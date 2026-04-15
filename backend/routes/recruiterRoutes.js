// backend/routes/recruiterRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// List all user profiles (for recruiters) with scores
router.get("/profiles", async (req, res) => {
  try {
    // First, ensure ilo_level and ilo_label columns exist
    try {
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='user_scores' AND column_name='ilo_level') THEN
            ALTER TABLE user_scores ADD COLUMN ilo_level INTEGER DEFAULT 2;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='user_scores' AND column_name='ilo_label') THEN
            ALTER TABLE user_scores ADD COLUMN ilo_label TEXT DEFAULT 'Entry level';
          END IF;
        END $$;
      `);
    } catch (alterErr) {
      console.log('Note: Columns may already exist or table may not exist yet:', alterErr.message);
    }

    const result = await pool.query(`
      SELECT 
        up.*,
        COALESCE(us.overall_score, 75) as overall_score,
        COALESCE(us.education_score, 80) as education_score,
        COALESCE(us.skills_readiness_score, 75) as skills_readiness_score,
        COALESCE(us.future_readiness_score, 70) as future_readiness_score,
        COALESCE(us.geographic_score, 65) as geographic_score,
        COALESCE(us.ilo_level, 2) as ilo_level,
        COALESCE(us.ilo_label, 'Entry level') as ilo_label
      FROM user_profiles up
      LEFT JOIN user_scores us ON us.user_id = up.user_id
      ORDER BY COALESCE(us.overall_score, 75) DESC, up.created_at DESC
    `);
    const rows = result.rows.map((p) => ({
      ...p,
      education: p.education ? (typeof p.education === 'string' ? JSON.parse(p.education) : p.education) : [],
      experience: p.experience ? (typeof p.experience === 'string' ? JSON.parse(p.experience) : p.experience) : [],
      skills: p.skills ? (typeof p.skills === 'string' ? JSON.parse(p.skills) : p.skills) : [],
      certificates: p.certificates ? (typeof p.certificates === 'string' ? JSON.parse(p.certificates) : p.certificates) : [],
      // Ensure all score fields have defaults
      overall_score: p.overall_score || 75,
      education_score: p.education_score || 80,
      skills_readiness_score: p.skills_readiness_score || 75,
      future_readiness_score: p.future_readiness_score || 70,
      geographic_score: p.geographic_score || 65,
      ilo_level: p.ilo_level || 2,
      ilo_label: p.ilo_label || 'Entry level',
    }));
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching recruiter profiles:', err);
    res.status(500).json({ success: false, error: 'Error fetching profiles', details: err.message });
  }
});

// Create job (post job)
router.post("/jobs", async (req, res) => {
  try {
    const { recruiterId, title, company, location, description, salary, type } = req.body;
    if (!recruiterId || !title || !company) {
      return res.status(400).json({ success: false, error: 'recruiterId, title, company are required' });
    }
    const result = await pool.query(
      `INSERT INTO jobs (recruiter_id, title, company, location, description, salary, type)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [recruiterId, title, company, location || null, description || null, salary || null, type || null]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error creating job', details: err.message });
  }
});

// List jobs by recruiter
router.get("/jobs", async (req, res) => {
  try {
    const { recruiterId } = req.query;
    const result = recruiterId
      ? await pool.query("SELECT * FROM jobs WHERE recruiter_id = $1 ORDER BY created_at DESC", [recruiterId])
      : await pool.query("SELECT * FROM jobs ORDER BY created_at DESC");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching jobs', details: err.message });
  }
});

// Delete job permanently
router.delete("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Check if job exists and get recruiter_id for verification (optional - can add auth middleware later)
    const checkResult = await pool.query('SELECT recruiter_id FROM jobs WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    
    // Delete the job (CASCADE will handle related applications, interviews, offers)
    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);
    res.json({ success: true, message: 'Job deleted permanently', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error deleting job', details: err.message });
  }
});

