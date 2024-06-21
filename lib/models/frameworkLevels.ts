import { Schema, model, models } from "mongoose";

export interface IFrameworkLevelRaw {
  id: number;
  framework_id: number;
  level: number;
  title: string;
  description: string | null;
  order: number;
  parent_id: number | null;
}

export interface IFrameworkLevel extends IFrameworkLevelRaw, Document {}

const FrameworkLevelSchema = new Schema<IFrameworkLevel>(
  {
    id: { type: Number, required: true },
    framework_id: { type: Number, required: true },
    level: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: false },
    order: { type: Number, required: true },
    parent_id: { type: Number, required: false },
  },
  {
    collection: "frameworkLevels",
  }
);

FrameworkLevelSchema.index({ id: 1 }, { unique: true });

export default models.FrameworkLevels ||
  model<IFrameworkLevel>(
    "FrameworkLevels",
    FrameworkLevelSchema,
    "frameworkLevels"
  );
