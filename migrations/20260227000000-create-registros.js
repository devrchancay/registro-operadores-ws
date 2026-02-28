"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("registros", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      tipo_registro: {
        type: Sequelize.ENUM("entrada", "salida", "inicio_almuerzo", "fin_almuerzo"),
        allowNull: false,
      },
      hora: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ubicacion: {
        type: Sequelize.GEOMETRY("POINT", 4326),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("registros", {
      fields: ["ubicacion"],
      type: "SPATIAL",
      name: "idx_registros_ubicacion",
    });

    await queryInterface.addIndex("registros", {
      fields: ["number"],
      name: "idx_registros_number",
    });

    await queryInterface.addIndex("registros", {
      fields: ["tipo_registro"],
      name: "idx_registros_tipo",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("registros");
  },
};
