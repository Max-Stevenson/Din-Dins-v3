const express = require("express");
const cors = require("cors");

const recipesRoutes = require("./routes/recipesRoutes");
const devUser = require("./middleware/devUser");
const mealPlansRoutes = require("./routes/mealPlansRoutes");
const uploadsRoutes = require("./routes/uploadsRoutes");

const app = express();

app.use(cors());

// replaces bodyParser.json(...)
app.use(express.json({ limit: "2mb" }));

app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));

// dev-only user middleware (swap later for real auth)
app.use(devUser);

// routes
app.use("/api/v1/recipes", recipesRoutes);
app.use("/api/v1/meal-plans", mealPlansRoutes);
app.use("/api/v1/uploads", uploadsRoutes);


// error handler
app.use((err, _req, res, next) => {
  if (res.headerSent) return next(err);
  res.status(err.code || 500).json({ error: err.message || "Unknown error" });
});

module.exports = app;
