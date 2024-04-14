import { model } from "mongoose";
import { Document, Schema, models } from "mongoose";

export interface IPageInfoRaw {
  title: string;
  type: string;
  text: string;
  courseName: string;
  url: string;
  subdomain: string;
  path: string[];
  chapter: string;
}

export interface IPageInfo extends IPageInfoRaw, Document {}

const PageInfoSchema = new Schema<IPageInfo>(
  {
    id: String,
    title: String,
    type: String,
    text: String,
    courseName: String,
    url: String,
    subdomain: String,
    path: [String],
    chapter: String,
  },
  {
    collection: "pageinfo",
  }
);

export default models.PageInfo || model<IPageInfo>("PageInfo", PageInfoSchema);
