"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Comment.init(
    {
      id_comment: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      username:{
        type: DataTypes.STRING,
        allowNull: false
      },
      comment: DataTypes.STRING,
      api_key: DataTypes.STRING,
      like_count: DataTypes.INTEGER,
      gif_reaction: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: "Comment",
    }
  );
  return Comment;
};
