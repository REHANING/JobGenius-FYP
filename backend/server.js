// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const parserRoutes = require("./routes/parserRoutes");
const profileRoutes = require("./routes/profileRoutes");
const jobsRoutes = require("./routes/jobsRoutes");
const scoresRoutes = require("./routes/scoresRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const coverLetterRoutes = require("./routes/coverLetterRoutes");
const postsRoutes = require("./routes/postsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const pool = require("./config/db"); // ✅ PostgreSQL connection
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('uploads')); // Serve uploaded files

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/parser", parserRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/scores", scoresRoutes);
app.use("/api/cover-letter", coverLetterRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscription", subscriptionRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Run recruiter SQL bootstrap once on server start
(async () => {
  try {
    const sqlPath = __dirname + "/createRecruiterTables.sql";
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, "utf-8");
      await pool.query(sql);
      console.log("✅ Recruiter tables ensured.");
    } else {
      console.log("ℹ️ Recruiter SQL not found, skipping bootstrap.");
    }
  } catch (e) {
    console.warn("⚠️ Recruiter SQL bootstrap failed:", e.message);
  }
})();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
