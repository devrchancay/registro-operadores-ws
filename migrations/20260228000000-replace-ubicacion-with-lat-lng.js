"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("registros", "latitud", {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("registros", "longitud", {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.removeIndex("registros", "idx_registros_ubicacion");
    await queryInterface.removeColumn("registros", "ubicacion");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("registros", "ubicacion", {
      type: Sequelize.GEOMETRY("POINT", 4326),
      allowNull: false,
    });

    await queryInterface.addIndex("registros", {
      fields: ["ubicacion"],
      type: "SPATIAL",
      name: "idx_registros_ubicacion",
    });

    await queryInterface.removeColumn("registros", "longitud");
    await queryInterface.removeColumn("registros", "latitud");
  },
};
