"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Reply extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Reply.init(
    {
      id_reply: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      id_comment: DataTypes.STRING,
      username:{
        type: DataTypes.STRING,
        allowNull: false
      },
      api_key: DataTypes.STRING,
      reply: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Reply",
      timestamps: false,
    }
  );
  return Reply;
};
