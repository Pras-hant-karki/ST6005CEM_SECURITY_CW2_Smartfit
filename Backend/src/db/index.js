import mongoose from "mongoose";

const { MONGODB_URL, DB_NAME } = process.env;

if (!MONGODB_URL || !DB_NAME) {
  throw new Error("Missing database configuration. Set MONGODB_URL and DB_NAME in Backend/.env.");
}

const MONGODB_URI = `${MONGODB_URL}/${DB_NAME}`;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectdb = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, 
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB Connected");
    await repairDepartmentCollection(cached.conn.connection.db);
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB connection error:", error);
    throw error;
  }

  return cached.conn;
};

const repairDepartmentCollection = async (db) => {
  const departments = db.collection("departments");

  try {
    const indexes = await departments.indexes();
    const obsoleteIndexes = indexes.filter((index) => {
      const keys = Object.keys(index.key || {});
      return index.name === "uniq_departments_name" || keys.includes("name");
    });

    for (const index of obsoleteIndexes) {
      if (index.name !== "_id_") {
        await departments.dropIndex(index.name);
        console.log(`Dropped obsolete departments index: ${index.name}`);
      }
    }

    await departments.updateMany(
      { $or: [{ iconKey: { $exists: false } }, { iconKey: null }, { iconKey: "" }] },
      { $set: { iconKey: "hospital" } }
    );

    await departments.updateMany(
      { $or: [{ color: { $exists: false } }, { color: null }, { color: "" }] },
      { $set: { color: "general-green" } }
    );
  } catch (error) {
    if (error.codeName === "NamespaceNotFound") return;
    console.warn("Department collection repair skipped:", error.message);
  }
};

export default connectdb;
