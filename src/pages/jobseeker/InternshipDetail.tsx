import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  TagIcon,
  ArrowLeftIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { fetchSingleJob, JobData } from '../../services/apiService';

const InternshipDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasResume, setHasResume] = useState<boolean | null>(null);

  // Check if user has uploaded resume
  const checkResumeExists = async (userId: string): Promise<boolean> => {
    try {
      // Check if user has saved profile in database
      const profileRes = await fetch(`http://localhost:5000/api/profile/${userId}`);
      const profileData = await profileRes.json();
      if (profileData.success && profileData.data) {
        return true;
      }
      
      // Check for temporary resume data in localStorage
      const tempData = localStorage.getItem('tempResumeData');
      if (tempData) {
        const temp = JSON.parse(tempData);
        if (temp.profile && (temp.profile.name || temp.profile.skills?.length > 0)) {
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error checking resume:', err);
      // Check localStorage as fallback
      const tempData = localStorage.getItem('tempResumeData');
      return tempData !== null;
    }
  };

  useEffect(() => {
    const loadJob = async () => {
      if (!id) {
        setError("Job ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetchSingleJob(id);
        if (response.success && response.data && response.data.length > 0) {
          setJob(response.data[0]);
        } else {
          setError(response.error || "Job not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load job details.");
      } finally {
        setLoading(false);
      }
    };

    loadJob();
    
    // Check if user has resume
    const checkResume = async () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id;
      if (userId) {
        const hasResume = await checkResumeExists(userId);
        setHasResume(hasResume);
      }
    };
    
    checkResume();
  }, [id]);

  const handleApply = async () => {
    // If job has external URL, open it directly
    if (job?.url) {
      window.open(job.url, '_blank');
      return;
    }
    
    // For internal jobs, check if user has resume
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = currentUser._id || currentUser.id;
    
    if (!userId) {
      alert('Please login to apply');
      navigate('/login');
      return;
    }
    
    // Check if user has uploaded resume
    const hasResume = await checkResumeExists(userId);
    if (!hasResume) {
      const shouldGoToProfile = confirm(
        '⚠️ No Resume Uploaded\n\nPlease upload your resume first before applying to jobs.\n\nWould you like to go to the Profile page to upload your resume?'
      );
      if (shouldGoToProfile) {
        navigate('/profile');
      }
      return;
    }
    
    // Apply to internal job
    try {
      const res = await fetch('http://localhost:5000/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, userId })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('✅ Application submitted successfully!');
      } else if (res.status === 409) {
        alert('You already applied to this job');
      } else if (data.code === 'NO_RESUME' || data.error?.includes('resume')) {
        const shouldGoToProfile = confirm(
          `⚠️ ${data.error}\n\nWould you like to go to the Profile page to upload your resume?`
        );
        if (shouldGoToProfile) {
          navigate('/profile');
        }
      } else {
        alert(data.error || 'Failed to apply');
      }
    } catch (err) {
      alert('Network error applying to job');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22D3EE] mx-auto mb-4"></div>
          <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-saas-text-heading mb-4" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Error</h2>
          <p className="text-saas-text-heading-secondary mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
          <Button onClick={() => navigate(-1)} variant="secondary">
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-saas-text-heading mb-4" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Job Not Found</h2>
          <p className="text-saas-text-heading-secondary mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>The job you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/internships')} variant="primary">
            Browse All Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button 
          onClick={() => navigate('/internships')} 
          variant="outline" 
          className="flex items-center mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Jobs
        </Button>

        {/* Job Header */}
        <Card className="p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-saas-text-heading mb-3" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                {job.title}
              </h1>
              <h2 className="text-xl text-saas-cyan mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                {job.company}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2 neon-cyan" />
                  <span>{job.location} {job.remote && '(Remote)'}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 neon-cyan" />
                  <span>Posted: {new Date(job.postedDate).toLocaleDateString()}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-[#22C55E]" />
                    <span>{job.salary}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <BriefcaseIcon className="h-5 w-5 mr-2 neon-cyan" />
                  <span>Type: {job.type}</span>
                </div>
                {job.experience && (
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-2 neon-cyan" />
                    <span>Experience: {job.experience}</span>
                  </div>
                )}
                {job.industry && (
                  <div className="flex items-center">
                    <TagIcon className="h-5 w-5 mr-2 neon-cyan" />
                    <span>Industry: {job.industry}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {hasResume === false && (
                <div className="mb-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    ⚠️ <strong>No Resume Uploaded</strong><br />
                    Please upload your resume in the Profile section to apply.
                  </p>
                </div>
              )}
              <Button 
                onClick={handleApply} 
                className="flex items-center justify-center px-8 py-3 text-lg"
                size="lg"
                disabled={hasResume === false && !job?.url}
              >
                <LinkIcon className="h-5 w-5 mr-2" /> 
                {hasResume === false && !job?.url ? 'Upload Resume to Apply' : 'Apply Now'}
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center px-8 py-3"
              >
                <ClockIcon className="h-5 w-5 mr-2" /> Save Job
              </Button>
            </div>
          </div>
        </Card>

        {/* Job Description */}
        <Card className="p-6">
          <h3 className="text-2xl font-semibold mb-4 text-saas-cyan" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
            Job Description
          </h3>
          <div className="text-saas-text-heading leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>
            {job.description}
          </div>
        </Card>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <Card className="p-6">
            <h3 className="text-2xl font-semibold mb-4 text-saas-cyan" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
              Requirements
            </h3>
            <ul className="space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-start text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span className="neon-cyan mr-2">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <Card className="p-6">
            <h3 className="text-2xl font-semibold mb-4 text-saas-cyan" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
              Skills & Technologies
            </h3>
            <div className="flex flex-wrap gap-3">
              {job.skills.map((skill, index) => (
                <span 
                  key={index} 
                  className="bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Apply Section */}
        <Card className="p-6 glass-card">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4 text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
              Ready to Apply?
            </h3>
            {hasResume === false && !job?.url && (
              <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  ⚠️ <strong>No Resume Uploaded</strong>
                </p>
                <p className="text-sm text-saas-text-heading mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Please upload your resume in the Profile section before applying to jobs.
                </p>
                <Button 
                  onClick={() => navigate('/profile')}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Go to Profile Page
                </Button>
              </div>
            )}
            <p className="text-saas-text-heading-secondary mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              {hasResume === false && !job?.url 
                ? 'Upload your resume to apply for this position'
                : 'Click the button below to apply for this position'}
            </p>
            <Button 
              onClick={handleApply} 
              className="px-12 py-4 text-xl"
              size="lg"
              disabled={hasResume === false && !job?.url}
            >
              <LinkIcon className="h-6 w-6 mr-3" /> 
              {hasResume === false && !job?.url ? 'Upload Resume to Apply' : 'Apply Now'}
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default InternshipDetail;


