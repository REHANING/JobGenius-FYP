-- Job Genius Database Setup Script
-- Run this script in pgAdmin to create the necessary tables

-- Create database (if it doesn't exist)
-- CREATE DATABASE jobgenius;

-- Connect to the jobgenius database and run the following:

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS user_profiles;

-- Create user_profiles table for storing parsed CV data
CREATE TABLE user_profiles (
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
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO user_profiles (
    user_id, name, email, phone, bio, 
    education, experience, skills
) VALUES (
    'demo-user-123',
    'John Doe',
    'john@example.com',
    '+1-555-123-4567',
    'Experienced software developer with 5+ years in web development.',
    '[
        {
            "degree": "Bachelor of Computer Science",
            "institute": "University of Technology",
            "year": "2018-2022"
        }
    ]',
    '[
        {
            "title": "Senior Frontend Developer",
            "company": "Tech Corp",
            "duration": "2022-Present"
        },
        {
            "title": "Frontend Developer",
            "company": "StartupXYZ",
            "duration": "2020-2022"
        }
    ]',
    '["React", "TypeScript", "Node.js", "PostgreSQL", "MongoDB", "AWS"]'
) ON CONFLICT (user_id) DO NOTHING;

-- Verify the table was created
SELECT 'Table created successfully!' as status;
SELECT COUNT(*) as sample_records FROM user_profiles;
