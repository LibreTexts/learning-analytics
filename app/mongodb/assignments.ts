import { Schema, model } from "mongoose";

export interface IAssignmentRaw {
  course_id: string;
  assignment_id: string;
  name: string;
  num_questions: number;
  questions: string[];
  due_date: Date | null;
  final_submission_deadline: Date | null;
}

export interface IAssignment extends IAssignmentRaw, Document {}

const AssignmentSchema = new Schema<IAssignment>(
  {
    course_id: { type: String, required: true },
    assignment_id: { type: String, required: true },
    name: { type: String, required: true },
    num_questions: { type: Number, required: true },
    questions: [String],
    due_date: { type: Date, required: false },
    final_submission_deadline: { type: Date, required: false },
  },
  {
    collection: "assignments",
  }
);

AssignmentSchema.index({ course_id: 1, assignment_id: 1 }, { unique: true });

export default model<IAssignment>("Assignment", AssignmentSchema, "assignments");
