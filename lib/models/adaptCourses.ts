import { Document, Schema, model, models } from "mongoose";

export interface IAdaptCoursesRaw {
  courseID: string;
  url: string;
  isInAdapt: boolean;
  courseId?: string;
}

export interface IAdaptCourses extends IAdaptCoursesRaw, Document {}

const AdaptCoursesSchema = new Schema<IAdaptCourses>(
  {
    courseID: { type: String, required: true },
    url: { type: String, required: true },
    isInAdapt: { type: Boolean, required: true },
    courseId: { type: String },
  },
  {
    collection: "adaptCourses",
  }
);

AdaptCoursesSchema.index({ courseID: 1 }, { unique: true });

export default models.AdaptCourses ||
  model<IAdaptCourses>("AdaptCourses", AdaptCoursesSchema, "adaptCourses");
