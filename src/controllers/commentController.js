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

//module imports
const { isUserPost } = require("../controllers/postController");

//get Comment count
async function getCommentCount() {
  const count = await comments.count();
  return count;
}

//get comment by ID
async function getComment(id){
  return comments.findOne({where: {id_comment:id}});
}

//get All comments
async function getAllComments(id_post){
  return comments.findAll({where:{
    id_post:id_post
  }});
}

//check if comment exists
async function commentExists(id) {
  return comments.count({ where: { id_comment: id } }).then((count) => {
    if (count != 0) {
      return true;
    }
    return false;
  });
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

//add comment endpoint(CHECK PLS)
const addComment = async (req, res) => {
  let token = req.header("x-auth-token");
  if (token) {
    let userdata = "";
    let cariUser;
    try {
      userdata = jwt.verify(token, JWT_KEY);
      cariUser = await users.findOne({ where: { nama: userdata.nama } });
    } catch (error) {
      return res.status(403).send("Unauthorized Token.");
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
        error_message: error.message,
      });
    }

    let comment = req.body.comment;
    let id_post = req.body.id_post;
    let isuserpost = await isUserPost(api_key, id_post);
    console.log(api_key);
    if(!isuserpost) return res.status(400).send({message:"Unauthorized Access. This post belongs to another user."});
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

      return res.status(201).send({ message: " Berhasil menambahkan komentar", data: temp });
    } else {
      return res.status(400).send({ msg: "Something went wrong! please try again later. ERR CODE 001" });
    }

  } else {
    return res.status(400).send({ msg: "Token is required but not found." });
  }
};

//edit comment endpoint (CHECK PLS) -Frans
const editComment = async (req, res) => {
  let token = req.header("x-auth-token");
  if (token) {
    let userdata = "";
    try {
      userdata = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(403).send("Unauthorized Token.");
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
      return res.status(400).send({ error_message: error.message });
    }
    let id = req.body.id_comment;
    let new_comment = req.body.new_comment;
    let existed = await commentExists(id);
    if (!existed) return res.status(404).send({ message: "Comment doesn't exists." });

    let oldComment = await getComment(id);
    if(oldComment.api_key!=api_key) return res.status(400).send({message:"Unauthorized Token. Comment belongs to another user."});
    
    const config = await profanityFilter(new_comment);
    let result = await axios.request(config);

    if (!result) return res.status(400).send({ msg: "Something went wrong! please try again later. ERR CODE 001" });

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
    return res.status(200).send({ message: "Berhasil update comment", data: data });
  } 
  return res.status(400).send({ message: "Token is required but not found." });
};

const getSpecificComment = async function(req, res){
  let token = req.header("x-auth-token");
  let {id_komentar} = req.body;

  if(!req.header('x-auth-token')){
    return res.status(400).send({ message: "Token is required but not found."});
  }

  try {
    let userdata = jwt.verify(token, JWT_KEY);
  } catch (error) {
    return res.status(403).send("Unauthorized Token.");
  }

  let schema = Joi.object({
    id_komentar: Joi.string().required().messages({
      "any.required": "{{#label}} harus diisi",
      "string.empty": "{{#label}} tidak boleh blank",
    }),
  });

  try {
    await schema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).send(error.message);
  }
  
  let commentGet = getComment(id_komentar);
  if (commentGet.length == 0 ) {
    return res.status(404).send({ message: "Comment not found."});
  }

  if (commentGet[0].api_key != userdata.api_key) {
    return res.status(400).send({message: "Unauthorized Token. Comment belongs to another user."})
  }

  return res.status(200).send({comment: commentGet[0]});
}

//get all comments from post (CHECK PLS) -Frans
const getAllCommentsFromPost = async (req, res) => {
  let token = req.header("x-auth-token");
  if (token) {
    let userdata = "";
    try {
      userdata = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(403).send("Unauthorized Token.");
    }
    
    let schema = Joi.object({
      id_post: Joi.string().required().messages({
        "any.required": "{{#label}} harus diisi",
        "string.empty": "{{#label}} tidak boleh blank",
      }),
    });

    try {
      await schema.validateAsync(req.body);
    } catch (error) {
      res.status(400).send(error.message);
    }

    let id_post = req.body.id_post;
    
    let foo = await getAllComments(id_post);
    return res.status(200).send({comments:foo});
  } 
  return res.status(400).send({ message: "Token is required but not found." });
};

//like comment endpoint
const likeComment = async (req,res)=>{

}

//delete comment
const deleteComment = async (req,res)=>{

}

//delete all comment from post
const deleteCommentFromPost = async (req,res)=>{
  
}

module.exports = { addComment, editComment, getAllCommentsFromPost, getSpecificComment };
