import { models } from "mongoose";
import { Document } from "mongoose";
import { Schema, model } from "mongoose";

export interface IGradebookRaw {
  email: string;
  assignment_name: string;
  course_id: string;
  score: number;
  points_possible: number;
  assignment_percent: number;
  turned_in_assignment: boolean;
  overall_course_percent: number;
  overall_course_grade: string;
  assignment_due: string;
  assignment_id: number;
}

export interface IGradebook extends IGradebookRaw, Document {}

const GradebookSchema = new Schema<IGradebook>(
  {
    email: String,
    assignment_name: String,
    course_id: String,
    score: Number,
    points_possible: Number,
    assignment_percent: Number,
    turned_in_assignment: Boolean,
    overall_course_percent: Number,
    overall_course_grade: String,
    assignment_due: String,
    assignment_id: Number,
  },
  {
    collection: "gradebook",
  }
);

GradebookSchema.index({ assignment_id: 1 });

export default models.Gradebook ||
  model<IGradebook>("Gradebook", GradebookSchema);
