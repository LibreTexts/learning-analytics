import { Document, Schema, model, models } from "mongoose";

export interface ICalcADAPTInteractionDays_Raw {
  actor: string;
  courseID: string;
  days: Date[];
  days_count: number;
}

export interface ICalcADAPTInteractionDays
  extends ICalcADAPTInteractionDays_Raw,
    Document {}

const CalcADAPTInteractionDaysSchema = new Schema<ICalcADAPTInteractionDays>(
  {
    actor: String,
    courseID: String,
    days: [Date],
    days_count: Number,
  },
  {
    collection: "calcADAPTInteractionDays",
  }
);

CalcADAPTInteractionDaysSchema.index({ actor: 1, courseID: 1 }, { unique: true });

export default models.CalcADAPTInteractionDays ||
  model<ICalcADAPTInteractionDays>(
    "CalcADAPTInteractionDays",
    CalcADAPTInteractionDaysSchema,
    "calcADAPTInteractionDays"
  );
