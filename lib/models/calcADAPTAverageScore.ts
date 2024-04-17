import { Document, Schema, model, models } from "mongoose";

export interface ICalcADAPTAverageScore_Raw {
  actor: string;
  courseID: string;
  avg_score: number;
}

export interface ICalcADAPTAverageScore
  extends ICalcADAPTAverageScore_Raw,
    Document {}

const CalcADAPTAverageScoreSchema = new Schema<ICalcADAPTAverageScore>(
  {
    actor: String,
    courseID: String,
    avg_score: Number,
  },
  {
    collection: "calcADAPTAverageScore",
  }
);

CalcADAPTAverageScoreSchema.index({ actor: 1, courseID: 1 }, { unique: true });

export default models.CalcADAPTAverageScore ||
  model<ICalcADAPTAverageScore>(
    "CalcADAPTAverageScore",
    CalcADAPTAverageScoreSchema,
    "calcADAPTAverageScore"
  );
