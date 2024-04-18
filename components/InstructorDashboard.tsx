import {
  getPerformancePerAssignment,
  getSubmissionTimeline,
  getTextbookEngagement,
} from "@/lib/analytics-functions";
import GenericPageContainer from "@/components/GenericPageContainer";
import PageHeader from "@/components/PageHeader";
import SmallMetricCard from "@/components/SmallMetricCard";
import VisualizationContainer from "@/components/VisualizationContainer";
import BarChart from "@/components/Visualizations/BarChart";
import PerfPerAssignment from "@/components/Visualizations/PerfPerAssignment";
import SubmissionTimeline from "@/components/Visualizations/SubmissionTimeline";
import { useEffect, useState } from "react";
import NoData from "@/components/NoData";
import TextbookEngagement from "@/components/Visualizations/TextbookEngagement";
import TextbookActivity from "@/components/Visualizations/TextbookActivity";
import InstructorQuickMetrics from "@/components/InstructorQuickMetrics";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";

const InstructorDashboard = () => {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Instructor Dashboard"
        subtitle="View analytics and data visualizations for your course. Click on a visualization to view more details."
      />
      <InstructorQuickMetrics />
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
};

export default InstructorDashboard;
