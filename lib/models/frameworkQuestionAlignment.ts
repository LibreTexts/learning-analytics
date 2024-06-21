import { Document, Schema, model, models } from "mongoose";
import { IDWithText } from "../types";

export interface IFrameworkQuestionAlignment_Raw {
  course_id: string;
  assignment_id: string;
  question_id: string;
  framework_descriptors: IDWithText<string>[];
  framework_levels: IDWithText<string>[];
}

export interface IFrameworkQuestionAlignment
  extends IFrameworkQuestionAlignment_Raw,
    Document {}

const FrameworkQuestionAlignmentSchema =
  new Schema<IFrameworkQuestionAlignment>(
    {
      course_id: { type: String, required: true },
      assignment_id: { type: String, required: true },
      question_id: { type: String, required: true },
      framework_descriptors: {
        type: [{ id: String, text: String }],
        required: true,
      },
      framework_levels: {
        type: [{ id: String, text: String }],
        required: true,
      },
    },
    {
      collection: "frameworkQuestionAlignment",
    }
  );

FrameworkQuestionAlignmentSchema.index(
  { assignment_id: 1, question_id: 1 },
  { unique: true }
);

export default models.FrameworkQuestionAlignment ||
  model<IFrameworkQuestionAlignment>(
    "FrameworkQuestionAlignment",
    FrameworkQuestionAlignmentSchema,
    "frameworkQuestionAlignment"
  );
