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

    await queryInterface.bulkInsert('users',[
      {
        nama: "coba",
        email: "coba@gmail.com",
        password: "123456789",
        api_key: "6r5hkilw4q",
        api_hit: 10,
        saldo: 0
      },
      {
        nama: "coba2",
        email: "coba2@gmail.com",
        password: "123456789",
        api_key: "z0baw3n4ks",
        api_hit: 10,
        saldo: 0
      }
    ]);

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('users', null, {});
  }
};
