const express = require("express");
const config = require("./config");
const { requireAuth, requireRole } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const classesRoutes = require("./routes/classes");
const studentsRoutes = require("./routes/students");
const attendanceRoutes = require("./routes/attendance");
const classbookRoutes = require("./routes/classbook");

const app = express();

if (config.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(express.json());

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowAnyOrigin = !requestOrigin;
  const originAllowed = requestOrigin && config.allowedOrigins.includes(requestOrigin);

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
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/classes", requireAuth, classesRoutes);
app.use("/api/students", requireAuth, studentsRoutes);
app.use("/api/attendance", requireAuth, requireRole("teacher", "admin"), attendanceRoutes);
app.use("/api/classbook", requireAuth, requireRole("teacher", "admin"), classbookRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, config.host, () => {
  console.log(`Schulmanager backend listening on http://${config.host}:${config.port}`);
});
