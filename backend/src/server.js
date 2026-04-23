const express = require("express");
const path = require("path");
const config = require("./config");
const { ensureFirebaseReady } = require("./firebase");
const { requireAuth, requireRole } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const classesRoutes = require("./routes/classes");
const studentsRoutes = require("./routes/students");
const attendanceRoutes = require("./routes/attendance");
const classbookRoutes = require("./routes/classbook");
const lessonsRoutes = require("./routes/lessons");

const app = express();

if (config.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(express.json());

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowAnyOrigin = !requestOrigin;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const requestProtocol = String(forwardedProto || req.protocol || "https").split(",")[0].trim();
  const requestHost = req.headers["x-forwarded-host"] || req.headers.host || "";
  const requestAppOrigin = requestHost ? `${requestProtocol}://${String(requestHost).split(",")[0].trim()}` : "";
  const sameHostOrigin = requestOrigin && requestAppOrigin && requestOrigin === requestAppOrigin;
  const originAllowed = requestOrigin && (config.allowedOrigins.includes(requestOrigin) || sameHostOrigin);

  if (allowAnyOrigin) {
    res.setHeader("Access-Control-Allow-Origin", config.appUrl);
  } else if (originAllowed) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  if (req.method === "OPTIONS") {
    if (requestOrigin && !originAllowed) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    return res.status(204).end();
  }

  if (requestOrigin && !originAllowed) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  return next();
});

app.get("/api/health", (_req, res) => {
  return res.json({
    status: "ok",
    service: "schulmanager-backend",
    datastore: "firebase",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", requireAuth, requireRole("admin"), usersRoutes);
app.use("/api/classes", requireAuth, classesRoutes);
app.use("/api/students", requireAuth, studentsRoutes);
app.use("/api/attendance", requireAuth, requireRole("teacher", "admin"), attendanceRoutes);
app.use("/api/classbook", requireAuth, requireRole("teacher", "admin"), classbookRoutes);
app.use("/api/lessons", requireAuth, (req, res, next) => {
  if (req.method === "GET") {
    return next();
  }
  if (req.method === "POST") {
    return requireRole("teacher", "admin")(req, res, next);
  }
  return requireRole("admin")(req, res, next);
}, lessonsRoutes);

const frontendDir = path.join(__dirname, "..", "..", "frontend");
app.use(express.static(frontendDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  return res.sendFile(path.join(frontendDir, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

async function startServer() {
  await ensureFirebaseReady();

  app.listen(config.port, config.host, () => {
    console.log(`Schulmanager backend listening on http://${config.host}:${config.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
