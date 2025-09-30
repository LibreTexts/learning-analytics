import { Document, Schema, model } from "mongoose";

export interface IUser_Raw {
  email?: string;
  user_id: string;
  password?: string;
  role: "instructor" | "student";
  courses: string[];
}

export interface IUser extends IUser_Raw, Document { }

const UserSchema = new Schema<IUser>(
  {
    user_id: { type: String, required: true },
    email: { type: String },
    password: { type: String },
    role: { type: String, required: true },
    courses: { type: [String], required: true },
  },
  {
    collection: "user",
  }
);

export default model<IUser>("User", UserSchema, "user");
