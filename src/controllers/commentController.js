require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("db_proyekws", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});
const Joi = require("joi");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const upload = multer({
  dest: "./uploads",
  fileFilter: function (req, file, cb) {
    if (file.mimetype != "image/gif") {
      return cb(new Error("Wrong file type"), null);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10000000,
  },
});
const JWT_KEY = process.env.JWT_KEY;

//models
const comments = require("../models/comment")(sequelize, DataTypes);
const replies = require("../models/reply")(sequelize, DataTypes);
const users = require("../models/user")(sequelize, DataTypes);
const likes = require("../models/like")(sequelize, DataTypes);
const posts = require("../models/post")(sequelize, DataTypes);

//module imports
const { isUserPost } = require("../controllers/postController");
const comment = require("../models/comment");
const { hit_api } = require("../controllers/userController");

//===================HELPER FUNCTIONS======================

//get Comment count
async function getCommentCount() {
  const count = await comments.count();
  return count;
}

//get comment by ID
async function getComment(id) {
  return comments.findOne({ where: { id_comment: id } });
}

//get All comments
async function getAllComments(id_post) {
  return comments.findAll({
    where: {
      id_post: id_post,
    },
  });
}

//check if comment exists
async function commentExists(id) {
  return comments.count({ where: { id_comment: id, status: 1 } }).then((count) => {
    if (count != 0) {
      return true;
    }
    return false;
  });
}

//check if a comment is owned by user
async function commentOwnedByUser(idComment, apiKeyUser) {
  let hasil = false;
  let getComment = await comments.findOne({
    where: {
      id_comment: idComment,
    },
  });
  if (getComment) {
    if (getComment.api_key == apiKeyUser) {
      hasil = true;
    }
  }
  return hasil;
}

async function PostOwnedByUser(idPost, apiKeyUser) {
  let hasil = false;
  let getPost = await posts.findOne({
    where: {
      id_post: idPost,
    },
  });
  if (getPost) {
    if (getPost.api_key == apiKeyUser) {
      hasil = true;
    }
  }
  return hasil;
}

//generate comment ID
async function generateCommentID() {
  let id = "C";
  let count = await getCommentCount();
  count++;
  let satuan = parseInt(count % 10);
  let puluhan = parseInt((count / 10) % 10);
  let ratusan = parseInt(count / 100);

  let generateID = id + ratusan + puluhan + satuan;
  return generateID;
}

//generate like ID
async function generateLikeID() {
  let awal = "L";
  let lastOrder = 0;
  let temp = await likes.findAll();
  if (temp.length > 0) {
    lastOrder = parseInt(temp[temp.length - 1].id_like.substr(1, 4));
  }
  let newOrder = lastOrder + 1;
  let newID = "L" + newOrder.toString().padStart(3, 0);
  return newID;
}

//get comment with sort
async function getCommentWithSort(id_post, category, sort) {
  return comments.findAll({
    where: {
      id_post: id_post,
    },
    order: [[`${category}`, `${sort}`]],
  });
}

//=========================================================

//FILTER FUNCTION
async function profanityFilter(comment) {
  const config = {
    method: "POST",
    url: "https://profanity-cleaner-bad-word-filter.p.rapidapi.com/profanity",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": process.env.PROFANITY_FILTER_KEY,
      "X-RapidAPI-Host": "profanity-cleaner-bad-word-filter.p.rapidapi.com",
    },
    data: {
      text: comment,
      maskCharacter: "*",
      language: "en",
    },
  };
  return config;
}

//ENDPOINTS

