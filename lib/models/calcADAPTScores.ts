import { Document, Schema, model, models } from "mongoose";

export interface ICalcADAPTScores_Raw {
  courseID: string;
  assignmentID: string;
  scores: number[];
}

export interface ICalcADAPTScores extends ICalcADAPTScores_Raw, Document {}

const CalcADAPTScoresSchema = new Schema<ICalcADAPTScores>(
  {
    courseID: String,
    assignmentID: String,
    scores: [Number],
  },
  {
    collection: "calcADAPTScores",
  }
);

CalcADAPTScoresSchema.index({ courseID: 1, assignmentID: 1 }, { unique: true });

export default models.CalcADAPTScores ||
  model<ICalcADAPTScores>(
    "CalcADAPTScores",
    CalcADAPTScoresSchema,
    "calcADAPTScores"
  );
