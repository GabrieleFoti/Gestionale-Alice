import { DataTypes } from "sequelize";
import sequelize from "../db.js";

export const Car = sequelize.define('Car', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photo: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false
  },
  plate: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'completed'),
    defaultValue: 'in_progress'
  },
  lavorazioni: {
    type: DataTypes.TEXT
  },
  note: {
    type: DataTypes.TEXT
  },
  partialHours: {
    type: DataTypes.STRING
  },
  totalHours: {
    type: DataTypes.STRING
  }
});