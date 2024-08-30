let { DataTypes, sequelize } = require("../lib/index");
let employee = sequelize.define("employee", {
  name: {
    type: DataTypes.TEXT,
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
});
module.exports = { employee };