"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Registro extends Model {}

  Registro.init(
    {
      number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      tipo_registro: {
        type: DataTypes.ENUM("entrada", "salida", "inicio_almuerzo", "fin_almuerzo"),
        allowNull: false,
      },
      hora: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      latitud: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false,
      },
      longitud: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false,
      },
      ubicacion: {
        type: DataTypes.GEOMETRY("POINT", 4326),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Registro",
      tableName: "registros",
      underscored: true,
    }
  );

  return Registro;
};
