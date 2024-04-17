'use client'
import { getPerformancePerAssignment, getStudentQuickMetrics } from "@/lib/analytics-functions";
import GenericPageContainer from "./GenericPageContainer";
import PageHeader from "./PageHeader";
import VisualizationContainer from "./VisualizationContainer";
import PerfPerAssignment from "./Visualizations/PerfPerAssignment";
import SmallMetricCard from "./SmallMetricCard";
import { useEffect, useState } from "react";
import { StudentQuickMetrics } from "@/lib/types";
import { minutesToPrettyHours } from "@/utils/text-helpers";

interface StudentDashboardProps {
  student_id: string;
}

function StudentDashboard({
  student_id,
}: StudentDashboardProps) {
  const [data, setData] = useState<StudentQuickMetrics>({
    textbookEngagement: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    if(!student_id) return console.error("No student ID provided.");
    const data = await getStudentQuickMetrics(student_id);
    setData(data);
  }

  return (
    <GenericPageContainer>
      <PageHeader
        title="Student Dashboard"
        subtitle="View your performance and engagement with the course material."
      />
      <div className="tw-flex tw-flex-row tw-justify-between">
        <SmallMetricCard
          title="Textbook Engagement"
          value={minutesToPrettyHours(data.textbookEngagement)}
          unit="Total Time Spent"
        />
      </div>
      <VisualizationContainer
        title="Performance Per Assignment"
        description="Your scores vs. class average for each assignment."
        studentMode
      >
        <PerfPerAssignment getData={getPerformancePerAssignment} />
      </VisualizationContainer>
      <VisualizationContainer
        title="Activity Accessed"
        description="Compare your engagement with the course material to the class average."
        studentMode
      >
        <PerfPerAssignment getData={getPerformancePerAssignment} />
      </VisualizationContainer>
    </GenericPageContainer>
  );
}

export default StudentDashboard;
