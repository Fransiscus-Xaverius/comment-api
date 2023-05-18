const router = require("express").Router();
const { register, coba } = require("../controllers/userController");

router.post("/user/register", register);

module.exports = router;
