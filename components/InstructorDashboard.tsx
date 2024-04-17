import {
  getInstructorQuickMetrics,
  getPerformancePerAssignment,
  getSubmissionTimeline,
  getTextbookEngagement,
} from "@/lib/analytics-functions";
import GenericPageContainer from "./GenericPageContainer";
import PageHeader from "./PageHeader";
import SmallMetricCard from "./SmallMetricCard";
import VisualizationContainer from "./VisualizationContainer";
import BarChart from "./Visualizations/BarChart";
import PerfPerAssignment from "./Visualizations/PerfPerAssignment";
import SubmissionTimeline from "./Visualizations/SubmissionTimeline";
import { useEffect, useState } from "react";
import NoData from "./NoData";
import TextbookEngagement from "./Visualizations/TextbookEngagement";
import TextbookActivity from "./Visualizations/TextbookActivity";
import { InstructorQuickMetrics } from "@/lib/types";

function InstructorDashboard() {
  const [data, setData] = useState<InstructorQuickMetrics>({
    assignments: 0,
    enrolled: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const data = await getInstructorQuickMetrics();
    setData(data);
  }

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
        title="Performance Per Assignment"
        description="Class average vs. selected student's scores"
        dropdown="student"
      >
        <PerfPerAssignment getData={getPerformancePerAssignment} />
      </VisualizationContainer>
      <VisualizationContainer
        title="Textbook Activity"
        description="Class average vs. selected student's activity"
        dropdown="student"
      >
        <TextbookActivity getData={getPerformancePerAssignment} />
      </VisualizationContainer>
      <VisualizationContainer
        title="Performance Per Assignment (Homework)"
        description="Class average vs. selected student's performance"
        dropdown="student"
      >
        <NoData width={1200} height={400} />
      </VisualizationContainer>
      <VisualizationContainer
        title="Submission Timeline"
        description="Timeline of student submissions for selected assignment"
        dropdown="assignment"
      >
        <SubmissionTimeline getData={getSubmissionTimeline} />
      </VisualizationContainer>
      {/* <VisualizationContainer
          title="Textbook Engagment"
          description="Number of unique interactions with the textbook by date"
        >
          <TextbookEngagement getData={getTextbookEngagement} />
        </VisualizationContainer> */}
      <VisualizationContainer
        title="ADAPT Performance"
        description="Distribution of student scores by selected assignment"
        dropdown="student"
      >
        <BarChart />
      </VisualizationContainer>
      <VisualizationContainer
        title="Grade Distribution"
        description="Distribution of student scores across all assignments"
      >
        <NoData width={1200} height={400} />
      </VisualizationContainer>
      <VisualizationContainer
        title="Learning Curve"
        description="Performance vs opportunity for each student"
      >
        <NoData width={1200} height={400} />
      </VisualizationContainer>
      <VisualizationContainer
        title="Learning Objective Completion"
        description="Breakdown of completion for the selected learning objective"
      >
        <NoData width={1200} height={400} />
      </VisualizationContainer>
    </GenericPageContainer>
  );
}

export default InstructorDashboard;
