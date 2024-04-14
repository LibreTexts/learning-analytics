import { Document, models } from "mongoose";
import { Schema, model } from "mongoose";

export interface IEnrollmentsRaw {
  email: string;
  class: number;
  created_at: string;
}

export interface IEnrollments extends IEnrollmentsRaw, Document {}

const EnrollmentsSchema = new Schema<IEnrollments>(
  {
    email: String,
    class: Number,
    created_at: String,
  },
  {
    collection: "enrollments",
  }
);

export default models.Enrollments ||
  model<IEnrollments>("Enrollments", EnrollmentsSchema, "enrollments");
