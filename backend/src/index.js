const dotenv = require("dotenv");

dotenv.config();
const { PORT: port } = process.env;
const PORT = port || 3000;

const app = require("./app");
const { connectToDatabase } = require("./config/db");

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is up on port:${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
