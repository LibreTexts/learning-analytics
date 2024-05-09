import { Document, Schema, model, models } from "mongoose";

export interface ICourseAnalyticsSettings_Raw {
  courseID: string;
  shareGradeDistribution: boolean;
}

export interface ICourseAnalyticsSettings
  extends ICourseAnalyticsSettings_Raw,
    Document {}

const CourseAnalyticsSettingsSchema = new Schema<ICourseAnalyticsSettings>(
  {
    courseID: String,
    shareGradeDistribution: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "courseAnalyticsSettings",
  }
);

CourseAnalyticsSettingsSchema.index({ courseID: 1 }, { unique: true });

export default models.CourseAnalyticsSettings ||
  model<ICourseAnalyticsSettings>(
    "CourseAnalyticsSettings",
    CourseAnalyticsSettingsSchema,
    "courseAnalyticsSettings"
  );

export const DEFAULT_COURSE_ANALYTICS_SETTINGS: ICourseAnalyticsSettings_Raw = {
  courseID: "",
  shareGradeDistribution: false,
};
