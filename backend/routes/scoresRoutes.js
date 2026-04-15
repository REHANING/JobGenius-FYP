// backend/routes/scoresRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const OpenAI = require("openai");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Log API key status (for debugging, remove in production)
console.log("🔑 OpenAI API Key loaded:", process.env.OPENAI_API_KEY ? "✅ Present" : "❌ Missing");

// 🔸 Analyze resume and generate scores using AI (MUST come before /:userId route)
router.post("/:userId/analyze", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔍 Starting AI analysis for user: ${userId}`);
    
    // Step 0: Check subscription and analysis limits
    const User = require("../models/User");
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    // Check if user is paid
    if (!user.isPaid) {
      return res.status(403).json({
        success: false,
        error: "Subscription required. Please subscribe to access AI analysis features.",
        requiresSubscription: true
      });
    }
    
    // Check analysis limits based on plan
    const getAnalysisLimit = (plan) => {
      switch (plan) {
        case 'basic':
          return 1;
        case 'standard':
          return 5;
        case 'premium':
        case 'enterprise':
          return Infinity; // Unlimited
        default:
          return 0;
      }
    };
    
    const analysisLimit = getAnalysisLimit(user.subscriptionPlan);
    const currentCount = user.analysisCount || 0;
    
    if (analysisLimit !== Infinity && currentCount >= analysisLimit) {
      return res.status(403).json({
        success: false,
        error: `Analysis limit reached. Your ${user.subscriptionPlan} plan allows ${analysisLimit} CV analysis${analysisLimit > 1 ? 'es' : ''}. Please upgrade your plan for more analyses.`,
        analysisLimit: analysisLimit,
        currentCount: currentCount,
        requiresUpgrade: true
      });
    }
    
    // Step 1: Fetch user profile from PostgreSQL
    const profileResult = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Profile not found. Please upload a resume first."
      });
    }
    
    const profile = profileResult.rows[0];
    
    // Parse JSONB fields
    let education = [];
    let experience = [];
    let skills = [];
    let certificates = [];
    
    try {
      education = profile.education ? 
        (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [];
      experience = profile.experience ? 
        (typeof profile.experience === 'string' ? JSON.parse(profile.experience) : profile.experience) : [];
      skills = profile.skills ? 
        (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [];
      certificates = profile.certificates ? 
        (typeof profile.certificates === 'string' ? JSON.parse(profile.certificates) : profile.certificates) : [];
    } catch (err) {
      console.error("❌ Error parsing profile JSONB fields:", err);
      return res.status(500).json({
        success: false,
        error: "Error parsing profile data"
      });
    }
    
    // Step 2: Prepare resume data for AI analysis
    const resumeData = {
      name: profile.name || "",
      bio: profile.bio || "",
      education: education,
      experience: experience,
      skills: skills,
      certificates: certificates
    };
    
    console.log("📋 Resume data prepared for analysis:", {
      name: resumeData.name,
      educationCount: resumeData.education.length,
      experienceCount: resumeData.experience.length,
      skillsCount: resumeData.skills.length,
      certificatesCount: resumeData.certificates.length
    });
    
    // Step 3: Create AI prompt for analysis
    const analysisPrompt = `
You are an expert career analyst evaluating a candidate's resume to determine their professional readiness and market value.

CRITICAL: You MUST score based on the ACTUAL DATA provided. If a section is empty or missing, the score for that section MUST be low (0-20).

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

PROFILE SUMMARY:
- Education entries: ${education.length}
- Experience entries: ${experience.length}
- Skills listed: ${skills.length}
- Certificates: ${certificates.length}

Provide your analysis as a JSON object with the following structure:
{
  "ilo_level": <number 1-4>,
  "ilo_label": "<string describing ILO level>",
  "overall_score": <number 0-100>,
  "education_score": <number 0-100>,
  "skill_readiness_score": <number 0-100>,
  "future_readiness_score": <number 0-100>,
  "geographic_score": <number 0-100>,
  "geographical_value": "<string describing where skills are in demand>",
  "top_countries": ["<country1>", "<country2>", "<country3>", "<country4>", "<country5>"],
  "analysis_summary": "<string with actionable insights>"
}

ILO Level Guidelines (MUST match actual data):
- Level 1: Illiterate/unskilled - No formal education, no skills, no experience (0-10 scores)
- Level 2: Diploma/vocational - Technical certifications, vocational training, associate degrees
- Level 3: Degree-level/professional - Bachelor's degree or equivalent, professional qualifications
- Level 4: Executive/leadership - Advanced degrees (Master's, PhD), senior leadership roles, specialized expertise

MANDATORY SCORING RULES:
1. Education Score (0-100):
   - If education array is EMPTY or length is 0: Score MUST be 0-15
   - If has education entries: Score based on degree level (20-40 for diploma, 40-70 for bachelor's, 70-90 for master's/PhD)
   - NEVER give high education scores (above 20) if no education data exists

2. Skill Readiness Score (0-100):
   - If skills array is EMPTY or length is 0: Score MUST be 0-15
   - If has skills: Score based on number, relevance, and market demand (20-60 for basic, 60-85 for advanced, 85-100 for expert-level)
   - NEVER give high skills scores (above 20) if no skills listed

3. Future Readiness Score (0-100):
   - Based on skills that are future-proof (AI, cloud, data science, etc.)
   - If no skills listed: Score MUST be 0-20
   - Consider industry trends and technological relevance

4. Geographic Score (0-100):
   - Based on global marketability of skills and education
   - If profile is incomplete: Score 0-30 (low marketability)
   - Higher scores only if skills/education are globally relevant

5. Overall Score (0-100):
   - MUST be a weighted average that reflects all scores above
   - If education=0, skills=0, then overall MUST be low (0-25)
   - Formula: (education*0.25 + skills*0.30 + future_readiness*0.25 + geographic*0.20)
   - Adjust based on completeness of profile

6. ILO Level:
   - If education.length === 0 AND skills.length === 0 AND experience.length === 0: MUST be Level 1
   - If only basic/vocational training: Level 2
   - If bachelor's degree or professional: Level 3
   - If advanced degree or executive: Level 4

Geographical Value:
- If profile is incomplete: Mention "Limited global opportunities until profile is completed"
- Otherwise, assess regions/countries based on skills and education
- Provide top 5 countries as an array

Analysis Summary:
- MUST reflect the actual scores given
- If scores are low, explain why (missing education, skills, etc.)
- Provide specific, actionable recommendations
- Be honest about profile completeness

EXAMPLE FOR INCOMPLETE PROFILE:
If education=[], skills=[], experience=[]:
- education_score: 5-15
- skill_readiness_score: 5-15
- overall_score: 5-25
- ilo_level: 1
- analysis_summary: "Profile is incomplete. Add education, skills, and experience to improve scores."

Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.
`;
    
    // Step 4: Call OpenAI API with retry logic
    console.log("🤖 Calling OpenAI for analysis...");
    
    let aiResponse;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: analysisPrompt }],
          temperature: 0.3,
        });
        
        // Success - break out of retry loop
        break;
        
      } catch (openaiError) {
        lastError = openaiError;
        retries--;
        
        // Check if it's a network/DNS error
        const isNetworkError = openaiError.message?.includes("getaddrinfo") || 
                               openaiError.message?.includes("EAI_AGAIN") ||
                               openaiError.message?.includes("fetch failed") ||
                               openaiError.code === "ECONNREFUSED" ||
                               openaiError.code === "ETIMEDOUT";
        
        if (isNetworkError && retries > 0) {
          console.log(`⚠️ Network error detected. Retrying... (${retries} attempts remaining)`);
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        // If not a network error, or no more retries, throw it
        console.error("❌ OpenAI API Error:", {
          message: openaiError.message,
          status: openaiError.status,
          code: openaiError.code,
          type: openaiError.type
        });
        
        // Return user-friendly error
        if (openaiError.message?.includes("getaddrinfo") || openaiError.message?.includes("EAI_AGAIN")) {
          return res.status(503).json({
            success: false,
            error: "Network connection error. Cannot reach OpenAI API servers.",
            details: "Please check your internet connection and try again. This might be a temporary network or DNS issue.",
            suggestion: "Wait a few moments and click 'Re-analyze Resume' button."
          });
        }
        
        if (openaiError.status === 401) {
          return res.status(401).json({
            success: false,
            error: "Invalid OpenAI API key.",
            details: "Please check your OPENAI_API_KEY in backend/.env file and ensure it's correct."
          });
        }
        
        // Re-throw other errors
        throw openaiError;
      }
    }
    
    // If we exhausted retries and still failed
    if (!aiResponse && lastError) {
      return res.status(503).json({
        success: false,
        error: "Failed to connect to OpenAI API after multiple attempts.",
        details: lastError.message,
        suggestion: "Please check your internet connection and try again later."
      });
    }
    
    let analysisRaw = aiResponse.choices[0].message.content || "";
    // Clean response (remove markdown code blocks if present)
    analysisRaw = analysisRaw.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let analysis;
    try {
      analysis = JSON.parse(analysisRaw);
      console.log("✅ AI Analysis received:", analysis);
    } catch (err) {
      console.error("❌ JSON parse failed, raw response:", analysisRaw);
      return res.status(500).json({
        success: false,
        error: "Invalid response format from AI",
        details: err.message
      });
    }
    
    // Step 5: Validate and ensure all required fields exist with data-based overrides
    // Critical validation: Scores MUST match actual profile data
    const hasEducation = education && education.length > 0;
    const hasSkills = skills && skills.length > 0;
    const hasExperience = experience && experience.length > 0;
    const hasCertificates = certificates && certificates.length > 0;
    
    // Force correct scores based on actual data
    let validatedEducationScore = Math.min(100, Math.max(0, analysis.education_score || 0));
    let validatedSkillsScore = Math.min(100, Math.max(0, analysis.skill_readiness_score || analysis.skills_readiness_score || 0));
    
    // Override if AI gave wrong scores for missing data
    if (!hasEducation && validatedEducationScore > 20) {
      console.log(`⚠️ Override: No education but score was ${validatedEducationScore}. Setting to 10.`);
      validatedEducationScore = 10;
    }
    
    if (!hasSkills && validatedSkillsScore > 20) {
      console.log(`⚠️ Override: No skills but score was ${validatedSkillsScore}. Setting to 10.`);
      validatedSkillsScore = 10;
    }
    
    // Future readiness should be low if no skills
    let validatedFutureReadiness = Math.min(100, Math.max(0, analysis.future_readiness_score || 0));
    if (!hasSkills && validatedFutureReadiness > 25) {
      console.log(`⚠️ Override: No skills but future_readiness was ${validatedFutureReadiness}. Setting to 15.`);
      validatedFutureReadiness = 15;
    }
    
    // Geographic score should be low if profile is incomplete
    let validatedGeographicScore = Math.min(100, Math.max(0, analysis.geographic_score || 0));
    if (!hasEducation && !hasSkills && !hasExperience && validatedGeographicScore > 30) {
      console.log(`⚠️ Override: Incomplete profile but geographic_score was ${validatedGeographicScore}. Setting to 15.`);
      validatedGeographicScore = 15;
    }
    
    // Determine ILO level based on actual data
    let validatedIloLevel = analysis.ilo_level || 1;
    if (!hasEducation && !hasSkills && !hasExperience) {
      validatedIloLevel = 1;
    } else if (!hasEducation && (hasSkills || hasExperience || hasCertificates)) {
      validatedIloLevel = Math.min(validatedIloLevel || 1, 2);
    }
    
    // Recalculate overall score based on validated individual scores
    const calculatedOverall = Math.round(
      validatedEducationScore * 0.25 +
      validatedSkillsScore * 0.30 +
      validatedFutureReadiness * 0.25 +
      validatedGeographicScore * 0.20
    );
    
    const validatedOverallScore = Math.min(100, Math.max(0, calculatedOverall));
    
    const validatedAnalysis = {
      ilo_level: Math.min(4, Math.max(1, validatedIloLevel)),
      ilo_label: analysis.ilo_label || (validatedIloLevel === 1 ? "Illiterate/unskilled" : "Professional"),
      overall_score: validatedOverallScore,
      education_score: validatedEducationScore,
      skills_readiness_score: validatedSkillsScore,
      future_readiness_score: validatedFutureReadiness,
      geographic_score: validatedGeographicScore,
      geographical_value: hasEducation || hasSkills 
        ? (analysis.geographical_value || "Moderate global demand")
        : "Limited global opportunities until profile is completed with education and skills",
      top_countries: hasEducation || hasSkills
        ? (Array.isArray(analysis.top_countries) && analysis.top_countries.length > 0
            ? analysis.top_countries.slice(0, 5)
            : ["United States", "Canada", "Germany", "Australia", "United Kingdom"])
        : ["Complete your profile", "Add education", "Add skills", "to see", "opportunities"],
      analysis_summary: analysis.analysis_summary || (
        !hasEducation && !hasSkills 
          ? "Your profile is incomplete. Add education, skills, and experience to improve your scores and marketability."
          : "Your profile shows potential. Continue building relevant skills to improve your scores."
      )
    };
    
    console.log("📊 Validated scores based on actual data:", {
      hasEducation,
      hasSkills,
      hasExperience,
      education_score: validatedEducationScore,
      skills_score: validatedSkillsScore,
      overall_score: validatedOverallScore,
      ilo_level: validatedIloLevel
    });
    
    // Step 6: Create or update user_scores table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_scores (
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
        top_countries TEXT,
        geographical_value TEXT,
        analysis_summary TEXT,
        ilo_level INTEGER DEFAULT 2,
        ilo_label TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Step 7: Upsert scores
    const upsertResult = await pool.query(
      `INSERT INTO user_scores (
        user_id, overall_score, education_score, future_readiness_score,
        skills_readiness_score, geographic_score, top_countries,
        geographical_value, analysis_summary, ilo_level, ilo_label,
        profile_views, applications_count, interviews_count, offers_count,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        overall_score = EXCLUDED.overall_score,
        education_score = EXCLUDED.education_score,
        future_readiness_score = EXCLUDED.future_readiness_score,
        skills_readiness_score = EXCLUDED.skills_readiness_score,
        geographic_score = EXCLUDED.geographic_score,
        top_countries = EXCLUDED.top_countries,
        geographical_value = EXCLUDED.geographical_value,
        analysis_summary = EXCLUDED.analysis_summary,
        ilo_level = EXCLUDED.ilo_level,
        ilo_label = EXCLUDED.ilo_label,
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        validatedAnalysis.overall_score,
        validatedAnalysis.education_score,
        validatedAnalysis.future_readiness_score,
        validatedAnalysis.skills_readiness_score,
        validatedAnalysis.geographic_score,
        JSON.stringify(validatedAnalysis.top_countries),
        validatedAnalysis.geographical_value,
        validatedAnalysis.analysis_summary,
        validatedAnalysis.ilo_level,
        validatedAnalysis.ilo_label,
        0, 0, 0, 0
      ]
    );
    
    const savedScores = upsertResult.rows[0];
    
    // Parse top_countries for response
    let topCountries = [];
    try {
      if (savedScores.top_countries) {
        topCountries = typeof savedScores.top_countries === 'string'
          ? JSON.parse(savedScores.top_countries)
          : savedScores.top_countries;
      }
    } catch (err) {
      topCountries = validatedAnalysis.top_countries;
    }
    
    console.log("✅ Scores saved successfully for user:", userId);
    
    // Increment analysis count after successful analysis
    if (user) {
      user.analysisCount = (user.analysisCount || 0) + 1;
      await user.save();
      console.log(`📊 Analysis count updated: ${user.analysisCount} for user ${userId}`);
    }
    
    res.json({
      success: true,
      message: "Resume analyzed and scores generated successfully",
      data: {
        ...savedScores,
        top_countries: topCountries
      },
      analysisCount: user ? user.analysisCount : 0
    });
    
  } catch (err) {
    console.error("❌ Analysis Error:", err);
    res.status(500).json({
      success: false,
      error: "Error analyzing resume",
      details: err.message
    });
  }
});

