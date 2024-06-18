import { Document, Schema, model, models } from "mongoose";
import { ADAPTCourseAssignment, IDWithName } from "../types";

export interface IAdaptCoursesRaw {
  course_id: string;
  instructor_id: string;
  name?: string;
  textbook_url: string;
  is_in_adapt: boolean;
  letter_grades_released?: boolean;
  start_date?: string;
  end_date?: string;
  assignments: ADAPTCourseAssignment[];
}

export interface IAdaptCourses extends IAdaptCoursesRaw, Document {}

const AdaptCoursesSchema = new Schema<IAdaptCourses>(
  {
    course_id: { type: String, required: true },
    instructor_id: { type: String, required: true },
    name: { type: String },
    textbook_url: { type: String, required: true },
    is_in_adapt: { type: Boolean, required: true },
    letter_grades_released: { type: Boolean },
    start_date: { type: String },
    end_date: { type: String },
    assignments: [
      {
        id: Number,
        name: String,
        num_questions: Number,
      },
    ],
  },
  {
    collection: "adaptCourses",
  }
);

AdaptCoursesSchema.index({ course_id: 1 }, { unique: true });

export default models.AdaptCourses ||
  model<IAdaptCourses>("AdaptCourses", AdaptCoursesSchema, "adaptCourses");
