const { Sequelize, DataTypes } = require("sequelize");
require('dotenv').config();
const sequelize = new Sequelize("db_proyekws", "root", "", {
    host: "localhost",
    port: 3306,
    dialect: "mysql",
});
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const JWT_KEY = process.env.JWT_KEY;

