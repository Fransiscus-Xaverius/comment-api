require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const {development} = require("../config/config.json");
const sequelize = new Sequelize(development.database, development.username, development.password, {
  host: development.host,
  port: 3306,
  dialect: "mysql",
});
const Joi = require("joi");
const jwt = require("jsonwebtoken");
let JWT_KEY = process.env.JWT_KEY;

//models
const users = require("../models/user")(sequelize, DataTypes);
const posts = require("../models/post")(sequelize, DataTypes);
const comments = require("../models/comment")(sequelize, DataTypes);

//module imports
const { hit_api } = require("../controllers/userController");

//===================HELPER FUNCTIONS======================
//generate new post functions

async function generatePostID() {
  let id = "P";
  let count = await getPostCount();
  count++;
  let satuan = parseInt(count % 10);
  let puluhan = parseInt((count / 10) % 10);
  let ratusan = parseInt(count / 100);

  let generateID = id + ratusan + puluhan + satuan;
  return generateID;
}

async function getPostCount() {
  const count = await posts.count();
  return count;
}

async function getPost(id_post) {
  let tarPost = await posts.findOne({ where: { id_post: id_post }, raw: true });
  return tarPost.api_key;
}

async function isUserPost(api_key, id_post) {
  let userPost = await getPost(id_post);
  return userPost == api_key;
}
//=========================================================

//ENDPOINTS

//add post endpoint (Hit : 5)
const addPost = async (req, res) => {
  // console.log(JWT_KEY);
  // let token = req.header("x-auth-token");
  // if (token) {
  //   let userdata = "";
  //   let cariUser;
  //   try {
  //     userdata = jwt.verify(token, JWT_KEY);
  //   } catch (error) {
  //     return res.status(401).send({ message: "Token tidak valid" });
  //     // return res.send({ message: error.toString() });
  //   }
  //   //Search for current user who's registering a new post.
  //   cariUser = await users.findOne({ where: { api_key: userdata.api_key } });
  //   //if current user exists, make post and return id_post

  //   if (cariUser) {
      //generate post ID
      let id = await generatePostID();
      //get API key from token
      // let api_key = userdata.api_key;

      //validate body params with schema
      let schema = Joi.object({
        title: Joi.string().required().messages({
          "any.required": "Semua Field Harus Diisi",
          "string.empty": "Isi Field Tidak Boleh String Kosong",
        }),
        content: Joi.string().required().messages({
          "any.required": "Semua Field Harus Diisi",
          "string.empty": "Isi Field Tidak Boleh String Kosong"
        }),
        authorName: Joi.string().required().messages({
          "any.required": "Semua Field Harus Diisi",
          "string.empty": "Isi Field Tidak Boleh String Kosong",
        }),
        uid: Joi.string().required().messages({
          "any.required": "Semua Field Harus Diisi",
          "string.empty": "Isi Field Tidak Boleh String Kosong",
        }),
      });

      try {
        await schema.validateAsync(req.body);
      } catch (error) {
        return res.status(400).send({
          message: error.message,
        });
      }
      
      let title = req.body.title;
      let content = req.body.content;
      // let authorName = cariUser.nama;
      let authorName = req.body.authorName;
      let uid = req.body.uid;

      //create new post with ORM
      // await posts.create({ id_post: id, api_key: api_key, title: title, author: authorName, content: content});

      await posts.create({ id_post: id, uid:uid , title: title, author: authorName, content: content}); //for intergration with KitaSetara.

      //let curHit = await hit_api(api_key, 5, res);

      //API Hit Charge
      // if ((await hit_api(api_key, 5)) == null) {
      //   return res.status(400).send({ message: "Api_Hit tidak cukup" });
      // }

      return res.status(201).send({ message: "New Post successfully added", id_post: id });
  //   } else {
  //     //Unreachable statement, but here just in case a user is deleted but the token is still active.
  //     return res.status(401).send({ message: "Token tidak valid" });
  //   }
  // } else res.status(401).send({ message: "Token tidak ditemukan" });
};

//get all post from user (Unchecked) (Hit : 10)
const getAllPost = async (req, res) => {
  // let token = req.header("x-auth-token");
  // let token = true; //bypass token for integration with KitaSetara. -Frans
  // if (token) {
    let userdata = "";
    // let cariUser;
    // try {
    //   userdata = jwt.verify(token, JWT_KEY);
    // } catch (error) {
    //   return res.status(401).send({ message: "Token tidak valid" });
    // }
    // cariUser = await users.findOne({ where: { api_key: userdata.api_key } });
    // if (!cariUser) {
    //   return res.status(401).send({ message: "Token tidak valid" });
    // }

    let allPosts = await posts.findAll({
      // disabled for integration with KitaSetara. -Frans
      // where: {
      //   api_key: cariUser.api_key,
      // },
    });

    let foo = [];

    if (allPosts) {
      foo = await Promise.all(allPosts.map(async (element) => {
        const lastComment = await comments.findOne({
          where: {
            id_post: element.id_post,
            status: 1,
          },
          order: [["id_comment", "DESC"]],
        });
        const amountOfComments = await comments.count({
          where: {
            id_post: element.id_post,
            status: 1,
          },
        });
        console.log('lastComment:', lastComment);  // Add this line
        element = element.toJSON();
        element.amountOfComments = amountOfComments;
        element.lastComment = lastComment;
        return element;
      }));

      //API Hit Charge, disabled for integration into KitaSetara. -Frans
      let api_key = userdata.api_key;
      // if ((await hit_api(cariUser.api_key, 10)) == null) {
      //   return res.status(400).send({ message: "Api_Hit tidak cukup" });
      // }

      return res.status(200).send(//{
        // username: cariUser.username,
        // api_key: cariUser.api_key,
        //Posts: foo,
      //}
        foo
      );
    }
    //safeguard incase of database error/deleted user with valid token
    return res.status(400).send({
      message: "Oops, something went wrong.",
    });
  // } else res.status(401).send({ message: "Token tidak ditemukan" });
};

const getPostById = async (req, res) => {
  let id = req.params.id;
  const schema = Joi.object({
    id: Joi.string().required().messages({
      "any.required": "Semua Field Harus Diisi",
      "string.empty": "Isi Field Tidak Boleh String Kosong",
    }),
  });
  try {
    await schema.validateAsync(req.params);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
  let postGet = await posts.findOne({ where: { id_post: id } });
  if (postGet) {
    return res.status(200).send(postGet);
  } else {
    return res.status(404).send({ message: "Post not found" });
  }
};

module.exports = { addPost, getAllPost, isUserPost, getPostById };
