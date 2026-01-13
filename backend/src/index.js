const dotenv = require("dotenv");

dotenv.config();
const {
  DB_USERNAME, DB_PASSWORD, DB_NAME, PORT: port,
} = process.env;
const PORT = port || 3000;

const mongoose = require("mongoose");
const app = require("./app");

mongoose
  .connect(
    `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@dindins.rxgr4.mongodb.net/?appName=DinDins`,
  )
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is up on port:${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
