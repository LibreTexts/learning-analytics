import { Document, Schema, model, models } from "mongoose";

export interface ICalcADAPTAssignments_Raw {
  actor: string;
  courseID: string;
  assignments: string[];
  assignments_count: number;
}

export interface ICalcADAPTAssignments
  extends ICalcADAPTAssignments_Raw,
    Document {}

const CalcADAPTAssignmentsSchema = new Schema<ICalcADAPTAssignments>(
  {
    actor: String,
    courseID: String,
    assignments: [String],
    assignments_count: Number,
  },
  {
    collection: "calcADAPTAssignments",
  }
);

CalcADAPTAssignmentsSchema.index({ actor: 1, courseID: 1 }, { unique: true });

export default models.CalcADAPTAssignments ||
  model<ICalcADAPTAssignments>(
    "CalcADAPTAssignments",
    CalcADAPTAssignmentsSchema,
    "calcADAPTAssignments"
  );
