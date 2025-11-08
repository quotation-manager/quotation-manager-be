'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Product name',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Product description',
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Product unit of measurement',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('products', ['name'], {
      name: 'products_name_index',
    });

    await queryInterface.addIndex('products', ['unit'], {
      name: 'products_unit_index',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('products', 'products_name_index');
    await queryInterface.removeIndex('products', 'products_unit_index');

    // Drop table
    await queryInterface.dropTable('products');
  },
};
