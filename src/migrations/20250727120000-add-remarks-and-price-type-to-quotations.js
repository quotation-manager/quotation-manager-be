'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('quotations', 'remarks', {
      type: Sequelize.STRING(1000),
      allowNull: true,
      comment: 'Optional remarks for the quotation (max 1000 characters)',
    });

    await queryInterface.addColumn('quotations', 'price_type', {
      type: Sequelize.ENUM('Inclusive Tax', 'Exclusive Tax'),
      allowNull: false,
      defaultValue: 'Inclusive Tax',
      comment: 'Price type for the quotation - Inclusive Tax or Exclusive Tax',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('quotations', 'remarks');
    await queryInterface.removeColumn('quotations', 'price_type');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_quotations_price_type;');
  },
};
