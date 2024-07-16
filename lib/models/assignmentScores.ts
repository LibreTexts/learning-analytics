import { Document, models } from "mongoose";
import { Schema, model } from "mongoose";

export interface IQuestionScoreData {
  question_id: string;
  score: string;
  time_on_task: string;
  first_submitted_at: string | null;
  last_submitted_at: string | null;
  max_score: string;
}

export interface IAssignmentScoresRaw {
  student_id: string;
  course_id: string;
  assignment_id: string;
  percent_correct: string;
  total_points: string;
  questions: IQuestionScoreData[];
}

export interface IAssignmentScores extends IAssignmentScoresRaw, Document {}

const AssignmentScoresSchema = new Schema<IAssignmentScores>(
  {
    student_id: { type: String, required: true },
    course_id: { type: String, required: true },
    assignment_id: { type: String, required: true },
    percent_correct: { type: String, required: true },
    total_points: { type: String, required: true },
    questions: [
      {
        question_id: String,
        score: String,
        time_on_task: String,
        first_submitted_at: { type: String, default: null},
        last_submitted_at: { type: String, default: null},
        max_score: String,
      },
    ],
  },
  {
    collection: "assignmentScores",
  }
);

AssignmentScoresSchema.index(
  { student_id: 1, assignment_id: 1 },
  { unique: true }
);

export default models.AssignmentScores ||
  model<IAssignmentScores>(
    "AssignmentScores",
    AssignmentScoresSchema,
    "assignmentScores"
  );
