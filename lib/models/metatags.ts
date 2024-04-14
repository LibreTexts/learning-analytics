import { Document, Schema, model, models } from "mongoose";

export interface IMetatagsRaw {
  pageId: string;
  count: string;
  href: string;
  value: string;
  "@id": string;
  "@href": string;
  title: string;
  type: string;
  ui: string;
  subdomain: string;
  _id__baas_transaction?: Schema.Types.ObjectId;
}

export interface IMetatags extends IMetatagsRaw, Document {}

const MetatagsSchema = new Schema<IMetatags>(
  {
    pageId: String,
    count: String,
    href: String,
    value: String,
    "@id": String,
    "@href": String,
    title: String,
    type: String,
    ui: String,
    subdomain: String,
    _id__baas_transaction: Schema.Types.ObjectId,
  },
  {
    collection: "metatags",
  }
);

export default models.Metatags || model<IMetatags>("Metatags", MetatagsSchema);
