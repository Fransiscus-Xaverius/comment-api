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
const { addComment, editComment } = require("../controllers/commentController");
const { addReply, editReply, deleteReply, deleteAllReply, likeReply } = require("../controllers/replyController");
const { addPost, getAllPost } = require("../controllers/postController");

router.post("/comment/add", addComment);
router.put("/comment/edit", editComment);

//reply endpoints
router.post("/reply/add", addReply);
router.put("/reply/edit", editReply);
router.delete("/reply/delete", deleteReply);
router.delete("/reply/deleteAll", deleteAllReply);
router.post("/reply/like", likeReply);

//posts endpoints
router.post("/post/add", addPost);
router.get("/post/all", getAllPost);

module.exports = router;
