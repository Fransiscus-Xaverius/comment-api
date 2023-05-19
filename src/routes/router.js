const router = require("express").Router();
const { register, coba, login, topupSaldo, cekSaldo, cekApiHit } = require("../controllers/userController");

router.post("/user/register", register);
router.post("/user/login", login);
router.post("/user/topup_saldo", topupSaldo);
router.get("/user/saldo", cekSaldo);
router.get("/user/api_hit", cekApiHit);


module.exports = router;