// 🔸 Increment specific counters (MUST come before /:userId route)
router.post("/:userId/increment", async (req, res) => {
  try {
    const { userId } = req.params;
    const { field } = req.body; // 'profile_views', 'applications_count', 'interviews_count', 'offers_count'

    const validFields = ['profile_views', 'applications_count', 'interviews_count', 'offers_count'];
    
    if (!validFields.includes(field)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid field. Must be one of: " + validFields.join(', ') 
      });
    }

    const result = await pool.query(
      `UPDATE user_scores SET 
        ${field} = ${field} + 1,
        updated_at = NOW()
      WHERE user_id = $1 
      RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "User scores not found" 
      });
    }

    const scores = result.rows[0];
    
    // Safely parse top_countries JSON after increment
    let topCountries = [];
    try {
      if (scores.top_countries) {
        topCountries = typeof scores.top_countries === 'string' 
          ? JSON.parse(scores.top_countries) 
          : scores.top_countries;
      }
    } catch (err) {
      console.warn('⚠️ Error parsing top_countries JSON after increment, using default:', err.message);
      topCountries = ["United States", "Canada", "Germany", "Australia", "United Kingdom"];
    }
    
    res.json({ 
      success: true, 
      message: `${field} incremented successfully`,
      data: {
        ...scores,
        top_countries: topCountries
      }
    });
  } catch (err) {
    console.error("❌ Increment Scores Error:", err);
    res.status(500).json({ 
      success: false,
      error: "Error incrementing scores in database",
      details: err.message 
    });
  }
});

// 🔸 Get Education Recommendations (MUST come before /:userId route)
router.get("/:userId/education-recommendations", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🎓 Fetching education recommendations for user: ${userId}`);
    
    // Step 1: Fetch user profile from PostgreSQL
    const profileResult = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Profile not found. Please upload a resume first."
      });
    }
    
    const profile = profileResult.rows[0];
    
    // Parse JSONB fields
    let education = [];
    let experience = [];
    let skills = [];
    
    try {
      education = profile.education ? 
        (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [];
      experience = profile.experience ? 
        (typeof profile.experience === 'string' ? JSON.parse(profile.experience) : profile.experience) : [];
      skills = profile.skills ? 
        (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [];
    } catch (err) {
      console.error("❌ Error parsing profile JSONB fields:", err);
      return res.status(500).json({
        success: false,
        error: "Error parsing profile data"
      });
    }
    
    // Step 2: Prepare education data for AI analysis
    const educationData = {
      name: profile.name || "",
      currentEducation: education,
      experience: experience,
      skills: skills,
      bio: profile.bio || ""
    };
    
    console.log("📚 Current Education Data:", JSON.stringify(educationData, null, 2));
    
    // Step 3: Create AI prompt for education recommendations
    const educationPrompt = `
You are an expert career consultant and education advisor. Analyze the user's current education background and provide personalized recommendations for their next degree or educational pursuit.

USER'S CURRENT PROFILE:
- Name: ${educationData.name}
- Current Education: ${JSON.stringify(educationData.currentEducation, null, 2)}
- Work Experience: ${JSON.stringify(educationData.experience, null, 2)}
- Skills: ${JSON.stringify(educationData.skills, null, 2)}
- Bio: ${educationData.bio}

Based on this information, provide comprehensive education recommendations as a consultant would. Consider:
1. What degree level should they pursue next (Bachelor's, Master's, PhD, Certificate, etc.)
2. Which specific field/domain would be most beneficial
3. Top universities/institutions worldwide (3-5 recommendations) with reasons
4. Top countries/regions for this education (3-5 recommendations) with reasons
5. How this education aligns with their career goals

Provide your recommendations as a JSON object with the following structure:
{
  "recommendedDegree": {
    "level": "<degree level: Bachelor's, Master's, PhD, Certificate, etc.>",
    "field": "<specific field/domain>",
    "reason": "<why this degree is recommended>"
  },
  "topUniversities": [
    {
      "name": "<university name>",
      "country": "<country>",
      "rank": "<ranking if known>",
      "reason": "<why this university is recommended>",
      "program": "<specific program name if applicable>"
    }
  ],
  "topCountries": [
    {
      "country": "<country name>",
      "reason": "<why this country is good for this education>",
      "advantages": ["<advantage1>", "<advantage2>", "<advantage3>"]
    }
  ],
  "careerAlignment": "<how this education aligns with their career goals>",
  "nextSteps": ["<step1>", "<step2>", "<step3>"]
}

Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.
`;
    
    // Step 4: Call OpenAI API
    console.log("🤖 Calling OpenAI for education recommendations...");
    
    let aiResponse;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: educationPrompt }],
          temperature: 0.7,
        });
        
        break;
      } catch (openaiError) {
        lastError = openaiError;
        retries--;
        
        const isNetworkError = openaiError.message?.includes("getaddrinfo") || 
                               openaiError.message?.includes("EAI_AGAIN") ||
                               openaiError.message?.includes("fetch failed") ||
                               openaiError.code === "ECONNREFUSED" ||
                               openaiError.code === "ETIMEDOUT";
        
        if (isNetworkError && retries > 0) {
          console.log(`⚠️ Network error detected. Retrying... (${retries} attempts remaining)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        console.error("❌ OpenAI API Error:", {
          message: openaiError.message,
          status: openaiError.status,
          code: openaiError.code,
        });
        
        if (openaiError.status === 401) {
          return res.status(401).json({
            success: false,
            error: "Invalid OpenAI API key.",
            details: "Please check your OPENAI_API_KEY in backend/.env file."
          });
        }
        
        throw openaiError;
      }
    }
    
    if (!aiResponse && lastError) {
      return res.status(503).json({
        success: false,
        error: "Failed to connect to OpenAI API after multiple attempts.",
        details: lastError.message
      });
    }
    
    // Step 5: Parse AI response
    let rawResponse = aiResponse.choices[0].message.content || "";
    rawResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let recommendations;
    try {
      recommendations = JSON.parse(rawResponse);
      console.log("✅ Education recommendations generated:", recommendations);
    } catch (parseError) {
      console.error("❌ Error parsing AI response:", parseError);
      console.error("Raw response:", rawResponse);
      return res.status(500).json({
        success: false,
        error: "Error parsing AI response",
        details: parseError.message
      });
    }
    
    res.json({
      success: true,
      message: "Education recommendations generated successfully",
      data: recommendations
    });
    
  } catch (err) {
    console.error("❌ Education Recommendations Error:", err);
    res.status(500).json({
      success: false,
      error: "Error generating education recommendations",
      details: err.message
    });
  }
});

// 🔸 Get Future Readiness Recommendations (MUST come before /:userId route)
router.get("/:userId/future-readiness-recommendations", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🚀 Fetching future readiness recommendations for user: ${userId}`);
    
    // Step 1: Fetch user profile from PostgreSQL
    const profileResult = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Profile not found. Please upload a resume first."
      });
    }
    
    const profile = profileResult.rows[0];
    
    // Parse JSONB fields
    let education = [];
    let experience = [];
    let skills = [];
    
    try {
      education = profile.education ? 
        (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [];
      experience = profile.experience ? 
        (typeof profile.experience === 'string' ? JSON.parse(profile.experience) : profile.experience) : [];
      skills = profile.skills ? 
        (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [];
    } catch (err) {
      console.error("❌ Error parsing profile JSONB fields:", err);
      return res.status(500).json({
        success: false,
        error: "Error parsing profile data"
      });
    }
    
    // Step 2: Prepare profile data for AI analysis
    const profileData = {
      name: profile.name || "",
      education: education,
      experience: experience,
      skills: skills,
      bio: profile.bio || ""
    };
    
    console.log("📊 Profile Data for Future Readiness:", JSON.stringify(profileData, null, 2));
    
    // Step 3: Create AI prompt for future readiness recommendations
    const futureReadinessPrompt = `
You are an expert career consultant and futurist specializing in career planning and future-proofing careers. Analyze the user's current profile and provide comprehensive future readiness recommendations.

USER'S CURRENT PROFILE:
- Name: ${profileData.name}
- Education: ${JSON.stringify(profileData.education, null, 2)}
- Work Experience: ${JSON.stringify(profileData.experience, null, 2)}
- Current Skills: ${JSON.stringify(profileData.skills, null, 2)}
- Bio: ${profileData.bio}

Based on this information, provide forward-looking career recommendations. Focus on:
1. Career Path Progression: What roles/positions they can aim for next (short-term 1-2 years, mid-term 3-5 years, long-term 5+ years)
2. Emerging Skills: What new skills/technologies they should learn to stay relevant
3. Industry Trends: Which industries/domains are growing and align with their profile
4. Future Job Opportunities: What types of roles will be in demand
5. Technology Trends: Emerging technologies they should prepare for
6. Career Transitions: If applicable, what career pivots make sense
7. Market Opportunities: Where the market is heading and how they can position themselves

IMPORTANT: This is about FUTURE READINESS, not education recommendations (that's separate). Focus on career paths, skills development, industry trends, and positioning for the future job market.

Provide your recommendations as a JSON object with the following structure:
{
  "careerPaths": {
    "shortTerm": {
      "roles": ["<role1>", "<role2>", "<role3>"],
      "description": "<why these roles make sense>",
      "timeline": "1-2 years"
    },
    "midTerm": {
      "roles": ["<role1>", "<role2>", "<role3>"],
      "description": "<why these roles make sense>",
      "timeline": "3-5 years"
    },
    "longTerm": {
      "roles": ["<role1>", "<role2>"],
      "description": "<why these roles make sense>",
      "timeline": "5+ years"
    }
  },
  "emergingSkills": [
    {
      "skill": "<skill name>",
      "importance": "<why this skill is important>",
      "relevance": "<how it relates to their profile>",
      "priority": "<high/medium/low>"
    }
  ],
  "industryTrends": [
    {
      "industry": "<industry name>",
      "trend": "<what's happening in this industry>",
      "opportunity": "<how user can capitalize>",
      "growth": "<high/medium/low>"
    }
  ],
  "technologyTrends": [
    {
      "technology": "<tech name>",
      "impact": "<how it will impact their field>",
      "action": "<what they should do about it>"
    }
  ],
  "marketOpportunities": [
    {
      "opportunity": "<opportunity description>",
      "whyNow": "<why this is relevant now>",
      "howToPrepare": "<how to prepare for this>"
    }
  ],
  "careerAdvice": "<overall strategic career advice for future readiness>",
  "actionPlan": ["<action1>", "<action2>", "<action3>", "<action4>", "<action5>"]
}

Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.
`;
    
    // Step 4: Call OpenAI API
    console.log("🤖 Calling OpenAI for future readiness recommendations...");
    
    let aiResponse;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: futureReadinessPrompt }],
          temperature: 0.7,
        });
        
        break;
      } catch (openaiError) {
        lastError = openaiError;
        retries--;
        
        const isNetworkError = openaiError.message?.includes("getaddrinfo") || 
                               openaiError.message?.includes("EAI_AGAIN") ||
                               openaiError.message?.includes("fetch failed") ||
                               openaiError.code === "ECONNREFUSED" ||
                               openaiError.code === "ETIMEDOUT";
        
        if (isNetworkError && retries > 0) {
          console.log(`⚠️ Network error detected. Retrying... (${retries} attempts remaining)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        console.error("❌ OpenAI API Error:", {
          message: openaiError.message,
          status: openaiError.status,
          code: openaiError.code,
        });
        
        if (openaiError.status === 401) {
          return res.status(401).json({
            success: false,
            error: "Invalid OpenAI API key.",
            details: "Please check your OPENAI_API_KEY in backend/.env file."
          });
        }
        
        throw openaiError;
      }
    }
    
    if (!aiResponse && lastError) {
      return res.status(503).json({
        success: false,
        error: "Failed to connect to OpenAI API after multiple attempts.",
        details: lastError.message
      });
    }
    
    // Step 5: Parse AI response
    let rawResponse = aiResponse.choices[0].message.content || "";
    rawResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let recommendations;
    try {
      recommendations = JSON.parse(rawResponse);
      console.log("✅ Future readiness recommendations generated:", recommendations);
    } catch (parseError) {
      console.error("❌ Error parsing AI response:", parseError);
      console.error("Raw response:", rawResponse);
      return res.status(500).json({
        success: false,
        error: "Error parsing AI response",
        details: parseError.message
      });
    }
    
    res.json({
      success: true,
      message: "Future readiness recommendations generated successfully",
      data: recommendations
    });
    
  } catch (err) {
    console.error("❌ Future Readiness Recommendations Error:", err);
    res.status(500).json({
      success: false,
      error: "Error generating future readiness recommendations",
      details: err.message
    });
  }
});

// 🔸 Get Skills Readiness Recommendations (MUST come before /:userId route)
router.get("/:userId/skills-readiness-recommendations", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`💼 Fetching skills readiness recommendations for user: ${userId}`);
    
    // Step 1: Fetch user profile from PostgreSQL
    const profileResult = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Profile not found. Please upload a resume first."
      });
    }
    
    const profile = profileResult.rows[0];
    
    // Parse JSONB fields
    let education = [];
    let experience = [];
    let skills = [];
    
    try {
      education = profile.education ? 
        (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [];
      experience = profile.experience ? 
        (typeof profile.experience === 'string' ? JSON.parse(profile.experience) : profile.experience) : [];
      skills = profile.skills ? 
        (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [];
    } catch (err) {
      console.error("❌ Error parsing profile JSONB fields:", err);
      return res.status(500).json({
        success: false,
        error: "Error parsing profile data"
      });
    }
    
    // Step 2: Prepare profile data for AI analysis
    const profileData = {
      name: profile.name || "",
      education: education,
      experience: experience,
      currentSkills: skills,
      bio: profile.bio || ""
    };
    
    console.log("💼 Profile Data for Skills Readiness:", JSON.stringify(profileData, null, 2));
    
    // Step 3: Create AI prompt for skills readiness recommendations
    const skillsReadinessPrompt = `
You are an expert career consultant and skills analyst specializing in market demand analysis and skills gap identification. Analyze the user's current skills and provide comprehensive skills readiness recommendations.

USER'S CURRENT PROFILE:
- Name: ${profileData.name}
- Education: ${JSON.stringify(profileData.education, null, 2)}
- Work Experience: ${JSON.stringify(profileData.experience, null, 2)}
- Current Skills: ${JSON.stringify(profileData.currentSkills, null, 2)}
- Bio: ${profileData.bio}

Based on this information, provide comprehensive skills readiness analysis. Focus on:
1. Current Skills Market Demand: Analyze each of their current skills and rate their demand in today's job market (high/medium/low demand)
2. Skills Gap Analysis: Identify critical skills they're missing based on their field/industry
3. In-Demand Skills: What skills are most in-demand in their industry/field right now
4. Skill Recommendations: Specific skills they should learn/add to improve their marketability
5. Complementary Skills: Skills that would complement their existing skill set
6. Emerging vs Obsolete: Which of their skills are emerging/trending up vs becoming obsolete
7. Learning Priorities: What skills to prioritize learning based on market demand and their career goals

IMPORTANT: This is about SKILLS READINESS and market demand, not education degrees (that's separate) or career paths (that's separate). Focus on technical skills, soft skills, tools, technologies, and competencies that are in demand.

Provide your recommendations as a JSON object with the following structure:
{
  "currentSkillsAnalysis": [
    {
      "skill": "<skill name>",
      "demand": "<high/medium/low>",
      "marketValue": "<description of market value>",
      "trend": "<growing/stable/declining>",
      "relevance": "<how relevant it is to their profile>"
    }
  ],
  "skillsGap": [
    {
      "skill": "<missing skill name>",
      "importance": "<critical/high/medium>",
      "reason": "<why this skill is important for them>",
      "impact": "<how missing this skill affects their career>"
    }
  ],
  "inDemandSkills": [
    {
      "skill": "<skill name>",
      "demandLevel": "<very high/high/medium>",
      "industryRelevance": "<how relevant to their industry>",
      "salaryImpact": "<how this skill affects earning potential>",
      "jobAvailability": "<high/medium/low>"
    }
  ],
  "recommendedSkills": [
    {
      "skill": "<skill name>",
      "priority": "<high/medium/low>",
      "reason": "<why they should learn this>",
      "learningPath": "<how to learn this skill>",
      "timeToLearn": "<estimated time>",
      "complements": ["<existing skill1>", "<existing skill2>"]
    }
  ],
  "complementarySkills": [
    {
      "skill": "<skill name>",
      "complements": ["<existing skill>"],
      "synergy": "<how it works with existing skills>",
      "value": "<added value>"
    }
  ],
  "emergingSkills": [
    {
      "skill": "<emerging skill>",
      "trend": "<why it's emerging>",
      "futureValue": "<predicted value>",
      "adoptionRate": "<fast/medium/slow>"
    }
  ],
  "obsoleteSkills": [
    {
      "skill": "<skill name>",
      "status": "<becoming obsolete/less relevant>",
      "replacement": "<what to replace it with>",
      "transition": "<how to transition>"
    }
  ],
  "skillsReadinessScore": {
    "overall": "<percentage>",
    "marketAlignment": "<percentage>",
    "completeness": "<percentage>",
    "futureProofing": "<percentage>",
    "summary": "<overall assessment>"
  },
  "actionPlan": ["<action1>", "<action2>", "<action3>", "<action4>", "<action5>"]
}

Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.
`;
    
    // Step 4: Call OpenAI API
    console.log("🤖 Calling OpenAI for skills readiness recommendations...");
    
    let aiResponse;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: skillsReadinessPrompt }],
          temperature: 0.7,
        });
        
        break;
      } catch (openaiError) {
        lastError = openaiError;
        retries--;
        
        const isNetworkError = openaiError.message?.includes("getaddrinfo") || 
                               openaiError.message?.includes("EAI_AGAIN") ||
                               openaiError.message?.includes("fetch failed") ||
                               openaiError.code === "ECONNREFUSED" ||
                               openaiError.code === "ETIMEDOUT";
        
        if (isNetworkError && retries > 0) {
          console.log(`⚠️ Network error detected. Retrying... (${retries} attempts remaining)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        console.error("❌ OpenAI API Error:", {
          message: openaiError.message,
          status: openaiError.status,
          code: openaiError.code,
        });
        
        if (openaiError.status === 401) {
          return res.status(401).json({
            success: false,
            error: "Invalid OpenAI API key.",
            details: "Please check your OPENAI_API_KEY in backend/.env file."
          });
        }
        
        throw openaiError;
      }
    }
    
    if (!aiResponse && lastError) {
      return res.status(503).json({
        success: false,
        error: "Failed to connect to OpenAI API after multiple attempts.",
        details: lastError.message
      });
    }
    
    // Step 5: Parse AI response
    let rawResponse = aiResponse.choices[0].message.content || "";
    rawResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let recommendations;
    try {
      recommendations = JSON.parse(rawResponse);
      console.log("✅ Skills readiness recommendations generated:", recommendations);
    } catch (parseError) {
      console.error("❌ Error parsing AI response:", parseError);
      console.error("Raw response:", rawResponse);
      return res.status(500).json({
        success: false,
        error: "Error parsing AI response",
        details: parseError.message
      });
    }
    
    res.json({
      success: true,
      message: "Skills readiness recommendations generated successfully",
      data: recommendations
    });
    
  } catch (err) {
    console.error("❌ Skills Readiness Recommendations Error:", err);
    res.status(500).json({
      success: false,
      error: "Error generating skills readiness recommendations",
      details: err.message
    });
  }
});

