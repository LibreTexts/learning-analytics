import {
  ADAPTCourseAssignment,
  ADAPTReviewTimeResponse,
  FrameworkAlignment,
} from "./types";
import enrollments, { IEnrollmentsRaw } from "./models/enrollments";
import connectDB from "./database";
import adaptCourses, {
  IAdaptCourses,
  IAdaptCoursesRaw,
} from "./models/adaptCourses";
import {
  QUESTION_SCORE_DATA_EXCLUSIONS,
  encryptStudent,
} from "@/utils/data-helpers";
import gradebook, { IGradebookRaw } from "./models/gradebook";
import frameworkQuestionAlignment, {
  IFrameworkQuestionAlignment_Raw,
} from "./models/frameworkQuestionAlignment";
import reviewTime, { IReviewTime_Raw } from "./models/reviewTime";
import useADAPTAxios from "@/hooks/useADAPTAxios";
import ADAPTInstructorConnector from "./ADAPTInstructorConnector";
import ADAPTCourseConnector from "./ADAPTCourseConnector";
import assignmentSubmissions, {
  IAssignmentScoresRaw,
} from "./models/assignmentScores";
import assignments, { IAssignmentRaw } from "./models/assignments";

class AnalyticsDataCollector {
  constructor() {
    if (!process.env.ADAPT_API_KEY) {
      throw new Error("ADAPT_API_KEY is not set");
    }
    if (!process.env.ADAPT_API_BASE_URL) {
      throw new Error("ADAPT_API_BASE_URL is not set");
    }
  }

  async runCollectors() {
    //await this.updateCourseData();
    //await this.collectAllAssignments();
    //await this.collectEnrollments();
    //await this.collectAssignmentScores();
    //await this.collectAssignmentSubmissionTimestamps(); // this should only run after collectAssignmentScores
    //await this.collectGradebookData();
    //await this.collectFrameworkData();
    await this.collectQuestionFrameworkAlignment();
    //await this.collectReviewTimeData();
  }

  async updateCourseData() {
    try {
      await connectDB();

      const knownCourses = await adaptCourses
        .find(
          process.env.DEV_LOCK_COURSE_ID
            ? { course_id: process.env.DEV_LOCK_COURSE_ID }
            : {}
        )
        .select("course_id");

      const knownCourseIDs = knownCourses.map((course) => course.course_id);

      const updateDocs = new Map<string, Record<string, string>>();
      for (const courseID of knownCourseIDs) {
        const adaptConn = new ADAPTCourseConnector(courseID);
        const courseData = await adaptConn.getCourseMiniSummary();
        if (!courseData?.data) continue;

        const raw = courseData.data["mini-summary"];
        updateDocs.set(courseID, {
          instructor_id: raw.user_id,
          name: raw.name,
          start_date: raw.start_date,
          end_date: raw.end_date,
          textbook_url: raw.textbook_url,
        });
      }

      const bulkOps = Array.from(updateDocs).map(([course_id, update]) => ({
        updateOne: {
          filter: { course_id },
          update: { $set: update },
          upsert: true,
        },
      }));

      await adaptCourses.bulkWrite(bulkOps);
    } catch (err) {
      console.error(err);
    }
  }

