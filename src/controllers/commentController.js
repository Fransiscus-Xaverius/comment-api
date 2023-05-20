require("dotenv").config();
const JWT_KEY = process.env.JWT_KEY;
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("db_proyekws", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});
const Joi = require("joi");
const axios = require("axios");
const jwt = require("jsonwebtoken");
// const JWT_KEY = "PROJEK_WS";
//ambil model
const users = require("../models/user")(sequelize, DataTypes);
const comments = require("../models/comment")(sequelize, DataTypes);

//Buat komentar baru
const addComment = async (req, res) => {
  let { comment } = req.body;
  let token = req.header("x-auth-token");
  //validasi token
  if (token) {
    try {
      let temp = jwt.verify(token, JWT_KEY);
      let cari = await users.findOne({ where: { nama: temp.nama } });
      if (cari) {
        if (comment) {
          const options = {
            method: "POST",
            url: "https://profanity-cleaner-bad-word-filter.p.rapidapi.com/profanity",
            headers: {
              "content-type": "application/json",
              "X-RapidAPI-Key": "f76149364cmsh31c24e1dc7a9006p1f26efjsnc3c26dfdcb4c",
              "X-RapidAPI-Host": "profanity-cleaner-bad-word-filter.p.rapidapi.com",
            },
            data: {
              text: comment,
              maskCharacter: "x",
              language: "en",
            },
          };
          try {
            let hasil = await axios.request(options);
            // console.log(hasil.data);
            if (hasil.data.profanities.length > 0) {
              //   console.log("kotor");
              res.status(400).send({ message: "Komentar tidak boleh mengandung kata kasar" });
            } else {
              //buat id komentar COM+no urut 3 digit
              let hitung = await comments.findAll();
              let id;
              if (hitung.length > 0) {
                id = "COM" + (hitung.length + 1).toString().padStart(3, 0);
              } else id = "COM001";
              let coba = await comments.create({ id_comment: id, username: cari.nama, comment: comment, api_key: cari.api_key, like_count: 0, gif_reaction: [] });
              res.status(201).send({ message: "Berhasil post komentar" });
            }
          } catch (error) {
            res.status(400).send(error.toString());
          }
        } else res.status(400).send({ message: "Komentar tidak boleh kosong" });
        //cek komentar mengandung bad words
      } else res.status(400).send({ message: "Invalid token" });
    } catch (error) {
      res.status(400).send({ message: "Invalid token" });
    }
  } else res.status(400).send({ message: "Invalid token" });
};

module.exports = { addComment };