// Cache for visa KB content
let visaKBContent = null;
let visaKBLoaded = false;

// Load visa KB PDF content
const loadVisaKB = async () => {
  if (visaKBLoaded && visaKBContent) {
    return visaKBContent;
  }

  try {
    const visaKBPath = path.join(__dirname, '../../visaKB.pdf');
    console.log('📄 Loading visa KB from:', visaKBPath);
    
    if (!fs.existsSync(visaKBPath)) {
      console.error('❌ Visa KB file not found at:', visaKBPath);
      return null;
    }

    const dataBuffer = fs.readFileSync(visaKBPath);
    const pdfData = await pdfParse(dataBuffer);
    visaKBContent = pdfData.text;
    visaKBLoaded = true;
    console.log('✅ Visa KB loaded successfully, length:', visaKBContent.length);
    return visaKBContent;
  } catch (error) {
    console.error('❌ Error loading visa KB:', error);
    return null;
  }
};

// 🔸 Get Geographic Recommendations (MUST come before /:userId route)
router.get("/:userId/geographic-recommendations", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🌍 Fetching geographic recommendations for user: ${userId}`);
    
    // Step 1: Fetch user profile from PostgreSQL
    const profileResult = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Profile not found. Please upload a resume first."
      });
    }
    
    const profile = profileResult.rows[0];
    
    // Parse JSONB fields
    let education = [];
    let experience = [];
    let skills = [];
    
    try {
      education = profile.education ? 
        (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [];
      experience = profile.experience ? 
        (typeof profile.experience === 'string' ? JSON.parse(profile.experience) : profile.experience) : [];
      skills = profile.skills ? 
        (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [];
    } catch (err) {
      console.error("❌ Error parsing profile JSONB fields:", err);
      return res.status(500).json({
        success: false,
        error: "Error parsing profile data"
      });
    }
    
    // Step 2: Prepare profile data for AI analysis
    const profileData = {
      name: profile.name || "",
      education: education,
      experience: experience,
      skills: skills,
      bio: profile.bio || ""
    };
    
    console.log("🌍 Profile Data for Geographic Recommendations:", JSON.stringify(profileData, null, 2));
    
    // Step 3: Create AI prompt for country recommendations
    const geographicPrompt = `
You are an expert career consultant and immigration advisor. Analyze the user's profile and recommend the best countries for their career and immigration opportunities.

USER'S CURRENT PROFILE:
- Name: ${profileData.name}
- Education: ${JSON.stringify(profileData.education, null, 2)}
- Work Experience: ${JSON.stringify(profileData.experience, null, 2)}
- Skills: ${JSON.stringify(profileData.skills, null, 2)}
- Bio: ${profileData.bio}

Based on this information, recommend 5-8 countries that would be best for their career growth and immigration opportunities. Consider:
1. Job market demand for their skills
2. Immigration policies and visa availability
3. Quality of life and career opportunities
4. Salary potential
5. Language requirements
6. Cultural fit

Provide your recommendations as a JSON object with the following structure:
{
  "recommendedCountries": [
    {
      "country": "<country name>",
      "reason": "<why this country is recommended>",
      "jobMarket": "<job market description>",
      "salaryPotential": "<salary potential description>",
      "immigrationEase": "<easy/medium/difficult>",
      "priority": "<high/medium/low>"
    }
  ]
}

Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.
`;
    
    // Step 4: Call OpenAI API for country recommendations
    console.log("🤖 Calling OpenAI for geographic recommendations...");
    
    let aiResponse;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: geographicPrompt }],
          temperature: 0.7,
        });
        
        break;
      } catch (openaiError) {
        lastError = openaiError;
        retries--;
        
        const isNetworkError = openaiError.message?.includes("getaddrinfo") || 
                               openaiError.message?.includes("EAI_AGAIN") ||
                               openaiError.message?.includes("fetch failed") ||
                               openaiError.code === "ECONNREFUSED" ||
                               openaiError.code === "ETIMEDOUT";
        
        if (isNetworkError && retries > 0) {
          console.log(`⚠️ Network error detected. Retrying... (${retries} attempts remaining)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        console.error("❌ OpenAI API Error:", {
          message: openaiError.message,
          status: openaiError.status,
          code: openaiError.code,
        });
        
        if (openaiError.status === 401) {
          return res.status(401).json({
            success: false,
            error: "Invalid OpenAI API key.",
            details: "Please check your OPENAI_API_KEY in backend/.env file."
          });
        }
        
        throw openaiError;
      }
    }
    
    if (!aiResponse && lastError) {
      return res.status(503).json({
        success: false,
        error: "Failed to connect to OpenAI API after multiple attempts.",
        details: lastError.message
      });
    }
    
    // Step 5: Parse AI response
    let rawResponse = aiResponse.choices[0].message.content || "";
    rawResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let recommendations;
    try {
      recommendations = JSON.parse(rawResponse);
      console.log("✅ Geographic recommendations generated:", recommendations);
    } catch (parseError) {
      console.error("❌ Error parsing AI response:", parseError);
      console.error("Raw response:", rawResponse);
      return res.status(500).json({
        success: false,
        error: "Error parsing AI response",
        details: parseError.message
      });
    }
    
    res.json({
      success: true,
      message: "Geographic recommendations generated successfully",
      data: recommendations.recommendedCountries || []
    });
    
  } catch (err) {
    console.error("❌ Geographic Recommendations Error:", err);
    res.status(500).json({
      success: false,
      error: "Error generating geographic recommendations",
      details: err.message
    });
  }
});

