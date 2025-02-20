import axios, { AxiosInstance, Method } from "axios";
import * as jose from "jose";
import {
  ADAPTAssignmentScoresRes,
  ADAPTAutoGradedSubmissionRes,
  ADAPTCourseAssignmentsRes,
  ADAPTEnrollmentDetailsRes,
  ADAPTFrameworkQuestionSyncRes,
  ADAPTFrameworkRes,
  ADAPTFrameworksRes,
  ADAPTReviewTimeResponse,
  ADAPTSubmissionTimestampDataRes,
} from "./types";

class ADAPTInstructorConnector {
  private axiosInstance: AxiosInstance | null = null;
  private instructorID: string | null = null;
  private instructorJWT: string | null = null;
  constructor(id: string) {
    this.instructorID = id;
  }

  private createAxiosInstance() {
    this.axiosInstance = axios.create({
      baseURL: process.env.ADAPT_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${this.instructorJWT}`,
      },
    });
  }

  private async generateAutoLoginJWT() {
    const API_KEY = process.env.ADAPT_API_KEY;
    if (!API_KEY) throw new Error("API_KEY not provided");
    if (!this.instructorID) throw new Error("Instructor ID not provided");

    const secret = new TextEncoder().encode(API_KEY);

    const jwt = await new jose.SignJWT({
      id: this.instructorID,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("30m")
      .sign(secret);

    return jwt;
  }

  private async doAutoLogin() {
    if (!this.instructorID) throw new Error("Instructor ID not provided");
    const autoLoginToken = await this.generateAutoLoginJWT();
    const res = await axios.get(
      process.env.ADAPT_API_BASE_URL + "/users/auto-login",
      {
        headers: {
          Authorization: `Bearer ${autoLoginToken}`,
        },
      }
    );
    if (!res.data || !res.data.token) throw new Error("Failed to auto login");
    this.instructorJWT = res.data.token;
  }

  public async makeRequest<T>(url: string, method: Method, data?: any) {
    if (!this.instructorJWT) await this.doAutoLogin();
    if (!this.axiosInstance) this.createAxiosInstance();
    if (!this.axiosInstance) throw new Error("Failed to create axios instance");

    return this.axiosInstance.request<T>({
      url,
      method,
      data,
    });
  }

  public async getCourseAssignments(courseID: string) {
    return this.makeRequest<ADAPTCourseAssignmentsRes>(
      "/assignments/courses/" + courseID,
      "GET"
    );
  }

  public async getCourseEnrollments(courseID: string) {
    return this.makeRequest<ADAPTEnrollmentDetailsRes>(
      "/enrollments/" + courseID + "/details",
      "GET"
    );
  }

  public async getAssignmentScores(assignmentID: string) {
    return this.makeRequest<ADAPTAssignmentScoresRes>(
      "/scores/assignment/get-assignment-questions-scores-by-user/" +
        assignmentID +
        "/on_task/0",
      "GET"
    );
  }

  public async getAssignmentAutoGradedSubmissions(assignmentID: string, questionID: string) {
    return this.makeRequest<ADAPTAutoGradedSubmissionRes>(
      "/auto-graded-and-file-submissions/" + assignmentID + "/" + questionID + "/get-auto-graded-and-file-submissions-by-assignment-and-question-and-student",
      "GET"
    );
  }

  public async getAssignmentReviewHistory(assignmentID: string){
    return this.makeRequest<ADAPTReviewTimeResponse>(
      '/assignments/' + assignmentID + '/review-history',
      'GET'
    )
  }

  public async getSubmissionTimestamps(assignmentID: string) {
    return this.makeRequest<ADAPTSubmissionTimestampDataRes>(
      `/auto-graded-and-file-submissions/${assignmentID}/get-submission-times-by-assignment-and-student`,
      "GET"
    );
  }

  public async getFrameworks() {
    return this.makeRequest<ADAPTFrameworksRes>("/frameworks", "GET");
  }

  public async getFramework(frameworkID: string){
    return this.makeRequest<ADAPTFrameworkRes>('/frameworks/' + frameworkID, 'GET')
  }
}

export default ADAPTInstructorConnector;
