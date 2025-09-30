import { Document, Schema, model } from "mongoose";

export interface ICalcADAPTAssignments_Raw {
  actor: string;
  courseID: string;
  assignments: { assignment_id: string; score: number }[];
  assignments_count: number;
}

export interface ICalcADAPTAssignments
  extends ICalcADAPTAssignments_Raw,
  Document { }

const CalcADAPTAssignmentsSchema = new Schema<ICalcADAPTAssignments>(
  {
    actor: String,
    courseID: String,
    assignments: [
      {
        assignment_id: String,
        score: Number,
      },
    ],
    assignments_count: Number,
  },
  {
    collection: "calcADAPTAssignments",
  }
);

CalcADAPTAssignmentsSchema.index({ actor: 1, courseID: 1 }, { unique: true });

export default model<ICalcADAPTAssignments>(
  "CalcADAPTAssignments",
  CalcADAPTAssignmentsSchema,
  "calcADAPTAssignments"
);
