import { getPerformancePerAssignment } from "@/lib/analytics-functions";
import GenericPageContainer from "@/components/GenericPageContainer";
import PageHeader from "@/components/PageHeader";
import VisualizationContainer from "@/components/VisualizationContainer";
import PerfPerAssignment from "@/components/Visualizations/PerfPerAssignment";
import { useAtom } from "jotai";
import { globalStateAtom } from "@/state/globalState";
import StudentQuickMetrics from "@/components/StudentQuickMetrics";

const StudentDashboard = () => {
  const [globalState] = useAtom(globalStateAtom);

  return (
    <GenericPageContainer>
      <PageHeader
        title="Student Dashboard"
        subtitle="View your performance and engagement with the course material."
      />
      <StudentQuickMetrics studentId={globalState.studentId} />
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
};

export default StudentDashboard;
