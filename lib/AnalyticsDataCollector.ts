import useADAPTAxios from "@/hooks/useADAPTAxios";
import { AxiosInstance } from "axios";
import { ADAPTEnrollmentsResponse } from "./types";
import enrollments from "./models/enrollments";
import connectDB from "./database";
import adaptCourses from "./models/adaptCourses";
import { encryptStudent } from "@/utils/data-helpers";

class AnalyticsDataCollector {
  private token: string | null = null;
  constructor() {
    if (!process.env.ADAPT_API_KEY) {
      throw new Error("ADAPT_API_KEY is not set");
    }
    if (!process.env.ADAPT_API_BASE_URL) {
      throw new Error("ADAPT_API_BASE_URL is not set");
    }

    this.token = "";
  }

  async runCollectors() {
    //await this.collectEnrollments();
    await this.collectGradebookData();
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
        assignments: { id: string; name: string }[];
      }[] = assignmentsResponses.map((response) => {
        if (response.status === "fulfilled" && response.value) {
          return {
            courseID: response.value.data.courseID,
            assignments: response.value.data.assignments.map(
              (assignment: any) => ({
                id: assignment.id,
                name: assignment.name,
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
      const mappedData = parsed.map((student) => {
        const courseAssignments = assignmentsData.find(
          (data) => data.courseID === student.courseID
        )?.assignments;

        if (!courseAssignments) return student;

        const reduced = courseAssignments.reduce((acc, assignment) => {
          const assignmentName = assignment.name;
          const assignmentID = assignment.id;
          // @ts-ignore
          acc.push({
            assignmentID,
            assignmentName,
            studentScore: student[assignmentName],
          });
          return acc;
        }, []);

        return { ...student, assignments: reduced };
      });

      console.log(mappedData[0]);
    } catch (err) {
      console.error(err);
    }
  }
}

export default AnalyticsDataCollector;
