const router = require("express").Router();
const { coba, register } = require("../controllers/userController");
router.get("/test", coba);
router.post("/users", register);
module.exports = router;
