const express = require("express");
const app = express();
const router = require("./routes/router.js");
require("dotenv").config();
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

const port = process.env.PORT || 3000; //Listen to predetermined port from .env or port 3000 if no .env variable is found.
console.log(process.env);
app.listen(port, function () {
  console.log(`listening on port ${port}`);
});
