'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add unique constraint to product name
    await queryInterface.addConstraint('products', {
      fields: ['name'],
      type: 'unique',
      name: 'products_name_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove unique constraint from product name
    await queryInterface.removeConstraint('products', 'products_name_unique');
  },
};