  async collectAllAssignments() {
    try {
      await connectDB();

      const knownCourses = (await adaptCourses.find(
        process.env.DEV_LOCK_COURSE_ID
          ? { course_id: process.env.DEV_LOCK_COURSE_ID }
          : {}
      )) as IAdaptCoursesRaw[];

      const updateDocs: IAssignmentRaw[] = [];
      for (const course of knownCourses) {
        try {
          if (!course.instructor_id) continue;
          const adaptConn = new ADAPTInstructorConnector(course.instructor_id);
          const courseData = await adaptConn.getCourseAssignments(
            course.course_id
          );
          if (!courseData?.data) continue;

          const assignments: IAssignmentRaw[] = courseData.data.assignments.map(
            (assig) => ({
              course_id: course.course_id,
              assignment_id: assig.id.toString(),
              name: assig.name,
              num_questions: assig.num_questions,
              questions: [],
            })
          );

          for (const assignment of assignments) {
            const scoreData = await adaptConn.getAssignmentScores(
              assignment.assignment_id
            );
            if (!scoreData?.data) continue;
            const questionsRaw = scoreData.data.rows[0];
            if (!questionsRaw) continue;

            const questions = Object.keys(questionsRaw).filter(
              (key) => !QUESTION_SCORE_DATA_EXCLUSIONS.includes(key)
            );

            assignment.questions = questions.map((question) =>
              question.toString()
            );
          }

          updateDocs.push(...assignments);
        } catch (err) {
          console.error(err);
          continue;
        }
      }

      const bulkOps = Array.from(updateDocs).map((assignment) => ({
        updateOne: {
          filter: {
            course_id: assignment.course_id,
            assignment_id: assignment.assignment_id,
          },
          update: {
            $set: {
              name: assignment.name,
              num_questions: assignment.num_questions,
              questions: assignment.questions,
            },
          },
          upsert: true,
        },
      }));

      await assignments.bulkWrite(bulkOps);
    } catch (err) {
      console.error(err);
    }
  }

  async collectEnrollments() {
    try {
      await connectDB();

      const knownCourses = await adaptCourses.find(
        process.env.DEV_LOCK_COURSE_ID
          ? { course_id: process.env.DEV_LOCK_COURSE_ID }
          : {}
      );

      const docsToInsert: IEnrollmentsRaw[] = [];
      for (const course of knownCourses) {
        try {
          const adaptConn = new ADAPTInstructorConnector(course.instructor_id);
          const courseData = await adaptConn.getCourseEnrollments(
            course.course_id
          );
          if (!courseData?.data) continue;
          const enrollments = courseData.data.enrollments;

          const encryptedEmails = await Promise.all(
            enrollments.map((enrollment) => encryptStudent(enrollment.email))
          );
          const encryptedIds = await Promise.all(
            enrollments.map((enrollment) =>
              encryptStudent(enrollment.id.toString())
            )
          );

          enrollments.forEach((enrollment, index) => {
            docsToInsert.push({
              email: encryptedEmails[index],
              student_id: encryptedIds[index],
              course_id: course.course_id,
              created_at: enrollment.enrollment_date,
            });
          });
        } catch (e) {
          console.error(e);
          continue;
        }
      }

      // Bulk upsert the enrollments
      const bulkOps = docsToInsert.map((enrollment) => ({
        updateOne: {
          filter: { email: enrollment.email, course_id: enrollment.course_id },
          update: { $set: enrollment },
          upsert: true,
        },
      }));
      await enrollments.bulkWrite(bulkOps);
    } catch (err) {
      console.error(err);
    }
  }

