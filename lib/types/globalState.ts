import { ICourseAnalyticsSettings_Raw } from "../models/courseAnalyticsSettings";

export type GlobalState = {
  ferpaPrivacy: boolean;
  role: string;
  viewAs: string;
  student: {
    id: string;
    email: string;
    name: string;
  };
  assignmentId: string;
  courseLetterGradesReleased: boolean;
} & ICourseAnalyticsSettings_Raw;
