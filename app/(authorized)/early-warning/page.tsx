import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import EarlyWarningBanner from "@/components/EarlyWarningBanner";
import { getEWSStatus } from "@/lib/ews-functions";

export default async function EarlyWarning() {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Early Warning"
        subtitle="Use predictive analysis to identify students at-risk based on their academic performance."
      />
      <EarlyWarningBanner getStatus={getEWSStatus} />
    </GenericPageContainer>
  );
}
