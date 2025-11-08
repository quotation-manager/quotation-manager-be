'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add unique constraint for combination of name and mobile_no
    await queryInterface.addConstraint('references', {
      fields: ['name', 'mobile_no'],
      type: 'unique',
      name: 'unique_name_mobile_references',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the unique constraint
    await queryInterface.removeConstraint('references', 'unique_name_mobile_references');
  },
};
