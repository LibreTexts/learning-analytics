import { Document, Schema, model, models } from "mongoose";
import { IDWithText } from "../types";

export interface IFrameworkQuestionAlignment_Raw {
  assignment_id: number;
  question_id: number;
  framework_descriptors: IDWithText<number>[];
  framework_levels: IDWithText<number>[];
}

export interface IFrameworkQuestionAlignment
  extends IFrameworkQuestionAlignment_Raw,
    Document {}

const FrameworkQuestionAlignmentSchema =
  new Schema<IFrameworkQuestionAlignment>(
    {
      assignment_id: { type: Number, required: true },
      question_id: { type: Number, required: true },
      framework_descriptors: {
        type: [{ id: Number, text: String }],
        required: true,
      },
      framework_levels: {
        type: [{ id: Number, text: String }],
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
