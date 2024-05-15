import { Document, Schema, model, models } from "mongoose";

export interface ICalcADAPTActorAvgScore_Raw {
  actor: string;
  courseID: string;
  avg_score: number;
}

export interface ICalcADAPTActorAvgScore
  extends ICalcADAPTActorAvgScore_Raw,
    Document {}

const CalcADAPTActorAvgScoreSchema = new Schema<ICalcADAPTActorAvgScore>(
  {
    actor: String,
    courseID: String,
    avg_score: Number,
  },
  {
    collection: "calcADAPTActorAvgScore",
  }
);

CalcADAPTActorAvgScoreSchema.index({ actor: 1, courseID: 1 }, { unique: true });

export default models.CalcADAPTActorAvgScore ||
  model<ICalcADAPTActorAvgScore>(
    "CalcADAPTActorAvgScore",
    CalcADAPTActorAvgScoreSchema,
    "calcADAPTActorAvgScore"
  );
