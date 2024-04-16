import { Document, Schema, model, models } from "mongoose";

export interface ITextbookInteractionsByDate_Raw {
  numInteractions: number;
  date: string;
  textbookID: string;
}

export interface ITextbookInteractionsByDate
  extends ITextbookInteractionsByDate_Raw,
    Document {}

const TextbookInteractionsByDateSchema =
  new Schema<ITextbookInteractionsByDate>(
    {
      numInteractions: Number,
      date: String,
      textbookID: String,
    },
    {
      collection: "textbookInteractionsByDate",
    }
  );

export default models.TextbookInteractionsByDate ||
  model<ITextbookInteractionsByDate>(
    "TextbookInteractionsByDate",
    TextbookInteractionsByDateSchema,
    "textbookInteractionsByDate"
  );
