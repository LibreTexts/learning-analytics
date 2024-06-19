import { Document, Schema, model, models } from "mongoose";

export interface ICalcADAPTScores_Raw {
  course_id: string;
  assignment_id: string;
  scores: number[];
}

export interface ICalcADAPTScores extends ICalcADAPTScores_Raw, Document {}

const CalcADAPTScoresSchema = new Schema<ICalcADAPTScores>(
  {
    course_id: String,
    assignment_id: String,
    scores: [Number], // Array of scores (as percent correct)
  },
  {
    collection: "calcADAPTScores",
  }
);

CalcADAPTScoresSchema.index({ course_id: 1, assignment_id: 1 }, { unique: true });

export default models.CalcADAPTScores ||
  model<ICalcADAPTScores>(
    "CalcADAPTScores",
    CalcADAPTScoresSchema,
    "calcADAPTScores"
  );
