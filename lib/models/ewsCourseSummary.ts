import { Document, Schema, model, models } from "mongoose";
import { EarlyWarningStatus } from "../types/ews";

export interface IEWSCourseSummary_Raw {
  course_id: string;
  assignments: {
    assignment_id: string;
    avg_score: number;
    avg_time_on_task: number;
    avg_time_in_review: number;
  }[];
  avg_percent_seen: number;
  avg_interaction_days: number;
  avg_course_percent: number;
  last_updated: Date;
  status: EarlyWarningStatus;
}

export interface IEWSCourseSummary extends IEWSCourseSummary_Raw, Document {}

const EWSCourseSummarySchema = new Schema<IEWSCourseSummary>(
  {
    course_id: { type: String, required: true },
    assignments: [
      {
        assignment_id: { type: String, required: true },
        avg_score: { type: Number, required: true },
        avg_time_on_task: { type: Number, required: true },
        avg_time_in_review: { type: Number, required: true },
      },
    ],
    avg_percent_seen: { type: Number, required: true },
    avg_interaction_days: { type: Number, required: true },
    avg_course_percent: { type: Number, required: true },
    last_updated: { type: Date, default: Date.now },
    status: { type: String, required: true },
  },
  {
    collection: "ewsCourseSummary",
  }
);

EWSCourseSummarySchema.index({ course_id: 1 }, { unique: true });

export default models.EWSCourseSummary ||
  model<IEWSCourseSummary>(
    "EWSCourseSummary",
    EWSCourseSummarySchema,
    "ewsCourseSummary"
  );
