import SmallMetricCard from './SmallMetricCard'
import { InstructorQuickMetrics as InstructorQuickMetricsType } from '#types/analytics'
import { useQuery } from '@tanstack/react-query'
import api from '~/api'

const InstructorQuickMetrics = ({ course_id }: { course_id: string }) => {
  const { data, isFetching } = useQuery<InstructorQuickMetricsType>({
    queryKey: ['instructor-quick-metrics', course_id],
    queryFn: async () => {
      const res = await api.getInstructorQuickMetrics(course_id)
      return res.data
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !!course_id,
  })

  return (
    <div className="tw:flex tw:flex-row tw:justify-between tw:max-w-[96%]">
      <SmallMetricCard
        title="Assignments"
        value={data?.assignments}
        //unit="Assignments in Course"
        loading={isFetching}
      />
      <SmallMetricCard
        title="Total Questions"
        value={data?.totalQuestions}
        // unit="Questions in Course"
        className="tw:ml-4"
        loading={isFetching}
      />
      {data && data?.totalPageViews && (
        <SmallMetricCard
          title="Textbook Page Views"
          value={data?.totalPageViews}
          // unit="Textbook Total Page Views"
          className="tw:ml-4"
          loading={isFetching}
        />
      )}
      <SmallMetricCard
        title="Enrolled Students"
        value={data?.enrolled}
        // unit="Active Students in Course"
        className="tw:ml-4"
        loading={isFetching}
      />
    </div>
  )
}

export default InstructorQuickMetrics
