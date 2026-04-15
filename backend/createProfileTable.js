// createProfileTable.js
// Run this script to create the user_profiles table in PostgreSQL
const pool = require("./config/db");

const createProfileTable = async () => {
  try {
    console.log("🚀 Creating user_profiles table...");

    // Create the table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        name TEXT,
        email TEXT,
        phone TEXT,
        bio TEXT,
        education JSONB,
        experience JSONB,
        skills JSONB,
        resume_file_name TEXT,
        parsed_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at)
    `);

    // Create function to automatically update updated_at timestamp
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Create trigger
    await pool.query(`
      DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
      CREATE TRIGGER update_user_profiles_updated_at 
          BEFORE UPDATE ON user_profiles 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
    `);

    console.log("✅ user_profiles table created successfully!");
    console.log("✅ Indexes created successfully!");
    console.log("✅ Trigger for auto-updating updated_at created successfully!");

    // Insert sample data
    await pool.query(`
      INSERT INTO user_profiles (
        user_id, name, email, phone, bio, 
        education, experience, skills
      ) VALUES (
        'demo-user-123',
        'John Doe',
        'john@example.com',
        '+1-555-123-4567',
        'Experienced software developer with 5+ years in web development.',
        $1,
        $2,
        $3
      ) ON CONFLICT (user_id) DO NOTHING
    `, [
      JSON.stringify([
        {
          degree: "Bachelor of Computer Science",
          institute: "University of Technology",
          year: "2018-2022"
        }
      ]),
      JSON.stringify([
        {
          title: "Senior Frontend Developer",
          company: "Tech Corp",
          duration: "2022-Present"
        },
        {
          title: "Frontend Developer",
          company: "StartupXYZ",
          duration: "2020-2022"
        }
      ]),
      JSON.stringify(["React", "TypeScript", "Node.js", "PostgreSQL", "MongoDB", "AWS"])
    ]);

    console.log("✅ Sample data inserted successfully!");

    // Verify the table
    const result = await pool.query("SELECT COUNT(*) FROM user_profiles");
    console.log(`📊 Total records in user_profiles: ${result.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating table:", error);
    process.exit(1);
  }
};

// Run the function
createProfileTable();


