import PageHeader from "~/components/PageHeader";
import GenericPageContainer from "~/components/GenericPageContainer";
import RawDataTable from "~/components/RawDataTable";

export default function RawDataView() {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Raw Data View"
        subtitle="Browse all available analytics/performance data for your course."
      />
      <RawDataTable />
    </GenericPageContainer>
  );
}
