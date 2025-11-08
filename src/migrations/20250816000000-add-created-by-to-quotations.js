'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('quotations', 'created_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who created the quotation',
    });

    // Add index for better query performance
    await queryInterface.addIndex('quotations', ['created_by'], {
      name: 'quotations_created_by_index',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('quotations', 'quotations_created_by_index');

    // Remove column
    await queryInterface.removeColumn('quotations', 'created_by');
  },
};
