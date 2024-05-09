import PageHeader from "@/components/PageHeader";
import GenericPageContainer from "@/components/GenericPageContainer";
import StudentPermissions from "@/components/CourseSettings/StudentPermissions";
import { updateCourseAnalyticsSettings } from "@/lib/analytics-functions";

export default function CourseSettings() {


  return (
    <GenericPageContainer>
      <PageHeader
        title="Course Settings"
        subtitle="Configure your course analytics and sharing settings."
      />
      <StudentPermissions saveData={updateCourseAnalyticsSettings} />
    </GenericPageContainer>
  );
}
