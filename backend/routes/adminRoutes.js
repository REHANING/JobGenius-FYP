// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// Helper function to create notification
const createNotification = async (userId, type, title, message, link = null) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, link]
    );
  } catch (err) {
    console.error("Error creating notification:", err);
    // Don't throw error, just log it - notification creation shouldn't break the main action
  }
};

// Get all users (from MongoDB)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching users",
      details: err.message
    });
  }
});

// Get all jobs
router.get("/jobs", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM jobs ORDER BY created_at DESC"
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching jobs",
      details: err.message
    });
  }
});

// Get all applications
router.get("/applications", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, j.title as job_title, j.company as job_company, j.recruiter_id
       FROM applications a
       LEFT JOIN jobs j ON j.id = a.job_id
       ORDER BY a.created_at DESC`
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching applications",
      details: err.message
    });
  }
});

// Get dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    // Total users by role (MongoDB)
    const totalUsers = await User.countDocuments();
    const jobseekersCount = await User.countDocuments({ role: 'jobseeker' });
    const recruitersCount = await User.countDocuments({ role: 'recruiter' });
    const adminsCount = await User.countDocuments({ role: 'admin' });

    // Total jobs (PostgreSQL)
    const jobsResult = await pool.query("SELECT COUNT(*) as count FROM jobs");
    const totalJobs = parseInt(jobsResult.rows[0].count);

    // Active jobs
    const activeJobsResult = await pool.query("SELECT COUNT(*) as count FROM jobs WHERE status = 'active'");
    const activeJobs = parseInt(activeJobsResult.rows[0].count);

    // Total applications (PostgreSQL)
    const applicationsResult = await pool.query("SELECT COUNT(*) as count FROM applications");
    const totalApplications = parseInt(applicationsResult.rows[0].count);

    // Applications by status
    const appsByStatusResult = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM applications 
       GROUP BY status`
    );
    const appsByStatus = appsByStatusResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    // Total profiles (PostgreSQL)
    const profilesResult = await pool.query("SELECT COUNT(*) as count FROM user_profiles");
    const totalProfiles = parseInt(profilesResult.rows[0].count);

    // Total interviews
    const interviewsResult = await pool.query("SELECT COUNT(*) as count FROM interviews");
    const totalInterviews = parseInt(interviewsResult.rows[0].count);

    // Total offers
    const offersResult = await pool.query("SELECT COUNT(*) as count FROM offers");
    const totalOffers = parseInt(offersResult.rows[0].count);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          jobseekers: jobseekersCount,
          recruiters: recruitersCount,
          admins: adminsCount
        },
        jobs: {
          total: totalJobs,
          active: activeJobs,
          closed: totalJobs - activeJobs
        },
        applications: {
          total: totalApplications,
          byStatus: appsByStatus
        },
        profiles: totalProfiles,
        interviews: totalInterviews,
        offers: totalOffers
      }
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching statistics",
      details: err.message
    });
  }
});

// Admin middleware - check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const jwt = require('jsonwebtoken');
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.admin = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Warn a user
router.post("/users/:userId/warn", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.warnings = (user.warnings || 0) + 1;
    await user.save();
    
    // Create notification for the user
    await createNotification(
      userId,
      'account_warning',
      'Account Warning',
      `Your account has received a warning. Total warnings: ${user.warnings}.${reason ? ' Reason: ' + reason : ''}`,
      '/profile'
    );
    
    res.json({
      success: true,
      message: "Warning issued successfully",
      data: { warnings: user.warnings }
    });
  } catch (err) {
    console.error("Error warning user:", err);
    res.status(500).json({ success: false, error: "Error warning user", details: err.message });
  }
});

// Suspend a user
router.post("/users/:userId/suspend", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: "Cannot suspend admin accounts" });
    }
    user.status = 'suspended';
    user.terminationReason = reason || 'No reason provided';
    await user.save();
    
    // Create notification for the user
    await createNotification(
      userId,
      'account_suspended',
      'Account Suspended',
      `Your account has been suspended.${reason ? ' Reason: ' + reason : ''} Please contact support for assistance.`,
      '/login'
    );
    
    res.json({
      success: true,
      message: "User suspended successfully",
      data: user
    });
  } catch (err) {
    console.error("Error suspending user:", err);
    res.status(500).json({ success: false, error: "Error suspending user", details: err.message });
  }
});

// Terminate a user
router.post("/users/:userId/terminate", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: "Cannot terminate admin accounts" });
    }
    user.status = 'terminated';
    user.terminationReason = reason || 'No reason provided';
    await user.save();
    
    // Create notification for the user
    await createNotification(
      userId,
      'account_terminated',
      'Account Terminated',
      `Your account has been terminated.${reason ? ' Reason: ' + reason : ''} Please contact support for more information.`,
      '/login'
    );
    
    res.json({
      success: true,
      message: "User terminated successfully",
      data: user
    });
  } catch (err) {
    console.error("Error terminating user:", err);
    res.status(500).json({ success: false, error: "Error terminating user", details: err.message });
  }
});

// Reactivate a user
router.post("/users/:userId/reactivate", adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.status = 'active';
    await user.save();
    res.json({
      success: true,
      message: "User reactivated successfully",
      data: user
    });
  } catch (err) {
    console.error("Error reactivating user:", err);
    res.status(500).json({ success: false, error: "Error reactivating user", details: err.message });
  }
});

// Delete a job
router.delete("/jobs/:jobId", adminMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await pool.query("DELETE FROM jobs WHERE id = $1 RETURNING *", [jobId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.json({
      success: true,
      message: "Job deleted successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error deleting job:", err);
    res.status(500).json({ success: false, error: "Error deleting job", details: err.message });
  }
});

module.exports = router;

