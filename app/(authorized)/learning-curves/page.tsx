import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import VisualizationContainer from "@/components/VisualizationContainer";
import NoData from "@/components/NoData";

export default async function LearningCurves() {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Learning Curves"
        subtitle="Understand how students are performing over time."
      />
      <VisualizationContainer
        title="Learning Curve"
        description="Performance vs. opportunity for each student"
      >
        <NoData width={1200} height={400} />
      </VisualizationContainer>
    </GenericPageContainer>
  );
}