//add comment endpoint(CHECK PLS) (Hit : 2)
const addComment = async (req, res) => {
  let token = req.header("x-auth-token");
  if (token) {
    let userdata = "";
    let cariUser;
    try {
      userdata = jwt.verify(token, JWT_KEY);
      cariUser = await users.findOne({ where: { nama: userdata.nama } });
    } catch (error) {
      return res.status(403).send({ message: "Unauthorized Token." });
    }

    let username = userdata.nama;
    let api_key = userdata.api_key;
    let schema = Joi.object({
      id_post: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
      comment: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
    });

    //validate body params
    try {
      await schema.validateAsync(req.body);
    } catch (error) {
      return res.status(400).send({
        message: error.message,
      });
    }

    let comment = req.body.comment;
    let id_post = req.body.id_post;
    let isuserpost = await isUserPost(api_key, id_post);
    console.log(api_key);
    if (!isuserpost) return res.status(400).send({ message: "Unauthorized Access. This post belongs to another user." });
    const config = await profanityFilter(comment);
    let result = await axios.request(config);
    if (result) {
      let id = await generateCommentID();
      await comments.create({ id_comment: id, username: username, comment: result.data.clean, api_key: cariUser.api_key, like_count: 0, id_post: id_post });

      let temp = {
        username: username,
        id_comment: id,
        comment: result.data.clean,
      };

      //API Hit Charge
      if ((await hit_api(api_key, 2)) == null) {
        return res.status(400).send({ message: "Api_Hit tidak cukup" });
      }

      return res.status(201).send({ message: " Berhasil menambahkan komentar", data: temp });
    } else {
      return res.status(400).send({ message: "Something went wrong! please try again later. ERR CODE 001" });
    }
  } else {
    return res.status(400).send({ message: "Token is required but not found." });
  }
};

