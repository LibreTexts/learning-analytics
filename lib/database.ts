import mongoose from "mongoose";

const DATABASE_URL = process.env.MONGOOSE_URI;

if (!DATABASE_URL) {
  throw new Error(
    "Please define the MONGOOSE_URI environment variable inside .env.local"
  );
}

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
        console.log("Connected to MongoDB");
        mongoose.set("debug", process.env.NODE_ENV === "development")
        return mongoose.connection;
      })
      .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
        throw err; // Rethrow the error to be handled by the caller
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
