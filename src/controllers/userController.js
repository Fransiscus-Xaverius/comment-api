const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();
const sequelize = new Sequelize("db_proyekws", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const JWT_KEY = process.env.JWT_KEY;
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

//api_hit function.
async function hit_api(api_key, amount){
  let userdata = await users.findOne({
    where: {
      api_key:api_key,
    },
  });

  let curhit = userdata.api_hit;
  
  if(curhit>=amount) {
    curhit-=amount;
    users.update(
      {
        api_hit:curhit
      },
      {
        where:{ api_key: api_key }
      }
    )
    return curhit;
  }
  else return null;

}

async function getUser(nama) {
  let userGet = await users.findAll({
    where: {
      nama: nama,
    },
  });

  return userGet;
}

async function userGetByKey(key) {}

const coba = (req, res) => {
  return res.status(200).send("Test");
};

//register endpoint
const register = async (req, res) => {
  let { nama, email, password, confirm_password } = req.body;
  //cek format email, password & conf dengan joi
  let schema = Joi.object({
    nama: Joi.string().required().messages({
      "any.required": "{{#label}} harus diisi",
      "string.empty": "{{#label}} tidak boleh blank",
    }),
    email: Joi.string().email().required().messages({
      "any.required": "{{#label}} harus diisi",
      "string.empty": "{{#label}} tidak boleh blank",
    }),
    password: Joi.string().min(8).required().messages({
      "any.required": "{{#label}} harus diisi",
      "string.empty": "{{#label}} tidak boleh blank",
    }),
    confirm_password: Joi.string().equal(Joi.ref("password")).messages({
      "any.required": "{{#label}} harus diisi",
      "string.empty": "{{#label}} tidak boleh blank",
    }),
  });
  try {
    let res1 = await schema.validateAsync(req.body);
    let apikey, kembar;
    do {
      //generate api key random untuk primary key user
      apikey = generateString(10); //generate 10 random alphanum string
      //cek apikey yang digenerate tidak kembar
      kembar = false;
      let allUser = await users.findAll();
      for (let i = 0; i < allUser.length; i++) {
        if (allUser[i].api_key == apikey) {
          kembar = true;
        }
      }
    } while (kembar);

    let userGet = await getUser(nama);
    if (userGet.length > 0) {
      return res.status(400).send({ message: "Nama anda sudah digunakan" });
    } else {
      let coba = await users.create({ nama: nama, email: email, password: password, api_key: apikey, api_hit: 10, saldo: 0, liked_comment: [] });
      let temp = {
        nama: nama,
        api_key: apikey,
      };
      return res.status(201).send({ message: "Berhasil register", data: temp });
    }
  } catch (error) {
    return res.status(400).send(error.message);
  }
};

//login endpoint
const login = async (req, res) => {
  // console.log(process.env.PORT);
  let { nama, password } = req.body;
  let schema = Joi.object({
    nama: Joi.string().required().messages({
      "any.required": "{{#label}} harus diisi",
      "string.empty": "{{#label}} tidak boleh blank",
    }),
    password: Joi.string().required().messages({
      "any.required": "{{#label}} harus diisi",
      "string.empty": "{{#label}} tidak boleh blank",
    }),
  });
  try {
    let res1 = await schema.validateAsync(req.body);
    let userGet = await getUser(nama);
    if (userGet.length == 0) {
      return res.status(404).send({ message: "User tidak ditemukan" });
    } else {
      if (userGet[0].password != password) {
        return res.status(400).send({ message: "Password salah" });
      } else {
        let token = jwt.sign(
          {
            api_key: userGet[0].api_key,
            nama: nama,
          },
          JWT_KEY,
          { expiresIn: "24h" }
        );
        return res.status(201).send({
          token: token,
        });
      }
    }
  } catch (error) {
    return res.status(400).send(error.toString());
  }
};

//Top up API Hit endpoint
const topupApiHit = async (req, res) => {
  let token = req.header("x-auth-token");
  let { jumlah_api_hit } = req.body;
  let schema = Joi.object({
    jumlah_api_hit: Joi.number().integer().min(1).required(),
  });

  if (!req.header("x-auth-token")) {
    return res.status(403).send("Unauthorized");
  }

  let harga = parseInt(jumlah_api_hit) * 500;

  try {
    let res1 = await schema.validateAsync(req.body);
    let userdata = jwt.verify(token, JWT_KEY);
    let userGet = await getUser(userdata.nama);
    if (userGet.length == 0) {
      return res.status(404).send("User Tidak ditemukan");
    }
    if (userGet[0].saldo < harga) {
      return res.status(400).send("Saldo tidak mencukupi");
    }
    let new_api_hit = parseInt(userGet[0].api_hit) + parseInt(jumlah_api_hit);
    let new_saldo = parseInt(userGet[0].saldo) - parseInt(harga);

    let userUpdate = await users.update(
      {
        api_hit: new_api_hit,
        saldo: new_saldo,
      },
      {
        where: {
          nama: userdata.nama,
        },
      }
    );
    return res.status(200).send({
      message: "Berhasil menambahkan api_hit",
      api_hit_sekarang: new_api_hit,
    });
  } catch (error) {
    return res.status(400).send(error.toString());
  }
};

//Top up saldo endpoint
const topupSaldo = async (req, res) => {
  let { nominal } = req.body;
  let token = req.header("x-auth-token");
  let schema = Joi.object({
    nominal: Joi.number().integer().min(1000).required(),
  });
  try {
    let res = await schema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).send(error.toString());
  }
  try {
    let temp = jwt.verify(token, JWT_KEY);
    let user = await users.findAll({
      where: {
        nama: temp.nama,
      },
    });
    if (user.length > 0) {
      let saldoAwal = parseInt(user[0].saldo);
      let saldoAkhir = saldoAwal + parseInt(nominal);
      await users.update(
        {
          saldo: saldoAkhir,
        },
        {
          where: {
            nama: temp.nama,
          },
        }
      );
      return res.status(200).send({
        message: "Berhasil Topup sebesar Rp " + nominal,
        saldo: "Rp " + saldoAkhir,
      });
    } else {
      return res.status(400).send({ message: "Invalid token" });
    }
  } catch (error) {
    return res.status(400).send({ message: "Invalid token" });
  }
};

//Cek Saldo endpoint
const cekSaldo = async (req, res) => {
  let token = req.header("x-auth-token");
  try {
    let temp = jwt.verify(token, JWT_KEY);
    let user = await users.findAll({
      where: {
        nama: temp.nama,
      },
    });
    if (user.length > 0) {
      let saldo = parseInt(user[0].saldo);
      return res.status(200).send({
        message: "Saldo saat ini sebesar Rp " + saldo,
      });
    } else {
      return res.status(400).send({ message: "Invalid token" });
    }
  } catch (error) {
    return res.status(400).send({ message: "Invalid token" });
  }
};

//Cek API Hit endpoint
const cekApiHit = async (req, res) => {
  let token = req.header("x-auth-token");
  try {
    let temp = jwt.verify(token, JWT_KEY);
    let user = await users.findAll({
      where: {
        nama: temp.nama,
      },
    });
    if (user.length > 0) {
      let api_hit = parseInt(user[0].api_hit);
      return res.status(200).send({
        nama: user[0].nama,
        api_hit: api_hit,
      });
    } else {
      return res.status(400).send({ message: "Invalid token" });
    }
  } catch (error) {
    return res.status(400).send({ message: "Invalid token" });
  }
};

module.exports = { coba, register, login, topupApiHit, topupSaldo, cekSaldo, cekApiHit , hit_api};
