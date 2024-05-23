import { ICourseAnalyticsSettings_Raw } from "../models/courseAnalyticsSettings";

export type GlobalState = {
  ferpaPrivacy: boolean;
  role: string;
  viewAs: string;
  studentId: string;
  assignmentId: string;
} & ICourseAnalyticsSettings_Raw;
