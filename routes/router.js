const router = require("express").Router();
const { coba } = require("../controllers/userController");
router.get("/test", coba);

module.exports = router;
