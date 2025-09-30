import {
  ADAPTAutoGradedSubmissionData,
  ADAPTCourseAssignment,
  ADAPTFrameworkRes,
  ADAPTFrameworkSyncWebhookData,
  ADAPTReviewTimeData,
} from "#types/index";
import enrollments, { IEnrollmentsRaw } from "#mongodb/enrollments";
import adaptCourses, {
  IAdaptCourses,
  IAdaptCoursesRaw,
} from "#mongodb/adaptCourses";
import {
  QUESTION_SCORE_DATA_EXCLUSIONS,
  extractScoreFromLabel,
  extractQuestionIdsFromScoreData,
} from "#utils/data-helpers";
import frameworkQuestionAlignment, {
  IFrameworkQuestionAlignment_Raw,
} from "#mongodb/frameworkQuestionAlignment";
import reviewTime, { IReviewTime_Raw } from "#mongodb/reviewTime";
import assignmentScores, {
  IAssignmentScoresRaw,
} from "#mongodb/assignmentScores";
import assignments, { IAssignmentRaw } from "#mongodb/assignments";
import framework, { IFramework_Raw } from "#mongodb/framework";
import frameworkLevels, { IFrameworkLevel_Raw } from "#mongodb/frameworkLevels";
import { parse } from "date-fns";
import { encryptStudent } from "#utils/crypto";
import logger from "@adonisjs/core/services/logger";
import env from "#start/env";
import { CourseConnectorService } from "./course_connector_service.js";
import { InstructorConnectorService } from "./instructor_connector_service.js";

export class DataCollectorService {
  constructor() {
    if (!env.get('ADAPT_API_KEY')) {
      throw new Error("ADAPT_API_KEY is not set");
    }
    if (!env.get('ADAPT_API_BASE_URL')) {
      throw new Error("ADAPT_API_BASE_URL is not set");
    }
  }

  async runCollectors() {
    await this.updateCourseData();
    await this.collectAllAssignments();
    await this.collectEnrollments();
    await this.collectAssignmentScores();
    await this.collectSubmissionTimestamps(); // this should only run after collectAssignmentScores
    await this.collectFrameworkData();
    await this.collectReviewTimeData();
  }

  async updateCourseData() {
    try {
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
        const adaptConn = new CourseConnectorService(courseID);
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
      logger.error(err);
    }
  }

