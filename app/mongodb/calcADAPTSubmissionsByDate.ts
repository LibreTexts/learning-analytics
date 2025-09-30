import { Document, Schema, model } from "mongoose";

export interface ICalcADAPTSubmissionsByDate_Raw {
  course_id: string;
  assignment_id: string;
  questions: {
    question_id: string;
    submissions: string[];
  }[];
  due_date: string;
}

export interface ICalcADAPTSubmissionsByDate
  extends ICalcADAPTSubmissionsByDate_Raw,
  Document { }

const CalcADAPTSubmissionsByDateSchema =
  new Schema<ICalcADAPTSubmissionsByDate>(
    {
      course_id: { type: String, required: true },
      assignment_id: { type: String, required: true },
      questions: [
        {
          question_id: { type: String, required: true },
          submissions: [String],
        },
      ],
      due_date: { type: String, required: true },
    },
    {
      collection: "calcADAPTSubmissionsByDate",
    }
  );

CalcADAPTSubmissionsByDateSchema.index(
  { course_id: 1, assignment_id: 1 },
  { unique: true }
);

export default model<ICalcADAPTSubmissionsByDate>(
  "CalcADAPTSubmissionsByDate",
  CalcADAPTSubmissionsByDateSchema,
  "calcADAPTSubmissionsByDate"
);
