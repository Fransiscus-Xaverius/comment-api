"use strict";
const { Model } = require("sequelize");
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
      api_key: DataTypes.STRING,
      api_hit: DataTypes.INTEGER,
      saldo: DataTypes.INTEGER,
      liked_comment: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
