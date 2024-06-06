import useADAPTAxios from "@/hooks/useADAPTAxios";
import { AxiosInstance } from "axios";
import {
  ADAPTEnrollmentsResponse,
  FrameworkAlignment,
  IDWithText,
} from "./types";
import enrollments from "./models/enrollments";
import connectDB from "./database";
import adaptCourses from "./models/adaptCourses";
import { encryptStudent } from "@/utils/data-helpers";
import gradebook, { IGradebookRaw } from "./models/gradebook";
import email from "next-auth/providers/email";
import frameworkQuestionAlignment from "./models/frameworkQuestionAlignment";

class AnalyticsDataCollector {
  private token: string | null = null;
  constructor() {
    if (!process.env.ADAPT_API_KEY) {
      throw new Error("ADAPT_API_KEY is not set");
    }
    if (!process.env.ADAPT_API_BASE_URL) {
      throw new Error("ADAPT_API_BASE_URL is not set");
    }

    this.token = process.env.TEMP_TOKEN || null;
  }

  async runCollectors() {
    //await this.collectEnrollments();
    //await this.collectGradebookData();
    await this.collectQuestionFrameworkAlignment();
  }

  async collectEnrollments() {
    try {
      await connectDB();

      const knownCourses = await adaptCourses
        .find({
          courseID: "2904",
        })
        .select("courseID");

      const knownCourseIDs = knownCourses.map((course) => course.courseID);

      const START_DATE = "2024-01-01";
      const END_DATE = "2024-12-31";
      const response = await useADAPTAxios().get<ADAPTEnrollmentsResponse[]>(
        "/analytics/enrollments/" + START_DATE + "/" + END_DATE
      );
      const _enrollments = response.data;

      const filteredEnrollments = _enrollments.filter((enrollment) => {
        return knownCourseIDs.includes(enrollment.class.toString());
      });

      const encrpytionPromises = filteredEnrollments.map((enrollment) => {
        return encryptStudent(enrollment.email);
      });

      const encryptedEmails = await Promise.all(encrpytionPromises);

      filteredEnrollments.forEach((enrollment, index) => {
        enrollment.email = encryptedEmails[index];
      });

      // Bulk upsert the enrollments
      const bulkOps = filteredEnrollments.map((enrollment) => ({
        updateOne: {
          filter: { email: enrollment.email, courseID: enrollment.class },
          update: { $set: enrollment },
          upsert: true,
        },
      }));
      await enrollments.bulkWrite(bulkOps);
    } catch (err) {
      console.error(err);
    }
  }

  async collectGradebookData() {
    try {
      await connectDB();
      const knownCourses = await adaptCourses
        .find({
          courseID: "2904",
        })
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

      const parsed: { courseID: string; email: string; [x: string]: string }[] =
        [];

      for (const course of scoreData) {
        if (!course.gradeData) continue;
        const headers = course.gradeData[0];
        for (let i = 1; i < course.gradeData.length; i++) {
          const email = course.gradeData[i][0]; // First 'column' is email
          const data = course.gradeData[i].slice(1); // Rest of the 'columns' are data
          const reduced = data.reduce((acc, val, index) => {
            const assignmentName = headers[index + 1];
            // @ts-ignore
            acc[assignmentName] = val;
            return acc;
          }, {} as { [x: string]: string });

          parsed.push({ courseID: course.courseID, email, ...reduced });
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
        return useADAPTAxios(this.token as string)?.get(
          "/assignments/courses/" + courseID
        );
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
              overall_course_grade: "", // TODO: Calculate this
              overall_course_percent: 0, // TODO: Calculate this
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

  async collectQuestionFrameworkAlignment() {
    try {
      await connectDB();

      // const assignmentIds = await gradebook.distinct("assignment_id");

      const assignmentIds = await gradebook.distinct("assignment_id").where({
        course_id: "2904",
      });

      console.log("TOKEN: ", this.token);

      // Get the questions for each assignment
      const questionsPromises = assignmentIds.map((assignmentId) => {
        return useADAPTAxios(this.token as string)?.get(
          "/assignments/" + assignmentId + "/questions/ids"
        );
      });

      const questionsResponses = await Promise.allSettled(questionsPromises);

      const questionsData: { assignment_id: string; question_ids: string[] }[] =
        questionsResponses.map((response, idx) => {
          if (response.status === "fulfilled" && response.value) {
            return {
              assignment_id: assignmentIds[idx],
              question_ids: response.value.data.question_ids_array,
            };
          }
          return {
            assignment_id: "",
            question_ids: [],
          };
        });

      // Spread the question_ids into individual documents
      const questionDocs = questionsData
        .map((data) => {
          return data.question_ids.map((question_id) => ({
            assignment_id: data.assignment_id,
            question_id,
          }));
        })
        .flat();

      // Get the framework alignment for each question
      const frameworkPromises = questionDocs.map((doc) => {
        return useADAPTAxios(this.token as string)?.get(
          "/framework-item-sync-question/question/" + doc.question_id
        );
      });

      const frameworkResponses = await Promise.allSettled(frameworkPromises);

      const frameworkData: (FrameworkAlignment | undefined)[] =
        frameworkResponses.map((response, idx) => {
          if (response.status === "fulfilled" && response.value) {
            return {
              assignment_id: parseInt(questionDocs[idx].assignment_id),
              question_id: parseInt(questionDocs[idx].question_id),
              framework_descriptors:
                response.value.data.framework_item_sync_question?.descriptors ??
                [],
              framework_levels:
                response.value.data.framework_item_sync_question?.levels ?? [],
            };
          }
          return undefined;
        });

      const noUndefined = frameworkData.filter(
        (data) => data !== undefined
      ) as FrameworkAlignment[];

      // Bulk upsert the framework alignment data
      await frameworkQuestionAlignment.bulkWrite(
        noUndefined.map((doc) => ({
          updateOne: {
            filter: {
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
}

export default AnalyticsDataCollector;
