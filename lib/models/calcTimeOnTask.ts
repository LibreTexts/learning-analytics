import { Document, Schema, model, models } from "mongoose";

export interface ICalcTimeOnTask_Raw {
  student_id: string;
  course_id: string;
  assignment_id: string;
  question_id: string;
  total_time_seconds: number;
}

export interface ICalcTimeOnTask extends ICalcTimeOnTask_Raw, Document {}

const CalcTimeOnTaskSchema = new Schema<ICalcTimeOnTask>(
  {
    student_id: { type: String, required: true },
    course_id: { type: String, required: true },
    assignment_id: { type: String, required: true },
    question_id: { type: String, required: true },
    total_time_seconds: { type: Number, required: true }, // time in seconds
  },
  {
    collection: "calcTimeOnTask",
  }
);

CalcTimeOnTaskSchema.index(
  { course_id: 1, assignment_id: 1, student_id: 1, question_id: 1 },
  { unique: true }
);

export default models.CalcTimeOnTask ||
  model<ICalcTimeOnTask>(
    "CalcTimeOnTask",
    CalcTimeOnTaskSchema,
    "calcTimeOnTask"
  );
