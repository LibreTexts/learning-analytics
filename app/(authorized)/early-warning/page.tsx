import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import { getEWSResults } from "@/lib/ews-functions";
import EarlyWarningResults from "@/components/EarlyWarningResults";

export default async function EarlyWarning() {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Early Warning"
        subtitle="Use predictive analysis to identify students at-risk based on their academic performance."
      />
      <EarlyWarningResults getData={getEWSResults} />
    </GenericPageContainer>
  );
}
