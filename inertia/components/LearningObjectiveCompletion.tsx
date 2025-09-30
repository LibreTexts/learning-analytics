import { useImperativeHandle, useMemo, useRef } from 'react'
import { LOCData, VisualizationBaseProps } from '#types/index'
import { useGlobalContext } from '~/state/globalContext'
import LearningObjectiveLevel from './LearningObjectiveLevel'
import LoadingComponent from './LoadingComponent'
import { useQuery } from '@tanstack/react-query'
import api from '~/api'

const LearningObjectiveCompletion: React.FC<VisualizationBaseProps> = ({ innerRef }) => {
  useImperativeHandle(innerRef, () => ({
    getSVG: () => svgRef.current,
  }))

  const [globalState] = useGlobalContext()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef(null)

  const { data, isLoading } = useQuery<LOCData[]>({
    queryKey: ['learningObjectiveCompletion', globalState.courseID],
    queryFn: async () => {
      if (!globalState.courseID) return []
      const res = await api.getLearningObjectiveCompletion(globalState.courseID)
      return res.data.data;
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
              {/* <div className="tw:flex tw:justify-end tw:max-w-[96%]">
                <Button onClick={handleToggleAll} className="" size="sm">
                  {allOpen ? "Collapse All" : "Expand All"}
                </Button>
              </div> */}
              {data?.map((d) => (
                <LearningObjectiveLevel key={crypto.randomUUID()} data={d} />
              ))}
            </div>
          )}
        </>
      )}
      {isLoading && <LoadingComponent />}
    </div>
  )
}

export default LearningObjectiveCompletion
