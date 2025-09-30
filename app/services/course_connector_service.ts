import axios, { AxiosInstance, Method } from "axios";
import * as jose from "jose";
import { ADAPTMiniSummaryRes } from "#types/index";
import env from "#start/env";

export class CourseConnectorService {
  private axiosInstance: AxiosInstance | null = null;
  private courseID: string | null = null;
  private courseJWT: string | null = null;
  constructor(id: string) {
    this.courseID = id;
  }

  private createAxiosInstance() {
    this.axiosInstance = axios.create({
      baseURL: env.get("ADAPT_API_BASE_URL"),
      headers: {
        Authorization: `Bearer ${this.courseJWT}`,
      },
    });
  }

  private async generateCourseJWT() {
    const API_KEY = env.get("ADAPT_API_KEY");
    if (!API_KEY) throw new Error("API_KEY not provided");
    if (!this.courseID) throw new Error("Course ID not provided");

    const secret = new TextEncoder().encode(API_KEY);

    return await new jose.SignJWT({
      course_id: this.courseID,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("30m")
      .sign(secret);
  }

  public async makeRequest<T>(url: string, method: Method, data?: any) {
    if (!this.courseJWT) this.courseJWT = await this.generateCourseJWT();
    if (!this.axiosInstance) this.createAxiosInstance();
    if (!this.axiosInstance) throw new Error("Failed to create axios instance");

    return this.axiosInstance.request<T>({
      url,
      method,
      data,
    });
  }

  public async getCourseMiniSummary() {
    return this.makeRequest<ADAPTMiniSummaryRes>(
      "/courses/mini-summary",
      "GET"
    );
  }
}
