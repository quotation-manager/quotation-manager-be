'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'gst_number', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
      comment: 'GST number of the customer (optional)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'gst_number');
  },
};
