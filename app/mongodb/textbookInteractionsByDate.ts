import { Document, Schema, model } from "mongoose";

export interface ITextbookInteractionsByDate_Raw {
  actor: string;
  numInteractions: number;
  date: string;
  textbookID: string;
}

export interface ITextbookInteractionsByDate
  extends ITextbookInteractionsByDate_Raw,
  Document { }

const TextbookInteractionsByDateSchema =
  new Schema<ITextbookInteractionsByDate>(
    {
      actor: String,
      numInteractions: Number,
      date: String,
      textbookID: String,
    },
    {
      collection: "textbookInteractionsByDate",
    }
  );

export default model<ITextbookInteractionsByDate>(
  "TextbookInteractionsByDate",
  TextbookInteractionsByDateSchema,
  "textbookInteractionsByDate"
);
