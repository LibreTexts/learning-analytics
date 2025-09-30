import PageHeader from '~/components/PageHeader'
import GenericPageContainer from '~/components/GenericPageContainer'
import LearningCurves from '~/components/LearningCurves'
import { useGlobalContext } from '~/state/globalContext'
import NoCourseData from '~/components/NoCourseData'

export default function LearningCurvesPage() {
  const [globalState] = useGlobalContext()

  return (
    <GenericPageContainer>
      <PageHeader
        title="Learning Curves"
        subtitle="Understand how students are performing over time."
      />
      {globalState.hasData ? <LearningCurves /> : <NoCourseData />}
    </GenericPageContainer>
  )
}
