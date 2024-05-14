import { Document, Schema, model, models } from "mongoose";
import { IDWithName } from "../types";

export interface ICalcADAPTAllAssignments_Raw {
  courseID: string;
  assignments: IDWithName[];
}

export interface ICalcADAPTAllAssignments
  extends ICalcADAPTAllAssignments_Raw,
    Document {}

const CalcADAPTAllAssignmentsSchema = new Schema<ICalcADAPTAllAssignments>(
  {
    courseID: String,
    assignments: [
      {
        id: String,
        name: String,
      },
    ],
  },
  {
    collection: "calcADAPTAllAssignments",
  }
);

CalcADAPTAllAssignmentsSchema.index({ courseID: 1 }, { unique: true });

export default models.CalcADAPTAllAssignments ||
  model<ICalcADAPTAllAssignments>(
    "CalcADAPTAllAssignments",
    CalcADAPTAllAssignmentsSchema,
    "calcADAPTAllAssignments"
  );
