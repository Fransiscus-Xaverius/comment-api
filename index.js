const express = require("express");
const app = express();
const router = require("./routes/router.js");
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

const port = 3000;
app.listen(port, function () {
  console.log(`listening on port ${port}`);
});
