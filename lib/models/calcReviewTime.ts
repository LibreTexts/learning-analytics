import { Document, Schema, model, models } from "mongoose";

export interface ICalcReviewTime_Raw {
  actor: string;
  course_id: number;
  assignment_id: number;
  question_id: number;
  total_review_time: number;
}

export interface ICalcReviewTime extends ICalcReviewTime_Raw, Document {}

const CalcReviewTimeSchema = new Schema<ICalcReviewTime>(
  {
    actor: { type: String, required: true },
    course_id: { type: Number, required: true },
    assignment_id: { type: Number, required: true },
    question_id: { type: Number, required: true },
    total_review_time: { type: Number, required: true },
  },
  {
    collection: "calcReviewTime",
  }
);

CalcReviewTimeSchema.index(
  { course_id: 1, assignment_id: 1, actor: 1, question_id: 1 },
  { unique: true }
);

export default models.CalcReviewTime ||
  model<ICalcReviewTime>(
    "CalcReviewTime",
    CalcReviewTimeSchema,
    "calcReviewTime"
  );
