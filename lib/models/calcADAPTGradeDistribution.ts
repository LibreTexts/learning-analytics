import { Document, Schema, model, models } from "mongoose";

export interface ICalcADAPTGradeDistribution_Raw {
  courseID: string;
  grades: string[]; // Letter grades (A, B, C, D, F)
}

export interface ICalcADAPTGradeDistribution
  extends ICalcADAPTGradeDistribution_Raw,
    Document {}

const CalcADAPTGradeDistributionSchema =
  new Schema<ICalcADAPTGradeDistribution>(
    {
      courseID: String,
      grades: [String],
    },
    {
      collection: "calcADAPTGradeDistribution",
    }
  );

CalcADAPTGradeDistributionSchema.index({ courseID: 1 }, { unique: true });

export default models.CalcADAPTGradeDistribution ||
  model<ICalcADAPTGradeDistribution>(
    "CalcADAPTGradeDistribution",
    CalcADAPTGradeDistributionSchema,
    "calcADAPTGradeDistribution"
  );
