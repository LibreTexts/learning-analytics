import PageHeader from '~/components/PageHeader'
import GenericPageContainer from '~/components/GenericPageContainer'
import StudentPermissions from '~/components/CourseSettings/StudentPermissions'
import FrameworkExclusions from '~/components/CourseSettings/FrameworkExclusions'
import AssignmentExclusions from '~/components/CourseSettings/AssignmentExclusions'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ICourseAnalyticsSettings_Raw } from '#mongodb/courseAnalyticsSettings'
import api from '~/api'

export default function CourseSettings() {
  const queryClient = useQueryClient()

  const updateCourseSettingsMutation = useMutation({
    mutationFn: async (params: {
      courseID: string
      data: Partial<ICourseAnalyticsSettings_Raw>
    }) => {
      if (!params.courseID) throw new Error('No course ID provided')
      const res = await api.updateCourseAnalyticsSettings(params.courseID, params.data)
      return res.data
    },
    onError(error) {
      console.error('Error updating course settings:', error)
    },
    onSuccess(data, variables, context) {
      queryClient.invalidateQueries({
        queryKey: ['course', 'analyticsSettings', variables.courseID],
      })
    },
  })

  return (
    <GenericPageContainer>
      <PageHeader
        title="Course Settings"
        subtitle="Configure your course analytics and sharing settings."
      />
      <StudentPermissions
        saveData={(courseID, data) => updateCourseSettingsMutation.mutate({ courseID, data })}
      />
      <AssignmentExclusions
        saveData={(courseID, data) => updateCourseSettingsMutation.mutate({ courseID, data })}
        className="tw:mt-6"
      />
      <FrameworkExclusions
        saveData={(courseID, data) => updateCourseSettingsMutation.mutate({ courseID, data })}
        className="tw:mt-6"
      />
    </GenericPageContainer>
  )
}
