import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Upload, Save, Trash2, PlusCircle, Loader2, Download, Camera } from "lucide-react";
import { motion } from 'framer-motion';
import { generateCVPDF } from "../../services/pdfService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import CircularProgress from "../../components/ui/CircularProgress";
import { useAuth } from "../../context/AuthContext";
import {
  fetchUserScores,
  UserScores,
  analyzeResume,
  getDashboardRecommendations,
  DashboardRecommendations
} from "../../services/apiService";
import {
  ChartBarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  StarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

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

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  bio: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: string[];
  certificates: CertificateItem[];
};

const ProfileMerged: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    education: [],
    experience: [],
    skills: [],
    certificates: [],
  });

  const [scores, setScores] = useState<UserScores | null>(null);
  const [ragData, setRagData] = useState<DashboardRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [ragLoading, setRagLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const [counters, setCounters] = useState({
    applications: 0,
    interviews: 0,
    offers: 0,
    profile_views: 0,
  });

  const userId = user?._id || user?.id || JSON.parse(localStorage.getItem('user') || '{}')._id || JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    if (userId) {
      loadProfileFromDB();
      loadScores();
      loadCounters();
      loadDashboardRecommendations();
    }
  }, [userId]);

  const loadProfileFromDB = async () => {
    try {
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
        });
        setProfilePicture(existingProfile.profile_picture || null);
      }
      
      // Also load profile picture from user object in localStorage
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.profilePicture) {
            setProfilePicture(user.profilePicture);
          }
        }
      } catch (err) {
        console.log("Error loading user from localStorage:", err);
      }
    } catch (err) {
      console.log("Error loading profile:", err);
    }
  };

  const loadScores = async () => {
    try {
      const response = await fetchUserScores(userId);
      if (response.success && response.data) {
        setScores(response.data);
      }
    } catch (err) {
      console.error('Error loading scores:', err);
    }
  };

  const loadCounters = async () => {
    try {
      const countersRes = await fetch(`http://localhost:5000/api/recruiter/counters/${userId}`);
      const countersData = await countersRes.json();
      if (countersData.success) {
        setCounters({
          applications: countersData.data.applications || 0,
          interviews: countersData.data.interviews || 0,
          offers: countersData.data.offers || 0,
          profile_views: countersData.data.profile_views || 0,
        });
      }
    } catch (e) {
      console.warn('Counters load failed:', e);
    }
  };

  const loadDashboardRecommendations = async () => {
    try {
      setRagLoading(true);
      const response = await getDashboardRecommendations(userId);
      if (response.success && response.data) {
        setRagData(response);
      }
    } catch (err) {
      console.error('Error loading dashboard recommendations:', err);
    } finally {
      setRagLoading(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);
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
      const parsed = data.data || {};

      setProfile({
        name: parsed.personalInfo?.name || "",
        email: parsed.personalInfo?.email || "",
        phone: parsed.personalInfo?.phone || "",
        bio: parsed.personalInfo?.bio || "",
        education: parsed.education?.map((edu: any) => ({
          degree: edu.degree || "",
          institute: edu.institute || "",
          year: edu.year || "",
        })) || [],
        experience: parsed.experience?.map((exp: any) => ({
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
      });

      setStatusMsg({ text: "✅ Resume uploaded!", type: "success" });
    } catch (err) {
      console.error("❌ Error parsing resume:", err);
      setStatusMsg({ text: "Error parsing resume. Try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setStatusMsg({ text: "", type: "" });

    try {
      const response = await fetch("http://localhost:5000/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        await loadProfileFromDB();
        
        try {
          const analysisResponse = await fetch(`http://localhost:5000/api/scores/${userId}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            setScores(analysisData.data);
            setStatusMsg({ text: "✅ Profile saved! Analysis completed.", type: "success" });
          }
        } catch (analysisErr) {
          setStatusMsg({ text: "✅ Profile saved! Analysis will update shortly.", type: "success" });
        }
      } else {
        throw new Error(data.error || "Failed to save profile");
      }
    } catch (err) {
      console.error("❌ Error saving profile:", err);
      setStatusMsg({ text: "Error saving profile. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleReAnalyze = async () => {
    try {
      setAnalyzing(true);
      const response = await analyzeResume(userId);
      if (response.success && response.data) {
        setScores(response.data);
      }
    } catch (err) {
      console.error('Error analyzing:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!profilePicture || !userId) return;

    if (!window.confirm('Are you sure you want to delete your profile picture? This action cannot be undone.')) {
      return;
    }

    setUploadingPicture(true);
    setStatusMsg({ text: "", type: "" });

    try {
      const response = await fetch(`http://localhost:5000/api/profile/delete-picture`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Delete response:", data);

      if (data.success) {
        setProfilePicture(null);
        
        // Update user in localStorage and trigger auth change
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            user.profilePicture = null;
            localStorage.setItem('user', JSON.stringify(user));
            window.dispatchEvent(new Event("authChange"));
          } catch (err) {
            console.error("Error updating user in localStorage:", err);
          }
        }
        
        setStatusMsg({ text: "✅ Profile picture deleted successfully!", type: "success" });
        setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
      } else {
        throw new Error(data.error || "Failed to delete profile picture");
      }
    } catch (err: any) {
      console.error("Error deleting profile picture:", err);
      setStatusMsg({ text: `Error: ${err.message || "Failed to delete profile picture. Please try again."}`, type: "error" });
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Get userId fresh from user context or localStorage
    const currentUserId = user?._id || user?.id || JSON.parse(localStorage.getItem('user') || '{}')._id || JSON.parse(localStorage.getItem('user') || '{}').id;
    
    if (!currentUserId) {
      setStatusMsg({ text: "Error: User ID not found. Please log in again.", type: "error" });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setStatusMsg({ text: "Please select an image file", type: "error" });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ text: "Image size must be less than 5MB", type: "error" });
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);
    formData.append('userId', currentUserId);
    
    console.log("Uploading profile picture for userId:", currentUserId);

    setUploadingPicture(true);
    setStatusMsg({ text: "", type: "" });

    try {
      const response = await fetch('http://localhost:5000/api/profile/upload-picture', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Upload response:", data);

      if (data.success) {
        const pictureUrl = data.profilePicture;
        console.log("Upload response data:", data);
        console.log("Setting profile picture to:", pictureUrl);
        console.log("Full image URL will be:", pictureUrl.startsWith('http') ? pictureUrl : `http://localhost:5000${pictureUrl}`);
        
        // Ensure the URL is correct
        const fullUrl = pictureUrl.startsWith('http') ? pictureUrl : `http://localhost:5000${pictureUrl}`;
        
        // Test if image loads
        const testImg = new Image();
        testImg.onload = () => {
          console.log("✅ Image test load successful:", fullUrl);
          setProfilePicture(pictureUrl);
        };
        testImg.onerror = () => {
          console.error("❌ Image test load failed:", fullUrl);
          setStatusMsg({ text: "⚠️ Image uploaded but failed to load. Please refresh the page.", type: "error" });
          setProfilePicture(pictureUrl); // Set it anyway, might work on refresh
        };
        testImg.src = fullUrl;
        
        // Update user in localStorage and trigger auth change
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            user.profilePicture = pictureUrl;
            localStorage.setItem('user', JSON.stringify(user));
            window.dispatchEvent(new Event("authChange"));
          } catch (err) {
            console.error("Error updating user in localStorage:", err);
          }
        }
        
        setStatusMsg({ text: "✅ Profile picture updated successfully!", type: "success" });
        setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
      } else {
        throw new Error(data.error || "Failed to upload profile picture");
      }
    } catch (err: any) {
      console.error("Error uploading profile picture:", err);
      setStatusMsg({ text: `Error: ${err.message || "Failed to upload profile picture. Please try again."}`, type: "error" });
    } finally {
      setUploadingPicture(false);
      // Reset file input so same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadCV = () => {
    try {
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
      
      generateCVPDF(currentProfile);
      setStatusMsg({ text: "✅ CV downloaded successfully!", type: "success" });
      setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error generating CV:", error);
      setStatusMsg({ text: "Error generating CV. Please try again.", type: "error" });
    }
  };

  const handleBasicInfoChange = (field: keyof ProfileData, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleEducationChange = (index: number, key: keyof EducationItem, value: string) => {
    const updated = [...profile.education];
    updated[index][key] = value;
    setProfile({ ...profile, education: updated });
  };
  const addEducation = () =>
    setProfile({ ...profile, education: [...profile.education, { degree: "", institute: "", year: "" }] });
  const deleteEducation = (index: number) =>
    setProfile({ ...profile, education: profile.education.filter((_, i) => i !== index) });

  const handleExperienceChange = (index: number, key: keyof ExperienceItem, value: string) => {
    const updated = [...profile.experience];
    updated[index][key] = value;
    setProfile({ ...profile, experience: updated });
  };
  const addExperience = () =>
    setProfile({ ...profile, experience: [...profile.experience, { title: "", company: "", duration: "" }] });
  const deleteExperience = (index: number) =>
    setProfile({ ...profile, experience: profile.experience.filter((_, i) => i !== index) });

  const handleSkillChange = (index: number, value: string) => {
    const updated = [...profile.skills];
    updated[index] = value;
    setProfile({ ...profile, skills: updated });
  };
  const addSkill = () => setProfile({ ...profile, skills: [...profile.skills, ""] });
  const deleteSkill = (index: number) =>
    setProfile({ ...profile, skills: profile.skills.filter((_, i) => i !== index) });

  const handleCertificateChange = (index: number, key: keyof CertificateItem, value: string) => {
    const updated = [...profile.certificates];
    updated[index][key] = value;
    setProfile({ ...profile, certificates: updated });
  };
  const addCertificate = () =>
    setProfile({ ...profile, certificates: [...profile.certificates, { name: "", issuer: "", date: "", credentialId: "" }] });
  const deleteCertificate = (index: number) =>
    setProfile({ ...profile, certificates: profile.certificates.filter((_, i) => i !== index) });

  const skillCategories = scores ? [
    { name: 'Education', score: scores.education_score, color: '#8b5cf6' },
    { name: 'Future Readiness', score: scores.future_readiness_score, color: '#06b6d4' },
    { name: 'Skills Readiness', score: scores.skills_readiness_score, color: '#10b981' },
    { name: 'Geographic', score: scores.geographic_score, color: '#f59e0b' },
  ] : [];

  const stats = [
    { label: 'Profile Views', value: counters.profile_views, icon: ChartBarIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Applications', value: counters.applications, icon: BriefcaseIcon, color: 'from-green-500 to-green-600' },
    { label: 'Interviews', value: counters.interviews, icon: AcademicCapIcon, color: 'from-purple-500 to-purple-600' },
    { label: 'Offers', value: counters.offers, icon: StarIcon, color: 'from-yellow-500 to-yellow-600' },
  ];

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    const fields = {
      name: profile.name.trim() ? 1 : 0,
      email: profile.email.trim() ? 1 : 0,
      phone: profile.phone.trim() ? 1 : 0,
      bio: profile.bio.trim() ? 1 : 0,
      education: profile.education.length > 0 ? 1 : 0,
      experience: profile.experience.length > 0 ? 1 : 0,
      skills: profile.skills.filter(s => s.trim()).length > 0 ? 1 : 0,
      certificates: profile.certificates.length > 0 ? 1 : 0,
    };
    
    const totalFields = Object.keys(fields).length;
    const completedFields = Object.values(fields).reduce((sum, val) => sum + val, 0);
    const percentage = Math.round((completedFields / totalFields) * 100);
    
    return { percentage, fields, completedFields, totalFields };
  };

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 pb-6 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Profile Setup */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              {/* Profile Picture Section */}
              <div className="mb-6 pb-6 border-b border-saas-cyan/20">
                <label className="block text-sm font-semibold text-saas-text-heading mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {profilePicture ? (
                      <img
                        key={`${profilePicture}_${Date.now()}`} // Force re-render with timestamp
                        src={profilePicture.startsWith('http') ? profilePicture : profilePicture.startsWith('/') ? `http://localhost:5000${profilePicture}` : `http://localhost:5000/${profilePicture}`}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-saas-cyan/30"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error("Error loading profile picture:", {
                            src: target.src,
                            profilePicture: profilePicture,
                            attemptedUrl: profilePicture.startsWith('http') ? profilePicture : `http://localhost:5000${profilePicture}`
                          });
                          // Set state to null so fallback shows
                          setProfilePicture(null);
                        }}
                        onLoad={() => {
                          console.log("Profile picture loaded successfully:", profilePicture);
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#22D3EE] to-[#A855F7] flex items-center justify-center border-4 border-saas-cyan/30">
                        <span className="text-white font-bold text-2xl">
                          {profile.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    {uploadingPicture && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      disabled={uploadingPicture}
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPicture}
                        className="px-4 py-2 btn-primary-glacier rounded-lg transition flex items-center space-x-2 cursor-pointer"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <Upload className="w-4 h-4" />
                        <span>{uploadingPicture ? 'Uploading...' : 'Upload Picture'}</span>
                      </button>
                      {profilePicture && (
                        <button
                          type="button"
                          onClick={handleDeleteProfilePicture}
                          disabled={uploadingPicture}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:opacity-50 text-white rounded-lg transition-all flex items-center space-x-2 cursor-pointer font-semibold shadow-lg hover:shadow-xl"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Picture</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-saas-text-heading-secondary mt-2">
                      JPG, PNG or GIF. Max size 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-saas-text-heading">Profile Setup</h1>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadCV}
                    className="flex items-center gap-2 btn-primary-glacier px-4 py-2 rounded-lg transition"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <Download className="w-5 h-5" /> Download CV
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 btn-primary-glacier disabled:opacity-50 px-4 py-2 rounded-lg transition"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Profile Completion Indicator */}
              <div className="mb-6 p-4 glass-card rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-saas-cyan/20 border border-saas-cyan/30 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="h-6 w-6 text-saas-cyan" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-saas-text-heading">Profile Completion</h3>
                      <p className="text-xs text-saas-text-heading-secondary">
                        {profileCompletion.completedFields} of {profileCompletion.totalFields} sections completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-saas-cyan" style={{ fontFamily: 'Inter, sans-serif' }}>{profileCompletion.percentage}%</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-saas-cyan/10 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${profileCompletion.percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{ backgroundColor: '#22D3EE' }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className={`flex items-center space-x-1 ${profileCompletion.fields.name ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'}`}>
                    <CheckCircleIcon className={`h-4 w-4 ${profileCompletion.fields.name ? 'text-saas-cyan' : 'text-saas-text-heading-secondary opacity-50'}`} />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Name</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${profileCompletion.fields.email ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'}`}>
                    <CheckCircleIcon className={`h-4 w-4 ${profileCompletion.fields.email ? 'text-saas-cyan' : 'text-saas-text-heading-secondary opacity-50'}`} />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Email</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${profileCompletion.fields.bio ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'}`}>
                    <CheckCircleIcon className={`h-4 w-4 ${profileCompletion.fields.bio ? 'text-saas-cyan' : 'text-saas-text-heading-secondary opacity-50'}`} />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Bio</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${profileCompletion.fields.education ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'}`}>
                    <CheckCircleIcon className={`h-4 w-4 ${profileCompletion.fields.education ? 'text-saas-cyan' : 'text-saas-text-heading-secondary opacity-50'}`} />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Education</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${profileCompletion.fields.experience ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'}`}>
                    <CheckCircleIcon className={`h-4 w-4 ${profileCompletion.fields.experience ? 'text-saas-cyan' : 'text-saas-text-heading-secondary opacity-50'}`} />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Experience</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${profileCompletion.fields.skills ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'}`}>
                    <CheckCircleIcon className={`h-4 w-4 ${profileCompletion.fields.skills ? 'text-saas-cyan' : 'text-saas-text-heading-secondary opacity-50'}`} />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Skills</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${profileCompletion.fields.certificates ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'}`}>
                    <CheckCircleIcon className={`h-4 w-4 ${profileCompletion.fields.certificates ? 'text-saas-cyan' : 'text-saas-text-heading-secondary opacity-50'}`} />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Certificates</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${profileCompletion.fields.phone ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'}`}>
                    <CheckCircleIcon className={`h-4 w-4 ${profileCompletion.fields.phone ? 'text-saas-cyan' : 'text-saas-text-heading-secondary opacity-50'}`} />
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>Phone</span>
                  </div>
                </div>
              </div>

              {statusMsg.text && (
                <div className={`mb-4 p-3 rounded-md text-sm ${
                  statusMsg.type === "success"
                    ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30"
                    : "bg-red-900/20 text-red-400 border border-red-500/30"
                }`}>
                  {statusMsg.text}
                </div>
              )}

              {/* Upload Section */}
              <div className="mb-6">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                  id="resumeUpload"
                />
                <label
                  htmlFor="resumeUpload"
                  className="cursor-pointer btn-primary-glacier px-4 py-2 rounded-lg flex items-center gap-2 inline-block"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  {loading ? 'Uploading...' : 'Upload Resume'}
                </label>
              </div>

              {/* Basic Info */}
              {["name", "email", "phone", "bio"].map((field) => (
                <div key={field} className="mb-4">
                  <label className="block text-saas-text-heading font-medium capitalize mb-1">
                    {field}
                  </label>
                  {field === "bio" ? (
                    <textarea
                      className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                      value={(profile as any)[field] || ""}
                      onChange={(e) => handleBasicInfoChange(field as keyof ProfileData, e.target.value)}
                      placeholder="Enter your professional bio..."
                      rows={4}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  ) : (
                    <input
                      type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                      className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                      value={(profile as any)[field] || ""}
                      onChange={(e) => handleBasicInfoChange(field as keyof ProfileData, e.target.value)}
                      placeholder={`Enter your ${field}...`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  )}
                </div>
              ))}

              {/* Education */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold text-saas-text-heading">Education</h2>
                  <button onClick={addEducation} className="flex items-center gap-1 text-sm text-saas-cyan hover:opacity-80 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <PlusCircle className="w-4 h-4" /> Add
                  </button>
                </div>
                {profile.education.length === 0 ? (
                  <p className="text-saas-text-heading-secondary text-sm italic">No education added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.education.map((edu, index) => (
                      <div key={index} className="border border-saas-border rounded-lg p-4 flex flex-col gap-3">
                        <input
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                          className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <input
                          placeholder="Institute"
                          value={edu.institute}
                          onChange={(e) => handleEducationChange(index, "institute", e.target.value)}
                          className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <input
                          placeholder="Year / Duration"
                          value={edu.year}
                          onChange={(e) => handleEducationChange(index, "year", e.target.value)}
                          className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <button onClick={() => deleteEducation(index)} className="text-red-400 hover:text-red-300 text-sm self-end flex items-center gap-1 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                  <h2 className="text-xl font-semibold text-saas-text-heading">Experience</h2>
                  <button onClick={addExperience} className="flex items-center gap-1 text-sm text-saas-cyan hover:opacity-80 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <PlusCircle className="w-4 h-4" /> Add
                  </button>
                </div>
                {profile.experience.length === 0 ? (
                  <p className="text-saas-text-heading-secondary text-sm italic">No experience added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.experience.map((exp, index) => (
                      <div key={index} className="border border-saas-border rounded-lg p-4 flex flex-col gap-3">
                        <input
                          placeholder="Job Title"
                          value={exp.title}
                          onChange={(e) => handleExperienceChange(index, "title", e.target.value)}
                          className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <input
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => handleExperienceChange(index, "company", e.target.value)}
                          className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <input
                          placeholder="Duration"
                          value={exp.duration}
                          onChange={(e) => handleExperienceChange(index, "duration", e.target.value)}
                          className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <button onClick={() => deleteExperience(index)} className="text-red-400 hover:text-red-300 text-sm self-end flex items-center gap-1 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                  <h2 className="text-xl font-semibold text-saas-text-heading">Skills</h2>
                  <button onClick={addSkill} className="flex items-center gap-1 text-sm text-saas-cyan hover:opacity-80 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <PlusCircle className="w-4 h-4" /> Add
                  </button>
                </div>
                {profile.skills.length === 0 ? (
                  <p className="text-saas-text-heading-secondary text-sm italic">No skills added yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {profile.skills.map((skill, index) => (
                      <li key={index} className="flex justify-between items-center gap-2">
                        <input
                          value={skill}
                          onChange={(e) => handleSkillChange(index, e.target.value)}
                          className="flex-1 border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <button onClick={() => deleteSkill(index)} className="text-red-400 hover:text-red-300 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                  <h2 className="text-xl font-semibold text-saas-text-heading">Certificates</h2>
                  <button onClick={addCertificate} className="flex items-center gap-1 text-sm text-saas-cyan hover:opacity-80 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <PlusCircle className="w-4 h-4" /> Add
                  </button>
                </div>
                {profile.certificates.length === 0 ? (
                  <p className="text-saas-text-heading-secondary text-sm italic">No certificates added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {profile.certificates.map((cert, index) => (
                      <div key={index} className="border border-saas-border rounded-lg p-4 flex flex-col gap-3">
                        <input
                          placeholder="Certificate Name"
                          value={cert.name}
                          onChange={(e) => handleCertificateChange(index, "name", e.target.value)}
                          className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <input
                          placeholder="Issuing Organization"
                          value={cert.issuer}
                          onChange={(e) => handleCertificateChange(index, "issuer", e.target.value)}
                          className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <input
                          placeholder="Issue Date"
                          value={cert.date}
                          onChange={(e) => handleCertificateChange(index, "date", e.target.value)}
                          className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <input
                          placeholder="Credential ID (Optional)"
                          value={cert.credentialId || ""}
                          onChange={(e) => handleCertificateChange(index, "credentialId", e.target.value)}
                          className="w-full border border-saas-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan input-glacier text-saas-text-heading transition-all"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <button onClick={() => deleteCertificate(index)} className="text-red-400 hover:text-red-300 text-sm self-end flex items-center gap-1 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Side - Live CV Preview */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-20 flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)', height: 'calc(100vh - 120px)', overflow: 'hidden', display: 'flex' }}>
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Live Preview</h3>
                <span className="text-xs text-saas-cyan bg-saas-cyan/20 border border-saas-cyan/30 px-2 py-1 rounded" style={{ fontFamily: 'Inter, sans-serif' }}>Live</span>
              </div>
              
              {/* CV Preview - Scrollable Container */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ minHeight: '0' }}>
                <div className="glass-card border-2 border-saas-cyan/30 rounded-lg p-8 shadow-xl" style={{ fontFamily: 'Georgia, serif' }}>
                {/* Header */}
                  <div className="border-b-4 border-saas-cyan/30 pb-4 mb-6">
                  <h1 className="text-3xl font-bold text-saas-text-heading mb-3 tracking-tight">
                    {profile.name || 'Your Name'}
                  </h1>
                  <div className="flex flex-wrap gap-4 text-sm text-saas-text-heading">
                    {profile.email && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-saas-text-heading-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {profile.email}
                      </span>
                    )}
                    {profile.phone && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-saas-text-heading-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {profile.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Professional Summary */}
                {profile.bio && (
                  <div className="mb-6">
                    <h2 className="text-base font-bold text-saas-text-heading uppercase tracking-wider border-b-2 border-saas-cyan/30 pb-2 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Professional Summary
                    </h2>
                    <p className="text-sm text-saas-text-heading leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Education */}
                {profile.education.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-base font-bold text-saas-text-heading uppercase tracking-wider border-b-2 border-saas-cyan/30 pb-2 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Education
                    </h2>
                    <div className="space-y-4">
                      {profile.education.map((edu, index) => (
                        <div key={index} className="pl-4 border-l-4 border-saas-cyan">
                          <p className="font-bold text-saas-text-heading text-sm mb-1">
                            {edu.degree || 'Degree'}
                          </p>
                          <p className="text-saas-text-heading text-sm italic">
                            {edu.institute || 'Institution'}
                          </p>
                          {edu.year && (
                            <p className="text-saas-text-heading-secondary text-xs mt-1 font-medium">{edu.year}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {profile.experience.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-base font-bold text-saas-text-heading uppercase tracking-wider border-b-2 border-saas-cyan/30 pb-2 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Experience
                    </h2>
                    <div className="space-y-4">
                      {profile.experience.map((exp, index) => (
                        <div key={index} className="pl-4 border-l-4 border-[#22C55E]">
                          <p className="font-bold text-saas-text-heading text-sm mb-1">
                            {exp.title || 'Job Title'}
                          </p>
                          <p className="text-saas-text-heading text-sm italic">
                            {exp.company || 'Company Name'}
                          </p>
                          {exp.duration && (
                            <p className="text-saas-text-heading-secondary text-xs mt-1 font-medium">{exp.duration}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {profile.skills.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-base font-bold text-saas-text-heading uppercase tracking-wider border-b-2 border-saas-cyan/30 pb-2 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.filter(s => s.trim()).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-saas-cyan/20 text-[#22D3EE] rounded text-xs font-medium border border-saas-cyan/30"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {skill}
                      </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificates */}
                {profile.certificates.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-base font-bold text-saas-text-heading uppercase tracking-wider border-b-2 border-saas-cyan/30 pb-2 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Certifications
                    </h2>
                    <div className="space-y-3">
                      {profile.certificates.map((cert, index) => (
                        <div key={index} className="pl-4 border-l-4 border-[#A855F7]">
                          <p className="font-bold text-saas-text-heading text-sm mb-1">
                            {cert.name || 'Certificate Name'}
                          </p>
                          <p className="text-saas-text-heading text-xs italic">
                            {cert.issuer || 'Issuing Organization'}
                            {cert.date && ` • ${cert.date}`}
                          </p>
                          {cert.credentialId && (
                            <p className="text-saas-text-heading-secondary text-xs mt-1 font-medium">Credential ID: {cert.credentialId}</p>
                          )}
                    </div>
                  ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!profile.name && !profile.email && profile.education.length === 0 && 
                 profile.experience.length === 0 && profile.skills.length === 0 && 
                 profile.certificates.length === 0 && (
                  <div className="text-center py-12 text-saas-text-heading-secondary">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-sm">Start filling your profile to see the preview</p>
                  </div>
                )}
                </div>
              </div>

              {/* Preview Footer */}
              <div className="mt-4 text-center flex-shrink-0 pt-4 border-t border-saas-cyan/20">
                <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                  This is how your CV will look when downloaded
                </p>
              </div>
            </div>
          </div>

          {/* AI Insights - Horizontal Professional Layout */}
          {scores && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3 mt-6"
            >
              <Card className="p-8 glass-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-saas-cyan/20 border border-saas-cyan/30 rounded-xl flex items-center justify-center shadow-lg">
                      <ChartBarIcon className="h-6 w-6 text-saas-cyan" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-saas-text-heading" style={{ fontFamily: 'JetBrains Mono, monospace' }}>AI Career Insights</h3>
                      <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Powered by advanced AI analysis</p>
                    </div>
                  </div>
                  {scores.ilo_level && scores.ilo_label && (
                    <div className="hidden md:flex items-center space-x-2 px-4 py-2 glass-card rounded-lg shadow-sm">
                      <div className="w-2 h-2 bg-saas-cyan rounded-full animate-pulse" style={{ boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)' }}></div>
                      <span className="text-sm font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                        ILO Level {scores.ilo_level}
                      </span>
                      <span className="text-xs text-saas-text-heading-secondary">•</span>
                      <span className="text-sm text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{scores.ilo_label}</span>
                    </div>
                  )}
                </div>

                {/* Check if user has profile data */}
                {(!profile.name || (!profile.education.length && !profile.experience.length && !profile.skills.length)) ? (
                  <div className="glass-card rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-saas-cyan/20 border border-saas-cyan/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChartBarIcon className="h-8 w-8 text-saas-cyan" />
                    </div>
                    <h4 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>No Analysis Available</h4>
                    <p className="text-sm text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Complete your profile (name, education, experience, or skills) to get AI-powered career insights.
                    </p>
                    <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                      All scores will show 0 until your profile is analyzed.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Analysis Summary */}
                      {scores.analysis_summary ? (
                        <div className="md:col-span-2 glass-card rounded-xl p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-saas-cyan/20 border border-saas-cyan/30 rounded-lg flex items-center justify-center">
                                <ChartBarIcon className="h-5 w-5 text-saas-cyan" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Career Analysis</h4>
                              <p className="text-saas-text-heading leading-relaxed text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {scores.analysis_summary}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="md:col-span-2 glass-card rounded-xl p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-saas-cyan/20 border border-saas-cyan/30 rounded-lg flex items-center justify-center">
                                <ChartBarIcon className="h-5 w-5 text-saas-cyan" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Career Analysis</h4>
                              <p className="text-saas-text-heading-secondary text-sm italic" style={{ fontFamily: 'Inter, sans-serif' }}>
                                Analysis will appear here after your profile is processed.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Key Metrics */}
                      <div className="glass-card rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-saas-text-heading mb-4">Key Metrics</h4>
                        <div className="space-y-4">
                          {scores.ilo_level && scores.ilo_label ? (
                            <div className="pb-4 border-b border-saas-cyan/20">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-saas-text-heading-secondary uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>ILO Classification</span>
                                <span className="text-xs font-bold text-saas-cyan" style={{ fontFamily: 'Inter, sans-serif' }}>Level {scores.ilo_level}</span>
                              </div>
                              <p className="text-sm text-saas-text-heading mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{scores.ilo_label}</p>
                            </div>
                          ) : (
                            <div className="pb-4 border-b border-saas-cyan/20">
                              <span className="text-xs font-medium text-saas-text-heading-secondary">ILO Classification: Not available</span>
                            </div>
                          )}
                          {scores.geographical_value ? (
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <MapPinIcon className="h-4 w-4 text-saas-cyan" />
                                <span className="text-xs font-medium text-saas-text-heading-secondary uppercase tracking-wide">Geographic Value</span>
                              </div>
                              <p className="text-sm text-saas-text-heading leading-relaxed">{scores.geographical_value}</p>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <MapPinIcon className="h-4 w-4 text-saas-text-heading-secondary" />
                                <span className="text-xs font-medium text-saas-text-heading-secondary uppercase tracking-wide">Geographic Value</span>
                              </div>
                              <p className="text-sm text-saas-text-heading-secondary italic">Not available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score Highlights */}
                    {skillCategories.length > 0 && (
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {skillCategories.map((category, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="glass-card rounded-lg p-4 hover:border-saas-cyan/50 transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{category.name}</span>
                              <span className="text-sm font-bold text-saas-cyan" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {category.score}%
                              </span>
                            </div>
                            <div className="w-full bg-saas-cyan/10 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${category.score}%`,
                                  backgroundColor: '#22D3EE'
                                }}
                              ></div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileMerged;

