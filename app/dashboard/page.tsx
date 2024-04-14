import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import SmallMetricCard from "@/components/SmallMetricCard";
import VisualizationContainer from "@/components/VisualizationContainer";
import BarChart from "@/components/Visualizations/BarChart";
import Analytics from "@/components/Analytics";
import PerfPerAssignment from "@/components/Visualizations/PerfPerAssignment";
import TextbookEngagement from "@/components/Visualizations/TextbookEngagement";

export async function getData() {
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env

  const analytics = new Analytics(adapt_id);

  const assignments = await analytics.countAssignments();
  const enrolled = await analytics.countEnrolledStudents();

  const performance = await analytics.getPerformancePerAssignment(
    "0603117dfdf13ead1aed422a3facdd5e"
  );
  return {
    assignments,
    enrolled,
    performance,
  };
}

async function getEngagement() {
  'use server'
  const adapt_id = process.env.NEXT_PUBLIC_ADAPT_ID; // Get ADAPT ID from env

  const analytics = new Analytics(adapt_id);

  const engagement = await analytics.getTextbookEngagement();

  return engagement;
}

export default async function InstructorDashboard() {
  const data = await getData();

  return (
    <GenericPageContainer>
      <PageHeader
        title="Instructor Dashboard"
        subtitle="View analytics and data visualizations for your course. Click on a visualization to view more details."
      />
      <div className="tw-flex tw-flex-row tw-justify-between">
        <SmallMetricCard
          title="Assignments"
          value={data.assignments}
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
          value={data.enrolled}
          unit="Active Students in Course"
          className="tw-ml-4"
        />
      </div>
      <VisualizationContainer
        title="Textbook Engagment"
        description="Student engagement/views with textbook"
      >
        <TextbookEngagement getData={getEngagement} />
      </VisualizationContainer>
      <VisualizationContainer
        title="Performance Per Assignment"
        description="Class average vs. selected student's scores"
        studentDropdown
      >
        <PerfPerAssignment data={data.performance} />
      </VisualizationContainer>
      <VisualizationContainer
        title="ADAPT Performance"
        description="Distribution of student scores by selected assignment"
        studentDropdown
      >
        <BarChart />
      </VisualizationContainer>
    </GenericPageContainer>
  );
}
