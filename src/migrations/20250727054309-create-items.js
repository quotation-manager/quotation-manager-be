'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      quotation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'quotations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      discount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      discount_type: {
        type: Sequelize.ENUM('PERCENTAGE', 'PER_PIECE'),
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: [],
      },
      location_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'locations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    // Add indexes
    await queryInterface.addIndex('items', ['quotation_id']);
    await queryInterface.addIndex('items', ['product_id']);
    await queryInterface.addIndex('items', ['location_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('items');
  },
};
