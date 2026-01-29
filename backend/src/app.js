const express = require("express");
const cors = require("cors");
const { auth } = require("express-oauth2-jwt-bearer");
const recipesRoutes = require("./routes/recipesRoutes");
const devUser = require("./middleware/devUser");
const mealPlansRoutes = require("./routes/mealPlansRoutes");
const uploadsRoutes = require("./routes/uploadsRoutes");

const app = express();

app.use(cors());

// replaces bodyParser.json(...)
app.use(express.json({ limit: "2mb" }));

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
app.use((err, _req, res, next) => {
  if (res.headerSent) return next(err);
  res.status(err.code || 500).json({ error: err.message || "Unknown error" });
});

module.exports = app;
