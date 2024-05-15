import { Document, Schema, model, models } from "mongoose";

export interface IEWSCourseSummary_Raw {
  course_id: string;
  assignments: { assignment_id: string; avg_score: number }[];
  avg_percent_seen: number;
  avg_interaction_days: number;
  avg_course_percent: number;
}

export interface IEWSCourseSummary extends IEWSCourseSummary_Raw, Document {}

const EWSCourseSummarySchema = new Schema<IEWSCourseSummary>(
  {
    course_id: { type: String, required: true },
    assignments: [
      {
        assignment_id: { type: String, required: true },
        avg_score: { type: Number, required: true },
      },
    ],
    avg_percent_seen: { type: Number, required: true },
    avg_interaction_days: { type: Number, required: true },
    avg_course_percent: { type: Number, required: true },
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
