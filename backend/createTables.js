// createTables.js
const pool = require("./config/db");

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(100),
        skills TEXT[],
        experience TEXT,
        education TEXT,
        uploaded_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ PostgreSQL tables created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exit(1);
  }
};

createTables();
