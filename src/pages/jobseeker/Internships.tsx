import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LinkIcon,
  BriefcaseIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { DUMMY_INTERNSHIPS, DUMMY_JOBS } from '../../data/dummyData';
import { fetchInternships, searchInternships, JobData } from '../../services/apiService';

const Internships: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasResume, setHasResume] = useState<boolean | null>(null);

  const ITEMS_PER_PAGE = 10;

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

  const loadJobs = useCallback(async (page: number, append: boolean = false, search: string = '') => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Build query string for JSearch API
      const queryString = search.trim() || 'developer jobs';
      
      // Always try JSearch API first
      const searchParams = new URLSearchParams({
        query: queryString,
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });
      
      try {
        // Use the main latest endpoint with query parameters
        const url = `http://localhost:5000/api/jobs/latest?${searchParams.toString()}`;
        const apiResponse = await fetch(url);
        const apiData = await apiResponse.json();
        
        if (apiData.success && apiData.data) {
          response = apiData;
        } else {
          throw new Error('JSearch API failed');
        }
      } catch (jsearchError) {
        console.log('⚠️ JSearch API failed, trying fallback API...');
        
        // Fallback to old API methods
        if (search.trim()) {
          response = await searchInternships(search);
        } else {
          response = await fetchInternships(page, ITEMS_PER_PAGE);
        }
      }

      if (response.success && response.data) {
        if (append) {
          setJobs(prev => [...prev, ...(response.data || [])]);
        } else {
          setJobs(response.data || []);
        }
        setHasMore(response.data.length === ITEMS_PER_PAGE);
        setLastUpdated(new Date());
        console.log('✅ Loaded jobs:', response.data.length);
      } else {
        // Fallback to dummy data if API fails
        console.warn('⚠️ API failed, using dummy data:', response.error);
        const fallbackData = [...DUMMY_INTERNSHIPS, ...DUMMY_JOBS.filter(job => job.type === 'internship')];
        setJobs(fallbackData);
        setError('Using sample data - API connection failed');
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Error loading jobs:', err);
      const fallbackData = [...DUMMY_INTERNSHIPS, ...DUMMY_JOBS.filter(job => job.type === 'internship')];
      setJobs(fallbackData);
      setError('Using sample data - Network error');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    loadJobs(1, false, searchTerm);
  }, [searchTerm, loadJobs]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadJobs(nextPage, true, searchTerm);
  };

  const handleApply = async (url: string | undefined, e: React.MouseEvent, jobId?: string) => {
    e.stopPropagation(); // Prevent card click from triggering
    if (url) {
      window.open(url, '_blank');
      return;
    }
    // Internal job application (no URL)
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id;
      if (!userId) {
        alert('Please login to apply');
        return;
      }
      if (!jobId) {
        alert('Invalid job');
        return;
      }
      
      // ✅ Check if user has uploaded resume
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
      
      const res = await fetch('http://localhost:5000/api/jobs/apply', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ jobId, userId }) 
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

  const handleJobClick = (id: string) => {
    navigate(`/internships/${id}`);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadJobs(1, false, searchTerm);
  };

  const handleSaveJob = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering
    
    setSavedJobs(prev => {
      if (prev.includes(jobId)) {
        // Remove from saved jobs
        const updated = prev.filter(id => id !== jobId);
        localStorage.setItem('savedJobs', JSON.stringify(updated));
        return updated;
      } else {
        // Add to saved jobs
        const updated = [...prev, jobId];
        localStorage.setItem('savedJobs', JSON.stringify(updated));
        return updated;
      }
    });
  };

  // Load saved jobs from localStorage on component mount
  useEffect(() => {
    const savedJobsFromStorage = localStorage.getItem('savedJobs');
    if (savedJobsFromStorage) {
      try {
        setSavedJobs(JSON.parse(savedJobsFromStorage));
      } catch (error) {
        console.error('Error loading saved jobs:', error);
      }
    }
  }, []);

  // Check if user has resume on component mount
  useEffect(() => {
    const checkResume = async () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id;
      if (userId) {
        const hasResume = await checkResumeExists(userId);
        setHasResume(hasResume);
      }
    };
    checkResume();
  }, []);

  // Use jobs directly since we removed filters
  const filteredJobs = jobs;


  return (
    <div className="pb-6 pt-2 px-6 max-w-7xl mx-auto space-y-8 min-h-screen" style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            <span className="text-saas-cyan">
              Find Your Dream Job
            </span>
          </h1>
          {savedJobs.length > 0 && (
            <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
              <StarIcon className="h-4 w-4 mr-1 fill-current text-yellow-500" />
              {savedJobs.length} saved
            </div>
          )}
        </div>
        <p className="text-xl text-saas-text-heading-secondary max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
          Find your perfect role from thousands of opportunities. Your next career move starts here.
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          
          {lastUpdated && (
            <div className="mb-4 text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
              Last updated: {lastUpdated.toLocaleTimeString()} | {jobs.length} opportunities available
              {jobs.some(job => job.id.includes('jsearch')) && (
                <span className="ml-2 px-2 py-1 bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 rounded text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  JSearch Powered
                </span>
              )}
            </div>
          )}

          <div className="flex gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-saas-text-heading-secondary" />
              <input
                type="text"
                placeholder="Search jobs by title, company, or technology..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRefresh()}
                className="w-full pl-10 pr-4 py-2 border border-saas-cyan/30 rounded-lg bg-white text-saas-text-heading placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#22D3EE] focus:border-transparent"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            {/* Search/Refresh Button */}
            <Button 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center px-6"
            >
              {loading ? (
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-saas-text-heading" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {loading ? 'Loading...' : `${filteredJobs.length} Opportunities Found`}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && jobs.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-3">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-saas-cyan" />
              <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Loading opportunities...</span>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="h-full"
              >
                <Card 
                  className="p-6 h-full flex flex-col cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" 
                  onClick={() => handleJobClick(job.id)}
                  hover
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-saas-text-heading hover:text-saas-cyan transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {job.title}
                        </h3>
                        {job.id.startsWith('db-') && (
                          <span className="px-2 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 text-xs font-medium rounded" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Platform
                          </span>
                        )}
                        {job.id.includes('jsearch') && !job.id.startsWith('db-') && (
                          <span className="px-2 py-1 bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 text-xs font-medium rounded" style={{ fontFamily: 'Inter, sans-serif' }}>
                            JSearch
                          </span>
                        )}
                      </div>
                      <p className="text-saas-cyan font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {job.company}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        job.type === 'internship' 
                          ? 'bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30'
                          : job.type === 'part-time'
                          ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                          : 'bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30'
                      }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                        {job.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <div className="flex items-center text-saas-text-heading-secondary">
                      <MapPinIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center text-saas-text-heading-secondary">
                      <CalendarIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                      <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center text-saas-text-heading-secondary">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-[#22C55E]" />
                        <span className="truncate">{job.salary}</span>
                      </div>
                    )}
                    <div className="flex items-center text-saas-text-heading-secondary">
                      <BriefcaseIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                      <span className="truncate">{job.experience || 'Entry Level'}</span>
                    </div>
                  </div>

                  <p className="text-saas-text-heading text-sm mb-4 line-clamp-3 flex-grow" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {job.description}
                  </p>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.skills.slice(0, 4).map((skill, skillIndex) => (
                        <span 
                          key={skillIndex} 
                          className="bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 px-2 py-1 rounded text-xs"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 4 && (
                        <span className="bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 px-2 py-1 rounded text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                          +{job.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* JSearch specific info */}
                  {job.id.includes('jsearch') && (job.employerLogo || job.jobPublisher) && (
                    <div className="mb-4 p-3 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg">
                      <div className="text-xs text-[#22C55E] space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {job.jobPublisher && (
                          <div>
                            <span className="font-medium">Source:</span>
                            <span className="ml-2">{job.jobPublisher}</span>
                          </div>
                        )}
                        {job.jobCity && job.jobCountry && (
                          <div>
                            <span className="font-medium">Location:</span>
                            <span className="ml-2">{job.jobCity}, {job.jobCountry}</span>
                          </div>
                        )}
                        {job.employerLogo && (
                          <div className="flex items-center">
                            <span className="font-medium">Company Logo:</span>
                            <img 
                              src={job.employerLogo} 
                              alt="Company Logo" 
                              className="ml-2 h-4 w-4 object-contain"
                              onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-auto">
                    {hasResume === false && !job.url && (
                      <div className="flex-1 mb-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                        ⚠️ Upload resume to apply
                      </div>
                    )}
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => handleApply(job.url as any, e, job.id)}
                      disabled={hasResume === false && !job.url}
                      title={hasResume === false && !job.url ? 'Please upload your resume first' : ''}
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      {hasResume === false && !job.url ? 'Upload Resume' : 'Apply Now'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => handleSaveJob(job.id, e)}
                      className={savedJobs.includes(job.id) ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' : ''}
                    >
                      <StarIcon className={`h-4 w-4 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-saas-text-heading-secondary text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              No jobs found
            </h3>
            <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
              Try adjusting your search criteria or filters
            </p>
          </motion.div>
        )}

        {/* Load More Button */}
        {hasMore && filteredJobs.length > 0 && (
          <div className="text-center mt-8">
            <Button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-8 py-3 text-lg flex items-center mx-auto"
            >
              {loading ? (
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <PlusIcon className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Loading...' : 'Load More Opportunities'}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Internships;