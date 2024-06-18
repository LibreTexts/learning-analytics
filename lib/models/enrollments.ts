import { Document, models } from "mongoose";
import { Schema, model } from "mongoose";

export interface IEnrollmentsRaw {
  student_id: string;
  email: string;
  course_id: number;
  created_at: string;
}

export interface IEnrollments extends IEnrollmentsRaw, Document {}

const EnrollmentsSchema = new Schema<IEnrollments>(
  {
    student_id: String,
    email: String,
    course_id: String,
    created_at: String,
  },
  {
    collection: "enrollments",
  }
);

EnrollmentsSchema.index({ email: 1, course_id: 1 }, { unique: true });

export default models.Enrollments ||
  model<IEnrollments>("Enrollments", EnrollmentsSchema, "enrollments");
