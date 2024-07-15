import { model } from "mongoose";
import { Document, Schema, models } from "mongoose";

export interface IFramework_Raw {
  framework_id: number;
  title: string;
  description: string;
}

export interface IFramework extends IFramework_Raw, Document {}

const FrameworkSchema = new Schema<IFramework>(
  {
    framework_id: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  {
    collection: "frameworks",
  }
);

FrameworkSchema.index({ framework_id: 1 }, { unique: true });

export default models.Framework ||
  model<IFramework>("Framework", FrameworkSchema, "frameworks");
