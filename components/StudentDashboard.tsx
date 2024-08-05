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
import NoCourseData from "./NoCourseData";

function StudentDashboard({
  course_id,
  student_id,
  has_data,
}: {
  course_id: string;
  student_id: string;
  has_data: boolean;
}) {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Student Dashboard"
        subtitle="View your performance and engagement with the course material."
      />
      {
        has_data ? (
          <>
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
          </>
        ) : (
          <NoCourseData />
        )}
    </GenericPageContainer>
  );
};

export default StudentDashboard;
