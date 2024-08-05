'use client'
import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import { getEWSResults } from "@/lib/ews-functions";
import EarlyWarningResults from "@/components/EarlyWarningResults";
import { useGlobalContext } from "@/state/globalContext";
import NoCourseData from "@/components/NoCourseData";

export default function EarlyWarning() {
  const [globalState] = useGlobalContext();

  return (
    <GenericPageContainer>
      <PageHeader
        title="Early Warning"
        subtitle="Use predictive analysis to identify students at-risk based on their academic performance. A final passing score of 70% is assumed."
      />
      {
        globalState.hasData ? (<EarlyWarningResults getData={getEWSResults} />
        ) : (
          <NoCourseData />
        )
      }
    </GenericPageContainer>
  );
}
