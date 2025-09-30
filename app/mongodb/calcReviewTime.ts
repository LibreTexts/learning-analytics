import { Document, Schema, model } from "mongoose";

export interface ICalcReviewTime_Raw {
  student_id: string;
  course_id: number;
  assignment_id: number;
  question_id: number;
  total_review_time: number;
}

export interface ICalcReviewTime extends ICalcReviewTime_Raw, Document { }

const CalcReviewTimeSchema = new Schema<ICalcReviewTime>(
  {
    student_id: { type: String, required: true },
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
  { course_id: 1, assignment_id: 1, student_id: 1, question_id: 1 },
  { unique: true }
);

export default model<ICalcReviewTime>(
  "CalcReviewTime",
  CalcReviewTimeSchema,
  "calcReviewTime"
);
