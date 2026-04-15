// backend/routes/profileRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const pool = require("../config/db");
const User = require("../models/User");

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/profile-pictures';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a temporary filename - we'll rename it after we get userId from body
    const ext = path.extname(file.originalname);
    const tempFilename = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, tempFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// 🔸 Save user profile (parsed CV data)
router.post("/save", async (req, res) => {
  try {
    const { 
      userId, 
      name, 
      email, 
      phone, 
      bio, 
      education, 
      experience, 
      skills,
      certificates,
      resumeFileName,
      parsedAt 
    } = req.body;

    // Create comprehensive table for CV data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT,
        bio TEXT,
        profile_picture TEXT,
        education JSONB,
        experience JSONB,
        skills JSONB,
        certificates JSONB,
        resume_file_name TEXT,
        parsed_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);
    
    // Add profile_picture column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS profile_picture TEXT
      `);
    } catch (err) {
      // Column might already exist, ignore error
    }

    // Upsert logic with proper JSON handling
    await pool.query(
      `
      INSERT INTO user_profiles (
        user_id, name, email, phone, bio, profile_picture,
        education, experience, skills, certificates,
        resume_file_name, parsed_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET 
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        bio = EXCLUDED.bio,
        profile_picture = COALESCE(EXCLUDED.profile_picture, user_profiles.profile_picture),
        education = EXCLUDED.education,
        experience = EXCLUDED.experience,
        skills = EXCLUDED.skills,
        certificates = EXCLUDED.certificates,
        resume_file_name = EXCLUDED.resume_file_name,
        parsed_at = EXCLUDED.parsed_at,
        updated_at = NOW()
      RETURNING *
      `,
      [
        userId, 
        name, 
        email, 
        phone, 
        bio,
        req.body.profilePicture || null, // Profile picture URL
        JSON.stringify(education || []), 
        JSON.stringify(experience || []), 
        JSON.stringify(skills || []),
        JSON.stringify(certificates || []),
        resumeFileName || null,
        parsedAt || new Date()
      ]
    );

    console.log(`✅ Profile saved for user: ${userId}`);
    res.json({ 
      success: true, 
      message: "Profile saved to PostgreSQL successfully",
      userId: userId 
    });
  } catch (err) {
    console.error("❌ Save Error:", err);
    res.status(500).json({ 
      success: false,
      error: "Error saving profile to database",
      details: err.message 
    });
  }
});

// 🔸 Fetch saved profile for user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1", 
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ 
        success: false, 
        message: "No profile found for this user",
        data: null 
      });
    }

    const profile = result.rows[0];
    
    // Parse JSONB fields back to objects (handle both string and object formats)
    const parsedProfile = {
      ...profile,
      education: profile.education ? 
        (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [],
      experience: profile.experience ? 
        (typeof profile.experience === 'string' ? JSON.parse(profile.experience) : profile.experience) : [],
      skills: profile.skills ? 
        (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [],
      certificates: profile.certificates ? 
        (typeof profile.certificates === 'string' ? JSON.parse(profile.certificates) : profile.certificates) : []
    };

    res.json({ 
      success: true, 
      message: "Profile fetched successfully",
      data: parsedProfile 
    });
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ 
      success: false,
      error: "Error fetching profile from database",
      details: err.message 
    });
  }
});

// 🔸 Get all profiles (for browsing)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM user_profiles ORDER BY created_at DESC"
    );
    
    // Parse JSONB fields for each profile
    const profiles = result.rows.map(profile => {
      try {
        const parsedProfile = {
          ...profile,
          education: profile.education ? 
            (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [],
          experience: profile.experience ? 
            (typeof profile.experience === 'string' ? JSON.parse(profile.experience) : profile.experience) : [],
          skills: profile.skills ? 
            (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [],
          certificates: profile.certificates ? 
            (typeof profile.certificates === 'string' ? JSON.parse(profile.certificates) : profile.certificates) : []
        };
        return parsedProfile;
      } catch (parseErr) {
        console.error('Error parsing profile:', parseErr);
        // Return profile with empty arrays if parsing fails
        return {
          ...profile,
          education: [],
          experience: [],
          skills: [],
          certificates: []
        };
      }
    });
    
    res.json({ 
      success: true, 
      message: "Profiles fetched successfully",
      data: profiles,
      count: profiles.length
    });
  } catch (err) {
    console.error("❌ Fetch All Error:", err);
    res.status(500).json({ 
      success: false,
      error: "Error fetching profiles from database",
      details: err.message 
    });
  }
});

// 🔸 Upload Profile Picture
router.post("/upload-picture", upload.single('profilePicture'), async (req, res) => {
  let uploadedFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "No file uploaded" 
      });
    }

    uploadedFilePath = req.file.path;
    const { userId } = req.body;
    
    if (!userId) {
      // Delete uploaded file if no userId
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Rename file with userId
    const ext = path.extname(req.file.filename);
    const newFilename = `${userId}_${Date.now()}${ext}`;
    const newFilePath = path.join(path.dirname(uploadedFilePath), newFilename);
    
    try {
      fs.renameSync(uploadedFilePath, newFilePath);
      uploadedFilePath = newFilePath; // Update to new path
    } catch (renameErr) {
      console.error("Error renaming file:", renameErr);
      // Continue with original filename if rename fails
    }

    const finalFilename = path.basename(uploadedFilePath);
    // Server serves from 'uploads' directory, so path should be relative to that
    const profilePictureUrl = `/profile-pictures/${finalFilename}`;

    // Update MongoDB User model
    try {
      await User.findByIdAndUpdate(userId, { profilePicture: profilePictureUrl });
    } catch (mongoErr) {
      console.error("Error updating MongoDB user:", mongoErr);
    }

    // Update PostgreSQL user_profiles
    try {
      await pool.query(`
        UPDATE user_profiles 
        SET profile_picture = $1, updated_at = NOW()
        WHERE user_id = $2
      `, [profilePictureUrl, userId]);

      // If profile doesn't exist, create it
      const checkResult = await pool.query(
        "SELECT user_id FROM user_profiles WHERE user_id = $1",
        [userId]
      );

      if (checkResult.rows.length === 0) {
        // Get user from MongoDB to get name and email
        const mongoUser = await User.findById(userId);
        if (mongoUser) {
          await pool.query(`
            INSERT INTO user_profiles (user_id, name, email, profile_picture)
            VALUES ($1, $2, $3, $4)
          `, [userId, mongoUser.name, mongoUser.email, profilePictureUrl]);
        }
      }
    } catch (pgErr) {
      console.error("Error updating PostgreSQL profile:", pgErr);
    }

    res.json({
      success: true,
      message: "Profile picture uploaded successfully",
      profilePicture: profilePictureUrl
    });
  } catch (err) {
    console.error("❌ Upload Profile Picture Error:", err);
    console.error("Error stack:", err.stack);
    // Delete uploaded file on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (unlinkErr) {
        console.error("Error deleting uploaded file:", unlinkErr);
      }
    }
    res.status(500).json({ 
      success: false,
      error: "Error uploading profile picture",
      details: err.message 
    });
  }
});

// 🔸 Delete Profile Picture
router.delete("/delete-picture", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }

    // Get current profile picture path
    const userResult = await pool.query(
      "SELECT profile_picture FROM user_profiles WHERE user_id = $1",
      [userId]
    );

    let profilePicturePath = null;
    if (userResult.rows.length > 0 && userResult.rows[0].profile_picture) {
      profilePicturePath = userResult.rows[0].profile_picture;
    }

    // Also check MongoDB
    try {
      const mongoUser = await User.findById(userId);
      if (mongoUser && mongoUser.profilePicture) {
        profilePicturePath = mongoUser.profilePicture;
      }
    } catch (mongoErr) {
      console.error("Error checking MongoDB user:", mongoErr);
    }

    // Delete file from filesystem if it exists
    if (profilePicturePath) {
      // Remove /profile-pictures/ prefix to get actual file path
      const filename = profilePicturePath.replace('/profile-pictures/', '');
      const filePath = path.join('uploads', 'profile-pictures', filename);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log("✅ Deleted profile picture file:", filePath);
        } catch (unlinkErr) {
          console.error("Error deleting file:", unlinkErr);
          // Continue even if file deletion fails
        }
      }
    }

    // Update MongoDB User model
    try {
      await User.findByIdAndUpdate(userId, { $unset: { profilePicture: "" } });
    } catch (mongoErr) {
      console.error("Error updating MongoDB user:", mongoErr);
    }

    // Update PostgreSQL user_profiles
    try {
      await pool.query(`
        UPDATE user_profiles 
        SET profile_picture = NULL, updated_at = NOW()
        WHERE user_id = $1
      `, [userId]);
    } catch (pgErr) {
      console.error("Error updating PostgreSQL profile:", pgErr);
    }

    res.json({
      success: true,
      message: "Profile picture deleted successfully"
    });
  } catch (err) {
    console.error("❌ Delete Profile Picture Error:", err);
    res.status(500).json({ 
      success: false,
      error: "Error deleting profile picture",
      details: err.message 
    });
  }
});

module.exports = router;
