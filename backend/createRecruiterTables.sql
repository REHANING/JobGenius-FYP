-- Jobs table (posted by recruiters)
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  recruiter_id VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  salary TEXT,
  type TEXT, -- full-time, part-time, internship
  status TEXT DEFAULT 'active', -- active, closed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Applications table (jobseeker applies to jobs)
CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  status TEXT DEFAULT 'applied', -- applied, reviewed, shortlisted, rejected, offered
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  recruiter_id VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  mode TEXT, -- online, onsite
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMP DEFAULT NOW()
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  recruiter_id VARCHAR(255) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined
  salary TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Simple trigger to keep updated_at fresh on jobs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

