import { ActivityAccessed, GradeDistribution, InstructorQuickMetrics, LearningCurveData, LOCData, PerformancePerAssignment, StudentQuickMetrics, SubmissionTimeline, TimeInReview, TimeOnTask } from "#types/analytics";
import { EWSResult } from "#types/ews";
import { IDWithName, IDWithText, Student } from "#types/misc";
import axios, { AxiosInstance } from "axios";


class API {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: '/api',
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

    // follow any redirects
    public async fallbackLogin(email: string, password: string) {
        return await this.axiosInstance.post('/auth/fallback-login', {
            email,
            password,
        });
    }

    public async adaptLogin(token: string) {
        return await this.axiosInstance.post('/auth/adapt-login', {
            token,
        });
    }

    public async getUserSession() {
        return await this.axiosInstance.get<{
            user: {
                id: string;
                email?: string;
                role: string;
                courses: string[];
            } | null;
        }>('/auth/session');
    }

    public async getCourse(courseID: string) {
        return await this.axiosInstance.get<{ id: string; final_grades_released: boolean }>(`/courses/${courseID}`);
    }

    public async getCourseFrameworkData(courseID: string) {
        return await this.axiosInstance.get<{
            descriptors: IDWithText[];
            levels: IDWithText[];
        }>(`/courses/${courseID}/framework-data`);
    }

    public async getCourseAnalyticsSettings(courseID: string) {
        return await this.axiosInstance.get(`/courses/${courseID}/analytics-settings`);
    }

    public async updateCourseAnalyticsSettings(courseID: string, data: Partial<any>) {
        return await this.axiosInstance.put(`/courses/${courseID}/analytics-settings`, data);
    }

    public async getCourseAssignments(courseID: string) {
        return await this.axiosInstance.get<{ data: IDWithName[] }>(`/courses/${courseID}/assignments`);
    }

    public async getCourseRawData(courseID: string, privacyMode: boolean) {
        return await this.axiosInstance.get<any[]>(`/courses/${courseID}/raw-data`, {
            params: {
                privacy_mode: privacyMode,
            }
        });
    }

    public async getHasData(courseID: string) {
        return await this.axiosInstance.get<{ hasData: boolean }>(`/courses/${courseID}/has-data`);
    }

    public async getStudents(courseID: string, page?: number, limit?: number, privacy_mode?: boolean) {
        return await this.axiosInstance.get<{ data: Student[] }>(`/courses/${courseID}/students`, {
            params: {
                page,
                limit,
                privacy_mode
            }
        });
    }

    public async getStudentQuickMetrics(courseID: string, studentID: string) {
        return await this.axiosInstance.get<StudentQuickMetrics>(`/analytics/student-quick-metrics/${courseID}/${studentID}`);
    }

    public async getInstructorQuickMetrics(courseID: string) {
        return await this.axiosInstance.get<InstructorQuickMetrics>(`/analytics/instructor-quick-metrics/${courseID}`);
    }

    public async getStudentActivityAccessed(courseID: string, studentID: string) {
        return await this.axiosInstance.get<{ data: ActivityAccessed[] }>(`/analytics/activity-accessed/${courseID}/${studentID}`);
    }

    public async getPerformancePerAssignment(courseID: string, studentID: string) {
        return await this.axiosInstance.get<{ data: PerformancePerAssignment[] }>(`/analytics/performance-per-assignment/${courseID}/${studentID}`);
    }

    public async getLearningObjectiveCompletion(courseID: string) {
        return await this.axiosInstance.get<{ data: LOCData[] }>(`/analytics/learning-objective-completion/${courseID}`);
    }

    public async getLearningCurves(courseID: string) {
        return await this.axiosInstance.get<{ data: LearningCurveData[] }>(`/analytics/learning-curves/${courseID}`);
    }

    public async getADAPTPerformance(courseID: string, assignmentID: string) {
        return await this.axiosInstance.get<{ data: number[] }>(`/analytics/adapt-performance/${courseID}/${assignmentID}`);
    }

    public async getGradeDistribution(courseID: string) {
        return await this.axiosInstance.get<{ data: GradeDistribution }>(`/analytics/grade-distribution/${courseID}`);
    }

    public async getSubmissionTimeline(courseID: string, assignmentID: string) {
        return await this.axiosInstance.get<{ data: SubmissionTimeline }>(`/analytics/submission-timeline/${courseID}/${assignmentID}`);
    }

    public async getTimeOnTask(courseID: string, assignmentID: string, studentID: string) {
        return await this.axiosInstance.get<{ data: TimeOnTask[] }>(`/analytics/time-on-task/${courseID}/${assignmentID}/${studentID}`);
    }

    public async getTimeInReview(courseID: string, assignmentID: string, studentID: string) {
        return await this.axiosInstance.get<{ data: TimeInReview[] }>(`/analytics/time-in-review/${courseID}/${assignmentID}/${studentID}`);
    }

    public async getEWSResults(courseID: string, privacyMode: boolean) {
        return await this.axiosInstance.get<{ data: EWSResult[] }>(`/early-warning/${courseID}/results`, {
            params: {
                privacy_mode: privacyMode,
            }
        });
    }
}

export default new API();