// 🔸 Get Visa Information for a specific country
router.get("/:userId/visa-info/:country", async (req, res) => {
  try {
    const { userId, country } = req.params;
    
    console.log(`🛂 Fetching visa information for ${country} for user: ${userId}`);
    
    // Step 1: Load visa KB content
    const visaKB = await loadVisaKB();
    
    if (!visaKB) {
      return res.status(500).json({
        success: false,
        error: "Visa knowledge base not available"
      });
    }
    
    // Step 2: Create AI prompt to extract and enhance visa info
    const visaInfoPrompt = `
You are an expert immigration consultant. Extract visa information for ${country} from the knowledge base below, and enhance it with additional relevant information.

VISA KNOWLEDGE BASE CONTENT:
${visaKB.substring(0, 15000)} ${visaKB.length > 15000 ? '... (truncated)' : ''}

Based on the knowledge base above, extract all relevant visa information for ${country}. Include:
1. Available visa types (work visa, skilled worker visa, etc.)
2. Requirements and eligibility criteria
3. Application process and steps
4. Processing time
5. Costs and fees
6. Validity period
7. Links to official resources (if mentioned in KB)
8. Additional requirements
9. Tips and important notes

Then enhance this information with:
- Current market conditions
- Recent changes or updates
- Best practices for application
- Common mistakes to avoid
- Additional resources

Provide your response as a JSON object with the following structure:
{
  "country": "${country}",
  "visaTypes": [
    {
      "type": "<visa type name>",
      "description": "<description>",
      "eligibility": ["<requirement1>", "<requirement2>"],
      "requirements": ["<requirement1>", "<requirement2>"],
      "processSteps": ["<step1>", "<step2>", "<step3>"],
      "processingTime": "<time estimate>",
      "cost": "<cost information>",
      "validity": "<validity period>",
      "links": ["<link1>", "<link2>"],
      "notes": "<additional notes>"
    }
  ],
  "generalInfo": {
    "overview": "<overview of visa options>",
    "bestFor": "<who this is best for>",
    "tips": ["<tip1>", "<tip2>", "<tip3>"],
    "commonMistakes": ["<mistake1>", "<mistake2>"],
    "additionalResources": ["<resource1>", "<resource2>"]
  },
  "enhancedInfo": {
    "marketConditions": "<current market conditions>",
    "recentUpdates": "<recent changes or updates>",
    "bestPractices": ["<practice1>", "<practice2>"]
  }
}

If information for ${country} is not found in the knowledge base, provide general guidance based on common visa practices for that country.

Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.
`;
    
    // Step 3: Call OpenAI API
    console.log("🤖 Calling OpenAI to extract and enhance visa information...");
    
    let aiResponse;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: visaInfoPrompt }],
          temperature: 0.7,
        });
        
        break;
      } catch (openaiError) {
        lastError = openaiError;
        retries--;
        
        const isNetworkError = openaiError.message?.includes("getaddrinfo") || 
                               openaiError.message?.includes("EAI_AGAIN") ||
                               openaiError.message?.includes("fetch failed") ||
                               openaiError.code === "ECONNREFUSED" ||
                               openaiError.code === "ETIMEDOUT";
        
        if (isNetworkError && retries > 0) {
          console.log(`⚠️ Network error detected. Retrying... (${retries} attempts remaining)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        console.error("❌ OpenAI API Error:", {
          message: openaiError.message,
          status: openaiError.status,
          code: openaiError.code,
        });
        
        if (openaiError.status === 401) {
          return res.status(401).json({
            success: false,
            error: "Invalid OpenAI API key.",
            details: "Please check your OPENAI_API_KEY in backend/.env file."
          });
        }
        
        throw openaiError;
      }
    }
    
    if (!aiResponse && lastError) {
      return res.status(503).json({
        success: false,
        error: "Failed to connect to OpenAI API after multiple attempts.",
        details: lastError.message
      });
    }
    
    // Step 4: Parse AI response
    let rawResponse = aiResponse.choices[0].message.content || "";
    rawResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let visaInfo;
    try {
      visaInfo = JSON.parse(rawResponse);
      console.log("✅ Visa information extracted and enhanced:", visaInfo);
    } catch (parseError) {
      console.error("❌ Error parsing AI response:", parseError);
      console.error("Raw response:", rawResponse);
      return res.status(500).json({
        success: false,
        error: "Error parsing AI response",
        details: parseError.message
      });
    }
    
    res.json({
      success: true,
      message: "Visa information retrieved successfully",
      data: visaInfo
    });
    
  } catch (err) {
    console.error("❌ Visa Information Error:", err);
    res.status(500).json({
      success: false,
      error: "Error retrieving visa information",
      details: err.message
    });
  }
});

// 🔸 Get Personalized Job Recommendations based on CV analysis (MUST come before /:userId route)
router.get("/:userId/job-recommendations", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`💼 Fetching personalized job recommendations for user: ${userId}`);
    
    // Step 1: Fetch user profile from PostgreSQL
    const profileResult = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Profile not found. Please upload a resume first."
      });
    }
    
    const profile = profileResult.rows[0];
    
    // Parse JSONB fields
    let education = [];
    let experience = [];
    let skills = [];
    
    try {
      education = profile.education ? 
        (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [];
      experience = profile.experience ? 
        (typeof profile.experience === 'string' ? JSON.parse(profile.experience) : profile.experience) : [];
      skills = profile.skills ? 
        (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [];
    } catch (err) {
      console.error("❌ Error parsing profile JSONB fields:", err);
      return res.status(500).json({
        success: false,
        error: "Error parsing profile data"
      });
    }
    
    // Step 2: Prepare CV data for AI analysis
    const cvData = {
      name: profile.name || "",
      bio: profile.bio || "",
      education: education,
      experience: experience,
      skills: skills
    };
    
    console.log("📄 CV Data for Job Recommendations:", JSON.stringify(cvData, null, 2));
    
    // Step 3: Use AI to analyze CV and generate search queries
    const jobSearchPrompt = `
You are an expert job search consultant. Analyze the user's CV/resume carefully and generate optimal job search queries to find the most relevant job opportunities.

USER'S CV/RESUME:
- Name: ${cvData.name}
- Bio: ${cvData.bio}
- Education: ${JSON.stringify(cvData.education, null, 2)}
- Work Experience: ${JSON.stringify(cvData.experience, null, 2)}
- Skills: ${JSON.stringify(cvData.skills, null, 2)}

Based on this CV, generate 3-5 specific job search queries that would find the most relevant job opportunities. Consider:
1. Their current role/title and experience level
2. Their technical skills and expertise
3. Their education background
4. Career progression and next logical steps
5. Industry and domain expertise

Provide your response as a JSON object with the following structure:
{
  "searchQueries": [
    "<specific job search query 1>",
    "<specific job search query 2>",
    "<specific job search query 3>",
    "<specific job search query 4>",
    "<specific job search query 5>"
  ],
  "jobTitles": ["<title1>", "<title2>", "<title3>"],
  "keySkills": ["<skill1>", "<skill2>", "<skill3>"],
  "experienceLevel": "<entry-level/mid-level/senior/executive>",
  "industries": ["<industry1>", "<industry2>"],
  "analysis": "<brief analysis of their profile and why these queries are recommended>"
}

Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.
`;
    
    // Step 4: Call OpenAI API to generate search queries
    console.log("🤖 Calling OpenAI to analyze CV and generate job search queries...");
    
    let aiResponse;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: jobSearchPrompt }],
          temperature: 0.7,
        });
        
        break;
      } catch (openaiError) {
        lastError = openaiError;
        retries--;
        
        const isNetworkError = openaiError.message?.includes("getaddrinfo") || 
                               openaiError.message?.includes("EAI_AGAIN") ||
                               openaiError.message?.includes("fetch failed") ||
                               openaiError.code === "ECONNREFUSED" ||
                               openaiError.code === "ETIMEDOUT";
        
        if (isNetworkError && retries > 0) {
          console.log(`⚠️ Network error detected. Retrying... (${retries} attempts remaining)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        console.error("❌ OpenAI API Error:", {
          message: openaiError.message,
          status: openaiError.status,
          code: openaiError.code,
        });
        
        if (openaiError.status === 401) {
          return res.status(401).json({
            success: false,
            error: "Invalid OpenAI API key.",
            details: "Please check your OPENAI_API_KEY in backend/.env file."
          });
        }
        
        throw openaiError;
      }
    }
    
    if (!aiResponse && lastError) {
      return res.status(503).json({
        success: false,
        error: "Failed to connect to OpenAI API after multiple attempts.",
        details: lastError.message
      });
    }
    
    // Step 5: Parse AI response
    let rawResponse = aiResponse.choices[0].message.content || "";
    rawResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let searchAnalysis;
    try {
      searchAnalysis = JSON.parse(rawResponse);
      console.log("✅ CV Analysis completed:", searchAnalysis);
    } catch (parseError) {
      console.error("❌ Error parsing AI response:", parseError);
      console.error("Raw response:", rawResponse);
      return res.status(500).json({
        success: false,
        error: "Error parsing AI response",
        details: parseError.message
      });
    }
    
    // Step 6: Search JSearch API with generated queries
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const JSEARCH_API_HOST = 'jsearch.p.rapidapi.com';
    
    const allJobs = [];
    const seenJobIds = new Set();
    
    // Search with each query
    for (const query of searchAnalysis.searchQueries || []) {
      try {
        const url = new URL(`https://${JSEARCH_API_HOST}/search`);
        url.searchParams.append('query', query);
        url.searchParams.append('page', '1');
        url.searchParams.append('num_pages', '1');
        
        const response = await fetch(url.toString(), {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': JSEARCH_API_HOST,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const jobs = data.data || [];
          
          // Filter jobs with valid apply links and transform
          for (const job of jobs) {
            const jobId = job.job_id || job.id;
            if (!seenJobIds.has(jobId) && job.job_apply_link) {
              // Validate that apply link is a proper URL
              try {
                new URL(job.job_apply_link);
                seenJobIds.add(jobId);
                
                const transformedJob = {
                  id: jobId,
                  title: job.job_title || job.title || '',
                  company: job.employer_name || job.company || '',
                  location: `${job.job_city || ''}, ${job.job_state || ''}, ${job.job_country || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Location not specified',
                  type: job.job_employment_type || job.type || 'Full-time',
                  salary: job.job_min_salary && job.job_max_salary 
                    ? `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()} ${job.job_salary_period || 'per year'}`
                    : null,
                  description: job.job_description || job.description || '',
                  requirements: job.job_required_skills || [],
                  skills: job.job_required_skills || [],
                  postedDate: job.job_posted_at_datetime_utc || new Date().toISOString(),
                  remote: job.job_is_remote || false,
                  experience: job.job_experience || null,
                  industry: job.job_industry || null,
                  applyLink: job.job_apply_link, // Validated URL
                  employerLogo: job.employer_logo || null,
                  jobPublisher: job.job_publisher || 'External',
                  jobCountry: job.job_country || null,
                  jobCity: job.job_city || null,
                  jobState: job.job_state || null,
                  matchReason: `Matched based on: ${query}`,
                  similarityScore: 0.85 // Default similarity score
                };
                
                allJobs.push(transformedJob);
              } catch (urlError) {
                console.warn(`⚠️ Invalid apply link for job ${jobId}:`, job.job_apply_link);
                // Skip jobs with invalid URLs
              }
            }
          }
        }
      } catch (searchError) {
        console.warn(`⚠️ Error searching with query "${query}":`, searchError.message);
        // Continue with other queries
      }
    }
    
    // Step 7: Limit to top 10 most relevant jobs
    const recommendedJobs = allJobs.slice(0, 10);
    
    console.log(`✅ Found ${recommendedJobs.length} personalized job recommendations`);
    
    res.json({
      success: true,
      message: "Personalized job recommendations generated successfully",
      data: {
        jobs: recommendedJobs,
        analysis: searchAnalysis.analysis,
        searchQueries: searchAnalysis.searchQueries,
        jobTitles: searchAnalysis.jobTitles,
        keySkills: searchAnalysis.keySkills,
        experienceLevel: searchAnalysis.experienceLevel,
        industries: searchAnalysis.industries
      }
    });
    
  } catch (err) {
    console.error("❌ Job Recommendations Error:", err);
    res.status(500).json({
      success: false,
      error: "Error generating job recommendations",
      details: err.message
    });
  }
});

// 🔸 Get Personalized Course Recommendations based on CV analysis (MUST come before /:userId route)
router.get("/:userId/course-recommendations", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📚 Fetching personalized course recommendations for user: ${userId}`);
    
    // Step 1: Fetch user profile from PostgreSQL
    const profileResult = await pool.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId]
    );
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Profile not found. Please upload a resume first."
      });
    }
    
    const profile = profileResult.rows[0];
    
    // Parse JSONB fields
    let education = [];
    let experience = [];
    let skills = [];
    
    try {
      education = profile.education ? 
        (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [];
      experience = profile.experience ? 
        (typeof profile.experience === 'string' ? JSON.parse(profile.experience) : profile.experience) : [];
      skills = profile.skills ? 
        (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [];
    } catch (err) {
      console.error("❌ Error parsing profile JSONB fields:", err);
      return res.status(500).json({
        success: false,
        error: "Error parsing profile data"
      });
    }
    
    // Step 2: Prepare CV data for AI analysis
    const cvData = {
      name: profile.name || "",
      bio: profile.bio || "",
      education: education,
      experience: experience,
      skills: skills
    };
    
    console.log("📄 CV Data for Course Recommendations:", JSON.stringify(cvData, null, 2));
    
    // Step 3: Use AI to analyze CV and generate course recommendations
    const courseSearchPrompt = `
You are an expert career consultant and online learning advisor. Analyze the user's CV/resume carefully and recommend specific online courses that would help them advance their career.

USER'S CV/RESUME:
- Name: ${cvData.name}
- Bio: ${cvData.bio}
- Education: ${JSON.stringify(cvData.education, null, 2)}
- Work Experience: ${JSON.stringify(cvData.experience, null, 2)}
- Skills: ${JSON.stringify(cvData.skills, null, 2)}

Based on this CV, recommend 8-10 specific online courses from popular platforms (Coursera, Udemy, edX, LinkedIn Learning, Pluralsight, etc.) that would be most beneficial for their career growth. Consider:
1. Skills gaps they need to fill
2. Career advancement opportunities
3. Emerging technologies in their field
4. Complementary skills that would enhance their profile
5. Industry-relevant certifications

IMPORTANT: For each course, provide a REAL, WORKING enrollment link. Use actual course URLs from platforms like:
- Coursera: https://www.coursera.org/learn/[course-slug]
- Udemy: https://www.udemy.com/course/[course-slug]/
- edX: https://www.edx.org/learn/[subject]/[course-name]
- LinkedIn Learning: https://www.linkedin.com/learning/[course-name]
- Pluralsight: https://www.pluralsight.com/courses/[course-slug]

Make sure all links are valid URLs that users can actually visit and enroll in.

Provide your response as a JSON object with the following structure:
{
  "courses": [
    {
      "id": "<unique-id>",
      "title": "<course title>",
      "provider": "<Coursera/Udemy/edX/LinkedIn Learning/Pluralsight/etc.>",
      "platform": "<platform name>",
      "duration": "<estimated duration, e.g., '10 hours', '4 weeks', 'Self-paced'>",
      "level": "<Beginner/Intermediate/Advanced>",
      "price": "<price, e.g., 'Free', '$49.99', 'Subscription'>",
      "description": "<brief course description>",
      "skills_taught": ["<skill1>", "<skill2>", "<skill3>"],
      "category": "<category, e.g., 'Data Science', 'Web Development', 'Business'>",
      "rating": <rating out of 5, e.g., 4.5>,
      "students": <number of students or enrollments if known>,
      "instructor": "<instructor name if known>",
      "enrollmentLink": "<REAL WORKING URL to enroll in the course>",
      "matchReason": "<why this course is recommended for this user>",
      "similarityScore": <0.0 to 1.0>,
      "certificate": "<Yes/No - whether certificate is available>",
      "language": "<English/Spanish/etc.>",
      "format": "<Video/Text/Interactive/Hybrid>"
    }
  ],
  "analysis": "<brief analysis of why these courses are recommended>",
  "skillGaps": ["<skill gap 1>", "<skill gap 2>"],
  "careerImpact": "<how these courses will impact their career>"
}

Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.
`;
    
    // Step 4: Call OpenAI API to generate course recommendations
    console.log("🤖 Calling OpenAI to analyze CV and generate course recommendations...");
    
    let aiResponse;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: courseSearchPrompt }],
          temperature: 0.7,
        });
        
        break;
      } catch (openaiError) {
        lastError = openaiError;
        retries--;
        
        const isNetworkError = openaiError.message?.includes("getaddrinfo") || 
                               openaiError.message?.includes("EAI_AGAIN") ||
                               openaiError.message?.includes("fetch failed") ||
                               openaiError.code === "ECONNREFUSED" ||
                               openaiError.code === "ETIMEDOUT";
        
        if (isNetworkError && retries > 0) {
          console.log(`⚠️ Network error detected. Retrying... (${retries} attempts remaining)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        console.error("❌ OpenAI API Error:", {
          message: openaiError.message,
          status: openaiError.status,
          code: openaiError.code,
        });
        
        if (openaiError.status === 401) {
          return res.status(401).json({
            success: false,
            error: "Invalid OpenAI API key.",
            details: "Please check your OPENAI_API_KEY in backend/.env file."
          });
        }
        
        throw openaiError;
      }
    }
    
    if (!aiResponse && lastError) {
      return res.status(503).json({
        success: false,
        error: "Failed to connect to OpenAI API after multiple attempts.",
        details: lastError.message
      });
    }
    
    // Step 5: Parse AI response
    let rawResponse = aiResponse.choices[0].message.content || "";
    rawResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let courseAnalysis;
    try {
      courseAnalysis = JSON.parse(rawResponse);
      console.log("✅ Course Analysis completed:", courseAnalysis);
    } catch (parseError) {
      console.error("❌ Error parsing AI response:", parseError);
      console.error("Raw response:", rawResponse);
      return res.status(500).json({
        success: false,
        error: "Error parsing AI response",
        details: parseError.message
      });
    }
    
    // Step 6: Validate and filter courses with working enrollment links
    const validCourses = [];
    if (courseAnalysis.courses && Array.isArray(courseAnalysis.courses)) {
      for (const course of courseAnalysis.courses) {
        // Validate enrollment link
        if (course.enrollmentLink) {
          try {
            const url = new URL(course.enrollmentLink);
            // Check if it's a valid HTTP/HTTPS URL
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              validCourses.push({
                id: course.id || `course-${Date.now()}-${Math.random()}`,
                title: course.title || 'Course',
                provider: course.provider || course.platform || 'Online Platform',
                duration: course.duration || 'Self-paced',
                level: course.level || 'Intermediate',
                price: course.price || 'Check platform',
                description: course.description || '',
                skills_taught: course.skills_taught || [],
                category: course.category || 'General',
                rating: course.rating || 4.0,
                students: course.students || 0,
                instructor: course.instructor || '',
                enrollmentLink: course.enrollmentLink,
                matchReason: course.matchReason || course.relevance_reason || 'Recommended based on your profile',
                similarityScore: course.similarityScore || course.similarity_score || 0.8,
                certificate: course.certificate || 'Yes',
                language: course.language || 'English',
                format: course.format || 'Video'
              });
            }
          } catch (urlError) {
            console.warn(`⚠️ Invalid enrollment link for course "${course.title}":`, course.enrollmentLink);
            // Skip courses with invalid URLs
          }
        }
      }
    }
    
    // Step 7: Limit to top 10 most relevant courses
    const recommendedCourses = validCourses.slice(0, 10);
    
    console.log(`✅ Found ${recommendedCourses.length} personalized course recommendations`);
    
    res.json({
      success: true,
      message: "Personalized course recommendations generated successfully",
      data: {
        courses: recommendedCourses,
        analysis: courseAnalysis.analysis || '',
        skillGaps: courseAnalysis.skillGaps || [],
        careerImpact: courseAnalysis.careerImpact || ''
      }
    });
    
  } catch (err) {
    console.error("❌ Course Recommendations Error:", err);
    res.status(500).json({
      success: false,
      error: "Error generating course recommendations",
      details: err.message
    });
  }
});

// 🔸 Get user scores and dashboard stats
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      "SELECT * FROM user_scores WHERE user_id = $1", 
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default scores with 0 for new users (no profile set yet)
      const defaultScores = {
        user_id: userId,
        overall_score: 0,
        education_score: 0,
        future_readiness_score: 0,
        skills_readiness_score: 0,
        geographic_score: 0,
        profile_views: 0,
        applications_count: 0,
        interviews_count: 0,
        offers_count: 0,
        top_countries: '[]'
      };

      const insertResult = await pool.query(
        `INSERT INTO user_scores (
          user_id, overall_score, education_score, future_readiness_score, 
          skills_readiness_score, geographic_score, profile_views, 
          applications_count, interviews_count, offers_count, top_countries
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          defaultScores.user_id,
          defaultScores.overall_score,
          defaultScores.education_score,
          defaultScores.future_readiness_score,
          defaultScores.skills_readiness_score,
          defaultScores.geographic_score,
          defaultScores.profile_views,
          defaultScores.applications_count,
          defaultScores.interviews_count,
          defaultScores.offers_count,
          defaultScores.top_countries
        ]
      );

      const scores = insertResult.rows[0];
      
      // Safely parse top_countries JSON for new user
      let topCountries = [];
      try {
        if (scores.top_countries) {
          topCountries = typeof scores.top_countries === 'string' 
            ? JSON.parse(scores.top_countries) 
            : scores.top_countries;
        }
      } catch (err) {
        console.warn('⚠️ Error parsing top_countries JSON for new user, using default:', err.message);
        topCountries = ["United States", "Canada", "Germany", "Australia", "United Kingdom"];
      }

      res.json({ 
        success: true, 
        message: "Default scores created successfully",
        data: {
          ...scores,
          top_countries: topCountries
        }
      });
      return;
    }

    const scores = result.rows[0];
    
    // Safely parse top_countries JSON
    let topCountries = [];
    try {
      if (scores.top_countries) {
        topCountries = typeof scores.top_countries === 'string' 
          ? JSON.parse(scores.top_countries) 
          : scores.top_countries;
      }
    } catch (err) {
      console.warn('⚠️ Error parsing top_countries JSON, using default:', err.message);
      topCountries = ["United States", "Canada", "Germany", "Australia", "United Kingdom"];
    }
    
    res.json({ 
      success: true, 
      message: "Scores fetched successfully",
      data: {
        ...scores,
        top_countries: topCountries
      }
    });
  } catch (err) {
    console.error("❌ Fetch Scores Error:", err);
    res.status(500).json({ 
      success: false,
      error: "Error fetching scores from database",
      details: err.message 
    });
  }
});

