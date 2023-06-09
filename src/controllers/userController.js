const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();
const {development} = require("../config/config.json");
const sequelize = new Sequelize(development.database, development.username, development.password, {
  host: development.host,
  port: 3306,
  dialect: "mysql",
});
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const JWT_KEY = process.env.JWT_KEY;
//ambil model
const users = require("../models/user")(sequelize, DataTypes);
//helper function
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

//===================HELPER FUNCTIONS======================

function generateString(length) {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

//api_hit function.
async function hit_api(api_key, amount) {
  console.log(api_key);
  let userdata = await users.findOne({
    where: {
      api_key: api_key,
    },
  });

  let curhit = userdata.api_hit;
  

  if (curhit >= amount) {
    curhit -= amount;
    users.update(
      {
        api_hit: curhit,
      },
      {
        where: { api_key: api_key },
      }
    );
    return curhit;
  } else return null;
}

async function getUser(nama) {
  let userGet = await users.findAll({
    where: {
      nama: nama,
    },
  });

  return userGet;
}

const coba = (req, res) => {
  return res.status(200).send("Test");
};

//register endpoint
const register = async (req, res) => {
  let { nama, email, password, confirm_password } = req.body;
  console.log(nama);
  //cek format email, password & conf dengan joi
  let schema = Joi.object({
    nama: Joi.string().required().messages({
      "any.required": "Semua Field Harus Diisi",
      "string.empty": "Isi Field Tidak Boleh String Kosong",
    }),
    email: Joi.string().email().required().messages({
      "any.required": "Semua Field Harus Diisi",
      "string.empty": "Isi Field Tidak Boleh String Kosong",
    }),
    password: Joi.string().min(8).required().messages({
      "any.required": "Semua Field Harus Diisi",
      "string.empty": "Isi Field Tidak Boleh String Kosong",
      "string.min": "Panjang password harus lebih dari sama dengan 8 karakter"
    }),
    confirm_password: Joi.string().equal(Joi.ref("password")).required().messages({
      "any.required": "Semua Field Harus Diisi",
      "string.empty": "Isi Field Tidak Boleh String Kosong",
      "any.only": "{{#label}} harus sama dengan password",
    }),
  });
  try {
    let res1 = await schema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
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
      //hash password
      let hashedPass = bcrypt.hashSync(password, 10);
      let coba = await users.create({ nama: nama, email: email, password: hashedPass, api_key: apikey, api_hit: 10, saldo: 0, liked_comment: [] });
      let temp = {
        nama: nama,
        api_key: apikey,
      };
      return res.status(201).send({ message: "Berhasil register", data: temp });
    }
  
};

//login endpoint
const login = async (req, res) => {
  // console.log(process.env.PORT);
  let { nama, password } = req.body;
  let schema = Joi.object({
    nama: Joi.string().required().messages({
      "any.required": "Semua Field Harus Diisi",
      "string.empty": "Isi Field Tidak Boleh String Kosong",
    }),
    password: Joi.string().required().messages({
      "any.required": "Semua Field Harus Diisi",
      "string.empty": "Isi Field Tidak Boleh String Kosong",
    }),
  });
  try {
    let res1 = await schema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
    let userGet = await getUser(nama);
    if (userGet.length == 0) {
      return res.status(404).send({ message: "User tidak ditemukan" });
    } else {
      if (!bcrypt.compareSync(password, userGet[0].password)) {
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
          message: "Berhasil login",
          token: token,
        });
      }
    }
  
};

//Top up API Hit endpoint
const topupApiHit = async (req, res) => {
  let token = req.header("x-auth-token");
  let { jumlah_api_hit } = req.body;
  let schema = Joi.object({
    jumlah_api_hit: Joi.number().integer().min(1).required().messages({
      "any.required": "Semua Field Harus Diisi",
      "number.base": "{{#label}} Harus Berupa Angka",
      "number.min": "Jumlah api_hit minimal 1",
    }),
  });

  if (!req.header("x-auth-token")) {
    return res.status(401).send({ message: "Token tidak ditemukan" });
  }

  let harga = parseInt(jumlah_api_hit) * 500;

  try {
    await schema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  let userdata;
  try {
    userdata = jwt.verify(token, JWT_KEY);
  } catch (error) {
    return res.status(401).send({ message: "Token tidak valid" });
  }

    let userGet = await getUser(userdata.nama);
    if (userGet.length == 0) {
      return res.status(401).send({ message: "Token tidak valid" });
    }
    if (userGet[0].saldo < harga) {
      return res.status(400).send({ message: "Saldo tidak mencukupi" });
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
};

//Top up saldo endpoint
const topupSaldo = async (req, res) => {
  let { nominal } = req.body;
  let token = req.header("x-auth-token");

  if (!req.header("x-auth-token")) {
    return res.status(401).send({ message: "Token tidak ditemukan" });
  }

  let schema = Joi.object({
    nominal: Joi.number().integer().min(1000).required().messages({
      "any.required": "Semua Field Harus Diisi",
      "number.base": "{{#label}} Harus Berupa Angka",
      "number.min": "Nominal topup minimal 1000",
    }),
  });
  try {
    let res = await schema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }

  let temp;
  try {
    temp = jwt.verify(token, JWT_KEY);
  } catch (error) {
    return res.status(401).send({ message: "Token tidak valid" });
  }

    let user = await users.findAll({
      where: {
        nama: temp.nama,
      },
    });
    if (user.length == 0) {
      return res.status(401).send({ message: "Token tidak valid" });
    }

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
};

//Cek Saldo endpoint
const cekSaldo = async (req, res) => {
  let token = req.header("x-auth-token");

  if (!req.header("x-auth-token")) {
    return res.status(401).send({ message: "Token tidak ditemukan" });
  }

  let temp;
  try {
    temp = jwt.verify(token, JWT_KEY);
  } catch (error) {
    return res.status(401).send({ message: "Token tidak valid" });
  }

    let user = await users.findAll({
      where: {
        nama: temp.nama,
      },
    });
    if (user.length == 0) {
      return res.status(401).send({ message: "Token tidak valid" });
    }
      let saldo = parseInt(user[0].saldo);
      return res.status(200).send({
        nama: user[0].nama,
        message: "Saldo saat ini sebesar Rp " + saldo,
      });
};

//Cek API Hit endpoint
const cekApiHit = async (req, res) => {
  let token = req.header("x-auth-token");

  if (!req.header("x-auth-token")) {
    return res.status(401).send({ message: "Token tidak ditemukan" });
  }

  let temp;
  try {
    temp = jwt.verify(token, JWT_KEY);
  } catch (error) {
    return res.status(401).send({ message: "Token tidak valid" });
  }

    let user = await users.findAll({
      where: {
        nama: temp.nama,
      },
    });
    if (user.length == 0) {
      return res.status(401).send({ message: "Token tidak valid" });
    }
      let api_hit = parseInt(user[0].api_hit);
      return res.status(200).send({
        nama: user[0].nama,
        api_hit: "Api_Hit saat ini sebesar " + api_hit,
      });
};

module.exports = { coba, register, login, topupApiHit, topupSaldo, cekSaldo, cekApiHit, hit_api };
