'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('items', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
      comment: 'Quantity of the item (positive integer, default 1)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('items', 'quantity');
  },
};
