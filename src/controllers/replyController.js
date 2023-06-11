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
const JWT_KEY = process.env.JWT_KEY;

//models
const comments = require("../models/comment")(sequelize, DataTypes);
const replies = require("../models/reply")(sequelize, DataTypes);
const users = require("../models/user")(sequelize, DataTypes);
const likes = require("../models/like")(sequelize, DataTypes);

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
    try {
      let userData = jwt.verify(token, JWT_KEY);
      let cariUser = await users.findOne({ where: { nama: userData.nama } });
      let schema = Joi.object({
        reply: Joi.string().required().messages({
          "any.required": "{{#label}} harus diisi",
          "string.empty": "{{#label}} tidak boleh blank",
        }),
        id_comment: Joi.string().required().messages({
          "any.required": "{{#label}} harus diisi",
          "string.empty": "{{#label}} tidak boleh blank",
        }),
      });
      try {
        await schema.validateAsync(req.body);
        let existed = await commentExists(id_comment);
        if (!existed) return res.status(404).send({ message: "Comment doesn't exists." });
        else {
          //filter for any potential harmful words
          const config = await profanityFilter(reply);
          let result = await axios.request(config);
          if (!result) return res.status(400).send({ message: "Something went wrong! please try again later. ERR CODE 001" });
          else {
            //create a reply id
            let hitung = await replies.findAll();
            let id;
            if (hitung.length > 0) {
              id = "R" + (hitung.length + 1).toString().padStart(3, 0);
            } else id = "R001";
            await replies.create({ id_reply: id, id_comment: id_comment, username: userData.nama, api_key: cariUser.api_key, reply: result.data.clean });
            //API Hit Charge
            let api_key = userdata.api_key;
            if ((await hit_api(api_key, 2)) == null) {
              return res.status(400).send({ message: "Api_Hit tidak cukup" });
            }
            return res.status(201).send({ message: "Berhasil menambahkan reply" });
          }
        }
      } catch (error) {
        return res.status(400).send({
          message: error.message,
        });
      }
    } catch (error) {
      return res.status(400).send({ message: "Something is wrong with the token" });
    }
  } else res.status(400).send({ message: "Token is nowhere to be found.." });
};

//edit reply endpoint (Hit : 2)
const editReply = async (req, res) => {
  let { id_reply, new_reply } = req.body;
  let token = req.header("x-auth-token");
  if (token) {
    try {
      let userData = jwt.verify(token, JWT_KEY);
      //check whether the reply id exist or not
      let cariReply = await replies.findOne({ where: { id_reply: id_reply, status: 1 } });
      if (cariReply) {
        //joi validation
        let schema = Joi.object({
          id_reply: Joi.string().required().messages({
            "any.required": "{{#label}} harus diisi",
            "string.empty": "{{#label}} tidak boleh blank",
          }),
          new_reply: Joi.string().required().messages({
            "any.required": "{{#label}} harus diisi",
            "string.empty": "{{#label}} tidak boleh blank",
          }),
        });
        try {
          await schema.validateAsync(req.body);
          //censor any offensive words
          const config = await profanityFilter(new_reply);
          let result = await axios.request(config);
          if (!result) return res.status(400).send({ message: "Something went wrong! please try again later. ERR CODE 001" });
          else {
            //update reply
            await replies.update({ reply: result.data.clean }, { where: { id_reply: id_reply } });
            //API Hit Charge
            let api_key = userdata.api_key;
            if ((await hit_api(api_key, 2)) == null) {
              return res.status(400).send({ message: "Api_Hit tidak cukup" });
            }
            res.status(201).send({ message: "Reply successfully updated" });
          }
        } catch (error) {
          return res.status(400).send({ message: error.message });
        }
      } else return res.status(404).send({ message: "Reply not found" });
    } catch (error) {
      return res.status(400).send({ message: "Something is wrong with the token" });
    }
  } else return res.status(403).send({ message: "Token is nowhere to be found..." });
};

