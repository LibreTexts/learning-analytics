import { ActivityAccessed, GradeDistribution, PerformancePerAssignment, SubmissionTimeline, TimeInReview, TimeOnTask } from "#types/analytics"
import { useQuery } from "@tanstack/react-query"
import api from "~/api"

const useInstructorAnalytics = (course_id: string, student_id: string | null, assignment_id: string | null) => {
    const { data: performancePerAssignment, isLoading: performancePerAssignmentLoading } = useQuery<PerformancePerAssignment[]>({
        queryKey: ["performancePerAssignment", course_id, student_id],
        queryFn: async () => {
            if (!student_id) {
                return [] as PerformancePerAssignment[]
            }

            const res = await api.getPerformancePerAssignment(course_id, student_id)
            return res.data.data;
        },
        enabled: !!course_id && !!student_id
    });

    const { data: activityAccessed, isLoading: activityAccessedLoading } = useQuery<ActivityAccessed[]>({
        queryKey: ["activityAccessed", course_id, student_id],
        queryFn: async () => {
            if (!student_id) {
                return []
            }
            const res = await api.getStudentActivityAccessed(course_id, student_id)
            return res.data.data;
        },
        enabled: !!course_id && !!student_id
    })

    const { data: timeOnTask, isLoading: timeOnTaskLoading } = useQuery<TimeOnTask[]>({
        queryKey: ["timeOnTask", course_id, student_id, assignment_id],
        queryFn: async () => {
            if (!student_id || !assignment_id) {
                return []
            }
            const res = await api.getTimeOnTask(course_id, assignment_id, student_id)
            return res.data.data;
        },
        enabled: !!course_id && !!student_id && !!assignment_id
    })

    const { data: timeInReview, isLoading: timeInReviewLoading } = useQuery<TimeInReview[]>({
        queryKey: ["timeInReview", course_id, student_id, assignment_id],
        queryFn: async () => {
            if (!student_id || !assignment_id) {
                return []
            }
            const res = await api.getTimeInReview(course_id, assignment_id, student_id)
            return res.data.data;
        },
        enabled: !!course_id && !!student_id && !!assignment_id
    })

    const { data: submissionTimeline, isLoading: submissionTimelineLoading } = useQuery<SubmissionTimeline | undefined>({
        queryKey: ["submissionTimeline", course_id, assignment_id],
        queryFn: async () => {
            if (!assignment_id) {
                return undefined
            }
            const res = await api.getSubmissionTimeline(course_id, assignment_id)
            return res.data.data;
        },
        enabled: !!course_id && !!assignment_id
    })

    const { data: adaptPerformance, isLoading: adaptPerformanceLoading } = useQuery<number[]>({
        queryKey: ["adaptPerformance", course_id, assignment_id],
        queryFn: async () => {
            if (!assignment_id) {
                return []
            }
            const res = await api.getADAPTPerformance(course_id, assignment_id)
            return res.data.data;
        },
        enabled: !!course_id && !!assignment_id
    })

    const { data: gradeDistribution, isLoading: gradeDistributionLoading } = useQuery<GradeDistribution | undefined>({
        queryKey: ["gradeDistribution", course_id],
        queryFn: async () => {
            if (!assignment_id) {
                return undefined
            }
            const res = await api.getGradeDistribution(course_id)
            return res.data.data;
        },
        enabled: !!course_id
    })


    return {
        performancePerAssignment,
        performancePerAssignmentLoading,
        activityAccessed,
        activityAccessedLoading,
        timeOnTask,
        timeOnTaskLoading,
        timeInReview,
        timeInReviewLoading,
        submissionTimeline,
        submissionTimelineLoading,
        adaptPerformance,
        adaptPerformanceLoading,
        gradeDistribution,
        gradeDistributionLoading
    }
}

export default useInstructorAnalytics;  