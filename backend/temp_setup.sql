-- First drop database if exists
DROP DATABASE IF EXISTS jobgenius;

-- Create database
CREATE DATABASE jobgenius;

-- Now connect to database and create tables
\c jobgenius

-- Job Genius Database Setup Script
-- Run this script in your PostgreSQL database to create all necessary tables

-- Drop tables if exist (for clean setup)
DROP TABLE IF EXISTS user_scores CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table for storing parsed CV data
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    name TEXT,
    email TEXT,
    phone TEXT,
    bio TEXT,
    education JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    certificates JSONB DEFAULT '[]',
    resume_file_name TEXT,
    parsed_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_scores table for dashboard metrics
CREATE TABLE user_scores (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    overall_score INTEGER DEFAULT 75,
    education_score INTEGER DEFAULT 80,
    future_readiness_score INTEGER DEFAULT 70,
    skills_readiness_score INTEGER DEFAULT 75,
    geographic_score INTEGER DEFAULT 65,
    profile_views INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    interviews_count INTEGER DEFAULT 0,
    offers_count INTEGER DEFAULT 0,
    top_countries JSONB DEFAULT '["United States", "Canada", "Germany", "Australia", "United Kingdom"]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX idx_user_scores_overall_score ON user_scores(overall_score);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at for both tables
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_scores_updated_at 
    BEFORE UPDATE ON user_scores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the tables were created
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_profiles', 'user_scores');