  async collectAllAssignments() {
    try {
      const knownCourses = (await adaptCourses.find(
        process.env.DEV_LOCK_COURSE_ID
          ? { course_id: process.env.DEV_LOCK_COURSE_ID }
          : {}
      )) as IAdaptCoursesRaw[];

      const updateDocs: IAssignmentRaw[] = [];
      for (const course of knownCourses) {
        try {
          if (!course.instructor_id) continue;
          const adaptConn = new InstructorConnectorService(course.instructor_id);
          const courseData = await adaptConn.getCourseAssignments(
            course.course_id
          );
          if (!courseData?.data) continue;

          const assignments: IAssignmentRaw[] = courseData.data.assignments.map(
            (assig) => {
              const [dueDate, finalSubmissionDeadline] =
                this._extractDueDates(assig);
              return {
                course_id: course.course_id,
                assignment_id: assig.id.toString(),
                name: assig.name,
                num_questions: assig.num_questions,
                questions: [],
                due_date: dueDate,
                final_submission_deadline: finalSubmissionDeadline,
              };
            }
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
          logger.error(err);
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
              due_date: assignment.due_date,
              final_submission_deadline: assignment.final_submission_deadline,
            },
          },
          upsert: true,
        },
      }));

      await assignments.bulkWrite(bulkOps);
    } catch (err) {
      logger.error(err);
    }
  }

  async collectEnrollments() {
    try {
      const knownCourses = await adaptCourses.find(
        process.env.DEV_LOCK_COURSE_ID
          ? { course_id: process.env.DEV_LOCK_COURSE_ID }
          : {}
      );

      const docsToInsert: IEnrollmentsRaw[] = [];
      for (const course of knownCourses) {
        try {
          const adaptConn = new InstructorConnectorService(course.instructor_id);
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
              created_at: parse(
                enrollment.enrollment_date,
                "MMMM dd, yyyy",
                new Date()
              ).toISOString(),
            });
          });
        } catch (e) {
          logger.error(e);
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
      logger.error(err);
    }
  }

  async collectAssignmentScores() {
    try {
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
        return { ...course.toObject(), assignments };
      }) as (IAdaptCoursesRaw & { assignments: IAssignmentRaw[] })[];

      for (const course of withAssignments) {
        try {
          const assignmentIDs = course.assignments.map(
            (assignment) => assignment.assignment_id
          );

          if (!course.instructor_id) continue;
          const adaptConn = new InstructorConnectorService(
            course.instructor_id.toString()
          );

          const promises = assignmentIDs.map((assignmentID) => {
            return adaptConn.getAssignmentScores(assignmentID.toString());
          });

          const responses = await Promise.allSettled(promises);

          const scoreData: {
            assignment_id: string;
            rows: any[];
            fields: any[];
          }[] = responses.map((response, idx) => {
            if (response.status === "fulfilled" && response.value) {
              return {
                assignment_id: assignmentIDs[idx].toString(),
                rows: response.value.data.rows,
                fields: response.value.data.fields,
              };
            }
            return {
              assignment_id: "",
              rows: [],
              fields: [],
            };
          });

          const parsed: IAssignmentScoresRaw[] = [];

          for (const assignment of scoreData) {
            const questionIds = extractQuestionIdsFromScoreData(
              assignment.rows
            );

            const autoGradedData = await this._collectAutoGradedSubmissions(
              adaptConn,
              assignment.assignment_id,
              questionIds
            );

            for (const row of assignment.rows) {
              const student_id = row.userId;
              const reduced = Object.keys(row).reduce((acc, key) => {
                if (QUESTION_SCORE_DATA_EXCLUSIONS.includes(key)) {
                  return acc;
                }

                acc[key] = row[key];
                return acc;
              }, {} as { [x: string]: string });

              const getMaxScore = (question_id: string) => {
                const field = assignment.fields.find(
                  (field) =>
                    field.key === question_id && field.isRowHeader === true
                );
                if (field) {
                  return extractScoreFromLabel(field.label) ?? "-";
                }
                return "-";
              };

              const getSubmissionCount = (question_id: string) => {
                const autoGraded = autoGradedData.find(
                  (data) => data.question_id === question_id
                );
                if (autoGraded) {
                  return (
                    autoGraded.data.find(
                      (d) => d.user_id.toString() === student_id.toString()
                    )?.submission_count ?? 0
                  );
                }
                return 0;
              };

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
                    max_score: getMaxScore(key),
                    submission_count: getSubmissionCount(key),
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

          await assignmentScores.bulkWrite(bulkOps);
        } catch (e) {
          logger.error(e);
          continue;
        }
      }
    } catch (err) {
      logger.error(err);
    }
  }

  async collectSubmissionTimestamps() {
    try {
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
        try {
          const adaptConn = new InstructorConnectorService(course.instructor_id);
          const courseAssignments = allAssignments.filter(
            (assignment) => assignment.course_id === course.course_id
          );
          for (const assignment of courseAssignments) {
            const submissionData = await adaptConn.getSubmissionTimestamps(
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
          logger.error(err);
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

      await assignmentScores.bulkWrite(bulkOps);
    } catch (err) {
      logger.error(err);
    }
  }

  async collectFrameworkData() {
    try {
      // Get a random instructor_id to use for the API calls
      const randomInstructor = await adaptCourses.findOne({
        instructor_id: { $exists: true },
      });

      if (!randomInstructor?.instructor_id) {
        logger.error("Could not find an instructor_id to collect framework data");
        return;
      }

      // Create a new InstructorConnectorService instance
      const adaptConn = new InstructorConnectorService(
        randomInstructor.instructor_id
      );
      const frameworks = await adaptConn.getFrameworks();
      if (!frameworks?.data?.frameworks) return;

      // Get the IDs of the frameworks
      const frameworkIDs = frameworks.data.frameworks.map(
        (framework) => framework.id
      );

      // Get the framework data for each framework
      const responses = await Promise.allSettled(
        frameworkIDs.map((id) => adaptConn.getFramework(id.toString()))
      );
      const successResponses = responses.filter(
        (response) => response.status === "fulfilled"
      );

      // Map data out of the responses
      const frameworksToUpsert: IFramework_Raw[] = [];
      const levelsToUpsert: IFrameworkLevel_Raw[] = [];
      for (const response of successResponses) {
        const responseValue = response as PromiseFulfilledResult<any>;
        const data = responseValue.value.data as ADAPTFrameworkRes;

        frameworksToUpsert.push({
          framework_id: data.properties.id,
          title: data.properties.title,
          description: data.properties.description,
        });

        for (const level of data.framework_levels) {
          const descriptors = data.descriptors.filter(
            (descriptor) => descriptor.framework_level_id === level.id
          );
          levelsToUpsert.push({
            level_id: level.id,
            framework_id: level.framework_id,
            title: level.title,
            description: level.description ?? "",
            order: level.order,
            parent_id: level.parent_id ?? null,
            descriptors: descriptors.map((descriptor) => ({
              id: descriptor.id,
              descriptor: descriptor.descriptor,
              framework_level_id: descriptor.framework_level_id,
            })),
          });
        }
      }

      // Bulk upsert the framework data
      await framework.bulkWrite(
        frameworksToUpsert.map((doc) => ({
          updateOne: {
            filter: { framework_id: doc.framework_id },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );

      // Bulk upsert the framework level data
      await frameworkLevels.bulkWrite(
        levelsToUpsert.map((doc) => ({
          updateOne: {
            filter: { level_id: doc.level_id },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    } catch (err) {
      logger.error(err);
    }
  }

  public async collectReviewTimeData() {
    try {
      const knownCourses = await adaptCourses.find(
        process.env.DEV_LOCK_COURSE_ID
          ? { course_id: process.env.DEV_LOCK_COURSE_ID }
          : {}
      );

      const allAssignments = await assignments.find({
        course_id: { $in: knownCourses.map((course) => course.course_id) },
      });

      const enrollmentData = await enrollments.find({
        course_id: { $in: knownCourses.map((course) => course.course_id) },
      });

      const reviewTimeData: (ADAPTReviewTimeData & {
        student_id: string;
        course_id: string;
      })[] = [];
      for (const course of knownCourses) {
        try {
          const adaptConn = new InstructorConnectorService(course.instructor_id);
          const courseAssignments = allAssignments.filter(
            (assignment) => assignment.course_id === course.course_id
          );

          for (const assignment of courseAssignments) {
            const reviewHistory = await adaptConn.getAssignmentReviewHistory(
              assignment.assignment_id
            );
            if (!reviewHistory?.data) continue;
            const data = reviewHistory.data.review_histories;
            if (!data) continue;

            const encryptedEmails = await Promise.all(
              data.map((d) => encryptStudent(d.email))
            );

            data.forEach((d, index) => {
              d.email = encryptedEmails[index];
            });

            const withCourseID: (ADAPTReviewTimeData & {
              student_id: string;
              course_id: string;
            })[] = data.map((d) => {
              // Use (encrypted) email to find student_id (if it exists)
              const studentID = enrollmentData.find(
                (enrollment) => enrollment.email === d.email
              )?.student_id;

              return {
                ...d,
                student_id: studentID ?? "",
                course_id: course.course_id,
              };
            });

            reviewTimeData.push(...withCourseID);
          }
        } catch (err) {
          logger.error(err);
          continue;
        }
      }

      // for each actor + course_id + assignment_id, group the questions

      const docsToInsert = reviewTimeData.reduce(
        (acc: IReviewTime_Raw[], curr) => {
          const existing = acc.find(
            (doc) =>
              !isNaN(parseInt(curr.course_id)) &&
              doc.course_id === parseInt(curr.course_id) &&
              doc.assignment_id === curr.assignment_id &&
              doc.student_id === curr.student_id
          );

          if (existing) {
            existing.questions.push({
              question_id: curr.question_id,
              review_time_start: curr.created_at,
              review_time_end: curr.updated_at,
            });
          } else {
            acc.push({
              course_id: parseInt(curr.course_id),
              assignment_id: curr.assignment_id,
              student_id: curr.student_id,
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
        return doc.student_id && doc.course_id && doc.assignment_id;
      });

      // Bulk upsert the review time data
      await reviewTime.bulkWrite(
        filteredDocs.map((doc) => ({
          updateOne: {
            filter: {
              course_id: doc.course_id,
              assignment_id: doc.assignment_id,
              student_id: doc.student_id,
            },
            update: { $set: doc },
            upsert: true,
          },
        }))
      );
    } catch (err) {
      logger.error(err);
    }
  }

  public async ingestFrameworkSyncWebhookData(
    data: ADAPTFrameworkSyncWebhookData
  ) {
    try {
      if (data.type === "error") {
        logger.error(
          `An error was sent by the ADAPT framework sync webhook with message: ${data.message}`
        );
        return;
      }

      const { results } = data;

      const stringifiedQuestionIDs = results.map((result) =>
        result.question_id.toString()
      );

      // Find all assignments where the questions array contains any of the question IDs
      const affectedAssignments = (await assignments.find({
        questions: { $in: stringifiedQuestionIDs },
      })) as IAssignmentRaw[];

      const toUpdate: IFrameworkQuestionAlignment_Raw[] =
        affectedAssignments.reduce(
          (acc: IFrameworkQuestionAlignment_Raw[], curr) => {
            const matchingQuestions = curr.questions.filter((q) =>
              stringifiedQuestionIDs.includes(q)
            );
            matchingQuestions.forEach((question) => {
              const resultMatch = results.find(
                (r) => r.question_id.toString() === question
              );
              if (!resultMatch) return;

              const descriptors = resultMatch.descriptors_levels.descriptors;
              const levels = resultMatch.descriptors_levels.levels;

              acc.push({
                course_id: curr.course_id,
                assignment_id: curr.assignment_id,
                question_id: question,
                framework_descriptors: descriptors.map((d) => ({
                  id: d.id,
                  text: d.text,
                })),
                framework_levels: levels.map((l) => ({
                  id: l.id,
                  text: l.text,
                })),
              });
            });
            return acc;
          },
          []
        );

      // Bulk upsert the framework alignment data
      await frameworkQuestionAlignment.bulkWrite(
        toUpdate.map((doc) => ({
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
      logger.error(err);
    }
  }

  private async _collectAutoGradedSubmissions(
    instructorConn: InstructorConnectorService,
    assignmentID: string,
    questionIds: string[]
  ): Promise<{ question_id: string; data: ADAPTAutoGradedSubmissionData[] }[]> {
    const autoGradedPromises = questionIds.map((questionId) => {
      return instructorConn.getAssignmentAutoGradedSubmissions(
        assignmentID,
        questionId
      );
    });

    const autoGradedResponses = await Promise.allSettled(autoGradedPromises);

    const autoGradedData = autoGradedResponses.map((response, idx) => {
      if (response.status === "fulfilled" && response.value) {
        return {
          question_id: questionIds[idx],
          data: response.value.data.auto_graded_submission_info_by_user,
        };
      }
      return {
        question_id: questionIds[idx],
        data: [],
      };
    });

    return autoGradedData;
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

  private _extractDueDates(
    assignment: ADAPTCourseAssignment
  ): [Date | null, Date | null] {
    const primaryAssignTo = assignment.assign_tos.find((assignTo) =>
      assignTo.groups.includes("Everybody")
    ); // "Everybody" is the primary/default assignTo group
    if (!primaryAssignTo) return [null, null];

    const dueDate = primaryAssignTo.due ? new Date(primaryAssignTo.due) : null;
    const finalSubmissionDeadline = primaryAssignTo.final_submission_deadline
      ? new Date(primaryAssignTo.final_submission_deadline)
      : null;

    return [dueDate, finalSubmissionDeadline];
  }
}