// backend/routes/jobsRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
require("dotenv").config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';

// Helper function to transform JSearch API response to our format
const transformJob = (job) => {
  return {
    id: job.job_id || job.id,
    title: job.job_title || job.title || '',
    company: job.employer_name || job.company || '',
    location: `${job.job_city || ''}, ${job.job_state || ''}, ${job.job_country || ''}`.replace(/^,\s*|,\s*$/g, '') || job.location || 'Location not specified',
    type: job.job_employment_type || job.type || 'Full-time',
    salary: job.job_min_salary && job.job_max_salary 
      ? `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()} ${job.job_salary_period || 'per year'}`
      : job.salary || null,
    description: job.job_description || job.description || '',
    requirements: job.job_required_skills || job.requirements || [],
    skills: job.job_required_skills || job.skills || [],
    postedDate: job.job_posted_at_datetime_utc || job.postedDate || new Date().toISOString(),
    recruiterId: job.recruiter_id || 'external',
    status: job.status || 'active',
    url: job.job_apply_link || job.applyLink || job.url || null,
    remote: job.job_is_remote || job.remote || false,
    experience: job.job_experience || job.experience || null,
    industry: job.job_industry || job.industry || null,
    applyLink: job.job_apply_link || job.applyLink || null,
    employerLogo: job.employer_logo || job.employerLogo || null,
    jobPublisher: job.job_publisher || job.jobPublisher || 'External',
    jobCountry: job.job_country || job.jobCountry || null,
    jobCity: job.job_city || job.jobCity || null,
    jobState: job.job_state || job.jobState || null,
  };
};

// Fetch internships from JSearch API
router.get("/internships", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const url = new URL(`https://${JSEARCH_API_HOST}/search`);
    url.searchParams.append('query', 'internship');
    url.searchParams.append('page', page.toString());
    url.searchParams.append('num_pages', '1');
    
    const response = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': JSEARCH_API_HOST,
      },
    });
    
    const data = await response.json();
    const jobs = (data.data || []).slice(0, limit).map(transformJob);
    
    res.json({
      success: true,
      data: jobs,
      message: `Found ${jobs.length} internship opportunities`
    });
  } catch (error) {
    console.error("❌ JSearch API Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Error fetching internships from JSearch API",
      details: error.message
    });
  }
});

// Helper function to transform database job to our format
const transformDbJob = (job) => {
  return {
    id: `db-${job.id}`, // Prefix to distinguish from external jobs
    title: job.title || '',
    company: job.company || '',
    location: job.location || 'Location not specified',
    type: job.type || 'full-time',
    salary: job.salary || null,
    description: job.description || '',
    requirements: [],
    skills: [],
    postedDate: job.created_at ? new Date(job.created_at).toISOString() : new Date().toISOString(),
    recruiterId: job.recruiter_id || 'external',
    status: job.status || 'active',
    url: null, // Database jobs don't have external URLs
    remote: false,
    experience: null,
    industry: null,
    applyLink: null,
    employerLogo: null,
    jobPublisher: 'Job Genius Platform',
    jobCountry: null,
    jobCity: null,
    jobState: null,
  };
};

