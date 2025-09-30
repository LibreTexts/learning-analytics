import { Document, Schema, model } from "mongoose";

export interface IFrameworkDescriptor_Raw {
  id: number;
  descriptor: string;
  framework_level_id: number;
}

export interface IFrameworkLevel_Raw {
  level_id: number;
  framework_id: number;
  title: string;
  description: string | null;
  order: number;
  parent_id: number | null;
  descriptors: IFrameworkDescriptor_Raw[];
}

export interface IFrameworkLevel extends IFrameworkLevel_Raw, Document { }

const FrameworkLevelSchema = new Schema<IFrameworkLevel>(
  {
    level_id: { type: Number, required: true },
    framework_id: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: false },
    order: { type: Number, required: true },
    parent_id: { type: Number, required: false },
    descriptors: {
      type: [
        {
          id: { type: Number, required: true },
          descriptor: { type: String, required: true },
          framework_level_id: { type: Number, required: true },
        },
      ],
      required: true,
    },
  },
  {
    collection: "frameworkLevels",
  }
);

FrameworkLevelSchema.index({ level_id: 1 }, { unique: true });

export default model<IFrameworkLevel>(
  "FrameworkLevel",
  FrameworkLevelSchema,
  "frameworkLevels"
);
