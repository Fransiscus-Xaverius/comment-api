"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Like.init(
    {
      id_like: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      id_comment: DataTypes.STRING,
      id_post: DataTypes.STRING,
      username: DataTypes.STRING,
      jenis: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Like",
      tableName: "likes",
      timestamps: false,
    }
  );
  return Like;
};
