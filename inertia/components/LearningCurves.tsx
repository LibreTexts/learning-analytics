import { useImperativeHandle, useMemo, useRef } from 'react'
import { LearningCurveData, VisualizationBaseProps } from '#types/index'
import { useGlobalContext } from '~/state/globalContext'
import LoadingComponent from './LoadingComponent'
import LearningCurveDescriptor from './LearningCurveDescriptor'
import { useQuery } from '@tanstack/react-query'
import api from '~/api'

type LearningCurvesProps = VisualizationBaseProps

const LearningCurves: React.FC<LearningCurvesProps> = ({ innerRef }) => {
  useImperativeHandle(innerRef, () => ({
    getSVG: () => svgRef.current,
  }))

  const [globalState] = useGlobalContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef(null)

  const { data, isLoading } = useQuery<LearningCurveData[]>({
    queryKey: ['learningCurves', globalState.courseID],
    queryFn: async () => {
      if (!globalState.courseID) return []
      const res = await api.getLearningCurves(globalState.courseID)
      return res.data.data
    },
    enabled: !!globalState.courseID,
  })

  const noFrameworkAlignment = useMemo(() => {
    if (data?.length === 0) return true
    return false
  }, [data])

  return (
    <div ref={containerRef}>
      {!isLoading && (
        <>
          {noFrameworkAlignment && (
            <div className="tw:flex tw:flex-row tw:justify-center">
              <p>No questions have been aligned to frameworks in this course.</p>
            </div>
          )}
          {!noFrameworkAlignment && (
            <div className="tw:flex tw:flex-col">
              {data?.map((d) => (
                <LearningCurveDescriptor key={crypto.randomUUID()} data={d} />
              ))}
            </div>
          )}
        </>
      )}
      {isLoading && <LoadingComponent />}
    </div>
  )
}

export default LearningCurves
