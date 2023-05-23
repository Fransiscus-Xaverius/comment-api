const router = require("express").Router();

//user endpoints
const { register, coba, login, topupApiHit, topupSaldo, cekSaldo, cekApiHit } = require("../controllers/userController");

//users
router.post("/user/register", register);
router.post("/user/login", login);
router.post("/user/topup_api_hit", topupApiHit);
router.post("/user/topup_saldo", topupSaldo);
router.get("/user/saldo", cekSaldo);
router.get("/user/api_hit", cekApiHit);

//comment endpoints
const { addComment, editComment, addReply, editReply } = require("../controllers/commentController");
const { addPost } = require("../controllers/postController");

router.post("/comment/add", addComment);
router.put("/comment/edit", editComment);

//reply endpoints
router.post("/reply/add", addReply);
router.post("/reply/edit", editReply);

//posts endpoints
router.post("/post/add", addPost);

module.exports = router;
