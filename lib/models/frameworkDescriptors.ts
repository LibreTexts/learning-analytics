import { Schema, model, models } from "mongoose";

export interface IFrameworkDescriptorRaw {
  id: number;
  descriptor: string;
  framework_level_id: number;
}

export interface IFrameworkDescriptor
  extends IFrameworkDescriptorRaw,
    Document {}

const FrameworkDescriptorSchema = new Schema<IFrameworkDescriptor>(
  {
    id: { type: Number, required: true },
    descriptor: { type: String, required: true },
    framework_level_id: { type: Number, required: true },
  },
  {
    collection: "frameworkDescriptors",
  }
);

FrameworkDescriptorSchema.index({ id: 1 }, { unique: true });

export default models.FrameworkDescriptors ||
  model<IFrameworkDescriptor>(
    "FrameworkDescriptors",
    FrameworkDescriptorSchema,
    "frameworkDescriptors"
  );
