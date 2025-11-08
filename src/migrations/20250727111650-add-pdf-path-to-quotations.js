'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('quotations', 'pdf_path', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'S3 path to the generated PDF file',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('quotations', 'pdf_path');
  },
};
