import { Document, Schema, model } from "mongoose";

export interface ICalcADAPTStudentActivity_Raw {
  course_id: string;
  assignment_id: string;
  student_id: string;
  seen: string[];
  unseen: string[];
}

export interface ICalcADAPTStudentActivity
  extends ICalcADAPTStudentActivity_Raw,
  Document { }

const CalcADAPTStudentActivitySchema = new Schema<ICalcADAPTStudentActivity>(
  {
    course_id: String,
    assignment_id: String,
    student_id: String,
    seen: [String],
    unseen: [String],
  },
  {
    collection: "calcADAPTStudentActivity",
  }
);

CalcADAPTStudentActivitySchema.index(
  { course_id: 1, student_id: 1, assignment_id: 1 },
  { unique: true }
);

export default model<ICalcADAPTStudentActivity>(
  "CalcADAPTStudentActivity",
  CalcADAPTStudentActivitySchema,
  "calcADAPTStudentActivity"
);
