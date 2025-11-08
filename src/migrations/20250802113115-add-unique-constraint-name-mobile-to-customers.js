'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add unique constraint for combination of name and mobile_no
    await queryInterface.addConstraint('customers', {
      fields: ['name', 'mobile_no'],
      type: 'unique',
      name: 'unique_name_mobile_customers',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the unique constraint
    await queryInterface.removeConstraint('customers', 'unique_name_mobile_customers');
  },
};
