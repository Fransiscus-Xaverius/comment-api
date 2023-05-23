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

//helper function
async function commentExists(id) {
  return comments.count({ where: { id_comment: id } }).then((count) => {
    if (count != 0) {
      return true;
    }
    return false;
  });
}

async function profanityFilter(comment) {
  const config = {
    method: "POST",
    url: "https://profanity-cleaner-bad-word-filter.p.rapidapi.com/profanity",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": "e4a7b1cb50msh26faaaa06e35551p116f2bjsnc9d69790c133",
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
//add reply endpoint
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
          if (!result) return res.status(400).send({ msg: "Something went wrong! please try again later. ERR CODE 001" });
          else {
            //create a reply id
            let hitung = await replies.findAll();
            let id;
            if (hitung.length > 0) {
              id = "R" + (hitung.length + 1).toString().padStart(3, 0);
            } else id = "R001";
            await replies.create({ id_reply: id, id_comment: id_comment, username: userData.nama, api_key: cariUser.api_key, reply: result.data.clean });
            return res.status(201).send({ message: "Berhasil menambahkan reply" });
          }
        }
      } catch (error) {
        return res.status(400).send({
          error_message: error.message,
        });
      }
    } catch (error) {
      return res.status(400).send({ msg: "Something is wrong with the token" });
    }
  } else res.status(400).send({ message: "Token is nowhere to be found.." });
};

//edit reply endpoint
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
          if (!result) return res.status(400).send({ msg: "Something went wrong! please try again later. ERR CODE 001" });
          else {
            //update reply
            await replies.update({ reply: result.data.clean }, { where: { id_reply: id_reply } });
            res.status(201).send({ message: "Reply successfully updated" });
          }
        } catch (error) {
          return res.status(400).send(error.message);
        }
      } else return res.status(404).send({ message: "Reply not found" });
    } catch (error) {
      return res.status(400).send({ message: "Something is wrong with the token" });
    }
  } else return res.status(403).send({ message: "Token is nowhere to be found..." });
};

//delete reply with specified id
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
          return res.status(200).send({ message: "Reply successfully deleted" });
        } else res.status(404).send({ message: "Reply not found" });
      } catch (error) {
        return res.status(400).send(error.message);
      }
    } catch (error) {
      res.status(400).send({ message: "There's something wrong with the token" });
    }
  } else return res.status(400).send({ message: "Token is missing.." });
};

//delete all reply in a specified comment
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
          return res.status(201).send({ message: "All replies of this comment successfully deleted!" });
        } else return res.status(404).send({ message: "Comment not found" });
      } catch (error) {
        res.status(400).send(error.message);
      }
    } catch (error) {
      res.status(400).send({ message: "Something is wrong with the token" });
    }
  } else res.status(400).send({ message: "Token is nowhere to be found" });
};
module.exports = { addReply, editReply, deleteReply, deleteAllReply };
