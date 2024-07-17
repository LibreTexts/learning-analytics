import {
  getActivityAccessed,
  getPerformancePerAssignment,
} from "@/lib/analytics-functions";
import GenericPageContainer from "@/components/GenericPageContainer";
import PageHeader from "@/components/PageHeader";
import VisualizationContainer from "@/components/VisualizationContainer";
import PerfPerAssignment from "@/components/Visualizations/PerfPerAssignment";
import StudentQuickMetrics from "@/components/StudentQuickMetrics";
import ActivityAccessed from "./Visualizations/StudentActivity";

const StudentDashboard = ({
  course_id,
  student_id,
}: {
  course_id: string;
  student_id: string;
}) => {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Student Dashboard"
        subtitle="View your performance and engagement with the course material."
      />
      <StudentQuickMetrics course_id={course_id} student_id={student_id} />
      <VisualizationContainer
        title="Performance Per Assignment"
        description="Your scores vs. class average for each assignment."
        studentMode
      >
        <PerfPerAssignment
          getData={(student_id) =>
            getPerformancePerAssignment(course_id, student_id)
          }
        />
      </VisualizationContainer>
      <VisualizationContainer
        title="Activity Accessed"
        description="Compare your engagement with the course material."
        studentMode
      >
        <ActivityAccessed
          getData={(student_id) =>
            getActivityAccessed(course_id, student_id)
          }
        />
      </VisualizationContainer>
    </GenericPageContainer>
  );
};

export default StudentDashboard;
