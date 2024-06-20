import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import StudentPermissions from "@/components/CourseSettings/StudentPermissions";
import { updateCourseAnalyticsSettings } from "@/lib/analytics-functions";
import FrameworkExclusions from "@/components/CourseSettings/FrameworkExclusions";
import AssignmentExclusions from "@/components/CourseSettings/AssignmentExclusions";

export default function CourseSettings() {
  return (
    <GenericPageContainer>
      <PageHeader
        title="Course Settings"
        subtitle="Configure your course analytics and sharing settings."
      />
      <StudentPermissions saveData={updateCourseAnalyticsSettings} />
      <AssignmentExclusions
        saveData={updateCourseAnalyticsSettings}
        className="tw-mt-6"
      />
      <FrameworkExclusions
        saveData={updateCourseAnalyticsSettings}
        className="tw-mt-6"
      />
    </GenericPageContainer>
  );
}