// Fetch latest jobs (combines database jobs + JSearch API)
router.get("/latest", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = req.query.q || 'developer';
    
    const allJobs = [];
    
    // 1. Fetch jobs from our database (recruiter-posted jobs) - prioritize these
    try {
      const dbResult = await pool.query(
        `SELECT * FROM jobs 
         WHERE status = 'active' 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit * 2, (page - 1) * limit] // Fetch more database jobs to ensure they're included
      );
      
      if (dbResult.rows.length > 0) {
        const dbJobs = dbResult.rows.map(transformDbJob);
        allJobs.push(...dbJobs);
        console.log(`✅ Loaded ${dbJobs.length} jobs from database`);
      }
    } catch (dbError) {
      console.warn("⚠️ Database error (non-critical):", dbError.message);
      // Continue even if database fails
    }
    
    // 2. Fetch jobs from JSearch API
    try {
      const url = new URL(`https://${JSEARCH_API_HOST}/search`);
      url.searchParams.append('query', query);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('num_pages', '1');
      
      const response = await fetch(url.toString(), {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': JSEARCH_API_HOST,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const jsearchJobs = (data.data || []).slice(0, limit).map(transformJob);
        allJobs.push(...jsearchJobs);
        console.log(`✅ Loaded ${jsearchJobs.length} jobs from JSearch API`);
      }
    } catch (jsearchError) {
      console.warn("⚠️ JSearch API error (non-critical):", jsearchError.message);
      // Continue even if JSearch fails
    }
    
    // 3. Sort by postedDate (newest first), prioritize database jobs (db- prefix)
    allJobs.sort((a, b) => {
      // Database jobs (with db- prefix) should appear first
      const aIsDb = a.id.startsWith('db-');
      const bIsDb = b.id.startsWith('db-');
      if (aIsDb && !bIsDb) return -1;
      if (!aIsDb && bIsDb) return 1;
      // Then sort by date
      return new Date(b.postedDate) - new Date(a.postedDate);
    });
    const limitedJobs = allJobs.slice(0, limit);
    
    res.json({
      success: true,
      data: limitedJobs,
      message: `Found ${limitedJobs.length} job opportunities (${limitedJobs.filter(j => j.id.startsWith('db-')).length} from platform, ${limitedJobs.filter(j => !j.id.startsWith('db-')).length} from external sources)`
    });
  } catch (error) {
    console.error("❌ Error fetching jobs:", error.message);
    res.status(500).json({
      success: false,
      error: "Error fetching jobs",
      details: error.message
    });
  }
});

// Search jobs (searches both database and JSearch)
router.get("/search", async (req, res) => {
  try {
    const keyword = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: "Search keyword (q) is required"
      });
    }
    
    const allJobs = [];
    
    // 1. Search database jobs - prioritize these
    try {
      const dbResult = await pool.query(
        `SELECT * FROM jobs 
         WHERE status = 'active' 
         AND (LOWER(title) LIKE LOWER($1) OR LOWER(company) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1))
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [`%${keyword}%`, limit * 2, (page - 1) * limit] // Fetch more to ensure inclusion
      );
      
      if (dbResult.rows.length > 0) {
        const dbJobs = dbResult.rows.map(transformDbJob);
        allJobs.push(...dbJobs);
      }
    } catch (dbError) {
      console.warn("⚠️ Database search error (non-critical):", dbError.message);
    }
    
    // 2. Search JSearch API
    try {
      const url = new URL(`https://${JSEARCH_API_HOST}/search`);
      url.searchParams.append('query', keyword);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('num_pages', '1');
      
      const response = await fetch(url.toString(), {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': JSEARCH_API_HOST,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const jsearchJobs = (data.data || []).slice(0, limit).map(transformJob);
        allJobs.push(...jsearchJobs);
      }
    } catch (jsearchError) {
      console.warn("⚠️ JSearch API error (non-critical):", jsearchError.message);
    }
    
    // 3. Sort - prioritize database jobs, then by date
    allJobs.sort((a, b) => {
      // Database jobs (with db- prefix) should appear first
      const aIsDb = a.id.startsWith('db-');
      const bIsDb = b.id.startsWith('db-');
      if (aIsDb && !bIsDb) return -1;
      if (!aIsDb && bIsDb) return 1;
      // Then sort by date
      return new Date(b.postedDate) - new Date(a.postedDate);
    });
    const limitedJobs = allJobs.slice(0, limit);
    
    res.json({
      success: true,
      data: limitedJobs,
      message: `Found ${limitedJobs.length} jobs for "${keyword}"`
    });
  } catch (error) {
    console.error("❌ Error searching jobs:", error.message);
    res.status(500).json({
      success: false,
      error: "Error searching jobs",
      details: error.message
    });
  }
});

