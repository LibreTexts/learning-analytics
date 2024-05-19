import { Document, Schema, model, models } from "mongoose";

export interface IUser_Raw {
  email: string;
  password: string;
  role: "instructor" | "student";
  courses: string[];
}

export interface IUser extends IUser_Raw, Document {}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    courses: { type: [String], required: true },
  },
  {
    collection: "user",
  }
);

export default models?.User || model<IUser>("User", UserSchema, "user");
