'use client'
import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import LearningObjectiveCompletion from "@/components/LearningObjectiveCompletion";
import { getLearningObjectiveCompletion } from "@/lib/analytics-functions";
import { useGlobalContext } from "@/state/globalContext";
import NoCourseData from "@/components/NoCourseData";

export default function LearningObjectives() {
  const [globalState] = useGlobalContext();

  return (
    <GenericPageContainer>
      <PageHeader
        title="Learning Objective Completion"
        subtitle="Understand student grasp of learning objectives based on their performance."
      />
      {
        globalState.hasData ? (<LearningObjectiveCompletion getData={getLearningObjectiveCompletion} />
        ) : (
          <NoCourseData />
        )
      }

    </GenericPageContainer>
  );
}
