import PageHeader from '~/components/PageHeader'
import GenericPageContainer from '~/components/GenericPageContainer'
import LearningObjectiveCompletion from '~/components/LearningObjectiveCompletion'
import { useGlobalContext } from '~/state/globalContext'
import NoCourseData from '~/components/NoCourseData'

export default function LearningObjectives() {
  const [globalState] = useGlobalContext()

  return (
    <GenericPageContainer>
      <PageHeader
        title="Learning Objective Completion"
        subtitle="Understand student grasp of learning objectives based on their performance."
      />
      {globalState.hasData ? <LearningObjectiveCompletion /> : <NoCourseData />}
    </GenericPageContainer>
  )
}
