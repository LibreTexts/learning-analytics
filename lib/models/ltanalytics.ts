import { Document, models } from "mongoose";
import { Schema, model } from "mongoose";

export interface ILTAnalyticsRaw {
  actor: {
    courseName: string;
    id: string;
    platform: string;
  };
  verb: string;
  object: {
    id: string;
    subdomain: string;
    url: string;
    timestamp: string;
    pageSession: string;
    timeMe: number;
  };
  result?: {
    percent: number;
  }
}

export interface ILTAnalytics extends ILTAnalyticsRaw, Document {}

const LTAnalyticsSchema = new Schema<ILTAnalytics>(
  {
    actor: {
      courseName: String,
      id: String,
      platform: String,
    },
    verb: String,
    object: {
      id: String,
      subdomain: String,
      url: String,
      timestamp: String,
      pageSession: String,
      timeMe: Number,
    },
    result: {
      percent: Number,
    },
  },
  {
    collection: "ltanalytics",
  }
);

LTAnalyticsSchema.index({ "actor.courseName": 1, verb: 1 });

export default models.LTAnalytics ||
  model<ILTAnalytics>("LTAnalytics", LTAnalyticsSchema);
