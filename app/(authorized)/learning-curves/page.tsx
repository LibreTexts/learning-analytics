import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import { getLearningCurves } from "@/lib/analytics-functions";
import LearningCurves from "@/components/LearningCurves";

export default async function LearningCurvesPage() {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Learning Curves"
        subtitle="Understand how students are performing over time."
      />
      <LearningCurves getData={getLearningCurves} />
    </GenericPageContainer>
  );
}
