import { Document, Schema, model } from "mongoose";

export interface ICalcTextbookActivityTime_Raw {
  actor: string;
  textbookID: string;
  activity_time: number;
}

export interface ICalcTextbookActivityTime
  extends ICalcTextbookActivityTime_Raw,
  Document { }

const CalcTextbookActivityTimeSchema = new Schema<ICalcTextbookActivityTime>(
  {
    actor: String,
    textbookID: String,
    activity_time: Number,
  },
  {
    collection: "calcTextbookActivityTime",
  }
);

CalcTextbookActivityTimeSchema.index(
  { actor: 1, textbookID: 1 },
  { unique: true }
);

export default model<ICalcTextbookActivityTime>(
  "CalcTextbookActivityTime",
  CalcTextbookActivityTimeSchema,
  "calcTextbookActivityTime"
);
