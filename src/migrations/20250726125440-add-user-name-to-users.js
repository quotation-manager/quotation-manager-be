'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'user_name', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: 'Display name for the user',
    });

    // Add index on user_name for better query performance
    await queryInterface.addIndex('users', ['user_name'], {
      name: 'users_user_name_index',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('users', 'users_user_name_index');

    // Remove column
    await queryInterface.removeColumn('users', 'user_name');
  },
};
