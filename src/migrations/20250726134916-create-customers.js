'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Customer name',
      },
      mobile_no: {
        type: Sequelize.STRING(15),
        allowNull: false,
        comment: 'Customer mobile number',
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Customer address',
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Reference to references table',
        references: {
          model: 'references',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // Prevent deletion of reference if customers exist
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
    await queryInterface.addIndex('customers', ['name'], {
      name: 'customers_name_index',
    });

    await queryInterface.addIndex('customers', ['mobile_no'], {
      name: 'customers_mobile_no_index',
    });

    await queryInterface.addIndex('customers', ['reference_id'], {
      name: 'customers_reference_id_index',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('customers', 'customers_name_index');
    await queryInterface.removeIndex('customers', 'customers_mobile_no_index');
    await queryInterface.removeIndex('customers', 'customers_reference_id_index');

    // Drop table
    await queryInterface.dropTable('customers');
  },
};
