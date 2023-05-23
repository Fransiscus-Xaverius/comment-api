'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('likes', {
      id_like: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.STRING
      },
      id_comment: {
        type: Sequelize.STRING
      },
      id_post: {
        type: Sequelize.STRING
      },
      username: {
        type: Sequelize.STRING
      },
      jenis:{
        type: Sequelize.STRING
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('likes');
  }
};