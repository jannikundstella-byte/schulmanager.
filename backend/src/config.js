const path = require("path");

function normalizeOrigin(value) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).origin;
  } catch (error) {
    return String(value).trim().replace(/\/+$/, "");
  }
}

const appUrl = process.env.APP_URL || "http://localhost:5500";
const configuredOrigins = String(
  process.env.ALLOWED_ORIGINS || "http://localhost:5500,http://127.0.0.1:5500,http://localhost:4000"
)
  .split(",")
  .map((entry) => normalizeOrigin(entry))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([
  normalizeOrigin(appUrl),
  ...configuredOrigins
].filter(Boolean)));

module.exports = {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || "127.0.0.1",
  appUrl,
  allowedOrigins,
  trustProxy: String(process.env.TRUST_PROXY || "false").toLowerCase() === "true",
  seedFile: path.join(__dirname, "..", "data", "seed-data.json"),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  firebasePrivateKey: String(process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL || "",
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  firebaseWebApiKey: process.env.FIREBASE_WEB_API_KEY || "",
  firebaseSeedOnStart: String(process.env.FIREBASE_SEED_ON_START || "true").toLowerCase() === "true",
  bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL || "",
  bootstrapAdminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD || "",
  bootstrapAdminFirstName: process.env.BOOTSTRAP_ADMIN_FIRST_NAME || "Alex",
  bootstrapAdminLastName: process.env.BOOTSTRAP_ADMIN_LAST_NAME || "Admin"
};
