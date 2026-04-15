// config/db.js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

// Test connection
pool.query("SELECT NOW()")
  .then(() => console.log("✅ PostgreSQL Connected"))
  .catch((err) => {
    console.log("⚠️  PostgreSQL: Connection failed - check your password in .env file");
    console.log("   To fix: Update PGPASSWORD in .env with your actual PostgreSQL password");
    console.log("   MongoDB is connected and will handle most operations");
  });

module.exports = pool;
