// backend/routes/coverLetterRoutes.js
const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const pool = require("../config/db");
require("dotenv").config();

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔸 Generate cover letter
router.post("/generate", async (req, res) => {
  try {
    const {
      userId,
      jobTitle,
      companyName,
      jobDescription,
      hiringManagerName,
      tone = "professional" // professional, enthusiastic, creative
    } = req.body;

    if (!jobTitle || !companyName) {
      return res.status(400).json({
        success: false,
        error: "Job title and company name are required"
      });
    }

    console.log(`📝 Generating cover letter for user: ${userId || "guest"}`);

    // Fetch user profile if userId is provided
    let userProfile = null;
    if (userId) {
      try {
        const profileResult = await pool.query(
          "SELECT * FROM user_profiles WHERE user_id = $1",
          [userId]
        );
        
        if (profileResult.rows.length > 0) {
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
            console.error("Error parsing profile:", err);
          }
          
          userProfile = {
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || "",
            bio: profile.bio || "",
            education,
            experience,
            skills,
            certificates
          };
          
          console.log("✅ User profile loaded:", {
            name: userProfile.name,
            experienceCount: userProfile.experience.length,
            skillsCount: userProfile.skills.length
          });
        }
      } catch (err) {
        console.log("⚠️ Could not load user profile:", err.message);
      }
    }

    // Build the prompt for cover letter generation
    const toneGuidance = {
      professional: "Write in a professional, polished, and confident tone. Show competence and expertise.",
      enthusiastic: "Write with enthusiasm and energy. Show genuine excitement about the opportunity.",
      creative: "Write creatively while remaining professional. Use engaging language and show personality."
    };

    const coverLetterPrompt = `
You are an expert career coach and cover letter writer. Generate a compelling, personalized cover letter for the following job application.

${userProfile ? `CANDIDATE INFORMATION:
Name: ${userProfile.name || "Not provided"}
Email: ${userProfile.email || "Not provided"}
Phone: ${userProfile.phone || "Not provided"}
${userProfile.bio ? `Professional Summary: ${userProfile.bio}` : ""}

EDUCATION:
${userProfile.education.length > 0 
  ? userProfile.education.map(edu => `- ${edu.degree || ""} from ${edu.institute || ""} (${edu.year || ""})`).join("\n")
  : "Not provided"}

EXPERIENCE:
${userProfile.experience.length > 0 
  ? userProfile.experience.map(exp => `- ${exp.title || ""} at ${exp.company || ""} (${exp.duration || ""})`).join("\n")
  : "Not provided"}

SKILLS:
${userProfile.skills.length > 0 ? userProfile.skills.join(", ") : "Not provided"}

CERTIFICATIONS:
${userProfile.certificates.length > 0 
  ? userProfile.certificates.map(cert => `- ${cert.name || ""} from ${cert.issuer || ""}`).join("\n")
  : "None"}
` : "Note: No candidate profile provided. Generate a generic but professional cover letter."}

JOB APPLICATION DETAILS:
Job Title: ${jobTitle}
Company: ${companyName}
${hiringManagerName ? `Hiring Manager: ${hiringManagerName}` : ""}
${jobDescription ? `Job Description:\n${jobDescription}` : ""}

INSTRUCTIONS:
1. Create a personalized cover letter that highlights the candidate's relevant skills and experience
2. If profile data is provided, reference specific experiences, skills, and achievements that match the job requirements
3. ${toneGuidance[tone] || toneGuidance.professional}
4. Keep the cover letter concise (3-4 paragraphs, approximately 250-350 words)
5. Include:
   - Strong opening that captures attention
   - Why you're interested in this specific role and company
   - How your experience and skills align with the job requirements
   - Closing statement that reinforces your interest and request for next steps

6. Format the cover letter professionally with:
   - Proper greeting (use hiring manager name if provided, otherwise "Dear Hiring Manager")
   - Well-structured paragraphs
   - Professional closing ("Sincerely" or "Best regards" followed by the candidate's name)

7. Make it genuine and specific - avoid generic phrases. Reference the company and role specifically.
8. If profile data is limited, write a professional generic cover letter that can be customized.

Return ONLY the cover letter text, ready to use. No markdown formatting, no code blocks, no additional explanations.
`;

    console.log("🤖 Calling OpenAI for cover letter generation...");
    
    let retries = 3;
    let lastError = null;
    let aiResponse;
    
    while (retries > 0) {
      try {
        aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: coverLetterPrompt }],
          temperature: 0.7,
          max_tokens: 800,
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
          console.log(`⚠️ Network error. Retrying... (${retries} attempts remaining)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
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
    
    let coverLetter = aiResponse.choices[0].message.content || "";
    // Clean the response
    coverLetter = coverLetter.trim();
    
    console.log("✅ Cover letter generated successfully");
    
    res.json({
      success: true,
      message: "Cover letter generated successfully",
      data: {
        coverLetter,
        jobTitle,
        companyName,
        hiringManagerName: hiringManagerName || null,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (err) {
    console.error("❌ Cover Letter Generation Error:", err);
    res.status(500).json({
      success: false,
      error: "Error generating cover letter",
      details: err.message
    });
  }
});

module.exports = router;
