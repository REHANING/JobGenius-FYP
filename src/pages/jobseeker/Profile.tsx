import React, { useState, useEffect } from "react";
import { Upload, Save, Trash2, PlusCircle, Loader2, Download } from "lucide-react";
import { generateCVPDF } from "../../services/pdfService";

type EducationItem = {
  degree: string;
  institute: string;
  year: string;
};

type ExperienceItem = {
  title: string;
  company: string;
  duration: string;
};

type CertificateItem = {
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
};

type CareerAnalysis = {
  iloLevel: number;
  iloReasoning: string;
  futureReadinessScore: number;
  futureReadinessReasoning: string;
  skillsReadinessScore: number;
  skillsReadinessReasoning: string;
  geographicOpportunities: Array<{
    country: string;
    opportunityScore: number;
    visaProcess: string;
    averageSalary: string;
    requirements: string[];
  }>;
  recommendedSkills: string[];
  careerPath: string;
  strengths: string[];
  improvementAreas: string[];
};

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  bio: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: string[];
  certificates: CertificateItem[];
  careerAnalysis?: CareerAnalysis;
};

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    education: [],
    experience: [],
    skills: [],
    certificates: [],
    careerAnalysis: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });


  // ✅ Load existing profile data on component mount
  useEffect(() => {
    loadProfileFromDB().then((loaded) => {
      if (loaded) {
        setStatusMsg({ 
          text: "✅ Profile loaded from database", 
          type: "success" 
        });
        // Clear message after 3 seconds
        setTimeout(() => {
          setStatusMsg({ text: "", type: "" });
        }, 3000);
      }
    });
  }, []);

  // ✅ Upload + Parse Resume
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);
    
    // Get current user ID
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = currentUser._id || currentUser.id || "demo-user-123";
    formData.append("userId", userId);

    setLoading(true);
    setStatusMsg({ text: "", type: "" });

    try {
      const response = await fetch("http://localhost:5000/api/parser/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to parse resume");

      const data = await response.json();
      console.log("🧠 Parsed Resume Data:", data);
      console.log("📊 Analysis Result:", data.analysis);

      // backend ka data nested hai → data.data.personalInfo
      const parsed = data.data || {};
      console.log("📋 Extracted Data:");
      console.log("Personal Info:", parsed.personalInfo);
      console.log("Education:", parsed.education);
      console.log("Experience:", parsed.experience);
      console.log("Skills:", parsed.skills);
      console.log("Certificates:", parsed.certificates);

setProfile({
  name: parsed.personalInfo?.name || "",
  email: parsed.personalInfo?.email || "",
  phone: parsed.personalInfo?.phone || "",
  bio: parsed.personalInfo?.bio || "",
  education:
    parsed.education?.map((edu: any) => ({
      degree: edu.degree || "",
      institute: edu.institute || "",
      year: edu.year || "",
    })) || [],
  experience:
    parsed.experience?.map((exp: any) => ({
      title: exp.title || "",
      company: exp.company || "",
      duration: exp.duration || "",
    })) || [],
  skills: parsed.skills || [],
  certificates: parsed.certificates?.map((cert: any) => ({
    name: cert.name || "",
    issuer: cert.issuer || "",
    date: cert.date || "",
    credentialId: cert.credentialId || "",
  })) || [],
  careerAnalysis: parsed.careerAnalysis || undefined,
});


      // Store temporary analysis for dashboard preview
      setStatusMsg({ 
        text: "✅ Resume uploaded!", 
        type: "success" 
      });
      
      // Store temporary data in localStorage for dashboard access (until saved or logout)
      const tempData = {
        profile: {
          name: parsed.personalInfo?.name || "",
          email: parsed.personalInfo?.email || "",
          phone: parsed.personalInfo?.phone || "",
          bio: parsed.personalInfo?.bio || "",
          education: parsed.education || [],
          experience: parsed.experience || [],
          skills: parsed.skills || [],
          certificates: parsed.certificates || []
        },
        analysis: data.analysis,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("tempResumeData", JSON.stringify(tempData));
    } catch (err) {
      console.error("❌ Error parsing resume:", err);
      setStatusMsg({ text: "Error parsing resume. Try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load profile from database
  const loadProfileFromDB = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = currentUser._id || currentUser.id || "demo-user-123";
      
      const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const existingProfile = data.data;
        setProfile({
          name: existingProfile.name || "",
          email: existingProfile.email || "",
          phone: existingProfile.phone || "",
          bio: existingProfile.bio || "",
          education: Array.isArray(existingProfile.education) ? existingProfile.education : [],
          experience: Array.isArray(existingProfile.experience) ? existingProfile.experience : [],
          skills: Array.isArray(existingProfile.skills) ? existingProfile.skills : [],
          certificates: Array.isArray(existingProfile.certificates) ? existingProfile.certificates : [],
          careerAnalysis: existingProfile.career_analysis || undefined,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.log("Error loading profile:", err);
      return false;
    }
  };

  // ✅ Save profile to PostgreSQL (permanent save with analysis)
  const handleSaveProfile = async () => {
    setSaving(true);
    setStatusMsg({ text: "", type: "" });

    try {
      // Get current user ID
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = currentUser._id || currentUser.id;

      if (!userId) {
        setStatusMsg({ 
          text: "Error: User not logged in. Please login first.", 
          type: "error" 
        });
        setSaving(false);
        return;
      }

      // Save profile to database
      const response = await fetch("http://localhost:5000/api/profile/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio,
          education: profile.education,
          experience: profile.experience,
          skills: profile.skills,
          certificates: profile.certificates,
          resumeFileName: null,
          parsedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload profile from DB to ensure we have the latest saved data
        await loadProfileFromDB();
        
        // After saving profile, trigger analysis and save scores permanently
        console.log("💾 Profile saved, now triggering analysis for permanent storage...");
        
        try {
          const analysisResponse = await fetch(`http://localhost:5000/api/scores/${userId}/analyze`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            console.log("✅ Scores saved permanently:", analysisData);
            
            // Clear temporary data from localStorage
            localStorage.removeItem("tempResumeData");
            
            setStatusMsg({ 
              text: "✅ Profile saved! All changes are now permanent.", 
              type: "success" 
            });
          } else {
            // Profile saved but analysis failed
            setStatusMsg({ 
              text: "✅ Profile saved! Dashboard analysis will be updated shortly.", 
              type: "success" 
            });
          }
        } catch (analysisErr) {
          console.error("⚠️ Analysis failed but profile saved:", analysisErr);
          setStatusMsg({ 
            text: "✅ Profile saved! Dashboard analysis will be updated shortly.", 
            type: "success" 
          });
        }
      } else {
        throw new Error(data.error || "Failed to save profile");
      }
    } catch (err) {
      console.error("❌ Error saving profile:", err);
      setStatusMsg({ 
        text: "Error saving profile to database. Please try again.", 
        type: "error" 
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle basic info field changes
  const handleBasicInfoChange = (field: keyof ProfileData, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  // Education handling
  const handleEducationChange = (index: number, key: keyof EducationItem, value: string) => {
    const updated = [...profile.education];
    updated[index][key] = value;
    setProfile({ ...profile, education: updated });
  };
  const addEducation = () =>
    setProfile({
      ...profile,
      education: [...profile.education, { degree: "", institute: "", year: "" }],
    });
  const deleteEducation = (index: number) =>
    setProfile({ ...profile, education: profile.education.filter((_, i) => i !== index) });

  // Experience handling
  const handleExperienceChange = (index: number, key: keyof ExperienceItem, value: string) => {
    const updated = [...profile.experience];
    updated[index][key] = value;
    setProfile({ ...profile, experience: updated });
  };
  const addExperience = () =>
    setProfile({
      ...profile,
      experience: [...profile.experience, { title: "", company: "", duration: "" }],
    });
  const deleteExperience = (index: number) =>
    setProfile({ ...profile, experience: profile.experience.filter((_, i) => i !== index) });

  // Skills handling
  const handleSkillChange = (index: number, value: string) => {
    const updated = [...profile.skills];
    updated[index] = value;
    setProfile({ ...profile, skills: updated });
  };
  const addSkill = () => setProfile({ ...profile, skills: [...profile.skills, ""] });
  const deleteSkill = (index: number) =>
    setProfile({ ...profile, skills: profile.skills.filter((_, i) => i !== index) });

  // Certificates handling
  const handleCertificateChange = (index: number, key: keyof CertificateItem, value: string) => {
    const updated = [...profile.certificates];
    updated[index][key] = value;
    setProfile({ ...profile, certificates: updated });
  };
  const addCertificate = () =>
    setProfile({
      ...profile,
      certificates: [...profile.certificates, { name: "", issuer: "", date: "", credentialId: "" }],
    });
  const deleteCertificate = (index: number) =>
    setProfile({ ...profile, certificates: profile.certificates.filter((_, i) => i !== index) });

  // Download CV as PDF - Uses current state (includes any unsaved changes user made)
  const handleDownloadCV = () => {
    try {
      // Use current profile state - this includes any edits user made (saved or unsaved)
      // This way CV always reflects what user currently sees on screen
      const currentProfile = {
        name: profile.name || "Professional",
        email: profile.email || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        education: Array.isArray(profile.education) ? profile.education : [],
        experience: Array.isArray(profile.experience) ? profile.experience : [],
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        certificates: Array.isArray(profile.certificates) ? profile.certificates : []
      };
      
      console.log("📄 Generating CV with current profile state:", currentProfile);
      generateCVPDF(currentProfile);
      
      setStatusMsg({ 
        text: "✅ CV downloaded successfully with current profile data!", 
        type: "success" 
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setStatusMsg({ text: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error generating CV:", error);
      setStatusMsg({ 
        text: "Error generating CV. Please try again.", 
        type: "error" 
      });
    }
  };

  return (
    <div className="min-h-screen gradient-subtle flex flex-col items-center py-10 px-4">
      <div className="glass shadow-lg rounded-2xl p-8 w-full max-w-3xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Profile</h1>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadCV}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
              title="Download CV with latest profile data"
            >
              <Download className="w-5 h-5" /> Download CV
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMsg.text && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              statusMsg.type === "success"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Upload Section */}
        <div className="flex items-center gap-4 mb-6">
          <input
            type="file"
            accept=".pdf"
            onChange={handleResumeUpload}
            className="hidden"
            id="resumeUpload"
          />
          <label
            htmlFor="resumeUpload"
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" /> Upload Resume
              </>
            )}
          </label>
        </div>

        {/* Basic Info */}
        {["name", "email", "phone", "bio"].map((field) => (
          <div key={field} className="mb-4">
            <label className="block text-neutral-700 dark:text-neutral-300 font-medium capitalize mb-1">
              {field}
            </label>
            <input
              type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
              className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 glass outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={(profile as any)[field] || ""}
              onChange={(e) => handleBasicInfoChange(field as keyof ProfileData, e.target.value)}
              placeholder={field === "bio" ? "Enter your professional bio..." : `Enter your ${field}...`}
            />
          </div>
        ))}

        {/* Education */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Education</h2>
            <button
              onClick={addEducation}
              className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <PlusCircle className="w-4 h-4" /> Add
            </button>
          </div>
          {profile.education.length === 0 ? (
            <p className="text-neutral-400 dark:text-neutral-500 text-sm italic">No education added yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.education.map((edu, index) => (
                <div
                  key={index}
                  className="border border-neutral-200 dark:border-neutral-800 glass rounded-lg p-3 flex flex-col gap-2"
                >
                  <input
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) =>
                      handleEducationChange(index, "degree", e.target.value)
                    }
                    className="outline-none bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 text-neutral-900 dark:text-neutral-50 font-medium"
                  />
                  <input
                    placeholder="Institute"
                    value={edu.institute}
                    onChange={(e) =>
                      handleEducationChange(index, "institute", e.target.value)
                    }
                    className="outline-none bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 text-neutral-700 dark:text-neutral-300"
                  />
                  <input
                    placeholder="Year / Duration"
                    value={edu.year}
                    onChange={(e) =>
                      handleEducationChange(index, "year", e.target.value)
                    }
                    className="outline-none bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 text-neutral-700 dark:text-neutral-300"
                  />
                  <button
                    onClick={() => deleteEducation(index)}
                    className="text-red-500 hover:text-red-700 text-sm self-end flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Experience */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-800">Experience</h2>
            <button
              onClick={addExperience}
              className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <PlusCircle className="w-4 h-4" /> Add
            </button>
          </div>
          {profile.experience.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No experience added yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.experience.map((exp, index) => (
                <div
                  key={index}
                  className="border border-neutral-200 dark:border-neutral-800 glass rounded-lg p-3 flex flex-col gap-2"
                >
                  <input
                    placeholder="Job Title"
                    value={exp.title}
                    onChange={(e) =>
                      handleExperienceChange(index, "title", e.target.value)
                    }
                    className="outline-none bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 text-neutral-900 dark:text-neutral-50 font-medium"
                  />
                  <input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) =>
                      handleExperienceChange(index, "company", e.target.value)
                    }
                    className="outline-none bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 text-neutral-700 dark:text-neutral-300"
                  />
                  <input
                    placeholder="Year / Duration"
                    value={exp.duration}
                    onChange={(e) =>
                      handleExperienceChange(index, "duration", e.target.value)
                    }
                    className="outline-none bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 text-neutral-700 dark:text-neutral-300"
                  />
                  <button
                    onClick={() => deleteExperience(index)}
                    className="text-red-500 hover:text-red-700 text-sm self-end flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-800">Skills</h2>
            <button
              onClick={addSkill}
              className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <PlusCircle className="w-4 h-4" /> Add
            </button>
          </div>
          {profile.skills.length === 0 ? (
            <p className="text-neutral-400 dark:text-neutral-500 text-sm italic">No skills added yet.</p>
          ) : (
            <ul className="space-y-2">
              {profile.skills.map((skill, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center border border-neutral-200 dark:border-neutral-800 glass rounded-lg px-3 py-2"
                >
                  <input
                    value={skill}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                  />
                  <button
                    onClick={() => deleteSkill(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Certificates */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Certificates</h2>
            <button
              onClick={addCertificate}
              className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <PlusCircle className="w-4 h-4" /> Add
            </button>
          </div>
          {profile.certificates.length === 0 ? (
            <p className="text-neutral-400 dark:text-neutral-500 text-sm italic">No certificates added yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.certificates.map((cert, index) => (
                <div
                  key={index}
                  className="border border-neutral-200 dark:border-neutral-800 glass rounded-lg p-3 flex flex-col gap-2"
                >
                  <input
                    placeholder="Certificate Name"
                    value={cert.name}
                    onChange={(e) =>
                      handleCertificateChange(index, "name", e.target.value)
                    }
                    className="outline-none bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 text-neutral-900 dark:text-neutral-50 font-medium"
                  />
                  <input
                    placeholder="Issuing Organization"
                    value={cert.issuer}
                    onChange={(e) =>
                      handleCertificateChange(index, "issuer", e.target.value)
                    }
                    className="outline-none bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 text-neutral-700 dark:text-neutral-300"
                  />
                  <input
                    placeholder="Issue Date"
                    value={cert.date}
                    onChange={(e) =>
                      handleCertificateChange(index, "date", e.target.value)
                    }
                    className="outline-none bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 text-neutral-700 dark:text-neutral-300"
                  />
                  <input
                    placeholder="Credential ID (Optional)"
                    value={cert.credentialId || ""}
                    onChange={(e) =>
                      handleCertificateChange(index, "credentialId", e.target.value)
                    }
                    className="outline-none bg-transparent border-b border-neutral-300 dark:border-neutral-700 pb-1 text-neutral-600 dark:text-neutral-400 text-sm"
                  />
                  <button
                    onClick={() => deleteCertificate(index)}
                    className="text-red-500 hover:text-red-700 text-sm self-end flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
