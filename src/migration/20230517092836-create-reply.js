"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("replies", {
      id_reply: {
        primaryKey: true,
        type: Sequelize.STRING,
      },
      id_comment: {
        type: Sequelize.STRING,
      },
      username:{
        type: Sequelize.STRING,
        allowNull: false
      },
      api_key: {
        type: Sequelize.STRING,
      },
      reply: {
        type: Sequelize.STRING,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("replies");
  },
};
