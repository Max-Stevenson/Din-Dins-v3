module.exports = function devUser(req, _res, next) {
  req.userId = "dev-user";
  next();
};
