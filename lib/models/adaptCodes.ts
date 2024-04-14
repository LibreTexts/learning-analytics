import { Document, Schema, model, models } from "mongoose";

export interface IAdaptCodesRaw {
  adaptCode: string;
  url: string;
  isInAdapt: boolean;
  courseId?: string;
}

export interface IAdaptCodes extends IAdaptCodesRaw, Document {}

const AdaptCodesSchema = new Schema<IAdaptCodes>(
  {
    adaptCode: { type: String, required: true },
    url: { type: String, required: true },
    isInAdapt: { type: Boolean, required: true },
    courseId: { type: String },
  },
  {
    collection: "adaptCodes",
  }
);

export default models.AdaptCodes ||
  model<IAdaptCodes>("AdaptCodes", AdaptCodesSchema);
