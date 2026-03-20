const mongoose = require("mongoose");

let hasLoggedConnection = false;

function getDatabaseNameFromUri(mongodbUri) {
  if (!mongodbUri) return "";

  let parsedUrl;

  try {
    parsedUrl = new URL(mongodbUri);
  } catch (error) {
    throw new Error("Invalid MONGODB_URI. Expected a valid MongoDB connection string.");
  }

  const pathname = (parsedUrl.pathname || "").replace(/^\/+/, "");
  if (!pathname) return "";

  return decodeURIComponent(pathname.split("/")[0] || "").trim();
}

function validateDatabaseName(databaseName) {
  if (process.env.NODE_ENV !== "production") return;

  if (!databaseName) {
    throw new Error(
      "Production requires MONGODB_URI to include an explicit database name in the URI path.",
    );
  }

  if (databaseName === "test") {
    throw new Error('Production refuses to connect to the "test" database.');
  }
}

async function connectToDatabase() {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error("MONGODB_URI is required.");
  }

  const databaseName = getDatabaseNameFromUri(mongodbUri);
  validateDatabaseName(databaseName);

  await mongoose.connect(mongodbUri);

  const connectedDatabaseName = mongoose.connection.name || databaseName || "unknown";

  if (!hasLoggedConnection) {
    console.log(`Mongo connected: ${connectedDatabaseName}`);
    hasLoggedConnection = true;
  }

  return mongoose.connection;
}

module.exports = {
  connectToDatabase,
  getDatabaseNameFromUri,
};
