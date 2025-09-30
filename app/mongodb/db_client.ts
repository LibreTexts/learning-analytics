import mongoose from "mongoose";
import env from "#start/env";
import logger from "@adonisjs/core/services/logger";

const DATABASE_URL = env.get("MONGOOSE_URI");

let cached = global.mongooseClient;

if (!cached) {
  cached = global.mongooseClient = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!DATABASE_URL) {
    throw new Error("MONGOOSE_URI is not defined");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(DATABASE_URL, {})
      .then((mongoose) => {
        logger.info("Connected to MongoDB");
        mongoose.set("debug", env.get("NODE_ENV") === "development");
        return mongoose.connection;
      })
      .catch((err) => {
        logger.error("Error connecting to MongoDB:", err);
        throw err; // Rethrow the error to be handled by the caller
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
