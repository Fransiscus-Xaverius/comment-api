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

//get Comment count
async function getCommentCount(){
    const count = await comments.count();
    return count;
}

//generate comment ID
async function generateCommentID(){
    let id = "C";
    let count = await getCommentCount();
    count++;
    let satuan = parseInt(count%10);
    let puluhan = parseInt((count/10)%10);
    let ratusan = parseInt(count/100);

    let generateID = id+ratusan+puluhan+satuan;
    return generateID;
}

const addComment = async (req,res)=>{
    let token = req.header('x-auth-token');
    if(token){
        let userdata = ""
        try {
            userdata = jwt.verify(token, JWT_KEY);
        } catch (error) {
            return res.status(403).send('Unauthorized Token.');
        }

        let username = userdata.nama;

        let schema = Joi.object({
            comment:Joi.string().required().messages({
                "any.required": "{{#label}} harus diisi",
                "string.empty": "{{#label}} tidak boleh blank",
            })
        })

        try {
            await schema.validateAsync(req.body);

            let comment = req.body.comment;

            const config = {
                method: 'POST',
                url: 'https://profanity-cleaner-bad-word-filter.p.rapidapi.com/profanity',
                headers: {
                  'content-type': 'application/json',
                  'X-RapidAPI-Key': 'e4a7b1cb50msh26faaaa06e35551p116f2bjsnc9d69790c133',
                  'X-RapidAPI-Host': 'profanity-cleaner-bad-word-filter.p.rapidapi.com'
                },
                data: {
                  text: comment,
                  maskCharacter: '*',
                  language: 'en'
                }
            }  
            let result = await axios.request(config);
            if(result){
                let id = await generateCommentID();
                await comments.create({id_comment: id, username: username, comment: result.data.clean, like_count: 0});
                
                let temp = {
                    username: username,
                    comment: result.data.clean
                }

                return res.status(201).send({message:" Berhasil menambahkan komentar", data:temp});
            }
            else{
                return res.status(400).send({msg:"Something went wrong! please try again later. ERR CODE 001"})
            }

        } catch (error) {
            return res.status(400).send({
                error_message:error.message
            })
        }
    }
    else{
        return res.status(400).send({msg:"Token is required but not found."})
    }
}

const editComment = async (req,res)=>{
    
}

module.exports = {addComment, editComment};
