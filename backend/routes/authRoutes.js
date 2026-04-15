const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const pool = require("../config/db");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🔑 Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Prevent admin role creation through signup
    if (role === 'admin') {
      return res.status(403).json({ message: "Admin accounts cannot be created through signup" });
    }

    // Validate role - only allow jobseeker or recruiter
    const allowedRoles = ['jobseeker', 'recruiter'];
    const userRole = allowedRoles.includes(role) ? role : 'jobseeker';

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if email already exists (case-insensitive)
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
    });
    if (existingUser) {
      return res.status(400).json({ 
        message: "This email is already registered. Please use a different email or sign in instead." 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if termsAccepted is provided (required)
    const { termsAccepted } = req.body;
    if (!termsAccepted) {
      return res.status(400).json({ message: "You must accept the Terms and Conditions to register" });
    }

    // Create user
    const newUser = new User({
      name,
      email: normalizedEmail, // Store normalized email
      password: hashedPassword,
      role: userRole,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      status: 'active'
    });
    
    try {
      await newUser.save();
    } catch (saveError) {
      // Handle MongoDB duplicate key error (in case of race condition)
      if (saveError.code === 11000 || saveError.name === 'MongoServerError') {
        return res.status(400).json({ 
          message: "This email is already registered. Please use a different email or sign in instead." 
        });
      }
      throw saveError; // Re-throw if it's a different error
    }

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

// 🔑 Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Normalize email for login (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Special admin login check
    if (normalizedEmail === 'admin@gmail.com' && password === '123456') {
      // Find or create admin user (case-insensitive search)
      let adminUser = await User.findOne({ 
        email: { $regex: new RegExp(`^admin@gmail\.com$`, 'i') } 
      });
      
      if (!adminUser) {
        // Create admin user if it doesn't exist
        const hashedPassword = await bcrypt.hash('123456', 10);
        adminUser = new User({
          name: 'Admin',
          email: 'admin@gmail.com', // Store normalized
          password: hashedPassword,
          role: 'admin'
        });
        try {
          await adminUser.save();
        } catch (saveError) {
          // Handle MongoDB duplicate key error (in case of race condition)
          if (saveError.code === 11000 || saveError.name === 'MongoServerError') {
            // User was created between our check and save - fetch it
            adminUser = await User.findOne({ 
              email: { $regex: new RegExp(`^admin@gmail\.com$`, 'i') } 
            });
            if (!adminUser) {
              return res.status(500).json({ message: "Failed to create admin user" });
            }
          } else {
            throw saveError; // Re-throw if it's a different error
          }
        }
      } else {
        // Update to admin role if not already
        if (adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          await adminUser.save();
        }
        // Verify password
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (!isMatch && !adminUser.password) {
          // If no password set, set it
          const hashedPassword = await bcrypt.hash('123456', 10);
          adminUser.password = hashedPassword;
          await adminUser.save();
        } else if (!isMatch) {
          return res.status(400).json({ message: "Invalid credentials" });
        }
      }

      const token = jwt.sign(
        { id: adminUser._id, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        user: { id: adminUser._id, _id: adminUser._id, name: adminUser.name, email: adminUser.email, role: 'admin', profilePicture: adminUser.profilePicture }
      });
    }

    // Regular user login (case-insensitive email match)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
      role 
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check user status - block suspended/terminated users
    if (user.status === 'suspended') {
      return res.status(403).json({ 
        message: "Your account has been suspended. Please contact support for assistance.",
        status: 'suspended',
        warnings: user.warnings || 0,
        reason: user.terminationReason || 'No reason provided'
      });
    }
    if (user.status === 'terminated') {
      return res.status(403).json({ 
        message: "Your account has been terminated. Please contact support for more information.",
        status: 'terminated',
        warnings: user.warnings || 0,
        reason: user.terminationReason || 'No reason provided'
      });
    }

    // Check if user signed up with Google OAuth (no password)
    if (user.googleId && !user.password) {
      return res.status(400).json({ 
        message: "This account was created with Google. Please sign in with Google instead." 
      });
    }

    // Check if user has a password
    if (!user.password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { 
        id: user._id, 
        _id: user._id,
        name: user.name, 
        email: user.email, 
        role: user.role, 
        profilePicture: user.profilePicture,
        isPaid: user.isPaid || false,
        subscriptionPlan: user.subscriptionPlan || null
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// 🔑 Google OAuth Sign-in/Signup
router.post("/google", async (req, res) => {
  try {
    const { credential, role } = req.body; // credential is the Google ID token

    if (!credential) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: googlePicture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Email not provided by Google" });
    }

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists (case-insensitive)
    let user = await User.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
    });

    if (user) {
      // User exists - check if they have Google ID or need to link it
      if (!user.googleId) {
        user.googleId = googleId;
      }
      
      // Update profile picture from Google if available
      if (googlePicture && !user.profilePicture) {
        user.profilePicture = googlePicture;
      }
      
      await user.save();

      // Ensure profile exists in PostgreSQL (for posts to show name and picture)
      try {
        // Ensure user_profiles table exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS user_profiles (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL UNIQUE,
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
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        
        // Add profile_picture column if it doesn't exist
        try {
          await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS profile_picture TEXT
          `);
        } catch (err) {
          // Column might already exist
        }

        const profileCheck = await pool.query(
          "SELECT user_id FROM user_profiles WHERE user_id = $1",
          [user._id.toString()]
        );
        
        if (profileCheck.rows.length === 0) {
          // Create basic profile entry with Google picture
          await pool.query(
            `INSERT INTO user_profiles (user_id, name, email, profile_picture)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, profile_picture = COALESCE(EXCLUDED.profile_picture, user_profiles.profile_picture)`,
            [user._id.toString(), user.name || name || "User", email, googlePicture || null]
          );
        } else {
          // Update name, email, and profile picture
          await pool.query(
            `UPDATE user_profiles SET name = $1, email = $2, profile_picture = COALESCE($3, profile_picture) WHERE user_id = $4`,
            [user.name || name || "User", email, googlePicture || null, user._id.toString()]
          );
        }
      } catch (profileErr) {
        console.error("Error creating/updating profile for existing user:", profileErr);
        // Continue even if profile creation fails
      }

      // Login existing user
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

          return res.json({
            token,
            user: { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture }
          });
    } else {
      // New user - create account
      // Prevent admin role creation through Google OAuth
      const allowedRoles = ['jobseeker', 'recruiter'];
      const userRole = allowedRoles.includes(role) ? role : 'jobseeker';
      
      const newUser = new User({
        name: name || "User",
        email: normalizedEmail, // Store normalized email
        googleId,
        profilePicture: googlePicture || null, // Save Google profile picture
        role: userRole,
        termsAccepted: true, // Google OAuth users accept terms through Google's consent
        termsAcceptedAt: new Date(),
        status: 'active',
        // password is not required for OAuth users
      });

      try {
        await newUser.save();
      } catch (saveError) {
        // Handle MongoDB duplicate key error (in case of race condition)
        if (saveError.code === 11000 || saveError.name === 'MongoServerError') {
          // User was created between our check and save - fetch and login
          const existingUser = await User.findOne({ 
            email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
          });
          if (existingUser) {
            // Link Google ID if not already linked
            if (!existingUser.googleId) {
              existingUser.googleId = googleId;
              if (googlePicture && !existingUser.profilePicture) {
                existingUser.profilePicture = googlePicture;
              }
              await existingUser.save();
            }
            
            const token = jwt.sign(
              { id: existingUser._id, role: existingUser.role },
              process.env.JWT_SECRET,
              { expiresIn: "7d" }
            );
            
            return res.json({
              token,
              user: {
                id: existingUser._id,
                _id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
                profilePicture: existingUser.profilePicture
              }
            });
          }
        }
        throw saveError; // Re-throw if it's a different error
      }

      // Create basic profile entry in PostgreSQL (for posts to show name and picture)
      try {
        // Ensure user_profiles table exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS user_profiles (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL UNIQUE,
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
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        
        // Add profile_picture column if it doesn't exist
        try {
          await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS profile_picture TEXT
          `);
        } catch (err) {
          // Column might already exist
        }

        await pool.query(
          `INSERT INTO user_profiles (user_id, name, email, profile_picture)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, profile_picture = COALESCE(EXCLUDED.profile_picture, user_profiles.profile_picture)`,
          [newUser._id.toString(), newUser.name || name || "User", email, googlePicture || null]
        );
      } catch (profileErr) {
        console.error("Error creating profile for new Google user:", profileErr);
        // Continue even if profile creation fails
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

          return res.json({
            token,
            user: { id: newUser._id, _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, profilePicture: newUser.profilePicture }
          });
    }
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(500).json({ message: "Google authentication failed", error: err.message });
  }
});

module.exports = router;
