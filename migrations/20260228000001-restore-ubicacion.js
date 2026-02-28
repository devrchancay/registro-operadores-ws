"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Llenar NULLs con un punto default para poder aplicar NOT NULL
    await queryInterface.sequelize.query(
      "UPDATE registros SET ubicacion = ST_GeomFromText('POINT(0 0)', 4326) WHERE ubicacion IS NULL"
    );

    await queryInterface.changeColumn("registros", "ubicacion", {
      type: Sequelize.GEOMETRY("POINT", 4326),
      allowNull: false,
    });

    await queryInterface.addIndex("registros", {
      fields: ["ubicacion"],
      type: "SPATIAL",
      name: "idx_registros_ubicacion",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("registros", "idx_registros_ubicacion");
    await queryInterface.removeColumn("registros", "ubicacion");
  },
};
