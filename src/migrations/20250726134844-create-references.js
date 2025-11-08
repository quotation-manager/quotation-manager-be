'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('references', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Reference person name',
      },
      mobile_no: {
        type: Sequelize.STRING(15),
        allowNull: true,
        comment: 'Reference person mobile number',
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Reference category type',
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
    await queryInterface.addIndex('references', ['name'], {
      name: 'references_name_index',
    });

    await queryInterface.addIndex('references', ['category'], {
      name: 'references_category_index',
    });

    await queryInterface.addIndex('references', ['mobile_no'], {
      name: 'references_mobile_no_index',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('references', 'references_name_index');
    await queryInterface.removeIndex('references', 'references_category_index');
    await queryInterface.removeIndex('references', 'references_mobile_no_index');

    // Drop table
    await queryInterface.dropTable('references');
  },
};