// Fetch remote jobs
router.get("/remote", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const url = new URL(`https://${JSEARCH_API_HOST}/search`);
    url.searchParams.append('query', 'remote developer');
    url.searchParams.append('page', page.toString());
    url.searchParams.append('num_pages', '1');
    
    const response = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': JSEARCH_API_HOST,
      },
    });
    
    const data = await response.json();
    // Filter for remote jobs and transform
    const remoteJobs = (data.data || [])
      .filter(job => job.job_is_remote === true)
      .slice(0, limit)
      .map(transformJob);
    
    res.json({
      success: true,
      data: remoteJobs,
      message: `Found ${remoteJobs.length} remote job opportunities`
    });
  } catch (error) {
    console.error("❌ JSearch API Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Error fetching remote jobs",
      details: error.message
    });
  }
});

// Fetch jobs by type
router.get("/type/:jobType", async (req, res) => {
  try {
    const { jobType } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const query = `${jobType} developer`;
    
    const url = new URL(`https://${JSEARCH_API_HOST}/search`);
    url.searchParams.append('query', query);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('num_pages', '1');
    
    const response = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': JSEARCH_API_HOST,
      },
    });
    
    const data = await response.json();
    const jobs = (data.data || []).slice(0, limit).map(transformJob);
    
    res.json({
      success: true,
      data: jobs,
      message: `Found ${jobs.length} ${jobType} job opportunities`
    });
  } catch (error) {
    console.error("❌ JSearch API Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Error fetching jobs by type",
      details: error.message
    });
  }
});

// Get single job by ID
router.get("/job/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it's a database job (prefixed with "db-")
    if (id.startsWith('db-')) {
      const dbId = id.replace('db-', '');
      const dbResult = await pool.query("SELECT * FROM jobs WHERE id = $1", [dbId]);
      
      if (dbResult.rows.length > 0) {
        const job = transformDbJob(dbResult.rows[0]);
        return res.json({
          success: true,
          data: [job]
        });
      }
    } else {
      // Try direct database lookup (in case ID doesn't have prefix)
      const dbResult = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
      
      if (dbResult.rows.length > 0) {
        const job = transformDbJob(dbResult.rows[0]);
        return res.json({
          success: true,
          data: [job]
        });
      }
    }
    
    // If not in DB, return error (JSearch doesn't support fetching by specific ID)
    res.status(404).json({
      success: false,
      error: "Job not found",
      data: []
    });
  } catch (error) {
    console.error("❌ Get Job Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Error fetching job details",
      details: error.message,
      data: []
    });
  }
});

// Apply to a job
router.post("/apply", async (req, res) => {
  try {
    const { jobId, userId } = req.body;
    
    if (!jobId || !userId) {
      return res.status(400).json({
        success: false,
        error: "jobId and userId are required"
      });
    }
    
    // ✅ Check if user has uploaded a resume/profile
    try {
      const profileCheck = await pool.query(
        "SELECT id FROM user_profiles WHERE user_id = $1",
        [userId]
      );
      
      if (profileCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Please upload your resume first before applying to jobs",
          code: "NO_RESUME"
        });
      }
    } catch (profileError) {
      // If PostgreSQL is not available, we'll let the frontend handle the check
      // But still log the warning
      console.warn("⚠️ Could not check profile (PostgreSQL may not be available):", profileError.message);
      // Continue with application - frontend should also check
    }
    
    // Extract actual job ID (handle "db-" prefix)
    let actualJobId = jobId;
    if (jobId.startsWith('db-')) {
      actualJobId = jobId.replace('db-', '');
    }
    
    // Check if application already exists
    const existingApp = await pool.query(
      "SELECT id FROM applications WHERE job_id = $1 AND user_id = $2",
      [actualJobId, userId]
    );
    
    if (existingApp.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "You already applied to this job"
      });
    }
    
    // Create application record
    await pool.query(
      `INSERT INTO applications (job_id, user_id, status, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [actualJobId, userId, 'applied']
    );
    
    console.log(`✅ Application created for user ${userId} to job ${actualJobId}`);
    
    res.json({
      success: true,
      message: "Application submitted successfully"
    });
  } catch (error) {
    console.error("❌ Apply Job Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Error submitting application",
      details: error.message
    });
  }
});

module.exports = router;

