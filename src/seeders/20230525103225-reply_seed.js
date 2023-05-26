'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    await queryInterface.bulkInsert('replies', [
      {
        id_reply: "R001",
        id_comment: "C001",
        username: "visitor12",
        api_key: "6r5hkilw4q",
        reply: "It is really interesting!",
        like_count: 0,
        updatedAt: Sequelize.fn("now"),
      }
    ],{});

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('replies', null, {});
  }
};
