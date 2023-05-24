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
const { addComment, editComment, getAllCommentsFromPost, getSpecificComment, deleteComment, deleteCommentFromPost} = require("../controllers/commentController");

router.post("/comment/add", addComment);
router.put("/comment/edit", editComment);
router.get("/comment/specific_comment", getSpecificComment);
router.delete("/comment", deleteComment);

//reply endpoints
const { addReply, editReply, deleteReply, deleteAllReply, likeReply } = require("../controllers/replyController");

router.post("/reply/add", addReply);
router.put("/reply/edit", editReply);
router.delete("/reply/delete", deleteReply);
router.delete("/reply/deleteAll", deleteAllReply);
router.post("/reply/like", likeReply);

//posts endpoints
const { addPost, getAllPost } = require("../controllers/postController");

router.post("/post/add", addPost);
router.get("/post/all", getAllPost);
router.get("/post/comments", getAllCommentsFromPost);
router.delete("/post/comments", deleteCommentFromPost);

module.exports = router;
