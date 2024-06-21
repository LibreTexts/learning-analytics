import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import LearningObjectiveCompletion from "@/components/LearningObjectiveCompletion";
import { getLearningObjectiveCompletion } from "@/lib/analytics-functions";

export default async function LearningObjectives() {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Learning Objective Completion"
        subtitle="Understand student grasp of learning objectives based on their performance."
      />
      <LearningObjectiveCompletion getData={getLearningObjectiveCompletion} />
    </GenericPageContainer>
  );
}
