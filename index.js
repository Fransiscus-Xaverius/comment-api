const express = require("express");
const app = express();
require("dotenv").config();

const router = require("./routes/router.js");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api", router);

const port = process.env.PORT || 3000; //Listen to predetermined port from .env or port 3000 if no .env variable is found.

app.listen(port, function () {
  console.log(`listening on port ${port}`);
});
