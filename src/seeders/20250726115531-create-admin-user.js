'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if admin user already exists
    const existingAdmin = await queryInterface.rawSelect(
      'users',
      {
        where: {
          email: 'admin@maruti.com',
        },
      },
      ['id']
    );

    // Only create admin if it doesn't exist
    if (!existingAdmin) {
      // Hash the password
      const hashedPassword = await bcrypt.hash('admin123', 12);

      await queryInterface.bulkInsert('users', [
        {
          id: uuidv4(),
          email: 'admin@maruti.com',
          password: hashedPassword,
          role: 1, // ADMIN role
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      console.log('✅ Admin user created successfully');
      console.log('📧 Email: admin@maruti.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️  Please change the password after first login');
    } else {
      console.log('ℹ️  Admin user already exists, skipping creation');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'users',
      {
        email: 'admin@maruti.com',
      },
      {}
    );
  },
};
