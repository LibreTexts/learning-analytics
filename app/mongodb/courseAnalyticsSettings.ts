import { Document, Schema, model } from "mongoose";
import { IDWithName, IDWithText } from "#types/index";

export interface ICourseAnalyticsSettings_Raw {
  courseID: string;
  shareGradeDistribution: boolean;
  frameworkExclusions?: IDWithText[];
  assignmentExclusions?: IDWithName[];
}

export interface ICourseAnalyticsSettings
  extends ICourseAnalyticsSettings_Raw,
  Document { }

const CourseAnalyticsSettingsSchema = new Schema<ICourseAnalyticsSettings>(
  {
    courseID: String,
    shareGradeDistribution: {
      type: Boolean,
      default: false,
    },
    frameworkExclusions: {
      type: [
        {
          id: String,
          text: String
        },
      ],
      default: [],
    },
    assignmentExclusions: {
      type: [
        {
          id: String,
          name: String,
        },
      ],
      default: [],
    },
  },
  {
    collection: "courseAnalyticsSettings",
  }
);

CourseAnalyticsSettingsSchema.index({ courseID: 1 }, { unique: true });

export default model<ICourseAnalyticsSettings>(
  "CourseAnalyticsSettings",
  CourseAnalyticsSettingsSchema,
  "courseAnalyticsSettings"
);

export const DEFAULT_COURSE_ANALYTICS_SETTINGS: ICourseAnalyticsSettings_Raw = {
  courseID: "",
  shareGradeDistribution: false,
  frameworkExclusions: [],
  assignmentExclusions: [],
};
