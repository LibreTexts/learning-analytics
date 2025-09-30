import { ActivityAccessed, PerformancePerAssignment } from "#types/analytics"
import { useQuery } from "@tanstack/react-query"
import api from "~/api"

const useStudentAnalytics = (course_id: string, student_id: string | null) => {
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

    return {
        performancePerAssignment,
        performancePerAssignmentLoading,
        activityAccessed,
        activityAccessedLoading,
    }
}

export default useStudentAnalytics;  