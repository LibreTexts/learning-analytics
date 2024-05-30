import useADAPTAxios from "@/hooks/useADAPTAxios";
import { AxiosInstance } from "axios";
import { ADAPTEnrollmentsResponse } from "./types";
import enrollments from "./models/enrollments";

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
    await this.collectEnrollments();
  }

  async collectEnrollments() {
    try {
      if (!this.axiosInstance) {
        throw new Error("axiosInstance is not set");
      }

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
}

export default AnalyticsDataCollector;
