"use strict";
const { Model } = require("sequelize");
const dataTypes = require("sequelize/lib/data-types");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      nama: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      api_key: {
        type: DataTypes.STRING,
        primaryKey: true,
      },

      api_hit: DataTypes.INTEGER,
      saldo: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: false,
    }
  );
  return User;
};
