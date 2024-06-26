const router = require("express").Router();

//user endpoints
const { register, coba, login, topupApiHit, topupSaldo, cekSaldo, cekApiHit } = require("../controllers/userController");

//users
// commented this to make sure that these endpoints are not used in production, due to integration with KitaSetara app. If you're forking this, you can always uncomment this and everything will be running fine (fingers crossed) -Frans
// router.post("/user/register", register);
// router.post("/user/login", login);
// router.post("/user/topup_api_hit", topupApiHit);
// router.post("/user/topup_saldo", topupSaldo);
// router.get("/user/saldo", cekSaldo);
// router.get("/user/api_hit", cekApiHit);

//comment endpoints
const { addComment, editComment, getAllCommentsFromPost, getSpecificComment, getAllCommentFromPostWithSort, gifUpload, likeComment,deleteComment, deleteCommentFromPost} = require("../controllers/commentController");

router.post("/comment", addComment);
router.put("/comment", editComment);
router.post("/comment/like", likeComment);
router.get("/comment/specific", getSpecificComment);
router.delete("/comment", deleteComment);
// router.post("/comment/gif_reaction", gifUpload);

// //reply endpoints
// commented this to make sure that these endpoints are not used in production, due to integration with KitaSetara app. If you're forking this, you can always uncomment this and everything will be running fine (fingers crossed) -Frans
// const { addReply, editReply, deleteReply, deleteAllReply, likeReply } = require("../controllers/replyController");

// router.post("/reply", addReply);
// router.put("/reply", editReply);
// router.delete("/reply", deleteReply);
// router.delete("/reply/deleteAll", deleteAllReply);
// router.post("/reply/like", likeReply);

//posts endpoints
const { addPost, getAllPost, getPostById } = require("../controllers/postController");

router.get("/post/:id", getPostById);
router.post("/post", addPost);
router.get("/posts", getAllPost);
router.get("/post/comments/:id", getAllCommentsFromPost);
router.get("/post/sortComment", getAllCommentFromPostWithSort);
router.delete("/post/comments", deleteCommentFromPost);

module.exports = router;
