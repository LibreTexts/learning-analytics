import useADAPTAxios from "@/hooks/useADAPTAxios";
import { AxiosInstance } from "axios";
import { ADAPTEnrollmentsResponse } from "./types";
import enrollments from "./models/enrollments";
import connectDB from "./database";
import adaptCourses from "./models/adaptCourses";

class AnalyticsDataCollector {
  private axiosInstance: AxiosInstance | null = null;
  constructor() {
    if (!process.env.ADAPT_API_KEY) {
      throw new Error("ADAPT_API_KEY is not set");
    }
    if (!process.env.ADAPT_API_BASE_URL) {
      throw new Error("ADAPT_API_BASE_URL is not set");
    }

    this.axiosInstance = useADAPTAxios();
  }

  async runCollectors() {
    //await this.collectEnrollments();
    await this.collectGradebookData();
  }

  async collectEnrollments() {
    try {
      if (!this.axiosInstance) {
        throw new Error("axiosInstance is not set");
      }

      await connectDB();
      const response = await this.axiosInstance.get<ADAPTEnrollmentsResponse[]>(
        "/analytics/enrollments"
      );
      const _enrollments = response.data;

      // Bulk upsert the enrollments
      const bulkOps = _enrollments.map((enrollment) => ({
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
      if (!this.axiosInstance) {
        throw new Error("axiosInstance is not set");
      }

      await connectDB();
      const knownCourses = await adaptCourses.find({}).select("courseID");

      const knownCourseIDs = knownCourses.map((course) => course.courseID);

      const promises = knownCourseIDs.map((courseID) => {
        return this.axiosInstance?.get("/analytics/scores/course/" + courseID);
      });

      const responses = await Promise.allSettled(promises);

      const gradebookData = responses.map((response) => {
        if (response.status === "fulfilled" && response.value) {
          return response.value.data;
        }
        return null;
      });

      console.log(gradebookData.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  }
}

export default AnalyticsDataCollector;
