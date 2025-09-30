import { AnalyticsService } from '#services/analytics_service'
import { IDWithName } from '#types/misc'
import { getByCourseAndStudentIDValidator, getByCourseAssignmentIDValidator, getByCourseStudentAssignmentIDValidator, getByCourseValidator } from '#validators/analytics'
import type { HttpContext } from '@adonisjs/core/http'

export default class AnalyticsController {
    async getADAPTPerformance({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseAssignmentIDValidator);

        const analytics = new AnalyticsService(payload.params.course_id);
        const adaptPerformance = await analytics.getADAPTPerformance(
            payload.params.assignment_id
        );

        return response.status(200).send({ data: adaptPerformance });
    }

    async getGradeDistribution({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseValidator);

        const analytics = new AnalyticsService(payload.params.course_id);
        const gradeDistribution = await analytics.getGradeDistribution();

        return response.status(200).send({ data: gradeDistribution });
    }

    async getStudentQuickMetrics({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseAndStudentIDValidator)

        const analytics = new AnalyticsService(payload.params.course_id)

        const promises = [
            analytics.getStudentTextbookEngagement(payload.params.student_id),
            analytics.getStudentAssignmentsCount(payload.params.student_id),
            analytics.getStudentAverageScore(payload.params.student_id),
        ];

        const [textbookResult, assignmentsResult, averageResult] =
            await Promise.allSettled(promises);

        const textbookEngagement =
            textbookResult.status === "fulfilled" ? textbookResult.value : 0;
        const assignmentsCount =
            assignmentsResult.status === "fulfilled" ? assignmentsResult.value : 0;
        const averageScore =
            averageResult.status === "fulfilled" ? averageResult.value : 0;

        return response.status(200).send({ textbookEngagement, assignmentsCount, averageScore })
    }

    async getInstructorQuickMetrics({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseValidator)

        const analytics = new AnalyticsService(payload.params.course_id)

        const promises = [
            analytics.getAssignments(true),
            analytics.countEnrolledStudents(),
            analytics.getTotalQuestionsCount(),
        ];

        const [assignmentsResult, studentsResult, questionsResult] =
            await Promise.allSettled(promises);

        const assignmentsCount =
            assignmentsResult.status === "fulfilled" ? (assignmentsResult.value as IDWithName[]).length : 0;
        const enrolledStudentsCount =
            studentsResult.status === "fulfilled" ? studentsResult.value : 0;
        const totalQuestionsCount =
            questionsResult.status === "fulfilled" ? questionsResult.value : 0;

        return response.status(200).send({
            assignments: assignmentsCount,
            enrolled: enrolledStudentsCount,
            totalQuestions: totalQuestionsCount
        })
    }

    async getStudentPerformancePerAssignment({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseAndStudentIDValidator)

        const analytics = new AnalyticsService(payload.params.course_id)
        const performance = await analytics.getPerformancePerAssignment(payload.params.student_id)

        return response.status(200).send({ data: performance })
    }

    async getStudentActivityAccessed({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseAndStudentIDValidator)

        const analytics = new AnalyticsService(payload.params.course_id)
        const activity = await analytics.getADAPTActivity(payload.params.student_id)

        return response.status(200).send({ data: activity })
    }

    async getLearningObjectiveCompletion({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseValidator)

        const analytics = new AnalyticsService(payload.params.course_id)
        const learningObjectiveCompletion =
            await analytics.getLearningObjectiveCompletion()

        return response.status(200).send({ data: learningObjectiveCompletion })
    }

    async getLearningCurves({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseValidator)

        const analytics = new AnalyticsService(payload.params.course_id)
        const learningCurves = await analytics.getLearningCurves()

        return response.status(200).send({ data: learningCurves })
    }

    async getTimeOnTask({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseStudentAssignmentIDValidator);

        const analytics = new AnalyticsService(payload.params.course_id);
        const timeOnTask = await analytics.getTimeOnTask(
            payload.params.student_id,
            payload.params.assignment_id
        );

        return response.status(200).send({ data: timeOnTask });
    }

    async getTimeInReview({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseStudentAssignmentIDValidator);

        const analytics = new AnalyticsService(payload.params.course_id);
        const timeInReview = await analytics.getTimeInReview(
            payload.params.student_id,
            payload.params.assignment_id
        );

        return response.status(200).send({ data: timeInReview });
    }

    async getSubmissionTimeline({ request, response }: HttpContext) {
        const payload = await request.validateUsing(getByCourseAssignmentIDValidator);

        const analytics = new AnalyticsService(payload.params.course_id);
        const submissionTimeline = await analytics.getSubmissionTimeline(
            payload.params.assignment_id
        );

        return response.status(200).send({ data: submissionTimeline });
    }


}