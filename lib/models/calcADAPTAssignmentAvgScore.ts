import { Document, Schema, model, models } from "mongoose";

export interface ICalcADAPTAssignmentAvgScore_Raw {
  actor: string;
  courseID: string;
  avg_score: number;
}

export interface ICalcADAPTAssignmentAvgScore
  extends ICalcADAPTAssignmentAvgScore_Raw,
    Document {}

const CalcADAPTAssignmentAvgScoreSchema = new Schema<ICalcADAPTAssignmentAvgScore>(
  {
    actor: String,
    courseID: String,
    avg_score: Number,
  },
  {
    collection: "calcADAPTAssignmentAvgScore",
  }
);

CalcADAPTAssignmentAvgScoreSchema.index({ actor: 1, courseID: 1 }, { unique: true });

export default models.CalcADAPTAssignmentAvgScore ||
  model<ICalcADAPTAssignmentAvgScore>(
    "CalcADAPTAssignmentAvgScore",
    CalcADAPTAssignmentAvgScoreSchema,
    "calcADAPTAssignmentAvgScore"
  );
