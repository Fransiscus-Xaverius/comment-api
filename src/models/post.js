"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  post.init(
    {
      id_post: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      //this is usable, but it is commented due to integration with KitaSetara App. -Frans
      // api_key: {
      //   type: DataTypes.STRING,
      // },
      uid: { //this is only for KitaSetara App integration, feel free to comment this when you're forking this. Use api_key instead. -Frans
        type: DataTypes.STRING,
      },
      title:{
        type: DataTypes.STRING
      },
      author:{
        type: DataTypes.STRING
      },
      content:{
        type: DataTypes.STRING
      },
    },
    {
      sequelize,
      modelName: "post",
      tableName: "posts",
      timestamps: true,
    }
  );
  return post;
};
