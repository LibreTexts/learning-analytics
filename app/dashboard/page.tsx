import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import SmallMetricCard from "@/components/SmallMetricCard";

export default function InstructorDashboard() {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Instructor Dashboard"
        subtitle="View analytics and data visualizations for your course. Click on a visualization to view more details."
      />
      <div className="tw-flex tw-flex-row tw-justify-between">
        <SmallMetricCard
          title="Assignments"
          value={12}
          unit="Active Assignments"
        />
        <SmallMetricCard
          title="Total Page Views"
          value={1225}
          unit="Textbook Total Page Views"
          className="tw-ml-4"
        />
        <SmallMetricCard
          title="Enrolled Students"
          value={54}
          unit="Active Students in Course"
          className="tw-ml-4"
        />
      </div>
    </GenericPageContainer>
  );
}
