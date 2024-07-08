import { model } from "mongoose";
import { Document, Schema, models } from "mongoose";

export interface IFramework_Raw {
  framework_id: number;
  title: string;
  description: string;
  framework_levels: IFrameworkLevel_Raw[];
  descriptors: IFrameworkDescriptor_Raw[];
}

export interface IFrameworkLevel_Raw {
  id: number;
  framework_id: number;
  level: number;
  title: string;
  description: string | null;
  order: number;
  parent_id: number | null;
}

export interface IFrameworkDescriptor_Raw {
  id: number;
  descriptor: string;
  framework_level_id: number;
}

export interface IFramework extends IFramework_Raw, Document {}

const FrameworkSchema = new Schema<IFramework>(
  {
    framework_id: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    framework_levels: {
      type: [
        {
          id: { type: Number, required: true },
          framework_id: { type: Number, required: true },
          level: { type: Number, required: true },
          title: { type: String, required: true },
          description: { type: String, required: false },
          order: { type: Number, required: true },
          parent_id: { type: Number, required: false },
        },
      ],
      required: true,
    },
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
    collection: "frameworks",
  }
);

FrameworkSchema.index({ framework_id: 1 }, { unique: true });

export default models.Framework ||
  model<IFramework>("Framework", FrameworkSchema, "frameworks");
