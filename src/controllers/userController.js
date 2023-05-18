const db = require("../models");
const { Op } = require("sequelize");
const { valid } = require("joi");
const Joi = require('joi').extend(require('@joi/date'))

const coba = (req, res) => {
  return res.status(200).send("Test");
};

//register endpoint
const register = async (req,res) =>{  
  const validator = Joi.object({
    nama: Joi.string().min(5).required().messages({
      "any.required":"{{#label}} tidak diberikan dalam parameter",
      "string.empty":"{{#label}} tidak boleh kosong."
    })
  })
  try{
    await validator.validateAsync(req.body);
  }
  catch(error){
    return res.status(400).send(error.message);
  }

  return res.status(200).send("OK");
}

//login endpoint
const login = async (req,res) =>{
  let {nama, password} = req.body;
}

//Top up API Hit endpoint

//Cek Saldo endpoint

//Cek API Hit endpoint

module.exports = { 
  coba,
  register 
};
