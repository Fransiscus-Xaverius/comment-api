"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("comments", {
      id_comment: {
        primaryKey: true,
        type: Sequelize.STRING,
      },
      comment: {
        type: Sequelize.STRING,
      },
      api_key: {
        type: Sequelize.STRING,
      },
      like_count: {
        type: Sequelize.INTEGER,
      },
      gif_reaction: {
        type: Sequelize.JSON,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("comments");
  },
};
