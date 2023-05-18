const router = require("express").Router();
const { register, coba, login } = require("../controllers/userController");

router.post("/user/register", register);
router.post("/user/login", login);


module.exports = router;
