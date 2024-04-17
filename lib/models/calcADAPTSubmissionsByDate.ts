import { Document, Schema, model, models } from "mongoose";

export interface ICalcADAPTSubmissionsByDate_Raw {
  courseID: string;
  assignmentID: string;
  date: Date;
  dueDate: Date;
  count: number;
}

export interface ICalcADAPTSubmissionsByDate
  extends ICalcADAPTSubmissionsByDate_Raw,
    Document {}

const CalcADAPTSubmissionsByDateSchema =
  new Schema<ICalcADAPTSubmissionsByDate>(
    {
      courseID: String,
      assignmentID: String,
      date: Date,
      dueDate: Date,
      count: Number,
    },
    {
      collection: "calcADAPTSubmissionsByDate",
    }
  );

CalcADAPTSubmissionsByDateSchema.index(
  { courseID: 1, assignmentID: 1, date: 1},
  { unique: true }
);

export default models.CalcADAPTSubmissionsByDate ||
  model<ICalcADAPTSubmissionsByDate>(
    "CalcADAPTSubmissionsByDate",
    CalcADAPTSubmissionsByDateSchema,
    "calcADAPTSubmissionsByDate"
  );
