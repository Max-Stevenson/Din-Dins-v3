function requireAllowedUser(req, res, next) {
  const enabled = process.env.AUTH_ENABLED === "true";
  if (!enabled) return next(); // dev mode

  const allowed = String(process.env.ALLOWED_SUBS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // If you haven't configured the allowlist yet, fail CLOSED (safer)
  if (allowed.length === 0) {
    return res.status(403).json({ error: "Access not allowed" });
  }

  const sub = req.auth?.payload?.sub;
  if (!sub || !allowed.includes(sub)) {
    return res.status(403).json({ error: "Access not allowed" });
  }

  return next();
}


module.exports = requireAllowedUser;
