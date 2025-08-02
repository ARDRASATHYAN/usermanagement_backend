const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  profileImage: DataTypes.STRING,
  role: {
    type: DataTypes.STRING, 
    defaultValue: 'user',  
  },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
refreshToken: {
  type: DataTypes.STRING,
  allowNull: true
}

});

module.exports = User;