// Create offer to a user for a job
router.post("/offers", async (req, res) => {
  try {
    const { jobId, userId, recruiterId, salary, notes, roleTitle } = req.body;
    if (!jobId || !userId || !recruiterId) {
      return res.status(400).json({ success: false, error: 'jobId, userId, recruiterId are required' });
    }
    const result = await pool.query(
      `INSERT INTO offers (job_id, user_id, recruiter_id, salary, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [jobId, userId, recruiterId, salary || null, (roleTitle ? `Role: ${roleTitle}. ` : '') + (notes || '')]
    );
    
    // Offer is stored in offers table - counters endpoint reads directly from there
    console.log(`✅ Offer created for user ${userId}`);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error creating offer', details: err.message });
  }
});

// Schedule interview
router.post("/interviews", async (req, res) => {
  try {
    const { jobId, userId, recruiterId, scheduledAt, mode, notes, roleTitle } = req.body;
    if (!jobId || !userId || !recruiterId || !scheduledAt) {
      return res.status(400).json({ success: false, error: 'jobId, userId, recruiterId, scheduledAt are required' });
    }
    const result = await pool.query(
      `INSERT INTO interviews (job_id, user_id, recruiter_id, scheduled_at, mode, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [jobId, userId, recruiterId, scheduledAt, mode || null, (roleTitle ? `Role: ${roleTitle}. ` : '') + (notes || null)]
    );
    
    // Interview is stored in interviews table - counters endpoint reads directly from there
    console.log(`✅ Interview scheduled for user ${userId}`);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error scheduling interview', details: err.message });
  }
});

// Update job status (e.g., close)
router.put("/jobs/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g., 'closed'
    if (!status) {
      return res.status(400).json({ success:false, error:'status is required' });
    }
    // First ensure status column exists (for existing tables without the column)
    try {
      await pool.query('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'active\'');
    } catch (alterErr) {
      // Column might already exist or table structure issue, but continue anyway
      console.warn('⚠️ Note: Could not add/verify status column (may already exist):', alterErr.message);
      // Continue - the UPDATE query below will work if column exists, or fail gracefully
    }
    const result = await pool.query(
      `UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, 
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success:false, error:'Job not found' });
    res.json({ success:true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error updating job status', details: err.message });
  }
});

// Update application status (accept/reject/shortlist)
router.put('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success:false, error:'status required' });
    const result = await pool.query('UPDATE applications SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ success:false, error:'Application not found' });
    res.json({ success:true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error updating application', details: err.message });
  }
});

// Counters for a jobseeker dashboard (use actual table counts as source of truth)
router.get('/counters/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const viewsRes = await pool.query('SELECT profile_views FROM user_scores WHERE user_id = $1', [userId]);
    const viewsRow = viewsRes.rows[0] || {};
    
    // Get actual counts from tables (source of truth)
    const appsRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM applications WHERE user_id = $1', [userId]);
    const interviewsRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM interviews WHERE user_id = $1', [userId]);
    const offersRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM offers WHERE user_id = $1', [userId]);

    const data = {
      profile_views: viewsRow.profile_views || 0,
      applications: appsRes.rows[0]?.cnt || 0,
      interviews: interviewsRes.rows[0]?.cnt || 0,
      offers: offersRes.rows[0]?.cnt || 0,
    };
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error fetching counters', details: err.message });
  }
});

// Jobseeker Applications list
router.get('/applications', async (req, res) => {
  try {
    const { userId, recruiterId } = req.query;
    if (recruiterId) {
      // Recruiter view: applications to recruiter's jobs with candidate info
      const result = await pool.query(
        `SELECT a.*, j.title, j.company, j.location, j.type,
                p.name as candidate_name, p.email as candidate_email
         FROM applications a
         LEFT JOIN jobs j ON j.id = a.job_id
         LEFT JOIN user_profiles p ON p.user_id = a.user_id
         WHERE j.recruiter_id = $1
         ORDER BY a.created_at DESC`, [recruiterId]
      );
      res.json({ success:true, data: result.rows });
    } else if (userId) {
      // Jobseeker view: own applications
      const result = await pool.query(
        `SELECT a.*, j.title, j.company, j.location, j.type
         FROM applications a
         LEFT JOIN jobs j ON j.id = a.job_id
         WHERE a.user_id = $1
         ORDER BY a.created_at DESC`, [userId]
      );
      res.json({ success:true, data: result.rows });
    } else {
      return res.status(400).json({ success:false, error:'userId or recruiterId required' });
    }
  } catch (err) {
    res.status(500).json({ success:false, error:'Error fetching applications', details: err.message });
  }
});


// Jobseeker Offers list
router.get('/offers', async (req, res) => {
  try {
    const { userId, recruiterId } = req.query;
    if (recruiterId) {
      // Recruiter view: offers made to jobseekers with candidate info
      const result = await pool.query(
        `SELECT o.*, j.title, j.company, j.location, j.type,
                p.name as candidate_name, p.email as candidate_email
         FROM offers o
         LEFT JOIN jobs j ON j.id = o.job_id
         LEFT JOIN user_profiles p ON p.user_id = o.user_id
         WHERE o.recruiter_id = $1
         ORDER BY o.created_at DESC`, [recruiterId]
      );
      res.json({ success:true, data: result.rows });
    } else if (userId) {
      // Jobseeker view: own offers
      const result = await pool.query(
        `SELECT o.*, j.title, j.company, j.location, j.type
         FROM offers o
         LEFT JOIN jobs j ON j.id = o.job_id
         WHERE o.user_id = $1
         ORDER BY o.created_at DESC`, [userId]
      );
      res.json({ success:true, data: result.rows });
    } else {
      return res.status(400).json({ success:false, error:'userId or recruiterId required' });
    }
  } catch (err) {
    res.status(500).json({ success:false, error:'Error fetching offers', details: err.message });
  }
});

// Jobseeker Interviews list (with recruiter view support)
router.get('/interviews', async (req, res) => {
  try {
    const { userId, recruiterId } = req.query;
    if (recruiterId) {
      // Recruiter view: interviews scheduled with candidate info
      const result = await pool.query(
        `SELECT i.*, j.title, j.company, j.location, j.type,
                p.name as candidate_name, p.email as candidate_email
         FROM interviews i
         LEFT JOIN jobs j ON j.id = i.job_id
         LEFT JOIN user_profiles p ON p.user_id = i.user_id
         WHERE i.recruiter_id = $1
         ORDER BY i.scheduled_at DESC`, [recruiterId]
      );
      res.json({ success:true, data: result.rows });
    } else if (userId) {
      // Jobseeker view: own interviews
      const result = await pool.query(
        `SELECT i.*, j.title, j.company, j.location, j.type
         FROM interviews i
         LEFT JOIN jobs j ON j.id = i.job_id
         WHERE i.user_id = $1
         ORDER BY i.scheduled_at DESC`, [userId]
      );
      res.json({ success:true, data: result.rows });
    } else {
      return res.status(400).json({ success:false, error:'userId or recruiterId required' });
    }
  } catch (err) {
    res.status(500).json({ success:false, error:'Error fetching interviews', details: err.message });
  }
});

// Update offer status (jobseeker accepts/rejects)
router.put('/offers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'declined'
    if (!status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success:false, error:'status must be "accepted" or "declined"' });
    }
    
    // First ensure status column exists
    try {
      await pool.query('ALTER TABLE offers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'pending\'');
    } catch (alterErr) {
      // Column might already exist, ignore
    }
    
    const result = await pool.query(
      'UPDATE offers SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success:false, error:'Offer not found' });
    }
    res.json({ success:true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error updating offer status', details: err.message });
  }
});

// Update interview status (jobseeker accepts/rejects)
router.put('/interviews/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'declined'
    if (!status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success:false, error:'status must be "accepted" or "declined"' });
    }
    
    // First ensure status column exists
    try {
      await pool.query('ALTER TABLE interviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'pending\'');
    } catch (alterErr) {
      // Column might already exist, ignore
    }
    
    const result = await pool.query(
      'UPDATE interviews SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success:false, error:'Interview not found' });
    }
    res.json({ success:true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error updating interview status', details: err.message });
  }
});

// Delete application
router.delete('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM applications WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success:false, error:'Application not found' });
    }
    res.json({ success:true, message:'Application deleted successfully' });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error deleting application', details: err.message });
  }
});

// Delete all applications for a user or recruiter
router.delete('/applications', async (req, res) => {
  try {
    const { userId, recruiterId } = req.query;
    if (!userId && !recruiterId) {
      return res.status(400).json({ success:false, error:'userId or recruiterId required' });
    }
    let result;
    if (recruiterId) {
      // Delete all applications for recruiter's jobs
      result = await pool.query(
        `DELETE FROM applications 
         WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = $1)`,
        [recruiterId]
      );
    } else {
      // Delete all applications for jobseeker
      result = await pool.query('DELETE FROM applications WHERE user_id = $1', [userId]);
    }
    res.json({ success:true, message:`Deleted ${result.rowCount} application(s)` });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error deleting applications', details: err.message });
  }
});

// Delete interview
router.delete('/interviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM interviews WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success:false, error:'Interview not found' });
    }
    res.json({ success:true, message:'Interview deleted successfully' });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error deleting interview', details: err.message });
  }
});

// Delete all interviews for a user or recruiter
router.delete('/interviews', async (req, res) => {
  try {
    const { userId, recruiterId } = req.query;
    if (!userId && !recruiterId) {
      return res.status(400).json({ success:false, error:'userId or recruiterId required' });
    }
    let result;
    if (recruiterId) {
      result = await pool.query('DELETE FROM interviews WHERE recruiter_id = $1', [recruiterId]);
    } else {
      result = await pool.query('DELETE FROM interviews WHERE user_id = $1', [userId]);
    }
    res.json({ success:true, message:`Deleted ${result.rowCount} interview(s)` });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error deleting interviews', details: err.message });
  }
});

// Delete offer
router.delete('/offers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM offers WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success:false, error:'Offer not found' });
    }
    res.json({ success:true, message:'Offer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error deleting offer', details: err.message });
  }
});

// Delete all offers for a user or recruiter
router.delete('/offers', async (req, res) => {
  try {
    const { userId, recruiterId } = req.query;
    if (!userId && !recruiterId) {
      return res.status(400).json({ success:false, error:'userId or recruiterId required' });
    }
    let result;
    if (recruiterId) {
      result = await pool.query('DELETE FROM offers WHERE recruiter_id = $1', [recruiterId]);
    } else {
      result = await pool.query('DELETE FROM offers WHERE user_id = $1', [userId]);
    }
    res.json({ success:true, message:`Deleted ${result.rowCount} offer(s)` });
  } catch (err) {
    res.status(500).json({ success:false, error:'Error deleting offers', details: err.message });
  }
});

module.exports = router;

