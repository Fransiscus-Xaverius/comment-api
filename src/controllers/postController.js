require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("db_proyekws", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});

//models
const posts = require("../models/post");

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
const addPost = async (req,res)=>{
  console.log("masuk");
  let token = req.header("x-auth-token");
  if(token){
    let userdata = "";
    let cariUser;

    //Search for current user who's registering a new post.

    try {
      userdata = jwt.verify(token, JWT_KEY);
      cariUser = await users.findOne({ where: { nama: userdata.nama } });
    } catch (error) {
      return res.status(403).send("Unauthorized Token.");
    }

    //if current user exists, make post and return id_post

    if(cariUser){
      //generate post ID
      let id = await generatePostID();
      //create new post with ORM
      await posts.create({id_post : id});
      
      return res.status(201).send({message:"New Post successfully added", id_post:id});

    }
    else{
      //Unreachable statement, but here just in case a user is deleted but the token is still active.
      return res.status(400).send({message:"User not registered"})
    }

  }
  else res.status(400).send({ message: "Token is required but not found." });
}

//get all post from user (Unchecked)
const getAllPost = async (req,res) =>{
  let token = req.header("x-auth-token");
  if(token){

  }
}

module.exports = {addPost, getAllPost}