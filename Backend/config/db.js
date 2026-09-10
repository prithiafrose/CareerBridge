// Backend/config/db.js
const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

// Railway MySQL provides a full connection URL (e.g. MYSQL_URL / MYSQL_CONNECTION_URL)
const connectionUrl =
  process.env.MYSQL_URL ||
  process.env.MYSQL_CONNECTION_URL ||
  (process.env.MYSQLHOST || process.env.MYSQL_HOST
    ? `mysql://${process.env.MYSQLUSER || process.env.MYSQL_USER || "root"}:${encodeURIComponent(
        process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || ""
      )}@${process.env.MYSQLHOST || process.env.MYSQL_HOST}:${process.env.MYSQLPORT || 3306}/${
        process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || process.env.DB_NAME || "job_portal_db"
      }`
    : null);

const sequelize = connectionUrl
  ? new Sequelize(connectionUrl, { dialect: "mysql", logging: false })
  : new Sequelize(
      process.env.DB_NAME || "job_portal_db",
      process.env.DB_USER || "root",
      process.env.DB_PASSWORD || "",
      {
        host: process.env.DB_HOST || "localhost",
        dialect: "mysql",
        logging: false
      }
    );

// Test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("�o. MySQL connected via Sequelize");
  } catch (err) {
    console.error("�?O Unable to connect:", err);
  }
})();

module.exports = sequelize;