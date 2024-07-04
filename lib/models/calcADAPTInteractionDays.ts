import { Document, Schema, model, models } from "mongoose";

export interface ICalcADAPTInteractionDays_Raw {
  course_id: string;
  student_id: string;
  days_count: number;
}

export interface ICalcADAPTInteractionDays
  extends ICalcADAPTInteractionDays_Raw,
    Document {}

const CalcADAPTInteractionDaysSchema = new Schema<ICalcADAPTInteractionDays>(
  {
    course_id: String,
    student_id: String,
    days_count: Number,
  },
  {
    collection: "calcADAPTInteractionDays",
  }
);

CalcADAPTInteractionDaysSchema.index(
  { course_id: 1, student_id: 1 },
  { unique: true }
);

export default models.CalcADAPTInteractionDays ||
  model<ICalcADAPTInteractionDays>(
    "CalcADAPTInteractionDays",
    CalcADAPTInteractionDaysSchema,
    "calcADAPTInteractionDays"
  );
