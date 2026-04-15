const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const OpenAI = require("openai");
const pool = require("../config/db");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Lazy load OpenAI client only if API key is available
let openai = null;
const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder-key-123') {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

// Upload & Parse Resume (no DB)
router.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;

    // ✅ strict JSON-only prompt
    const prompt = `
You are a professional resume parser.
Extract and return ONLY valid JSON — no extra text, no markdown, no code block.

IMPORTANT: Extract ALL work experience, internships, projects, employment history, and certificates from the resume.

JSON format:
{
  "personalInfo": { "name": "", "email": "", "phone": "", "bio": "" },
  "education": [ { "degree": "", "institute": "", "year": "" } ],
  "experience": [ 
    { "title": "Job Title", "company": "Company Name", "duration": "Start Date - End Date or Duration" },
    { "title": "Another Job", "company": "Another Company", "duration": "Duration" }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "certificates": [
    { "name": "Certificate Name", "issuer": "Issuing Organization", "date": "Issue Date", "credentialId": "Optional ID" }
  ]
}

Instructions:
- Extract ALL work experience, internships, freelance work, projects, and employment history
- Include job titles, company names, and time periods/duration
- Extract all technical skills, programming languages, tools, frameworks
- Extract ALL certificates, certifications, licenses, and professional credentials
- Include certificate names, issuing organizations, issue dates, and credential IDs if available
- If no certificates are found, return empty array: []
- If no experience is found, return empty array: []
- Be thorough and extract as much relevant information as possible

Resume:
${resumeText}
`;

    // 🔹 call OpenAI API
    const client = getOpenAIClient();
    if (!client) {
      return res.status(500).json({ error: "OpenAI API not configured. Please set OPENAI_API_KEY in .env" });
    }
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    let raw = response.choices[0].message.content || "";
    // clean response
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let data;
    try {
      data = JSON.parse(raw);
      console.log("🧠 AI Parser Response:");
      console.log("Personal Info:", data.personalInfo);
      console.log("Education:", data.education);
      console.log("Experience:", data.experience);
      console.log("Skills:", data.skills);
      console.log("Certificates:", data.certificates);
    } catch (err) {
      console.log("⚠️ JSON parse failed, raw response:\n", raw);
      return res.status(500).json({ error: "Invalid response format from AI." });
    }

    // cleanup
    fs.unlinkSync(req.file.path);

    // ✅ Run analysis but DON'T save to DB (only for temporary preview)
    const userId = req.body.userId;
    let analysisResult = null;

    // Run analysis for temporary preview (not saved to DB)
    if (userId && data) {
      try {
        console.log("📊 Running temporary analysis for preview...");
        const personalInfo = data.personalInfo || {};
        const resumeDataForAnalysis = {
          name: personalInfo.name || "",
          bio: personalInfo.bio || "",
          education: data.education || [],
          experience: data.experience || [],
          skills: data.skills || [],
          certificates: data.certificates || []
        };

        const analysisPrompt = `
You are an expert career analyst evaluating a candidate's resume to determine their professional readiness and market value.

Analyze the following resume data and provide a comprehensive assessment:

RESUME DATA:
${JSON.stringify(resumeDataForAnalysis, null, 2)}

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

ILO Level Guidelines:
- Level 1: Illiterate/unskilled - No formal education, basic skills only
- Level 2: Diploma/vocational - Technical certifications, vocational training, associate degrees
- Level 3: Degree-level/professional - Bachelor's degree or equivalent, professional qualifications
- Level 4: Executive/leadership - Advanced degrees (Master's, PhD), senior leadership roles, specialized expertise

Scoring Guidelines:
- Overall Score: Weighted average considering all factors (0-100)
- Education Score: Based on degree level, institution quality, relevancy (0-100)
- Skill Readiness Score: Based on skill depth, market demand, certifications (0-100)
- Future Readiness Score: Likelihood skills remain valuable in 5-10 years (0-100)
- Geographic Score: Global marketability and demand in key regions (0-100)

Geographical Value:
- Assess which regions/countries would value this candidate most
- Consider skill demand trends, visa opportunities, salary potential
- Provide top 5 countries as an array

Analysis Summary:
- Provide 2-3 sentences with actionable insights and recommendations
- Be specific about strengths and areas for improvement
- Mention certifications or skills that would boost their profile

Return ONLY valid JSON, no markdown formatting, no code blocks, no additional text.
`;

        let aiAnalysisResponse;
        let retries = 3;
        const client = getOpenAIClient();
        
        while (retries > 0) {
          try {
            if (!client) {
              throw new Error("OpenAI API not configured");
            }
            aiAnalysisResponse = await client.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: analysisPrompt }],
              temperature: 0.3,
            });
            break;
          } catch (analysisError) {
            retries--;
            if (retries === 0) throw analysisError;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        let analysisRaw = aiAnalysisResponse.choices[0].message.content || "";
        analysisRaw = analysisRaw.replace(/```json/g, "").replace(/```/g, "").trim();

        const analysis = JSON.parse(analysisRaw);
        
        analysisResult = {
          ilo_level: Math.min(4, Math.max(1, analysis.ilo_level || 2)),
          ilo_label: analysis.ilo_label || "Professional",
          overall_score: Math.min(100, Math.max(0, analysis.overall_score || 75)),
          education_score: Math.min(100, Math.max(0, analysis.education_score || 75)),
          skills_readiness_score: Math.min(100, Math.max(0, analysis.skill_readiness_score || analysis.skills_readiness_score || 75)),
          future_readiness_score: Math.min(100, Math.max(0, analysis.future_readiness_score || 70)),
          geographic_score: Math.min(100, Math.max(0, analysis.geographic_score || 65)),
          geographical_value: analysis.geographical_value || "Moderate global demand",
          top_countries: Array.isArray(analysis.top_countries) && analysis.top_countries.length > 0
            ? analysis.top_countries.slice(0, 5)
            : ["United States", "Canada", "Germany", "Australia", "United Kingdom"],
          analysis_summary: analysis.analysis_summary || "Your profile shows good potential. Continue building relevant skills."
        };

        console.log("✅ Temporary analysis completed (not saved to DB)");

      } catch (analysisErr) {
        console.error("⚠️ Temporary analysis failed (non-critical):", analysisErr.message);
        // Don't fail the whole request if analysis fails
      }
    }

    // return structured data with temporary analysis (not saved to DB)
    res.json({
      success: true,
      message: "Resume parsed successfully! Save your profile to store permanently.",
      data,
      analysis: analysisResult, // Temporary analysis for preview
      isTemporary: true // Flag to indicate this is temporary data
    });
  } catch (err) {
    console.error("Parser Error:", err);
    res.status(500).json({ error: "Error parsing resume." });
  }
});

module.exports = router;
