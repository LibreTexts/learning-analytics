import { Document, Schema, model, models } from "mongoose";

export interface IEWSActorSummary_Raw {
  actor_id: string;
  course_id: string;
  assignments: {
    assignment_id: string;
    avg_unweighted_score: number; // Unweighted average of scores across assignment questions
    avg_time_on_task: number; // In minutes
    avg_time_in_review: number; // In minutes
  }[];
  percent_seen: number;
  interaction_days: number;
  course_percent: number;
  latest_predicted_percent?: number;
}

export interface IEWSActorSummary extends IEWSActorSummary_Raw, Document {}

const EWSActorSummarySchema = new Schema<IEWSActorSummary>(
  {
    actor_id: { type: String, required: true },
    course_id: { type: String, required: true },
    assignments: [
      {
        assignment_id: { type: String, required: true },
        avg_unweighted_score: { type: Number, required: true },
        avg_time_on_task: { type: Number, required: true },
        avg_time_in_review: { type: Number, required: true },
      },
    ],
    percent_seen: { type: Number, required: true },
    interaction_days: { type: Number, required: true },
    course_percent: { type: Number, required: true },
    latest_predicted_percent: { type: Number },
  },
  {
    collection: "ewsActorSummary",
  }
);

EWSActorSummarySchema.index({ actor_id: 1, course_id: 1 }, { unique: true });

export default models.EWSActorSummary ||
  model<IEWSActorSummary>(
    "EWSActorSummary",
    EWSActorSummarySchema,
    "ewsActorSummary"
  );