  async collectAssignmentScores() {
    try {
      await connectDB();

      const knownCourses = (await adaptCourses.find(
        process.env.DEV_LOCK_COURSE_ID
          ? { course_id: process.env.DEV_LOCK_COURSE_ID }
          : {}
      )) as IAdaptCourses[];

      const assignmentData = await assignments.find({
        course_id: { $in: knownCourses.map((course) => course.course_id) },
      });

      const withAssignments = knownCourses.map((course) => {
        const assignments = assignmentData.filter(
          (assignment) => assignment.course_id === course.course_id
        );
        return { ...course, assignments };
      });

      for (const course of withAssignments) {
        try {
          const assignmentIDs = course.assignments.map(
            (assignment) => assignment.assignment_id
          );

          const adaptConn = new ADAPTInstructorConnector(
            course.instructor_id.toString()
          );

          const promises = assignmentIDs.map((assignmentID) => {
            return adaptConn.getAssignmentScores(assignmentID.toString());
          });

          const responses = await Promise.allSettled(promises);

          const scoreData: { assignment_id: string; rows: any[] }[] =
            responses.map((response, idx) => {
              if (response.status === "fulfilled" && response.value) {
                return {
                  assignment_id: assignmentIDs[idx].toString(),
                  rows: response.value.data.rows,
                };
              }
              return {
                assignment_id: "",
                rows: [],
              };
            });

          const parsed: IAssignmentScoresRaw[] = [];

          for (const assignment of scoreData) {
            for (const row of assignment.rows) {
              const student_id = row.userId;
              const reduced = Object.keys(row).reduce((acc, key) => {
                if (QUESTION_SCORE_DATA_EXCLUSIONS.includes(key)) {
                  return acc;
                }

                acc[key] = row[key];
                return acc;
              }, {} as { [x: string]: string });

              parsed.push({
                student_id,
                course_id: course.course_id,
                assignment_id: assignment.assignment_id,
                percent_correct:
                  row.percent_correct === "N/A" ? "-" : row.percent_correct, // use dash indicator instead of "N/A" for consistency
                total_points: row.total_points.toString(),
                questions: Object.keys(reduced).map((key) => {
                  const { score, timeOnTask } = this._extractScoreAndTimeOnTask(
                    reduced[key]
                  );

                  return {
                    question_id: key,
                    score: score,
                    time_on_task: timeOnTask,
                    first_submitted_at: null,
                    last_submitted_at: null,
                  };
                }),
              });
            }
          }

          const encryptedIds = await Promise.all(
            parsed.map((student) =>
              encryptStudent(student.student_id.toString())
            )
          );

          parsed.forEach((student, index) => {
            student.student_id = encryptedIds[index];
          });

          // Bulk upsert the assignment scores
          const bulkOps = parsed.map((student) => ({
            updateOne: {
              filter: {
                student_id: student.student_id,
                assignment_id: student.assignment_id,
                course_id: student.course_id,
              },
              update: { $set: student },
              upsert: true,
            },
          }));

          await assignmentSubmissions.bulkWrite(bulkOps);
        } catch (e) {
          console.error(e);
          continue;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async collectAssignmentSubmissionTimestamps() {
    try {
      await connectDB();

      const knownCourses = await adaptCourses.find(
        process.env.DEV_LOCK_COURSE_ID
          ? { course_id: process.env.DEV_LOCK_COURSE_ID }
          : {}
      );

      const allAssignments = await assignments.find({
        course_id: { $in: knownCourses.map((course) => course.course_id) },
      });

      const dataToInsert: {
        course_id: string;
        assignment_id: string;
        student_id: string;
        question_id: string;
        first_submitted_at: string;
        last_submitted_at: string;
      }[] = [];

      for (const course of knownCourses) {
        console.log("Collecting submission timestamps for course", course);
        try {
          const adaptConn = new ADAPTInstructorConnector(course.instructor_id);
          const courseAssignments = allAssignments.filter(
            (assignment) => assignment.course_id === course.course_id
          );
          console.log("COurse Assignments", courseAssignments);
          for (const assignment of courseAssignments) {
            const submissionData =
              await adaptConn.getAssignmentSubmissionTimestamps(
                assignment.assignment_id
              );
            if (!submissionData?.data) continue;
            for (const submission of submissionData.data) {
              if (!submission.auto_graded) continue;
              const autoGradedEntries = Object.entries(submission.auto_graded);
              autoGradedEntries.forEach((question) => {
                const questionID = question[0];
                const submissionData = question[1];
                dataToInsert.push({
                  course_id: course.course_id,
                  assignment_id: assignment.assignment_id,
                  student_id: submission.user_id.toString(),
                  question_id: questionID,
                  first_submitted_at: submissionData.first_submitted_at,
                  last_submitted_at: submissionData.last_submitted_at,
                });
              });
            }
          }
        } catch (err) {
          console.error(err);
          continue;
        }
      }

      // Encrypt the student IDs
      const encryptedIds = await Promise.all(
        dataToInsert.map((data) => encryptStudent(data.student_id))
      );

      dataToInsert.forEach((data, index) => {
        data.student_id = encryptedIds[index];
      });

      // Bulk upsert the submission timestamps
      const bulkOps = dataToInsert.map((data) => ({
        updateOne: {
          filter: {
            course_id: data.course_id,
            assignment_id: data.assignment_id,
            student_id: data.student_id,
            "questions.question_id": data.question_id,
          },
          update: {
            $set: {
              "questions.$.first_submitted_at": data.first_submitted_at,
              "questions.$.last_submitted_at": data.last_submitted_at,
            },
          },
          upsert: true,
        },
      }));

      await assignmentSubmissions.bulkWrite(bulkOps);
    } catch (err) {
      console.error(err);
    }
  }

  async collectGradebookData() {
    try {
      await connectDB();
      const knownCourses = await adaptCourses
        .find(
          process.env.DEV_LOCK_COURSE_ID
            ? { courseID: process.env.DEV_LOCK_COURSE_ID }
            : {}
        )
        .select("courseID");

      const knownCourseIDs = knownCourses.map((course) => course.courseID);

      const promises = knownCourseIDs.map((courseID) => {
        return useADAPTAxios()?.get("/analytics/scores/course/" + courseID);
      });

      const responses = await Promise.allSettled(promises);

      // Get and parse assignment score data
      const scoreData: { courseID: string; gradeData: string[][] | null }[] =
        responses.map((response) => {
          const courseID = knownCourseIDs[responses.indexOf(response)];
          if (response.status === "fulfilled" && response.value) {
            if (Array.isArray(response.value.data)) {
              return {
                courseID,
                gradeData: response.value.data,
              };
            }
            return {
              courseID,
              gradeData: response.value.data,
            };
          }
          return {
            courseID,
            gradeData: null,
          };
        });

      const parsed: {
        courseID: string;
        email: string;
        weighted: string;
        letter: string;
        [x: string]: string;
      }[] = [];

      for (const course of scoreData) {
        if (!course.gradeData) continue;
        const headers = course.gradeData[0];
        for (let i = 1; i < course.gradeData.length; i++) {
          const email = course.gradeData[i][0]; // First 'column' is email
          const data = course.gradeData[i].slice(
            1,
            course.gradeData[i].length - 2
          ); // Rest of the 'columns' are data, excluding the last 2 columnds, which are "Weighted Score" and "Letter Grade"
          const weighted = course.gradeData[i][course.gradeData[i].length - 2];
          const letter = course.gradeData[i][course.gradeData[i].length - 1];
          const reduced = data.reduce((acc, val, index) => {
            const assignmentName = headers[index + 1];
            // @ts-ignore
            acc[assignmentName] = val;
            acc["weighted"] = weighted;
            acc["letter"] = letter;
            return acc;
          }, {} as { [x: string]: string });

          parsed.push({
            courseID: course.courseID,
            email,
            weighted: "",
            letter: "",
            ...reduced,
          });
        }
      }

      // Encrypt the emails
      const encrpytionPromises = parsed.map((student) => {
        return encryptStudent(student.email);
      });

      const encryptedEmails = await Promise.all(encrpytionPromises);
      parsed.forEach((student, index) => {
        student.email = encryptedEmails[index];
      });

      const assignmentsPromises = knownCourseIDs.map((courseID) => {
        return useADAPTAxios()?.get("/assignments/courses/" + courseID);
      });

      const assignmentsResponses = await Promise.allSettled(
        assignmentsPromises
      );

      const assignmentsData: {
        courseID: string;
        assignments: { id: string; name: string; points_possible: string }[];
      }[] = assignmentsResponses.map((response, idx) => {
        if (response.status === "fulfilled" && response.value) {
          return {
            courseID: knownCourseIDs[idx],
            assignments: response.value.data.assignments.map(
              (assignment: any) => ({
                id: assignment.id,
                name: assignment.name,
                points_possible: assignment.total_points?.toString() ?? 0,
              })
            ),
          };
        }
        return {
          courseID: "",
          assignments: [],
        };
      });

      // map the assignment names in the parsed data to the assignment IDs in the assignmentsData
      const mappedData: IGradebookRaw[][] = parsed.map((student) => {
        const courseAssignments = assignmentsData.find(
          (data) => data.courseID === student.courseID
        )?.assignments;

        if (!courseAssignments) return [];

        const reduced = courseAssignments.reduce(
          (acc: IGradebookRaw[], assignment) => {
            const assignmentName = assignment.name;
            const assignmentID = assignment.id;

            const assignment_percent =
              (parseFloat(student[assignmentName]) /
                parseFloat(assignment.points_possible)) *
              100;

            const getOverallPercent = (raw: string) => {
              if (raw === "-") return 0;
              if (raw.includes("%")) return parseFloat(raw.replace("%", ""));
              return parseFloat(raw);
            };

            // @ts-ignore
            acc.push({
              email: student.email,
              course_id: student.courseID,
              assignment_id: parseInt(assignmentID),
              assignment_name: assignmentName,
              score: parseFloat(
                student[assignmentName] === "-" ? "0" : student[assignmentName]
              ), // If the score is a dash, set it to 0
              points_possible: parseFloat(assignment.points_possible),
              assignment_percent:
                parseFloat(assignment_percent.toFixed(2)) || 0,
              turned_in_assignment: student[assignmentName] !== "-",
              overall_course_grade: student.letter,
              overall_course_percent: getOverallPercent(student.weighted),
            });
            // console.log(acc);
            return acc;
          },
          []
        );

        return reduced;
      });

      const docsToInsert = mappedData.flat();

      // Bulk upsert the gradebook data
      await gradebook.bulkWrite(
        docsToInsert.map((doc) => ({
          updateOne: {
            filter: {
              email: doc.email,
              course_id: doc.course_id,
              assignment_id: doc.assignment_id,
            },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  // async collectFrameworkData() {
  //   try {
  //     await connectDB();

  //     // Get a random instructor_id to use for the API calls
  //     const randomInstructor = await adaptCourses.findOne({
  //       instructor_id: { $exists: true },
  //     });

  //     const adaptConn = new ADAPTInstructorConnector(randomInstructor.instructor_id);
  //     const frameworks = await adaptConn.getFrameworks();
  //     if (!frameworks?.data?.frameworks) return;

  //     const frameworkIDs = frameworks.data.frameworks.map((framework) => framework.id);

  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

  async collectQuestionFrameworkAlignment() {
    try {
      await connectDB();

      // const assignmentIds = await gradebook.distinct("assignment_id");

      const assignmentData = await assignments.find(
        process.env.DEV_LOCK_COURSE_ID
          ? { course_id: process.env.DEV_LOCK_COURSE_ID }
          : {}
      );

      // Spread the question_ids into individual documents
      const questionDocs = assignmentData.reduce(
        (
          acc: {
            course_id: string;
            assignment_id: string;
            question_id: string;
          }[],
          assignment
        ) => {
          const questions = assignment.questions.map((question: string) => ({
            course_id: assignment.course_id,
            assignment_id: assignment.assignment_id,
            question_id: question,
          }));
          acc.push(...questions);
          return acc;
        },
        []
      );

      // Get a random instructor_id to use for the API calls
      const randomInstructor = await adaptCourses.findOne({
        instructor_id: { $exists: true },
      });

      const adaptConn = new ADAPTInstructorConnector(
        randomInstructor.instructor_id
      );

      // Get the framework alignment for each question
      const frameworkPromises = questionDocs.map((doc) => {
        return adaptConn.getFrameworkQuestionSync(doc.question_id);
      });

      const frameworkResponses = await Promise.allSettled(frameworkPromises);

      const frameworkData: (IFrameworkQuestionAlignment_Raw | undefined)[] =
        frameworkResponses.map((response, idx) => {
          if (response.status === "fulfilled" && response.value) {
            return {
              course_id: questionDocs[idx].course_id,
              assignment_id: questionDocs[idx].assignment_id,
              question_id: questionDocs[idx].question_id,
              framework_descriptors:
                response.value.data.framework_item_sync_question?.descriptors.map(
                  (d) => ({
                    id: d.id.toString(),
                    text: d.text,
                  })
                ) ?? [],
              framework_levels:
                response.value.data.framework_item_sync_question?.levels.map(
                  (l) => ({
                    id: l.id.toString(),
                    text: l.text,
                  })
                ) ?? [],
            };
          }
          return undefined;
        });

      // Filter out any undefined documents
      const noUndefined = frameworkData.filter(
        (data) => data !== undefined
      ) as IFrameworkQuestionAlignment_Raw[];

      // Don't save question alignment if there are no framework descriptors or levels
      const noEmpties = noUndefined.filter(
        (data) =>
          data.framework_descriptors.length > 0 &&
          data.framework_levels.length > 0
      );

      // Bulk upsert the framework alignment data
      await frameworkQuestionAlignment.bulkWrite(
        noEmpties.map((doc) => ({
          updateOne: {
            filter: {
              course_id: doc.course_id,
              assignment_id: doc.assignment_id,
              question_id: doc.question_id,
            },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  public async collectReviewTimeData() {
    try {
      await connectDB();

      const courseAssignmentData = await gradebook.aggregate([
        {
          $group: {
            _id: "$course_id",
            unique_assignments: {
              $addToSet: "$assignment_id",
            },
          },
        },
      ]);

      const courseAssignmentPairs = courseAssignmentData.reduce(
        (acc: { course_id: number; assignment_id: number }[], data) => {
          const course_id = parseInt(data._id) ?? 0;
          const assignment_ids = data.unique_assignments;
          assignment_ids.forEach((assignment_id: number) => {
            acc.push({ course_id, assignment_id });
          });
          return acc;
        },
        []
      );

      const reviewTimePromises = courseAssignmentPairs.map((pair) => {
        return useADAPTAxios()?.get(
          "/analytics/review-history/assignment/" + pair.assignment_id
        );
      });

      const reviewTimeResponses = await Promise.allSettled(reviewTimePromises);

      const reviewTimeData: (ADAPTReviewTimeResponse & {
        course_id: number;
      })[] = [];
      for (let i = 0; i < reviewTimeResponses.length; i++) {
        const response = reviewTimeResponses[i];
        if (response.status === "fulfilled" && response.value) {
          response.value.data.forEach((data: ADAPTReviewTimeResponse) => {
            reviewTimeData.push({
              ...data,
              course_id: courseAssignmentPairs[i].course_id,
            });
          });
        }
      }

      const encryptedEmails = await Promise.all(
        reviewTimeData.map((data) => encryptStudent(data.email))
      );

      reviewTimeData.forEach((data, index) => {
        data.email = encryptedEmails[index];
      });

      // for each actor + course_id + assignment_id, group the questions

      const docsToInsert = reviewTimeData.reduce(
        (acc: IReviewTime_Raw[], curr) => {
          const existing = acc.find(
            (doc) =>
              doc.course_id === curr.course_id &&
              doc.assignment_id === curr.assignment_id &&
              doc.actor === curr.email
          );

          if (existing) {
            existing.questions.push({
              question_id: curr.question_id,
              review_time_start: curr.created_at,
              review_time_end: curr.updated_at,
            });
          } else {
            acc.push({
              course_id: curr.course_id,
              assignment_id: curr.assignment_id,
              actor: curr.email,
              questions: [
                {
                  question_id: curr.question_id,
                  review_time_start: curr.created_at,
                  review_time_end: curr.updated_at,
                },
              ],
            });
          }

          return acc;
        },
        []
      );

      // Filter out any docs that are missing required fields
      const filteredDocs = docsToInsert.filter((doc) => {
        return doc.actor && doc.course_id && doc.assignment_id;
      });

      // Bulk upsert the review time data
      await reviewTime.bulkWrite(
        filteredDocs.map((doc) => ({
          updateOne: {
            filter: {
              course_id: doc.course_id,
              assignment_id: doc.assignment_id,
              actor: doc.actor,
            },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    } catch (err) {
      console.error(err);
    }
  }

  private _extractScoreAndTimeOnTask(raw: string): {
    score: string;
    timeOnTask: string;
  } {
    const DEFAULT = { score: "-", timeOnTask: "-" };

    if (!raw) return DEFAULT;
    if (typeof raw !== "string") return DEFAULT;
    if (raw.includes("-")) return DEFAULT;

    // valid raw data comes in the format "score (timeOnTask)"
    let [score, timeOnTask] = raw.split(" ");

    if (!timeOnTask)
      return {
        score: score,
        timeOnTask: "0",
      };

    timeOnTask = timeOnTask.replace("(", "").replace(")", ""); // Remove the parentheses

    // score should now be a string of the score, and timeOnTask should be a string of the time on task in minutes(ie "1:30")

    return { score, timeOnTask };
  }
}

export default AnalyticsDataCollector;
