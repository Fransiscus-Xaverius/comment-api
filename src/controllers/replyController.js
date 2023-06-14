require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const {development} = require("../config/config.json");
const sequelize = new Sequelize(development.database, development.username, development.password, {
  host: development.host,
  port: 3306,
  dialect: "mysql",
});
const Joi = require("joi");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const JWT_KEY = process.env.JWT_KEY;

//models
const comments = require("../models/comment")(sequelize, DataTypes);
const replies = require("../models/reply")(sequelize, DataTypes);
const users = require("../models/user")(sequelize, DataTypes);
const likes = require("../models/like")(sequelize, DataTypes);
const posts = require("../models/post")(sequelize, DataTypes);

//import module
const { generateLikeID } = require("../controllers/commentController");
const { hit_api } = require("../controllers/userController");

//===================HELPER FUNCTIONS======================

async function commentExists(id) {
  return comments.count({ where: { id_comment: id } }).then((count) => {
    if (count != 0) {
      return true;
    }
    return false;
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

//add reply endpoint (Hit : 2)
const addReply = async (req, res) => {
  let { reply, id_comment } = req.body;
  let token = req.header("x-auth-token");
  if (token) {
    let userData = "";
    let cariUser;
    try {
      userData = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(401).send({ message: "Token tidak valid" });
    }
    cariUser = await users.findOne({ where: { api_key: userData.api_key } });
    if (!cariUser) {
      return res.status(401).send({ message: "Token tidak valid" });
    }

    let schema = Joi.object({
      reply: Joi.string().required().messages({
        "any.required": "Semua Field Harus Diisi",
        "string.empty": "Isi Field Tidak Boleh String Kosong",
      }),
      id_comment: Joi.string().required().messages({
        "any.required": "Semua Field Harus Diisi",
        "string.empty": "Isi Field Tidak Boleh String Kosong",
      }),
    });
    try {
      await schema.validateAsync(req.body);
      let existed = await commentExists(id_comment);
      if (!existed) return res.status(404).send({ message: "Comment tidak ditemukan" });
      else {
        let commentGet = await comments.findAll({
          where: {
            id_comment: id_comment,
          },
        });
        // if (commentGet.api_key != userData.api_key) {
        //   return res.status(403).send({ message: "Unauthorized Access, Comment milik user lain" });
        // }
        //filter for any potential harmful words
        const config = await profanityFilter(reply);
        let result = await axios.request(config);
        if (!result) return res.status(400).send({ message: "3rd party API is Down" });
        else {
          //create a reply id
          let hitung = await replies.findAll();
          let id;
          if (hitung.length > 0) {
            id = "R" + (hitung.length + 1).toString().padStart(3, 0);
          } else id = "R001";
          let repliesCount = await comments.findAll({
            where: {
              id_comment: id_comment,
            },
          });
          await replies.create({ id_reply: id, id_comment: id_comment, username: userData.nama, api_key: cariUser.api_key, reply: result.data.clean });
          let temp = {
            username: userData.nama,
            id_comment: id,
            comment: result.data.clean,
          };
          let jmlReplyAwal = parseInt(repliesCount[0].reply_count);
          let jmlReplyBaru = jmlReplyAwal + 1;
          await comments.update(
            {
              reply_count: jmlReplyBaru,
            },
            {
              where: {
                id_comment: id_comment,
              },
            }
          );
          //API Hit Charge
          let api_key = userData.api_key;
          if ((await hit_api(api_key, 2)) == null) {
            return res.status(400).send({ message: "Api_Hit tidak cukup" });
          }
          return res.status(201).send({ message: "Berhasil menambahkan reply", data: temp });
        }
      }
    } catch (error) {
      return res.status(400).send({
        message: error.message,
      });
    }
  } else res.status(401).send({ message: "Token tidak ditemukan" });
};

//edit reply endpoint (Hit : 2)
const editReply = async (req, res) => {
  let { id_reply, new_reply } = req.body;
  let token = req.header("x-auth-token");
  if (token) {
    let userData = "";
    let cariUser;
    try {
      userData = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(401).send({ message: "Token tidak valid" });
    }
    cariUser = await users.findOne({ where: { api_key: userData.api_key } });
    if (!cariUser) {
      return res.status(401).send({ message: "Token tidak valid" });
    }
    //check whether the reply id exist or not
    let cariReply = await replies.findOne({ where: { id_reply: id_reply, status: 1 } });
    if (cariReply) {
      if (cariReply.api_key != userData.api_key) {
        return res.status(403).send({ message: "Unauthorized Access, Reply milik user lain" });
      }
      //joi validation
      let schema = Joi.object({
        id_reply: Joi.string().required().messages({
          "any.required": "Semua Field Harus Diisi",
          "string.empty": "Isi Field Tidak Boleh String Kosong",
        }),
        new_reply: Joi.string().required().messages({
          "any.required": "Semua Field Harus Diisi",
          "string.empty": "Isi Field Tidak Boleh String Kosong",
        }),
      });
      try {
        await schema.validateAsync(req.body);
        //censor any offensive words
        const config = await profanityFilter(new_reply);
        let result = await axios.request(config);
        if (!result) return res.status(400).send({ message: "3rd party API is Down" });
        else {
          //update reply
          await replies.update({ reply: result.data.clean }, { where: { id_reply: id_reply } });
          let data = {
            id: id_reply,
            new_reply: result.data.clean,
          };
          //API Hit Charge
          let api_key = userData.api_key;
          if ((await hit_api(api_key, 2)) == null) {
            return res.status(400).send({ message: "Api_Hit tidak cukup" });
          }
          res.status(201).send({ message: "Berhasil update reply", data: data });
        }
      } catch (error) {
        return res.status(400).send({ message: error.message });
      }
    } else return res.status(404).send({ message: "Reply tidak ditemukan" });
  } else return res.status(401).send({ message: "Token tidak ditemukan" });
};

//delete reply with specified id endpoint (Hit : 2)
const deleteReply = async (req, res) => {
  let { id_reply } = req.body;
  let token = req.header("x-auth-token");
  if (token) {
    let userData = "";
    let cariUser;
    try {
      userData = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(401).send({ message: "Token tidak valid" });
    }
    cariUser = await users.findOne({ where: { api_key: userData.api_key } });
    if (!cariUser) {
      return res.status(401).send({ message: "Token tidak valid" });
    }

    let schema = Joi.object({
      id_reply: Joi.string().required().messages({
        "any.required": "Semua Field Harus Diisi",
        "string.empty": "Isi Field Tidak Boleh String Kosong",
      }),
    });
    try {
      await schema.validateAsync(req.body);
      //check reply with the given id exist or not
      let cek = await replies.findOne({ where: { id_reply: id_reply, status: 1 } });
      if (cek) {
        if (cek.api_key != userData.api_key) {
          return res.status(403).send({ message: "Unauthorized Access, Reply milik user lain" });
        }
        await replies.update({ status: 0 }, { where: { id_reply: id_reply } });
        //remove like related to that reply (0 comment 1 reply)
        //if like type==1, id_comment==id_reply
        await likes.destroy({ where: { jenis: 1, id_comment: id_reply } });
        //API Hit Charge
        let api_key = userData.api_key;
        if ((await hit_api(api_key, 2)) == null) {
          return res.status(400).send({ message: "Api_Hit tidak cukup" });
        }
        return res.status(200).send({ message: "Berhasil menghapus reply" });
      } else res.status(404).send({ message: "Reply tidak ditemukan" });
    } catch (error) {
      return res.status(400).send({ message: error.message });
    }
  } else return res.status(401).send({ message: "Token tidak ditemukan" });
};

//delete all reply in a specified comment endpoint (Hit :5)
const deleteAllReply = async (req, res) => {
  let token = req.header("x-auth-token");
  let { id_comment } = req.body;
  if (token) {
    let userData = "";
    let cariUser;
    try {
      userData = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(401).send({ message: "Token tidak valid" });
    }
    cariUser = await users.findOne({ where: { api_key: userData.api_key } });
    if (!cariUser) {
      return res.status(401).send({ message: "Token tidak valid" });
    }

    let schema = Joi.object({
      id_comment: Joi.string().required().messages({
        "any.required": "Semua Field Harus Diisi",
        "string.empty": "Isi Field Tidak Boleh String Kosong",
      }),
    });
    try {
      await schema.validateAsync(req.body);
      let cek = await commentExists(id_comment);
      let commentGet;
      if (cek) {
        commentGet = await comments.findAll({
          where: {
            id_comment: id_comment,
          },
        });
        if (commentGet[0].api_key != userData.api_key) {
          // return res.send(commentGet[0].api_key + " - " + userData.api_key);
          return res.status(403).send({ message: "Unauthorized Access, Comment milik user lain" });
        }
        await replies.update({ status: 0 }, { where: { id_comment: id_comment } });
        //remove all likes related to those replies (0= comment 1=reply) (UNDONE)
        //   await likes.destroy({ where: { jenis:1, id_comment:   } });
        //API Hit Charge
        let api_key = userData.api_key;
        if ((await hit_api(api_key, 5)) == null) {
          return res.status(400).send({ message: "Api_Hit tidak cukup" });
        }
        return res.status(201).send({ message: "Semua reply di komen tersebut berhasil dihapus" });
      } else return res.status(404).send({ message: "Comment tidak ditemukan" });
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  } else res.status(401).send({ message: "Token tidak ditemukan" });
};

//like reply endpoint (Hit : 2)
const likeReply = async (req, res) => {
  let token = req.header("x-auth-token");
  let { id_reply, username } = req.body;
  if (token) {
    let userData = "";
    let cariUser;
    try {
      userData = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(401).send({ message: "Token tidak valid" });
    }
    cariUser = await users.findOne({ where: { api_key: userData.api_key } });
    if (!cariUser) {
      return res.status(401).send({ message: "Token tidak valid" });
    }
    let schema = Joi.object({
      id_reply: Joi.string().required().messages({
        "any.required": "Semua Field Harus Diisi",
        "string.empty": "Isi Field Tidak Boleh String Kosong",
      }),
      username: Joi.string().required().messages({
        "any.required": "Semua Field Harus Diisi",
        "string.empty": "Isi Field Tidak Boleh String Kosong",
      }),
    });
    try {
      await schema.validateAsync(req.body);
      //check id reply exist or not
      let cari = await replies.findOne({ where: { id_reply: id_reply, status: 1 } });
      if (cari) {
        if (cari.api_key != userData.api_key) {
          return res.status(403).send({ message: "Unauthorized Access, Reply milik user lain" });
        }
        //check if user has already liked this reply
        let sudahLike = await likes.findOne({ where: { jenis: 1, username: username, id_comment: id_reply } });
        if (!sudahLike) {
          let id = await generateLikeID();
          // let hitung = await likes.findAll();
          // if (hitung.length > 0) {
          //   id = "L" + (parseInt(hitung[hitung.length - 1].dataValues.id_like.substring(1)) + 1);
          // } else id = "L1";
          let ambil = await comments.findOne({
            where: {
              id_comment: cari.id_comment,
            },
          });
          console.log(ambil.id_post);
          await likes.create({ id_like: id, id_comment: id_reply, id_post: ambil.id_post, username: username, jenis: 1 });
          //API Hit Charge
          let api_key = userData.api_key;
          if ((await hit_api(api_key, 2)) == null) {
            return res.status(400).send({ message: "Api_Hit tidak cukup" });
          }
          res.status(201).send({ message: "Berhasil like reply " + id_reply.toUpperCase() });
        } else res.status(400).send({ message: "User sudah memberi like pada reply ini" });
      } else res.status(404).send({ message: "Reply tidak ditemukan" });
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  } else res.status(401).send({ message: "Token tidak ditemukan" });
};

module.exports = { addReply, editReply, deleteReply, deleteAllReply, likeReply };
