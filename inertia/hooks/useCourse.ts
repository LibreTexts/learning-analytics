import { IDWithName } from "#types/misc"
import { useQuery } from "@tanstack/react-query"
import api from "~/api"


const useCourseAssignments = (courseId: number) => {
    const { data: assignments, isLoading: assignmentsLoading, ...rest } = useQuery<IDWithName[]>({
        queryKey: ['course', courseId, 'assignments'],
        queryFn: async () => {
            const res = await api.getCourseAssignments(courseId.toString())
            return res.data
        },
        enabled: !!courseId,
        staleTime: Infinity,
    })

    return {
        assignments: assignments || [],
        assignmentsLoading,
        ...rest,
    }
}

export default useCourseAssignments