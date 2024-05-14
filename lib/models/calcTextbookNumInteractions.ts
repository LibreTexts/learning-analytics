import { Document, Schema, model, models } from "mongoose";

export interface ICalcTextbookNumInteractions_Raw {
  actor: string;
  textbookID: string;
  totalInteractions: number;
}

export interface ICalcTextbookNumInteractions
  extends ICalcTextbookNumInteractions_Raw,
    Document {}

const CalcTextbookNumInteractions = new Schema<ICalcTextbookNumInteractions>(
  {
    actor: String,
    textbookID: String,
    totalInteractions: Number,
  },
  {
    collection: "calcTextbookNumInteractions",
  }
);

CalcTextbookNumInteractions.index(
  { actor: 1, textbookID: 1 },
  { unique: true }
);

export default models.CalcTextbookNumInteractions ||
  model<ICalcTextbookNumInteractions>(
    "CalcTextbookNumInteractions",
    CalcTextbookNumInteractions,
    "calcTextbookNumInteractions"
  );
