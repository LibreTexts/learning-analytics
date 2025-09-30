import { Document, Schema, model } from "mongoose";

export interface ISession_Raw {
  user_id: string;
  expires_at: Date;
}

export interface ISession extends ISession_Raw, Document { }

const SessionSchema = new Schema<ISession>(
  {
    user_id: { type: String, required: true },
    expires_at: { type: Date, required: true },
  },
  {
    collection: "session",
  }
);

SessionSchema.index({ user_id: 1 });

export default model<ISession>("Session", SessionSchema, "session");
