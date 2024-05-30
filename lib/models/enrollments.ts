import { Document, models } from "mongoose";
import { Schema, model } from "mongoose";

export interface IEnrollmentsRaw {
  email: string;
  courseID: number;
  created_at: string;
}

export interface IEnrollments extends IEnrollmentsRaw, Document {}

const EnrollmentsSchema = new Schema<IEnrollments>(
  {
    email: String,
    courseID: String,
    created_at: String,
  },
  {
    collection: "enrollments",
  }
);

EnrollmentsSchema.index({ email: 1, courseID: 1 }, { unique: true });

export default models.Enrollments ||
  model<IEnrollments>("Enrollments", EnrollmentsSchema, "enrollments");
