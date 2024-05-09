"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("posts", {
      id_post: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      // api_key: { //this is disabled due to Integration with KitaSetara. -Uncomment this and comment on UID.
      //   type: Sequelize.STRING,
      // },
      uid:{
        type: Sequelize.STRING,
      },
      title: {
        type: Sequelize.STRING,
      },
      author: {
        type: Sequelize.STRING,
      },
      content: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("posts");
  },
};
