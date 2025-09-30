import { useMemo } from 'react'
import { EWSResult, EarlyWarningStatus } from '#types/index'
import EarlyWarningStudentRow from './EarlyWarningStudentRow'
import EarlyWarningBanner from './EarlyWarningBanner'
import EarlyWarningCourseMetrics from './EarlyWarningCourseMetrics'
import LoadingComponent from './LoadingComponent'

interface EarlyWarningResultsProps {
  data: EWSResult[]
  dataLoading?: boolean
}

const EarlyWarningResults: React.FC<EarlyWarningResultsProps> = ({ data, dataLoading }) => {
  const overallStatus: EarlyWarningStatus = useMemo(() => {
    if (!data?.length) return 'success'
    const dangerCount = data.filter((student) => student.status === 'danger')
    const warningCount = data.filter((student) => student.status === 'warning')

    if (dangerCount.length) return 'danger'
    if (warningCount.length) return 'warning'
    return 'success'
  }, [data])

  return (
    <div className="tw:flex tw:flex-col">
      {dataLoading && <LoadingComponent />}
      {!dataLoading && (
        <>
          <EarlyWarningBanner status={overallStatus} />
          {data && data.length > 0 && (
            <EarlyWarningCourseMetrics
              course_avg={data[0]?.course_avg}
              course_std_dev={data[0]?.course_std_dev}
            />
          )}
          {data &&
            data.length > 0 &&
            data.map((result) => <EarlyWarningStudentRow key={result.name} data={result} />)}
        </>
      )}
    </div>
  )
}

export default EarlyWarningResults
