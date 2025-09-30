import PageHeader from '~/components/PageHeader'
import GenericPageContainer from '~/components/GenericPageContainer'
import EarlyWarningResults from '~/components/EarlyWarningResults'
import { useGlobalContext } from '~/state/globalContext'
import NoCourseData from '~/components/NoCourseData'
import { useQuery } from '@tanstack/react-query'
import { EWSResult } from '#types/ews'
import api from '~/api'

export default function EarlyWarning() {
  const [globalState] = useGlobalContext()

  const { data, isLoading } = useQuery<EWSResult[]>({
    queryKey: ['ewsResults', globalState.courseID],
    queryFn: async () => {
      if (!globalState.courseID) return []
      const res = await api.getEWSResults(globalState.courseID, globalState.ferpaPrivacy || false)
      return res.data.data
    },
    enabled: !!globalState.courseID && globalState.hasData,
  })

  return (
    <GenericPageContainer>
      <PageHeader
        title="Early Warning"
        subtitle="Use predictive analysis to identify students at-risk based on their academic performance. A final passing score of 70% is assumed."
      />
      {globalState.hasData ? (
        <EarlyWarningResults data={data || []} dataLoading={isLoading} />
      ) : (
        <NoCourseData />
      )}
    </GenericPageContainer>
  )
}