//delete reply with specified id endpoint (Hit : 2)
const deleteReply = async (req, res) => {
  let { id_reply } = req.body;
  let token = req.header("x-auth-token");
  if (token) {
    try {
      let userData = jwt.verify(token, JWT_KEY);
      let schema = Joi.object({
        id_reply: Joi.string().required().messages({
          "any.required": "{{#label}} harus diisi",
          "string.empty": "{{#label}} tidak boleh blank",
        }),
      });
      try {
        await schema.validateAsync(req.body);
        //check reply with the given id exist or not
        let cek = await replies.findOne({ where: { id_reply: id_reply } });
        if (cek) {
          await replies.update({ status: 0 }, { where: { id_reply: id_reply } });
          //remove like related to that reply (0 comment 1 reply)
          //if like type==1, id_comment==id_reply
          await likes.destroy({ where: { jenis: 1, id_comment: id_reply } });
          //API Hit Charge
          let api_key = userdata.api_key;
          if ((await hit_api(api_key, 2)) == null) {
            return res.status(400).send({ message: "Api_Hit tidak cukup" });
          }
          return res.status(200).send({ message: "Reply successfully deleted" });
        } else res.status(404).send({ message: "Reply not found" });
      } catch (error) {
        return res.status(400).send({ message: error.message });
      }
    } catch (error) {
      res.status(400).send({ message: "There's something wrong with the token" });
    }
  } else return res.status(400).send({ message: "Token is missing.." });
};

//delete all reply in a specified comment endpoint (Hit :5)
const deleteAllReply = async (req, res) => {
  let token = req.header("x-auth-token");
  let { id_comment } = req.body;
  if (token) {
    try {
      let userData = jwt.verify(token, JWT_KEY);
      let schema = Joi.object({
        id_comment: Joi.string().required().messages({
          "any.required": "{{#label}} harus diisi",
          "string.empty": "{{#label}} tidak boleh blank",
        }),
      });
      try {
        await schema.validateAsync(req.body);
        let cek = await commentExists(id_comment);
        if (cek) {
          await replies.update({ status: 0 }, { where: { id_comment: id_comment } });
          //remove all likes related to those replies (0= comment 1=reply) (UNDONE)
          //   await likes.destroy({ where: { jenis:1, id_comment:   } });
          //API Hit Charge
          let api_key = userdata.api_key;
          if ((await hit_api(api_key, 5)) == null) {
            return res.status(400).send({ message: "Api_Hit tidak cukup" });
          }
          return res.status(201).send({ message: "All replies of this comment are successfully deleted!" });
        } else return res.status(404).send({ message: "Comment not found" });
      } catch (error) {
        res.status(400).send({ message: error.message });
      }
    } catch (error) {
      res.status(400).send({ message: "Something is wrong with the token" });
    }
  } else res.status(400).send({ message: "Token is nowhere to be found" });
};

//like reply endpoint (Hit : 2)
const likeReply = async (req, res) => {
  let token = req.header("x-auth-token");
  let { id_reply, username } = req.body;
  if (token) {
    try {
      let userData = jwt.verify(token, JWT_KEY);
      let cariUser = await users.findOne({ where: { nama: userData.nama } });
      let schema = Joi.object({
        id_reply: Joi.string().required().messages({
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
        //check id reply exist or not
        let cari = await replies.findOne({ where: { id_reply: id_reply, status: 1 } });
        if (cari) {
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
            let api_key = userdata.api_key;
            if ((await hit_api(api_key, 2)) == null) {
              return res.status(400).send({ message: "Api_Hit tidak cukup" });
            }
            res.status(201).send({ message: "Successfully liked this reply" });
          } else res.status(400).send({ message: "User has already liked this reply" });
        } else res.status(404).send({ message: "Reply not found" });
      } catch (error) {
        res.status(400).send({ message: error.message });
      }
    } catch (error) {
      res.status(400).send({ message: "Something is wrong with the token" });
    }
  } else res.status(400).send({ message: "Token is nowhere to be found" });
};

module.exports = { addReply, editReply, deleteReply, deleteAllReply, likeReply };
