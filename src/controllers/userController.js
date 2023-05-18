const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("db_proyekws", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const JWT_KEY = 'PROJEK_WS';
//ambil model
const users = require("../models/user")(sequelize, DataTypes);
//helper function
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateString(length) {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

async function userGet(nama) {
  let userGet = await users.findAll({
    where:{
      nama: nama
    }
  });

  return userGet;
}

const coba = (req, res) => {
  return res.status(200).send("Test");
};

//register endpoint (DONE)
const register = async (req, res) => {
  let { nama, email, password, confirm_password } = req.body;
  //cek format email, password & conf dengan joi
  let schema = Joi.object({
    nama: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    confirm_password: Joi.string().equal(Joi.ref("password")),
  });
  try {
    let res1 = await schema.validateAsync(req.body);
    //generate api key random untuk primary key user
    let apikey = generateString(10); //generate 10 random alphanum string
    let userGet = userGet(nama);
    if (userGet.length > 0) {
      return res.status(400).send({message: "Nama anda sudah digunakan"});
    }
    let coba = await users.create({ nama: nama, email: email, password: password, api_key: apikey, api_hit: 10, saldo: 0, liked_comment: [] });
    let temp = {
      nama: nama,
      api_key: apikey,
    };
    res.status(201).send({ message: "Berhasil register", data: temp });
  } catch (error) {
    return res.send(error.toString());
  }
};

//login endpoint
const login = async (req, res) => {
  let { nama, password } = req.body;
  let schema = Joi.object({
    nama: Joi.string().required(),
    password: Joi.string().required(),
  });
  try {
    let res1 = await schema.validateAsync(req.body);
    let userGet = userGet(nama);
    if (userGet.length == 0) {
      return res.status(404).send({message: "User tidak ditemukan"});
    }
    if (userGet[0].password != password) {
      return res.status(400).send({message: "Password salah"});
    }
    let token = jwt.sign({
      api_key: userGet[0].api_key,
      nama: nama,
    }, JWT_KEY, {expiresIn: '24h'})
    return res.status(201).send({
      token: token
    })
  } catch (error) {
    return res.send(error.toString());
  }
  
};

const topup = async (req, res) => {
  let {api_key, jumlah_api_hit} = req.body;
};

//Top up API Hit endpoint

//Cek Saldo endpoint

//Cek API Hit endpoint

module.exports = { coba, register, login };
