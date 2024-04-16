import { getPerformancePerAssignment } from "@/lib/analytics-functions";
import GenericPageContainer from "./GenericPageContainer";
import PageHeader from "./PageHeader";
import VisualizationContainer from "./VisualizationContainer";
import PerfPerAssignment from "./Visualizations/PerfPerAssignment";

function StudentDashboard() {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Student Dashboard"
        subtitle="View your performance and engagement with the course material."
      />
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
