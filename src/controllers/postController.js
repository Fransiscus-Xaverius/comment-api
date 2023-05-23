require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("db_proyekws", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});
const { hit_api } = require("../controllers/userController");
const jwt = require("jsonwebtoken");
let JWT_KEY = process.env.JWT_KEY;

//models
const users = require("../models/user")(sequelize, DataTypes);
const posts = require("../models/post")(sequelize, DataTypes);

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

//add post endpoint (Unchecked)
const addPost = async (req, res) => {
  // console.log(JWT_KEY);
  let token = req.header("x-auth-token");
  if (token) {
    let userdata = "";
    let cariUser;

    try {
      userdata = jwt.verify(token, JWT_KEY);
    } catch (error) {
      // return res.status(403).send("Unauthorized Token.");
      return res.send(error.toString());
    }
    //Search for current user who's registering a new post.
    cariUser = await users.findOne({ where: { nama: userdata.nama } });
    //if current user exists, make post and return id_post

    if (cariUser) {
      //generate post ID
      let id = await generatePostID();
      //get API key from token
      let api_key = userdata.api_key;
      //create new post with ORM
      await posts.create({id_post : id, api_key:api_key});
      
      let curHit = await hit_api(api_key, 3);

      return res.status(201).send({message:"New Post successfully added", id_post:id, API_HIT : curHit});
    } else {
      //Unreachable statement, but here just in case a user is deleted but the token is still active.
      return res.status(400).send({ message: "User not registered" });
    }
  } else res.status(400).send({ message: "Token is required but not found." });
};

//get all post from user (Unchecked)
const getAllPost = async (req, res) => {
  let token = req.header("x-auth-token");
  if(token){
    try {
      userdata = jwt.verify(token, JWT_KEY);
    } catch (error) {
      return res.status(403).send("Unauthorized Token.");
    }
    //Search for current user who's registering a new post.
    cariUser = await users.findOne({ where: { nama: userdata.nama } });

    let allPosts = await posts.findAll({
      where: {
        api_key: cariUser.api_key
      }
    })

    let foo = [];
    
    

    if(allPosts){
      for (let index = 0; index < allPosts.length; index++) {
        const element = allPosts[index];
        foo.push(element.id_post);
      }
      return res.status(200).send({
        username:cariUser.username,
        api_key: cariUser.api_key,
        Posts : foo
      })
    }
    //safeguard incase of database error/deleted user with valid token
    return res.status(400).send(
      {
        message:"Oops, something went wrong."
      }
    )

  }
  else res.status(400).send({ message: "Token is required but not found."});
}

module.exports = { addPost, getAllPost };