// 🔸 Update user scores
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      overall_score,
      education_score,
      future_readiness_score,
      skills_readiness_score,
      geographic_score,
      profile_views,
      applications_count,
      interviews_count,
      offers_count,
      top_countries
    } = req.body;

    const result = await pool.query(
      `UPDATE user_scores SET 
        overall_score = COALESCE($2, overall_score),
        education_score = COALESCE($3, education_score),
        future_readiness_score = COALESCE($4, future_readiness_score),
        skills_readiness_score = COALESCE($5, skills_readiness_score),
        geographic_score = COALESCE($6, geographic_score),
        profile_views = COALESCE($7, profile_views),
        applications_count = COALESCE($8, applications_count),
        interviews_count = COALESCE($9, interviews_count),
        offers_count = COALESCE($10, offers_count),
        top_countries = COALESCE($11, top_countries),
        updated_at = NOW()
      WHERE user_id = $1 
      RETURNING *`,
      [
        userId,
        overall_score,
        education_score,
        future_readiness_score,
        skills_readiness_score,
        geographic_score,
        profile_views,
        applications_count,
        interviews_count,
        offers_count,
        top_countries ? JSON.stringify(top_countries) : null
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "User scores not found" 
      });
    }

    const scores = result.rows[0];
    
    // Safely parse top_countries JSON after update
    let topCountries = [];
    try {
      if (scores.top_countries) {
        topCountries = typeof scores.top_countries === 'string' 
          ? JSON.parse(scores.top_countries) 
          : scores.top_countries;
      }
    } catch (err) {
      console.warn('⚠️ Error parsing top_countries JSON after update, using default:', err.message);
      topCountries = ["United States", "Canada", "Germany", "Australia", "United Kingdom"];
    }
    
    res.json({ 
      success: true, 
      message: "Scores updated successfully",
      data: {
        ...scores,
        top_countries: topCountries
      }
    });
  } catch (err) {
    console.error("❌ Update Scores Error:", err);
    res.status(500).json({ 
      success: false,
      error: "Error updating scores in database",
      details: err.message 
    });
  }
});

module.exports = router;
