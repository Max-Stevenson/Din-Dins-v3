const express = require("express");
const cors = require("cors");
const { auth } = require("express-oauth2-jwt-bearer");
const recipesRoutes = require("./routes/recipesRoutes");
const devUser = require("./middleware/devUser");
const mealPlansRoutes = require("./routes/mealPlansRoutes");
const uploadsRoutes = require("./routes/uploadsRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://din-dins-v3-oi7i.vercel.app",
];

app.use(cors({
  origin(origin, cb) {
    // allow non-browser tools like curl/Postman (no Origin header)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// replaces bodyParser.json(...)
app.use(express.json({ limit: "2mb" }));
app.get("/healthz", (req, res) => res.status(200).send("ok"));

const authEnabled = process.env.AUTH_ENABLED === "true";
if (!authEnabled) {
  app.use(devUser);
} else {
  const jwtCheck = auth({
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    audience: process.env.AUTH0_AUDIENCE,
  });

  app.use(jwtCheck);

  app.use((req, _res, next) => {
    req.userId = req.auth?.payload?.sub;
    next();
  });
  app.use(requireAllowedUser);
}

// routes
app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));
app.get("/api/v1/me", (req, res) => {
  res.json({ userId: req.userId || null });
});
app.use("/api/v1/recipes", recipesRoutes);
app.use("/api/v1/meal-plans", mealPlansRoutes);
app.use("/api/v1/uploads", uploadsRoutes);

// error handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Auth libs typically provide status/statusCode (number)
  const status = Number.isInteger(err.status)
    ? err.status
    : Number.isInteger(err.statusCode)
      ? err.statusCode
      : 500;

  res.status(status).json({
    error: err.message || "An unknown error occurred",
    code: err.code || undefined,
  });
});

module.exports = app;
