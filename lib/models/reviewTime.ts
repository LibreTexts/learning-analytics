import { Document, Schema, model, models } from "mongoose";
import { IDWithText } from "../types";

export interface IReviewTime_Raw {
  course_id: number;
  assignment_id: number;
  actor: string;
  questions: {
    question_id: number;
    review_time_start: string;
    review_time_end: string;
  }[];
}

export interface IReviewTime extends IReviewTime_Raw, Document {}

const ReviewTimeSchema = new Schema<IReviewTime>(
  {
    course_id: { type: Number, required: true },
    assignment_id: { type: Number, required: true },
    actor: { type: String, required: true },
    questions: [
      {
        question_id: { type: Number, required: true },
        review_time_start: { type: String, required: true },
        review_time_end: { type: String, required: true },
      },
    ],
  },
  {
    collection: "reviewTime",
  }
);

ReviewTimeSchema.index(
  { course_id: 1, assignment_id: 1, actor: 1 },
  { unique: true }
);

export default models.ReviewTime ||
  model<IReviewTime>("ReviewTime", ReviewTimeSchema, "reviewTime");
