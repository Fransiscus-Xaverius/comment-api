const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("db_proyekws", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});
const Joi = require("joi");
//ambil model
const users = require("../src/models/user")(sequelize, DataTypes);

//helper function
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateString(length) {
  let result = " ";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
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
    let coba = await users.create({ nama: nama, email: email, password: password, api_key: apikey, api_hit: 10, saldo: 0, liked_comment: [] });
    let temp = {
      nama: nama,
      api_key: apikey,
    };
    res.status(201).send({ message: "Berhasil register", data: temp });
  } catch (error) {
    res.send(error.toString());
  }
};

//login endpoint
const login = async (req, res) => {
  let { nama, password } = req.body;
};

//Top up API Hit endpoint

//Cek Saldo endpoint

//Cek API Hit endpoint

module.exports = { coba, register };