//edit comment endpoint (Hit : 2)
const editComment = async (req, res) => {
  let token = req.header("x-auth-token");
  if (token) {
    let userdata = "";
    try {
      userdata = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(403).send({ message: "Unauthorized Token." });
    }

    let username = userdata.nama;
    let api_key = userdata.api_key;
    let schema = Joi.object({
      id_comment: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
      new_comment: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
    });

    try {
      await schema.validateAsync(req.body);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
    let id = req.body.id_comment;
    let new_comment = req.body.new_comment;
    let existed = await commentExists(id);
    if (!existed) return res.status(404).send({ message: "Comment doesn't exists." });

    let oldComment = await getComment(id);
    if (oldComment.api_key != api_key) return res.status(400).send({ message: "Unauthorized Token. Comment belongs to another user." });

    const config = await profanityFilter(new_comment);
    let result = await axios.request(config);

    if (!result) return res.status(400).send({ message: "Something went wrong! please try again later. ERR CODE 001" });

    await comments.update(
      {
        comment: result.data.clean,
      },
      {
        where: { id_comment: id },
      }
    );
    let data = {
      id: id,
      new_comment: result.data.clean,
    };

    //charge API Hit
    if ((await hit_api(api_key, 2)) == null) {
      return res.status(400).send({ message: "Api_Hit tidak cukup" });
    }

    return res.status(200).send({ message: "Berhasil update comment", data: data });
  }
  return res.status(400).send({ message: "Token is required but not found." });
};

//get Specific Comment Endpoint (Hit : Blom)
const getSpecificComment = async function (req, res) {
  let token = req.header("x-auth-token");
  let { id_comment } = req.body;

  if (!req.header("x-auth-token")) {
    return res.status(400).send({ message: "Token is required but not found." });
  }

  let userdata = "";
  try {
    userdata = jwt.verify(token, JWT_KEY);
  } catch (error) {
    return res.status(403).send({ message: "Unauthorized Token." });
  }

  let schema = Joi.object({
    id_comment: Joi.string().required().messages({
      "any.required": "{{#label}} harus diisi",
      "string.empty": "{{#label}} tidak boleh blank",
    }),
  });

  try {
    await schema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  let commentGet = await getComment(id_comment);
  if (!commentGet) {
    return res.status(404).send({ message: "Comment not found." });
  }
  // console.log(commentGet);
  if (commentGet.api_key != userdata.api_key) {
    return res.status(400).send({ message: "Unauthorized Token. Comment belongs to another user." });
  }

  return res.status(200).send({ comment: commentGet });
};

//get all comments from post endpoint (Hit : 5)
const getAllCommentsFromPost = async (req, res) => {
  let token = req.header("x-auth-token");
  if (token) {
    let userdata = "";
    try {
      userdata = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(403).send({ message: "Unauthorized Token." });
    }

    let api_key = userdata.api_key;

    let schema = Joi.object({
      id_post: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
    });

    try {
      await schema.validateAsync(req.body);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }

    let id_post = req.body.id_post;

    let foo = await getAllComments(id_post);

    //charge API hit
    if ((await hit_api(api_key, 5)) == null) {
      return res.status(400).send({ message: "Api_Hit tidak cukup" });
    }

    return res.status(200).send({ comments: foo });
  }
  return res.status(400).send({ message: "Token is required but not found." });
};

// endpoint sort comment (Hit : 5)
const getAllCommentFromPostWithSort = async function (req, res) {
  let { id_post, type } = req.body;
  let token = req.header("x-auth-token");

  if (!req.header("x-auth-token")) {
    return res.status(400).send({ message: "Token is required but not found." });
  }

  let userdata;
  try {
    userdata = jwt.verify(token, JWT_KEY);
  } catch (error) {
    return res.status(403).send({ message: "Unauthorized Token." });
  }

  let api_key = userdata.api_key;

  let schema = Joi.object({
    id_post: Joi.string().required().messages({
      "any.required": "{{#label}} harus diisi",
      "string.empty": "{{#label}} tidak boleh blank",
    }),
    type: Joi.string(),
  });

  try {
    await schema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  if (!PostOwnedByUser(id_post, api_key)) {
    return res.status(400).send({ message: "Unauthorized Token. Post belongs to another user." });
  }

  if (!type) {
    type = 0;
  }

  let sortedComment;
  if (type == 1) {
    sortedComment = await getCommentWithSort(id_post, "createdAt", "ASC");
  } else if (type == 2) {
    sortedComment = await getCommentWithSort(id_post, "createdAt", "DESC");
  } else if (type == 3) {
    sortedComment = await getCommentWithSort(id_post, "like_count", "DESC");
  } else if (type == 4) {
    sortedcomment = await getCommentWithSort(id_post, "reply_count", "DESC");
  } else if (type == 0) {
    sortedComment = await getAllComments(id_post);
  }

  //charge API Hit
  if ((await hit_api(api_key, 5)) == null) {
    return res.status(400).send({ message: "Api_Hit tidak cukup" });
  }

  return res.status(200).send({ comments: sortedComment });
};

//endpoint upload gif reaction (Hit : 5)
const gifUpload = async function (req, res) {
  const uploadGif = upload.single("gif_reaction");
  uploadGif(req, res, async function (err) {
    console.log(req.body);
    let { id_komentar } = req.body;
    let token = req.header("x-auth-token");

    if (!req.header("x-auth-token")) {
      return res.status(400).send({ message: "Token is required but not found." });
    }

    let userdata;
    try {
      userdata = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(403).send({ message: "Unauthorized Token." });
    }

    let schema = Joi.object({
      id_komentar: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
    });
    
    const gifValidator = Joi.object({
      file: Joi.required().messages({
        "any.required": "{{#label}} harus diisi",
      }),
    });
  
    try {
      await gifValidator.validateAsync({ file: req.file });
    } catch (error) {
      return res.status(400).send(error.message);
    }

    try {
      await schema.validateAsync(req.body);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
    let gif = [];
    let gif1 = await getComment(id_komentar);
    let gif2 = JSON.parse(gif1.gif_reaction);

    for (let i = 0; i < gif2.length; i++) {
      gif.push(gif2[i]);
    }
    console.log(gif);

    if (gif1.length == 0) {
      return res.status(404).send({ message: "Comment not found." });
    }

    let urutan = parseInt(gif.length) + 1;
    if (err) {
      return res.status(400).send({ message: err });
    }

    const filename = `${id_komentar}_${urutan}.gif`;
    fs.renameSync(`./uploads/${req.file.filename}`, `./uploads/${filename}`);

    gif.push(filename);
    await comments.update(
      {
        gif_reaction: gif,
      },
      {
        where: {
          id_comment: id_komentar,
        },
      }
    );
    //charge API Hit
    if ((await hit_api(api_key, 5)) == null) {
      return res.status(400).send({ message: "Api_Hit tidak cukup" });
    }
    return res.status(200).send({ message: "Berhasil mengupload gif" });
  });
};

//like comment endpoint
const likeComment = async (req, res) => {
  let token = req.header("x-auth-token");
  let { id_comment, username } = req.body;
  if (token) {
    let schema = Joi.object({
      id_comment: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
      username: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
    });
    try {
      await schema.validateAsync(req.body);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
    try {
      let temp = jwt.verify(token, JWT_KEY);
      let getComm = await comments.findAll({
        where: {
          id_comment: id_comment,
          status: 1,
        },
      });
      if (getComm.length > 0) {
        //comment ada
        let idUser = temp.api_key;
        if (await commentOwnedByUser(id_comment, idUser)) {
          let alreadyLike = await likes.findOne({ where: { jenis: 0, username: username, id_comment: id_comment } });
          if (!alreadyLike) {
            //like pertama kali
            let idBaru = await generateLikeID();
            await likes.create({
              id_like: idBaru,
              id_comment: id_comment,
              id_post: getComm[0].id_post,
              username: username,
              jenis: 0,
            });
            //tambah jumlah like
            let jmlLikeAwal = parseInt(getComm[0].like_count);
            let jmlLikeBaru = jmlLikeAwal + 1;
            await comments.update(
              {
                like_count: jmlLikeBaru,
              },
              {
                where: {
                  id_comment: id_comment,
                },
              }
            );
            return res.status(200).send({ message: "Berhasil Like Komentar " + id_comment.toUpperCase() });
          } else {
            return res.status(400).send({ message: "Komentar sudah pernah dilike" });
          }
        } else {
          return res.status(400).send({ message: "Can't Like. Comment belongs to another user" });
        }
      } else {
        return res.status(404).send({ message: "Comment not found" });
      }
    } catch (error) {
      console.log(error);
      return res.status(403).send({ message: "Unauthorized Access" });
    }
  }
  return res.status(400).send({ message: "Token is required but not found." });
};

//delete comment
const deleteComment = async (req, res) => {
  let token = req.header("x-auth-token");
  let { id_comment } = req.body;
  if (token) {
    let schema = Joi.object({
      id_comment: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
    });
    try {
      await schema.validateAsync(req.body);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
    try {
      let temp = jwt.verify(token, JWT_KEY);
      let getComm = await comments.findAll({
        where: {
          id_comment: id_comment,
          status: 1,
        },
      });
      if (getComm.length > 0) {
        let idUser = temp.api_key;
        if (await commentOwnedByUser(id_comment, idUser)) {
          //delete comment
          await comments.update(
            {
              status: 0,
            },
            {
              where: {
                id_comment: id_comment,
              },
            }
          );
          //clear likes

          return res.status(200).send({ message: "Berhasil Menghapus Komentar " + id_comment.toUpperCase() });
        } else {
          return res.status(400).send({ message: "Can't delete. Comment belongs to another user" });
        }
      } else {
        return res.status(404).send({ message: "Comment not found" });
      }
    } catch (error) {
      // console.log(error);
      return res.status(403).send({ message: "Unauthorized Access" });
    }
  }
  return res.status(400).send({ message: "Token is required but not found." });
};

//delete all comment from post
const deleteCommentFromPost = async (req, res) => {
  let token = req.header("x-auth-token");
  let { id_post } = req.body;
  if (token) {
    let schema = Joi.object({
      id_post: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
    });
    try {
      await schema.validateAsync(req.body);
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
    try {
      let temp = jwt.verify(token, JWT_KEY);
      let cek = await posts.findOne({
        where: {
          id_post: id_post,
        },
      });
      if (cek) {
        //post ada
        if (cek.api_key == temp.api_key) {
          //benar pemilik dari post
          let allComm = await comments.findAll({
            where: {
              id_post: id_post,
              status: 1,
            },
          });
          if (allComm.length == 0) {
            return res.status(400).send({ message: "Belum Ada Komentar di Post " + id_post.toUpperCase() });
          }

          //delete all comment
          await comments.update(
            {
              status: 0,
            },
            {
              where: {
                id_post: id_post,
              },
            }
          );
          //clear likes

          return res.status(200).send({ message: "Berhasil Menghapus Semua Komentar Dari Post " + id_post.toUpperCase() });
        } else {
          return res.status(400).send({ message: "Can't delete. Comments belongs to another user" });
        }
      } else {
        return res.status(404).send({ message: "Post not found" });
      }
    } catch (error) {
      // console.log(error);
      return res.status(403).send({ message: "Unauthorized Access" });
    }
  }
  return res.status(400).send({ message: "Token is required but not found." });
};

module.exports = { addComment, editComment, getAllCommentsFromPost, getSpecificComment, getAllCommentFromPostWithSort, gifUpload, likeComment, deleteComment, deleteCommentFromPost, generateLikeID };
