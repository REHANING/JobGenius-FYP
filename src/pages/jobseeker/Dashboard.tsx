import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  StarIcon,
  ArrowRightIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CircularProgress from '../../components/ui/CircularProgress';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchUserScores, 
  UserScores, 
  getDashboardRecommendations,
  VisaInformation,
  DashboardRecommendations,
  analyzeResume,
  getEducationRecommendations,
  EducationRecommendation,
  getFutureReadinessRecommendations,
  FutureReadinessRecommendation,
  getSkillsReadinessRecommendations,
  SkillsReadinessRecommendation,
  getGeographicRecommendations,
  GeographicCountry,
  getVisaInfoForCountry,
  getPersonalizedJobRecommendations,
  PersonalizedJobRecommendations,
  getPersonalizedCourseRecommendations,
  PersonalizedCourseRecommendations
} from '../../services/apiService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [analysisCount, setAnalysisCount] = useState<number>(0);
  const [analysisLimit, setAnalysisLimit] = useState<number>(0);
  const [remainingAnalyses, setRemainingAnalyses] = useState<number>(0);
  const [scores, setScores] = useState<UserScores | null>(null);
  const [ragData, setRagData] = useState<DashboardRecommendations | null>(null);
  const [personalizedJobs, setPersonalizedJobs] = useState<PersonalizedJobRecommendations | null>(null);
  const [personalizedCourses, setPersonalizedCourses] = useState<PersonalizedCourseRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [ragLoading, setRagLoading] = useState(true);
  const [loadingPersonalizedJobs, setLoadingPersonalizedJobs] = useState(false);
  const [loadingPersonalizedCourses, setLoadingPersonalizedCourses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [counters, setCounters] = useState({
    applications: 0,
    interviews: 0,
    offers: 0,
    profile_views: 0,
  });
  const [newItems, setNewItems] = useState({
    applications: 0,
    interviews: 0,
    offers: 0,
  });
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [educationRecommendations, setEducationRecommendations] = useState<EducationRecommendation | null>(null);
  const [loadingEducationRecs, setLoadingEducationRecs] = useState(false);
  const [showFutureReadinessModal, setShowFutureReadinessModal] = useState(false);
  const [futureReadinessRecommendations, setFutureReadinessRecommendations] = useState<FutureReadinessRecommendation | null>(null);
  const [loadingFutureReadinessRecs, setLoadingFutureReadinessRecs] = useState(false);
  const [showSkillsReadinessModal, setShowSkillsReadinessModal] = useState(false);
  const [skillsReadinessRecommendations, setSkillsReadinessRecommendations] = useState<SkillsReadinessRecommendation | null>(null);
  const [loadingSkillsReadinessRecs, setLoadingSkillsReadinessRecs] = useState(false);
  const [showGeographicModal, setShowGeographicModal] = useState(false);
  const [geographicCountries, setGeographicCountries] = useState<GeographicCountry[]>([]);
  const [loadingGeographicRecs, setLoadingGeographicRecs] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [visaInfo, setVisaInfo] = useState<VisaInformation | null>(null);
  const [loadingVisaInfo, setLoadingVisaInfo] = useState(false);
  const [topGeographicCountries, setTopGeographicCountries] = useState<GeographicCountry[]>([]);
  const [loadingTopGeographic, setLoadingTopGeographic] = useState(false);
  const [showAllJobsModal, setShowAllJobsModal] = useState(false);
  const [showAllCoursesModal, setShowAllCoursesModal] = useState(false);

  const applyDemoDashboardData = (userId: string) => {
    const now = new Date().toISOString();
    setScores({
      id: -1,
      user_id: userId,
      overall_score: 78,
      education_score: 82,
      future_readiness_score: 74,
      skills_readiness_score: 81,
      geographic_score: 69,
      profile_views: 128,
      applications_count: 12,
      interviews_count: 4,
      offers_count: 2,
      top_countries: ['United States', 'Canada', 'Germany'],
      geographical_value: 'Strong fit for North America and Europe markets.',
      analysis_summary: 'Demo analysis mode is active. Connect full backend services to refresh with live AI insights.',
      ilo_level: 3,
      ilo_label: 'Emerging Professional',
      created_at: now,
      updated_at: now,
    });
    setCounters({ applications: 12, interviews: 4, offers: 2, profile_views: 128 });
    setNewItems({ applications: 2, interviews: 1, offers: 1 });
    setError(null);
  };

  // Fetch user scores from database OR show temporary analysis
  useEffect(() => {
    const loadScores = async () => {
      // Get user ID from AuthContext only
      const currentUser = user;
      const userId = currentUser?._id || currentUser?.id;
      
      if (!userId) {
        console.log('❌ No user ID found:', { user, currentUser });
        applyDemoDashboardData('demo-user');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 Loading scores for user ID:', userId);
        
        // First, check database for saved scores (priority)
        const response = await fetchUserScores(userId);
        
        if (response.success && response.data && response.data.id) {
          // Valid saved scores from database
          console.log('✅ Scores loaded from database:', response.data);
          setScores(response.data);
          
          // Clear temp data if we have saved scores (profile was saved)
          if (localStorage.getItem("tempResumeData")) {
            localStorage.removeItem("tempResumeData");
          }
          
          // Check if scores are 0 (new user, no profile set yet)
          const isNewUser = response.data.overall_score === 0 && 
                            response.data.education_score === 0 &&
                            response.data.future_readiness_score === 0 &&
                            response.data.skills_readiness_score === 0 &&
                            response.data.geographic_score === 0;
          
          // Check if scores are default values (profile exists but no AI analysis done yet)
          const isDefaultScores = !isNewUser && 
                                  response.data.overall_score > 0 &&
                                  !response.data.analysis_summary &&
                                  !response.data.ilo_level;
          
          if (isDefaultScores) {
            console.log('📊 Default scores detected, triggering AI analysis...');
            try {
              const analysisResponse = await analyzeResume(userId);
              if (analysisResponse.success && analysisResponse.data) {
                console.log('✅ Analysis completed:', analysisResponse.data);
                setScores(analysisResponse.data);
              }
            } catch (analysisErr) {
              console.error('❌ Error during analysis:', analysisErr);
            }
          } else if (isNewUser) {
            console.log('📊 New user detected with 0 scores - profile not set yet');
          }
          // Load counters from DB (will be loaded separately with polling)
          await loadCounters(userId);
        } else {
          // No saved scores, check for temporary analysis data
          console.log('📋 No saved scores, checking for temporary analysis...');
          const tempData = localStorage.getItem("tempResumeData");
          
          if (tempData) {
            try {
              const temp = JSON.parse(tempData);
              if (temp.analysis) {
                console.log('📋 Temporary analysis found, showing preview...');
                // Convert temporary analysis to UserScores format
                setScores({
                  id: 0, // id: 0 indicates temporary data
                  user_id: userId,
                  overall_score: temp.analysis.overall_score || 0,
                  education_score: temp.analysis.education_score || 0,
                  future_readiness_score: temp.analysis.future_readiness_score || 0,
                  skills_readiness_score: temp.analysis.skills_readiness_score || 0,
                  geographic_score: temp.analysis.geographic_score || 0,
                  profile_views: 0,
                  applications_count: 0,
                  interviews_count: 0,
                  offers_count: 0,
                  top_countries: temp.analysis.top_countries || [],
                  geographical_value: temp.analysis.geographical_value,
                  analysis_summary: temp.analysis.analysis_summary,
                  ilo_level: temp.analysis.ilo_level,
                  ilo_label: temp.analysis.ilo_label,
                  created_at: temp.timestamp || new Date().toISOString(),
                  updated_at: temp.timestamp || new Date().toISOString()
                } as UserScores);
                // Don't set error, just show temporary data
                return;
              }
            } catch (tempErr) {
              console.error('Error parsing temp data:', tempErr);
            }
          }
          
          // No temp data either, show error
          console.log('❌ No scores found (saved or temporary). Loading demo dashboard data.');
          applyDemoDashboardData(userId);
        }
      } catch (err) {
        console.error('Error loading scores:', err);
        applyDemoDashboardData(userId);
      } finally {
        setLoading(false);
      }
    };

    loadScores();
  }, [user?._id]);

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || user.role !== 'jobseeker') {
        setCheckingSubscription(false);
        return;
      }

      const userId = user._id || user.id;
      if (!userId) {
        setCheckingSubscription(false);
        return;
      }

      try {
        console.log('🔍 Checking subscription status for user:', userId);
        const response = await fetch(`http://localhost:5000/api/subscription/status/${userId}`);
        const data = await response.json();
        console.log('📊 Subscription status response:', data);
        if (data.success) {
          setIsPaid(data.isPaid || false);
          setAnalysisCount(data.analysisCount || 0);
          setAnalysisLimit(data.analysisLimit || 0);
          setRemainingAnalyses(data.remainingAnalyses !== undefined ? data.remainingAnalyses : (data.analysisLimit === Infinity ? Infinity : Math.max(0, (data.analysisLimit || 0) - (data.analysisCount || 0))));
          // Update user in context if needed
          if (data.isPaid && (!user.isPaid || user.isPaid !== data.isPaid)) {
            const updatedUser = { ...user, isPaid: true, subscriptionPlan: data.subscriptionPlan };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
      } catch (error) {
        console.error('❌ Error checking subscription:', error);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [user]);

  // Load and poll counters separately
  const loadCounters = async (userId: string) => {
    try {
      const countersRes = await fetch(`http://localhost:5000/api/recruiter/counters/${userId}`);
      const countersData = await countersRes.json();
      if (countersData.success) {
        const newCounts = {
          applications: countersData.data.applications || 0,
          interviews: countersData.data.interviews || 0,
          offers: countersData.data.offers || 0,
          profile_views: countersData.data.profile_views || 0,
        };
        
        // Calculate new items (if count increased from previous)
        setCounters((prevCounters) => {
          const prevApps = prevCounters.applications || 0;
          const prevInterviews = prevCounters.interviews || 0;
          const prevOffers = prevCounters.offers || 0;
          
          // Only show notification if count actually increased (not on first load)
          const isFirstLoad = prevApps === 0 && prevInterviews === 0 && prevOffers === 0;
          
          if (!isFirstLoad) {
            setNewItems({
              applications: newCounts.applications > prevApps ? newCounts.applications - prevApps : 0,
              interviews: newCounts.interviews > prevInterviews ? newCounts.interviews - prevInterviews : 0,
              offers: newCounts.offers > prevOffers ? newCounts.offers - prevOffers : 0,
            });
          }
          
          return newCounts;
        });
        
        // Update scores object with counters
        setScores((prev: any) => prev ? ({
          ...prev,
          profile_views: newCounts.profile_views,
          applications_count: newCounts.applications,
          interviews_count: newCounts.interviews,
          offers_count: newCounts.offers,
        }) : prev);
      }
    } catch (e) {
      console.warn('Counters load failed:', e);
    }
  };

  // Poll for counters updates every 30 seconds
  useEffect(() => {
      const currentUser = user;
      const userId = currentUser?._id || currentUser?.id;
    if (!userId) return;

    // Load immediately
    loadCounters(userId);

    // Then poll every 30 seconds
    const interval = setInterval(() => {
      loadCounters(userId);
    }, 30000);

    return () => clearInterval(interval);
  }, [user?._id]);

  // Fetch RAG recommendations (for courses only now)
  useEffect(() => {
    const loadRAGData = async () => {
      // Get user ID from AuthContext only
      const currentUser = user;
      const userId = currentUser?._id || currentUser?.id;
      
      if (!userId) {
        console.log('❌ No user ID for RAG data:', { user, currentUser });
        setRagLoading(false);
        return;
      }

      try {
        setRagLoading(true);
        console.log('🔍 Loading RAG recommendations for user:', userId);
        
        const response = await getDashboardRecommendations(userId);
        
        if (response.success) {
          console.log('✅ RAG data loaded:', response);
          setRagData(response);
        } else {
          console.error('❌ RAG data failed:', response.message);
        }
      } catch (err) {
        console.error('Error loading RAG data:', err);
      } finally {
        setRagLoading(false);
      }
    };

    loadRAGData();
  }, [user?._id]);

  // Load Personalized Job Recommendations (on button click) - Only for paid users
  const loadPersonalizedJobs = async () => {
    if (!isPaid && !checkingSubscription) {
      navigate('/subscription');
      return;
    }

    const currentUser = user;
    const userId = currentUser?._id || currentUser?.id;
    
    if (!userId) {
      setError('No user ID found');
      return;
    }

    try {
      setLoadingPersonalizedJobs(true);
      const response = await getPersonalizedJobRecommendations(userId);
      
      if (response.success && response.data) {
        setPersonalizedJobs(response.data);
      } else {
        setError(response.error || 'Failed to load job recommendations');
      }
    } catch (err) {
      console.error('Error loading personalized job recommendations:', err);
      setError('Failed to load job recommendations');
    } finally {
      setLoadingPersonalizedJobs(false);
    }
  };

  // Load Personalized Course Recommendations (on button click) - Only for paid users
  const loadPersonalizedCourses = async () => {
    if (!isPaid && !checkingSubscription) {
      navigate('/subscription');
      return;
    }

    const currentUser = user;
    const userId = currentUser?._id || currentUser?.id;
    
    if (!userId) {
      setError('No user ID found');
      return;
    }

    try {
      setLoadingPersonalizedCourses(true);
      const response = await getPersonalizedCourseRecommendations(userId);
      
      if (response.success && response.data) {
        setPersonalizedCourses(response.data);
      } else {
        setError(response.error || 'Failed to load course recommendations');
      }
    } catch (err) {
      console.error('Error loading personalized course recommendations:', err);
      setError('Failed to load course recommendations');
    } finally {
      setLoadingPersonalizedCourses(false);
    }
  };

  // Load Top Geographic Opportunities (on button click)
  const loadTopGeographic = async () => {
    if (!isPaid && !checkingSubscription) {
      navigate('/subscription');
      return;
    }

    const currentUser = user;
    const userId = currentUser?._id || currentUser?.id;
    
    if (!userId) {
      setError('No user ID found');
      return;
    }

    try {
      setLoadingTopGeographic(true);
      const response = await getGeographicRecommendations(userId);
      
      if (response.success && response.data) {
        // Take top 5 countries for the dashboard section
        setTopGeographicCountries(response.data.slice(0, 5));
      } else {
        setError(response.error || 'Failed to load geographic opportunities');
      }
    } catch (err) {
      console.error('Error loading top geographic opportunities:', err);
      setError('Failed to load geographic opportunities');
    } finally {
      setLoadingTopGeographic(false);
    }
  };

  // Handle Education card click
  const handleEducationClick = async () => {
    if (!isPaid && !checkingSubscription) {
      navigate('/subscription');
      return;
    }
      const currentUser = user;
      const userId = currentUser?._id || currentUser?.id;
    
    if (!userId) {
      setError('No user ID found');
      return;
    }

    setShowEducationModal(true);
    setLoadingEducationRecs(true);
    
    try {
      const response = await getEducationRecommendations(userId);
      if (response.success && response.data) {
        setEducationRecommendations(response.data);
      } else {
        setError(response.error || 'Failed to load education recommendations');
      }
    } catch (err) {
      console.error('Error loading education recommendations:', err);
      setError('Failed to load education recommendations');
    } finally {
      setLoadingEducationRecs(false);
    }
  };

  // Handle Future Readiness card click
  const handleFutureReadinessClick = async () => {
    if (!isPaid && !checkingSubscription) {
      navigate('/subscription');
      return;
    }
      const currentUser = user;
      const userId = currentUser?._id || currentUser?.id;
    
    if (!userId) {
      setError('No user ID found');
      return;
    }

    setShowFutureReadinessModal(true);
    setLoadingFutureReadinessRecs(true);
    
    try {
      const response = await getFutureReadinessRecommendations(userId);
      if (response.success && response.data) {
        setFutureReadinessRecommendations(response.data);
      } else {
        setError(response.error || 'Failed to load future readiness recommendations');
      }
    } catch (err) {
      console.error('Error loading future readiness recommendations:', err);
      setError('Failed to load future readiness recommendations');
    } finally {
      setLoadingFutureReadinessRecs(false);
    }
  };

  // Handle Skills Readiness card click
  const handleSkillsReadinessClick = async () => {
    if (!isPaid && !checkingSubscription) {
      navigate('/subscription');
      return;
    }
      const currentUser = user;
      const userId = currentUser?._id || currentUser?.id;
    
    if (!userId) {
      setError('No user ID found');
      return;
    }

    setShowSkillsReadinessModal(true);
    setLoadingSkillsReadinessRecs(true);
    
    try {
      const response = await getSkillsReadinessRecommendations(userId);
      if (response.success && response.data) {
        setSkillsReadinessRecommendations(response.data);
      } else {
        setError(response.error || 'Failed to load skills readiness recommendations');
      }
    } catch (err) {
      console.error('Error loading skills readiness recommendations:', err);
      setError('Failed to load skills readiness recommendations');
    } finally {
      setLoadingSkillsReadinessRecs(false);
    }
  };

  // Handle Geographic card click
  const handleGeographicClick = async () => {
    if (!isPaid && !checkingSubscription) {
      navigate('/subscription');
      return;
    }
      const currentUser = user;
      const userId = currentUser?._id || currentUser?.id;
    
    if (!userId) {
      setError('No user ID found');
      return;
    }

    setShowGeographicModal(true);
    setLoadingGeographicRecs(true);
    setSelectedCountry(null);
    setVisaInfo(null);
    
    try {
      const response = await getGeographicRecommendations(userId);
      if (response.success && response.data) {
        setGeographicCountries(response.data);
      } else {
        setError(response.error || 'Failed to load geographic recommendations');
      }
    } catch (err) {
      console.error('Error loading geographic recommendations:', err);
      setError('Failed to load geographic recommendations');
    } finally {
      setLoadingGeographicRecs(false);
    }
  };

  // Handle country selection
  const handleCountrySelect = async (country: string) => {
      const currentUser = user;
      const userId = currentUser?._id || currentUser?.id;
    
    if (!userId) {
      return;
    }

    setSelectedCountry(country);
    setLoadingVisaInfo(true);
    setVisaInfo(null);
    
    try {
      const response = await getVisaInfoForCountry(userId, country);
      if (response.success && response.data) {
        setVisaInfo(response.data);
      } else {
        setError(response.error || 'Failed to load visa information');
      }
    } catch (err) {
      console.error('Error loading visa information:', err);
      setError('Failed to load visa information');
    } finally {
      setLoadingVisaInfo(false);
    }
  };

  // Manual re-analyze function
  const handleReAnalyze = async () => {
    if (!isPaid && !checkingSubscription) {
      navigate('/subscription');
      return;
    }

    // Check analysis limits
    if (analysisLimit !== Infinity && remainingAnalyses <= 0) {
      setError(`Analysis limit reached. Your ${user?.subscriptionPlan || 'current'} plan allows ${analysisLimit} CV analysis${analysisLimit > 1 ? 'es' : ''}. Please upgrade your plan for more analyses.`);
      return;
    }

    const currentUser = user;
    const userId = currentUser?._id || currentUser?.id;
    
    if (!userId) {
      setError('No user ID found');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      console.log('🔄 Manually triggering resume analysis...');
      
      const response = await analyzeResume(userId);
      
      if (response.success && response.data) {
        console.log('✅ Re-analysis completed:', response.data);
        setScores(response.data);
        // Update analysis count after successful analysis
        if (response.analysisCount !== undefined) {
          setAnalysisCount(response.analysisCount);
          if (analysisLimit !== Infinity) {
            setRemainingAnalyses(Math.max(0, analysisLimit - response.analysisCount));
          }
        }
        // Refresh subscription status to get updated counts
        const statusResponse = await fetch(`http://localhost:5000/api/subscription/status/${userId}`);
        const statusData = await statusResponse.json();
        if (statusData.success) {
          setAnalysisCount(statusData.analysisCount || 0);
          setRemainingAnalyses(statusData.remainingAnalyses !== undefined ? statusData.remainingAnalyses : (statusData.analysisLimit === Infinity ? Infinity : Math.max(0, (statusData.analysisLimit || 0) - (statusData.analysisCount || 0))));
        }
      } else {
        // Check if it's a limit error
        if (response.error && (response.error.includes('limit') || response.error.includes('Subscription required'))) {
          setError(response.error);
          // Refresh subscription status
          const statusResponse = await fetch(`http://localhost:5000/api/subscription/status/${userId}`);
          const statusData = await statusResponse.json();
          if (statusData.success) {
            setAnalysisCount(statusData.analysisCount || 0);
            setRemainingAnalyses(statusData.remainingAnalyses !== undefined ? statusData.remainingAnalyses : (statusData.analysisLimit === Infinity ? Infinity : Math.max(0, (statusData.analysisLimit || 0) - (statusData.analysisCount || 0))));
          }
        } else {
          setError(response.error || 'Failed to analyze resume');
        }
      }
    } catch (err: any) {
      console.error('❌ Error during re-analysis:', err);
      if (err.message && (err.message.includes('limit') || err.message.includes('Subscription'))) {
        setError(err.message);
      } else {
        setError('Failed to analyze resume. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Get display name from user or fallback
  const displayName = user?.name || 'User';

  // Debug logging
      const currentUser = user;
      const userId = currentUser?._id || currentUser?.id;
  
  console.log('🔍 Dashboard Debug:', {
    userFromAuth: user,
    currentUser: currentUser,
    userId: userId,
    scores: scores,
    ragData: ragData,
    loading: loading,
    ragLoading: ragLoading,
    error: error,
    coursesCount: ragData?.data.courses?.length || 0,
    jobsCount: ragData?.data.jobs?.length || 0
  });

  // Create skill categories from database scores with fallback
  const skillCategories = scores ? [
    { name: 'Education', score: scores.education_score, color: '#8b5cf6' },
    { name: 'Future Readiness', score: scores.future_readiness_score, color: '#06b6d4' },
    { name: 'Skills Readiness', score: scores.skills_readiness_score, color: '#10b981' },
    { name: 'Geographic', score: scores.geographic_score, color: '#f59e0b' },
  ] : [
    { name: 'Education', score: 0, color: '#8b5cf6' },
    { name: 'Future Readiness', score: 0, color: '#06b6d4' },
    { name: 'Skills Readiness', score: 0, color: '#10b981' },
    { name: 'Geographic', score: 0, color: '#f59e0b' },
  ];

  // Create stats from actual counters (not from scores object to ensure accuracy)
  const stats = [
    { 
      label: 'Profile Views', 
      value: counters.profile_views >= 1000 ? `${(counters.profile_views / 1000).toFixed(1)}k` : counters.profile_views.toString(), 
      icon: ChartBarIcon, 
      color: 'from-blue-500 to-blue-600',
      newCount: 0,
    },
    { 
      label: 'Applications', 
      value: counters.applications.toString(), 
      icon: BriefcaseIcon, 
      color: 'from-green-500 to-green-600',
      newCount: newItems.applications,
    },
    { 
      label: 'Interviews', 
      value: counters.interviews.toString(), 
      icon: AcademicCapIcon, 
      color: 'from-primary-500 to-primary-600',
      newCount: newItems.interviews,
    },
    { 
      label: 'Offers', 
      value: counters.offers.toString(), 
      icon: StarIcon, 
      color: 'from-yellow-500 to-yellow-600',
      newCount: newItems.offers,
    },
  ];

  const statRouteMap: Record<string, string | null> = {
    'Profile Views': null,
    'Applications': '/applications',
    'Interviews': '/interviews',
    'Offers': '/offers'
  };


  // Show loading state
  if (loading || ragLoading) {
    return (
      <div className="pb-6 pt-2 max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex justify-center items-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saas-cyan"></div>
            <span className="text-saas-text-heading-secondary">
              {loading ? 'Loading dashboard...' : 'Loading AI recommendations...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="pb-6 pt-2 max-w-7xl mx-auto px-4 space-y-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-xl mb-4">⚠️ Error Loading Dashboard</div>
          <p className="text-saas-text-heading-secondary">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 pb-6 pt-2">
        {/* Subscription Notice for Unpaid Users */}
        {!checkingSubscription && !isPaid && (
          <Card className="p-6 mb-6 bg-primary-accent/10 border-2 border-primary-accent/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  🔒 Unlock Premium Features
                </h3>
                <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Subscribe to access AI analysis, personalized recommendations, and advanced dashboard features.
                </p>
              </div>
              <Button variant="primary" onClick={() => navigate('/subscription')}>
                View Plans
              </Button>
            </div>
          </Card>
        )}

        {/* Analysis Limit Notice for Paid Users */}
        {!checkingSubscription && isPaid && analysisLimit !== Infinity && (
          <Card className="p-4 mb-6 bg-saas-bg-secondary border border-saas-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                  📊 CV Analysis Usage: {analysisCount} / {analysisLimit} used
                </p>
                <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {remainingAnalyses > 0 
                    ? `${remainingAnalyses} analysis${remainingAnalyses > 1 ? 'es' : ''} remaining in your ${user?.subscriptionPlan || 'current'} plan`
                    : 'Analysis limit reached. Upgrade your plan for more analyses.'}
                </p>
              </div>
              {remainingAnalyses <= 0 && (
                <Button variant="primary" size="sm" onClick={() => navigate('/subscription')}>
                  Upgrade Plan
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-4">
              <Avatar 
                src={user?.profile_picture || user?.profilePicture}
                name={displayName}
                size="lg"
              />
              <div>
                <h1 className="text-2xl font-semibold text-saas-text-heading font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                  Welcome back, {displayName}
                </h1>
                <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Here's your career progress and recommendations
                </p>
              </div>
            </div>
            {scores && (isPaid || checkingSubscription) && (
              <div className="flex items-center gap-2">
                {analysisLimit !== Infinity && remainingAnalyses > 0 && (
                  <span className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {remainingAnalyses} left
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReAnalyze}
                  disabled={analyzing || (analysisLimit !== Infinity && remainingAnalyses <= 0)}
                >
                  {analyzing ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Re-analyze
                    </>
                  )}
                </Button>
              </div>
            )}
            {!isPaid && !checkingSubscription && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/subscription')}
              >
                Unlock Premium
              </Button>
            )}
          </div>
          {/* Show warning if viewing temporary data */}
          {localStorage.getItem("tempResumeData") && !scores?.id && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              ⚠️ <strong>Preview Mode:</strong> You're viewing temporary analysis. Save your profile in the Profile page to store this permanently.
            </div>
          )}
        </div>

        {/* Stats Cards - LinkedIn Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index}>
              {statRouteMap[stat.label] ? (
                <Link to={statRouteMap[stat.label] as string}>
                  <Card className="p-4 cursor-pointer relative" hover>
                    {stat.newCount > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                        {stat.newCount}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-saas-text-heading-secondary mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{stat.label}</p>
                        <p className="text-2xl font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{stat.value}</p>
                        {stat.newCount > 0 && (
                          <p className="text-xs text-red-400 font-semibold mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {stat.newCount} new!
                          </p>
                        )}
                      </div>
                      <div className="w-10 h-10 bg-saas-cyan/20 border border-saas-cyan/30 rounded flex items-center justify-center">
                        <stat.icon className="h-5 w-5 text-saas-cyan" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ) : (
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-saas-text-heading-secondary mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{stat.label}</p>
                      <p className="text-2xl font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{stat.value}</p>
                    </div>
                    <div className="w-10 h-10 bg-saas-cyan/20 border border-saas-cyan/30 rounded flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-saas-cyan" />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ))}
        </div>

        {/* Skilled Score Section - Redesigned */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Score */}
          <Card className="p-6 text-center h-full">
            <h3 className="text-lg font-semibold text-saas-text-heading mb-6" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
              Your Skilled Score
            </h3>
            <CircularProgress
              percentage={scores?.overall_score || 0}
              size={140}
              strokeWidth={10}
              showPercentage={true}
              label="Overall Score"
            />
            {scores?.ilo_level && scores?.ilo_label ? (
              <div className="mt-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-saas-cyan/20 border border-saas-cyan/30 mb-3">
                  <span className="text-sm font-semibold text-saas-cyan" style={{ fontFamily: 'Inter, sans-serif' }}>
                    ILO Level {scores.ilo_level}: {scores.ilo_label}
                  </span>
                </div>
                <p className="text-saas-text-heading-secondary mt-3 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {scores.analysis_summary || "Above average! Keep improving to reach the top 10%"}
                </p>
              </div>
            ) : (
              <p className="text-saas-text-heading-secondary mt-6 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                Above average! Keep improving to reach the top 10%
              </p>
            )}
          </Card>

          {/* Score Breakdown */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-full">
              <h3 className="text-lg font-semibold text-saas-text-heading mb-6" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                Score Breakdown
              </h3>
              <div className="space-y-4">
                {skillCategories.map((category, index) => {
                  const isClickable = category.name === 'Education' || category.name === 'Future Readiness' || category.name === 'Skills Readiness' || category.name === 'Geographic';
                  const handleClick = isPaid || checkingSubscription ? (category.name === 'Education' 
                    ? handleEducationClick 
                    : category.name === 'Future Readiness' 
                    ? handleFutureReadinessClick 
                    : category.name === 'Skills Readiness'
                    ? handleSkillsReadinessClick
                    : category.name === 'Geographic'
                    ? handleGeographicClick
                    : undefined) : () => navigate('/subscription');
                  
                  return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className={`p-4 rounded-lg border border-saas-border hover:border-saas-cyan/40 bg-white transition-all duration-300 relative ${
                      isClickable ? 'cursor-pointer hover:bg-saas-bg-secondary' : ''
                    } ${!isPaid && !checkingSubscription && isClickable ? 'opacity-60' : ''}`}
                    onClick={handleClick}
                  >
                    {!isPaid && !checkingSubscription && isClickable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px] rounded-lg z-10">
                        <span className="text-xs font-semibold text-primary-accent" style={{ fontFamily: 'Inter, sans-serif' }}>
                          🔒 Premium
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-saas-cyan/10 border border-saas-cyan/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-saas-cyan" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {category.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span 
                          className="text-2xl font-bold text-saas-cyan"
                          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}
                        >
                          {category.score}%
                        </span>
                      </div>
                    </div>
                    <div className="relative w-full bg-saas-cyan/5 rounded-full h-2.5 overflow-hidden border border-saas-cyan/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${category.score}%` }}
                        transition={{ duration: 1.2, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                        className="h-full rounded-full relative overflow-hidden"
                        style={{ backgroundColor: '#708F96' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </motion.div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>


      {/* Top Geographic Opportunities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8 relative"
      >
        {!isPaid && !checkingSubscription && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                🔒 Premium Feature
              </p>
              <p className="text-sm text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                Subscribe to unlock geographic opportunities and visa information
              </p>
              <Button variant="primary" onClick={() => navigate('/subscription')}>
                Subscribe Now
              </Button>
            </div>
          </div>
        )}
        <Card className="p-6" hover>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
              Top Geographic Opportunities
            </h3>
            {topGeographicCountries.length > 0 ? (
              <button
                onClick={handleGeographicClick}
                className="text-sm text-saas-cyan hover:opacity-80 font-medium flex items-center transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                View All
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={loadTopGeographic}
                disabled={loadingTopGeographic}
                className="flex items-center px-4 py-2 text-sm font-medium btn-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {loadingTopGeographic ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    Get Opportunities
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
          {loadingTopGeographic ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saas-cyan"></div>
            </div>
          ) : topGeographicCountries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {topGeographicCountries.map((country, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  onClick={() => {
                    handleGeographicClick();
                    setTimeout(() => handleCountrySelect(country.country), 100);
                  }}
                  className="card-base p-4 rounded-lg text-center cursor-pointer hover:border-saas-cyan/50 transition-all"
                >
                  <div className="flex items-center justify-center mb-2">
                    <MapPinIcon className="h-6 w-6 text-saas-cyan" />
                  </div>
                  <p className="text-sm font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{country.country}</p>
                  <div className="space-y-1">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      country.immigrationEase === 'easy' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' :
                      country.immigrationEase === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                      {country.immigrationEase}
                    </span>
                    <p className="text-xs text-saas-text-heading-secondary mt-2 line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {country.reason}
                    </p>
                  </div>
                  <p className="text-xs text-saas-cyan mt-2 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Click for details →
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPinIcon className="h-12 w-12 text-saas-text-heading-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Get Geographic Opportunities
              </h3>
              <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                Click the button above to analyze your profile and get personalized geographic opportunities and visa information.
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Recommended Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8 relative"
      >
        {!isPaid && !checkingSubscription && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                🔒 Premium Feature
              </p>
              <p className="text-sm text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                Subscribe to unlock AI-powered job recommendations
              </p>
              <Button variant="primary" onClick={() => navigate('/subscription')}>
                Subscribe Now
              </Button>
            </div>
          </div>
        )}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
              Recommended Jobs
            </h2>
            {personalizedJobs ? (
              <button
                onClick={isPaid || checkingSubscription ? () => setShowAllJobsModal(true) : () => navigate('/subscription')}
                className="flex items-center px-4 py-2 text-sm font-medium btn-secondary rounded-lg transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                View All Jobs
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={isPaid || checkingSubscription ? loadPersonalizedJobs : () => navigate('/subscription')}
                disabled={loadingPersonalizedJobs || (!isPaid && !checkingSubscription)}
                className="flex items-center px-4 py-2 text-sm font-medium btn-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {loadingPersonalizedJobs ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    {isPaid || checkingSubscription ? 'Get Job Recommendations' : 'Subscribe to Unlock'}
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        {loadingPersonalizedJobs ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saas-cyan"></div>
              <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Analyzing your CV and finding the best job matches...</span>
            </div>
          </div>
        ) : personalizedJobs?.jobs && personalizedJobs.jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personalizedJobs.jobs.slice(0, 3).map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="h-full"
            >
              <Card className="p-6 h-full flex flex-col" hover>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-saas-text-heading text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {job.title}
                  </h3>
                  <div className="flex flex-col items-end space-y-1">
                    <span className="px-3 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 rounded-full text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {job.type}
                    </span>
                    {job.similarity_score && (
                      <span className="px-2 py-1 bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 rounded-full text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {Math.round((job.similarity_score || 0) * 100)}% Match
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>{job.company}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {job.location}
                  </div>
                  <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    {job.salary}
                  </div>
                  {job.experience && (
                    <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      {job.experience}
                    </div>
                  )}
                  {job.remote && (
                    <div className="flex items-center text-sm text-[#22C55E]" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <GlobeAltIcon className="h-4 w-4 mr-2" />
                      Remote Available
                    </div>
                  )}
                </div>
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.slice(0, 3).map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-2 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 rounded text-xs"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                {(job.matchReason || job.match_reason) && (
                  <div className="mb-4 p-3 bg-saas-bg-secondary border border-saas-border rounded-lg">
                    <p className="text-xs text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <strong>Why this job:</strong> {job.matchReason || job.match_reason}
                    </p>
                  </div>
                )}
                <div className="mt-auto pt-4">
                {job.applyLink ? (
                  <a
                    href={job.applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button variant="primary" className="w-full">
                      Apply Now
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                ) : (
                  <Link to={`/internships/${job.id}`}>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                )}
                </div>
              </Card>
            </motion.div>
            ))}
          </div>
        ) : personalizedJobs ? (
          <div className="p-8 text-center">
            <BriefcaseIcon className="h-12 w-12 text-saas-text-heading-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              No Job Recommendations Found
            </h3>
            <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              We couldn't find job recommendations. Please try again or upload your CV in the Profile section.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={loadPersonalizedJobs}>
                Try Again
              </Button>
              <Link to="/profile">
                <Button variant="primary">
                  Upload CV
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <BriefcaseIcon className="h-12 w-12 text-saas-text-heading-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Get Personalized Job Recommendations
            </h3>
            <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Click the button above to analyze your CV and get personalized job recommendations based on your skills and experience.
            </p>
          </div>
        )}
        </Card>
      </motion.div>

      {/* Recommended Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-8 relative"
      >
        {!isPaid && !checkingSubscription && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                🔒 Premium Feature
              </p>
              <p className="text-sm text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                Subscribe to unlock AI-powered course recommendations
              </p>
              <Button variant="primary" onClick={() => navigate('/subscription')}>
                Subscribe Now
              </Button>
            </div>
          </div>
        )}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
              Recommended Courses
            </h2>
            {personalizedCourses ? (
              <button
                onClick={() => setShowAllCoursesModal(true)}
                className="flex items-center px-4 py-2 text-sm font-medium btn-secondary rounded-lg transition-colors"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                View All Courses
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={loadPersonalizedCourses}
                disabled={loadingPersonalizedCourses}
                className="flex items-center px-4 py-2 text-sm font-medium btn-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {loadingPersonalizedCourses ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    Get Course Recommendations
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
          {loadingPersonalizedCourses ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saas-cyan"></div>
                <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Analyzing your CV and finding the best course matches...</span>
              </div>
            </div>
          ) : personalizedCourses?.courses && personalizedCourses.courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {personalizedCourses.courses.slice(0, 2).map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="h-full"
            >
              <Card className="overflow-hidden h-full flex flex-col" hover>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-saas-text-heading mb-2 flex-1">
                      {course.title}
                    </h3>
                    <div className="flex flex-col items-end space-y-1 ml-2">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                        {course.provider}
                      </span>
                      {course.similarityScore && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                          {Math.round(course.similarityScore * 100)}% Match
                        </span>
                      )}
                    </div>
                  </div>
                  {course.instructor && (
                    <p className="text-saas-text-heading-secondary mb-2 text-sm">
                      Instructor: {course.instructor}
                    </p>
                  )}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-saas-text-heading-secondary">
                        Duration: {course.duration}
                      </span>
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-saas-text-heading-secondary ml-1">
                          {course.rating?.toFixed(1) || '4.0'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-saas-text-heading-secondary">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Level: {course.level}
                    </div>
                    <div className="flex items-center text-sm text-saas-text-heading-secondary">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      Price: {course.price}
                    </div>
                    {course.certificate && (
                      <div className="flex items-center text-sm text-[#22C55E]">
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Certificate: {course.certificate}
                      </div>
                    )}
                    {course.format && (
                      <div className="flex items-center text-sm text-saas-text-heading-secondary">
                        <AcademicCapIcon className="h-4 w-4 mr-2" />
                        Format: {course.format}
                      </div>
                    )}
                  </div>
                  {course.skills_taught && course.skills_taught.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.skills_taught.slice(0, 4).map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-2 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 rounded text-xs"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {course.description && (
                    <p className="text-sm text-saas-text-heading-secondary mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  {course.matchReason && (
                    <div className="mb-4 p-3 bg-saas-bg-secondary border border-saas-border rounded-lg">
                      <p className="text-xs text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <strong>Why this course:</strong> {course.matchReason}
                      </p>
                    </div>
                  )}
                  <div className="mt-auto pt-4">
                  {course.enrollmentLink ? (
                    <a
                      href={course.enrollmentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button variant="primary" className="w-full">
                        Enroll Now
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Link Not Available
                    </Button>
                  )}
                  </div>
                </div>
              </Card>
            </motion.div>
            ))}
          </div>
        ) : personalizedCourses ? (
          <div className="p-8 text-center">
            <AcademicCapIcon className="h-12 w-12 text-saas-text-heading-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              No Course Recommendations Found
            </h3>
            <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              We couldn't find course recommendations. Please try again or upload your CV in the Profile section.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={loadPersonalizedCourses}>
                Try Again
              </Button>
              <Link to="/profile">
                <Button variant="primary">
                  Upload CV
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <AcademicCapIcon className="h-12 w-12 text-saas-text-heading-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Get Personalized Course Recommendations
            </h3>
            <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Click the button above to analyze your CV and get personalized course recommendations based on your skills and career goals.
            </p>
          </div>
        )}
        </Card>
      </motion.div>

      {/* Visa Information & Skill Gaps */}
      {((ragData?.data.visa_info && ragData.data.visa_info.length > 0) || (ragData?.data.skill_gaps && ragData.data.skill_gaps.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visa Information */}
          {ragData?.data.visa_info && ragData.data.visa_info.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card className="p-6" hover>
                <h3 className="text-xl font-semibold text-saas-text-heading mb-6">
                  Visa Information
                </h3>
                <div className="space-y-4">
                  {ragData.data.visa_info.slice(0, 3).map((visa, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 + index * 0.1 }}
                          className="card-base border border-saas-cyan/20 rounded-lg p-4"
                    >
                      <div className="flex items-center mb-3">
                        <GlobeAltIcon className="h-5 w-5 text-saas-cyan mr-2" />
                        <h4 className="font-semibold text-saas-text-heading">
                          {visa.country}
                        </h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-saas-text-heading-secondary">
                          <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                          <span className="font-medium">Visa Type:</span>
                          <span className="ml-2">{visa.visa_info.work_visa}</span>
                        </div>
                        <div className="flex items-center text-saas-text-heading-secondary">
                          <ClockIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                          <span className="font-medium">Processing Time:</span>
                          <span className="ml-2">{visa.visa_info.processing_time}</span>
                        </div>
                        <div className="flex items-center text-saas-text-heading-secondary">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2 text-[#22C55E]" />
                          <span className="font-medium">Cost:</span>
                          <span className="ml-2">{visa.visa_info.cost}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Skill Gaps & Improvement Areas */}
          {((ragData?.data.skill_gaps && ragData.data.skill_gaps.length > 0) || (ragData?.data.improvement_areas && ragData.data.improvement_areas.length > 0)) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <Card className="p-6" hover>
                <h3 className="text-xl font-semibold text-saas-text-heading mb-6">
                  Skill Development
                </h3>
                
                {/* Skill Gaps */}
                {ragData?.data.skill_gaps && ragData.data.skill_gaps.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-saas-text-heading mb-3">
                      Identified Skill Gaps
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ragData.data.skill_gaps.slice(0, 6).map((skill, index) => (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.2 + index * 0.05 }}
                          className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Areas */}
                {ragData && ragData.data && ragData.data.improvement_areas && ragData.data.improvement_areas.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-saas-text-heading mb-3">
                      Improvement Areas
                    </h4>
                    <div className="space-y-2">
                      {ragData.data.improvement_areas.slice(0, 4).map((area, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.3 + index * 0.1 }}
                          className="flex items-center text-sm text-saas-text-heading-secondary"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                          {area}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </div>
      )}

      {/* Education Recommendations Modal */}
      {showEducationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-base rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-saas-cyan/30 bg-white"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-saas-border px-6 py-4 flex items-center justify-between z-10 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#A855F7]/20 border border-[#A855F7]/30 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="h-6 w-6 text-saas-purple" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Education Recommendations</h2>
                  <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>AI-powered career guidance</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEducationModal(false);
                  setEducationRecommendations(null);
                }}
                className="p-2 hover:bg-saas-cyan/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-saas-text-heading-secondary hover:text-[#22D3EE]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-white">
              {loadingEducationRecs ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan mb-4"></div>
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Analyzing your education background...</p>
                </div>
              ) : educationRecommendations ? (
                <div className="space-y-6">
                  {/* Recommended Degree */}
                  <div className="card-base rounded-xl p-6 border border-[#A855F7]/30 bg-gradient-to-br from-[#A855F7]/10 to-[#A855F7]/5">
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-3 flex items-center" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                      <StarIcon className="h-5 w-5 text-saas-purple mr-2" />
                      Recommended Next Degree
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-[#A855F7] text-white rounded-full text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {educationRecommendations.recommendedDegree.level}
                        </span>
                        <span className="text-lg font-semibold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {educationRecommendations.recommendedDegree.field}
                        </span>
                      </div>
                      <p className="text-saas-text-heading mt-3" style={{ fontFamily: 'Inter, sans-serif' }}>{educationRecommendations.recommendedDegree.reason}</p>
                    </div>
                  </div>

                  {/* Top Universities */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                      <AcademicCapIcon className="h-5 w-5 text-saas-cyan mr-2" />
                      Top Recommended Universities
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {educationRecommendations.topUniversities.map((university, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card-base rounded-lg p-4 hover:border-saas-cyan/50 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{university.name}</h4>
                              <p className="text-sm text-saas-text-heading-secondary flex items-center mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                                <MapPinIcon className="h-4 w-4 mr-1 text-saas-cyan" />
                                {university.country}
                              </p>
                            </div>
                            {university.rank && (
                              <span className="px-2 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 rounded text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                #{university.rank}
                              </span>
                            )}
                          </div>
                          {university.program && (
                            <p className="text-sm text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                              <span className="font-medium">Program:</span> {university.program}
                            </p>
                          )}
                          <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{university.reason}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Top Countries */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                      <GlobeAltIcon className="h-5 w-5 text-[#22C55E] mr-2" />
                      Best Countries for This Education
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {educationRecommendations.topCountries.map((country, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card-base rounded-lg p-4 hover:border-[#22C55E]/50 transition-all"
                        >
                          <h4 className="font-semibold text-saas-text-heading mb-2 flex items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <MapPinIcon className="h-5 w-5 text-[#22C55E] mr-2" />
                            {country.country}
                          </h4>
                          <p className="text-sm text-saas-text-heading-secondary mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>{country.reason}</p>
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Key Advantages:</p>
                            <ul className="space-y-1">
                              {country.advantages.map((advantage, advIndex) => (
                                <li key={advIndex} className="text-sm text-saas-text-heading-secondary flex items-start" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  <CheckCircleIcon className="h-4 w-4 text-[#22C55E] mr-2 mt-0.5 flex-shrink-0" />
                                  {advantage}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Career Alignment */}
                  <div className="card-base rounded-xl p-6 border border-saas-cyan/30 bg-saas-cyan/10">
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-3 flex items-center" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                      <BriefcaseIcon className="h-5 w-5 text-saas-cyan mr-2" />
                      Career Alignment
                    </h3>
                    <p className="text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{educationRecommendations.careerAlignment}</p>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                      <ArrowRightIcon className="h-5 w-5 text-saas-cyan mr-2" />
                      Recommended Next Steps
                    </h3>
                    <div className="space-y-2">
                      {educationRecommendations.nextSteps.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start card-base rounded-lg p-4 hover:border-saas-cyan/50 transition-all"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-saas-cyan/20 border border-saas-cyan/30 text-[#22D3EE] rounded-full flex items-center justify-center text-sm font-semibold mr-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {index + 1}
                          </span>
                          <p className="text-saas-text-heading flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{step}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Failed to load recommendations. Please try again.</p>
                  <Button
                    onClick={handleEducationClick}
                    className="mt-4"
                    variant="primary"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Future Readiness Recommendations Modal */}
      {showFutureReadinessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-base rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-saas-cyan/30 bg-white"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-saas-border px-6 py-4 flex items-center justify-between z-10 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-saas-cyan/20 border border-saas-cyan/30 rounded-lg flex items-center justify-center">
                  <ArrowRightIcon className="h-6 w-6 text-saas-cyan" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Future Readiness</h2>
                  <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Strategic career planning & future-proofing</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFutureReadinessModal(false);
                  setFutureReadinessRecommendations(null);
                }}
                className="p-2 hover:bg-saas-cyan/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-saas-text-heading-secondary hover:text-[#22D3EE]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-white">
              {loadingFutureReadinessRecs ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan mb-4"></div>
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Analyzing your career trajectory...</p>
                </div>
              ) : futureReadinessRecommendations ? (
                <div className="space-y-6">
                  {/* Career Paths */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <BriefcaseIcon className="h-5 w-5 text-saas-cyan mr-2" />
                      Career Path Progression
                    </h3>
                    <div className="space-y-4">
                      {/* Short Term */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Short Term ({futureReadinessRecommendations.careerPaths.shortTerm.timeline})</h4>
                          <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold">
                            Next Steps
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {futureReadinessRecommendations.careerPaths.shortTerm.roles.map((role, index) => (
                            <span key={index} className="px-3 py-1 bg-white border border-green-300 text-green-700 rounded-full text-sm font-medium">
                              {role}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700">{futureReadinessRecommendations.careerPaths.shortTerm.description}</p>
                      </div>

                      {/* Mid Term */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Mid Term ({futureReadinessRecommendations.careerPaths.midTerm.timeline})</h4>
                          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold">
                            Growth Phase
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {futureReadinessRecommendations.careerPaths.midTerm.roles.map((role, index) => (
                            <span key={index} className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded-full text-sm font-medium">
                              {role}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700">{futureReadinessRecommendations.careerPaths.midTerm.description}</p>
                      </div>

                      {/* Long Term */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Long Term ({futureReadinessRecommendations.careerPaths.longTerm.timeline})</h4>
                          <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-semibold">
                            Vision
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {futureReadinessRecommendations.careerPaths.longTerm.roles.map((role, index) => (
                            <span key={index} className="px-3 py-1 bg-white border border-purple-300 text-purple-700 rounded-full text-sm font-medium">
                              {role}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700">{futureReadinessRecommendations.careerPaths.longTerm.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emerging Skills */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-2" />
                      Emerging Skills to Develop
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {futureReadinessRecommendations.emergingSkills.map((skill, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card-base border border-saas-cyan/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{skill.skill}</h4>
                            <span                               className={`px-2 py-1 rounded text-xs font-medium ${
                                skill.priority === 'high' ? 'bg-red-900/20 text-red-400 border border-red-500/30' :
                                skill.priority === 'medium' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                              {skill.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{skill.importance}</p>
                          <p className="text-xs text-gray-500">{skill.relevance}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Industry Trends */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <ChartBarIcon className="h-5 w-5 text-saas-purple mr-2" />
                      Industry Trends & Opportunities
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {futureReadinessRecommendations.industryTrends.map((trend, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card-base border border-saas-cyan/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{trend.industry}</h4>
                            <span                               className={`px-2 py-1 rounded text-xs font-medium ${
                                trend.growth === 'high' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' :
                                trend.growth === 'medium' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                              {trend.growth} growth
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2"><strong>Trend:</strong> {trend.trend}</p>
                          <p className="text-sm text-gray-700"><strong>Opportunity:</strong> {trend.opportunity}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Technology Trends */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <GlobeAltIcon className="h-5 w-5 text-saas-cyan mr-2" />
                      Technology Trends to Watch
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {futureReadinessRecommendations.technologyTrends.map((tech, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card-base border border-saas-cyan/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <h4 className="font-semibold text-gray-900 mb-2">{tech.technology}</h4>
                          <p className="text-sm text-gray-600 mb-2"><strong>Impact:</strong> {tech.impact}</p>
                          <p className="text-sm text-gray-700"><strong>Action:</strong> {tech.action}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Market Opportunities */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      Market Opportunities
                    </h3>
                    <div className="space-y-3">
                      {futureReadinessRecommendations.marketOpportunities.map((opportunity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card-base border border-saas-cyan/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <h4 className="font-semibold text-gray-900 mb-2">{opportunity.opportunity}</h4>
                          <p className="text-sm text-gray-600 mb-2"><strong>Why Now:</strong> {opportunity.whyNow}</p>
                          <p className="text-sm text-gray-700"><strong>How to Prepare:</strong> {opportunity.howToPrepare}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Career Advice */}
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-3 flex items-center">
                      <BriefcaseIcon className="h-5 w-5 text-cyan-600 mr-2" />
                      Strategic Career Advice
                    </h3>
                    <p className="text-gray-700">{futureReadinessRecommendations.careerAdvice}</p>
                  </div>

                  {/* Action Plan */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <ArrowRightIcon className="h-5 w-5 text-saas-cyan mr-2" />
                      Recommended Action Plan
                    </h3>
                    <div className="space-y-2">
                      {futureReadinessRecommendations.actionPlan.map((action, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start bg-white border border-gray-200 rounded-lg p-4"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                            {index + 1}
                          </span>
                          <p className="text-gray-700 flex-1">{action}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Failed to load recommendations. Please try again.</p>
                  <Button
                    onClick={handleFutureReadinessClick}
                    className="mt-4"
                    variant="primary"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Skills Readiness Recommendations Modal */}
      {showSkillsReadinessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-base rounded-xl shadow-2xl border border-saas-cyan/30 max-w-5xl w-full max-h-[90vh] overflow-y-auto bg-white"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-saas-border rounded-t-xl px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#22C55E]/20 border border-[#22C55E]/30 rounded-lg flex items-center justify-center">
                  <StarIcon className="h-6 w-6 text-[#22C55E]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Skills Readiness</h2>
                  <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Market demand analysis & skills gap assessment</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSkillsReadinessModal(false);
                  setSkillsReadinessRecommendations(null);
                }}
                className="p-2 hover:bg-saas-cyan/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-saas-text-heading-secondary hover:text-[#22D3EE]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-white">
              {loadingSkillsReadinessRecs ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan mb-4"></div>
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Analyzing your skills market demand...</p>
                </div>
              ) : skillsReadinessRecommendations ? (
                <div className="space-y-6">
                  {/* Skills Readiness Score */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <ChartBarIcon className="h-5 w-5 text-[#22C55E] mr-2" />
                      Skills Readiness Score
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{skillsReadinessRecommendations.skillsReadinessScore.overall}%</div>
                        <div className="text-xs text-gray-600 mt-1">Overall</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{skillsReadinessRecommendations.skillsReadinessScore.marketAlignment}%</div>
                        <div className="text-xs text-gray-600 mt-1">Market Alignment</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{skillsReadinessRecommendations.skillsReadinessScore.completeness}%</div>
                        <div className="text-xs text-gray-600 mt-1">Completeness</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{skillsReadinessRecommendations.skillsReadinessScore.futureProofing}%</div>
                        <div className="text-xs text-gray-600 mt-1">Future Proofing</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{skillsReadinessRecommendations.skillsReadinessScore.summary}</p>
                  </div>

                  {/* Current Skills Analysis */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Your Current Skills Market Demand
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skillsReadinessRecommendations.currentSkillsAnalysis.map((skill, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card-base border border-saas-cyan/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{skill.skill}</h4>
                            <div className="flex flex-col items-end space-y-1">
                              <span                               className={`px-2 py-1 rounded text-xs font-medium ${
                                skill.demand === 'high' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' :
                                skill.demand === 'medium' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                                {skill.demand} demand
                              </span>
                              <span                               className={`px-2 py-1 rounded text-xs font-medium ${
                                skill.trend === 'growing' ? 'bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30' :
                                skill.trend === 'stable' ? 'bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30' :
                                'bg-red-900/20 text-red-400 border border-red-500/30'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                                {skill.trend}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{skill.marketValue}</p>
                          <p className="text-xs text-gray-500">{skill.relevance}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Skills Gap */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <XMarkIcon className="h-5 w-5 text-red-400 mr-2" />
                      Critical Skills Gap
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skillsReadinessRecommendations.skillsGap.map((gap, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card-base border border-red-500/30 bg-red-900/10 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{gap.skill}</h4>
                            <span                               className={`px-2 py-1 rounded text-xs font-medium ${
                                gap.importance === 'critical' ? 'bg-red-600 text-white' :
                                gap.importance === 'high' ? 'bg-orange-900/20 text-orange-400 border border-orange-500/30' :
                                'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                              {gap.importance}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{gap.reason}</p>
                          <p className="text-xs text-red-600"><strong>Impact:</strong> {gap.impact}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* In-Demand Skills */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-2" />
                      Most In-Demand Skills in Your Field
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skillsReadinessRecommendations.inDemandSkills.map((skill, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card-base bg-gradient-to-br from-yellow-900/10 to-orange-900/10 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{skill.skill}</h4>
                            <span                               className={`px-2 py-1 rounded text-xs font-medium ${
                                skill.demandLevel === 'very high' ? 'bg-red-600 text-white' :
                                skill.demandLevel === 'high' ? 'bg-orange-900/20 text-orange-400 border border-orange-500/30' :
                                'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                              {skill.demandLevel}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2"><strong>Industry Relevance:</strong> {skill.industryRelevance}</p>
                          <p className="text-sm text-gray-700 mb-2"><strong>Salary Impact:</strong> {skill.salaryImpact}</p>
                          <p className="text-xs text-gray-600"><strong>Job Availability:</strong> {skill.jobAvailability}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Skills */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <AcademicCapIcon className="h-5 w-5 text-purple-600 mr-2" />
                      Recommended Skills to Learn
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skillsReadinessRecommendations.recommendedSkills.map((skill, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="card-base border border-saas-cyan/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{skill.skill}</h4>
                            <div className="flex flex-col items-end space-y-1">
                              <span                               className={`px-2 py-1 rounded text-xs font-medium ${
                                skill.priority === 'high' ? 'bg-red-900/20 text-red-400 border border-red-500/30' :
                                skill.priority === 'medium' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                                {skill.priority}
                              </span>
                              <span className="px-2 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 rounded text-xs font-medium">
                                {skill.timeToLearn}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{skill.reason}</p>
                          <p className="text-sm text-gray-600 mb-2"><strong>Learning Path:</strong> {skill.learningPath}</p>
                          {skill.complements.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-saas-text-heading-secondary mb-1"><strong>Complements:</strong></p>
                              <div className="flex flex-wrap gap-1">
                                {skill.complements.map((comp, compIndex) => (
                                  <span key={compIndex} className="px-2 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 rounded text-xs">
                                    {comp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Complementary Skills */}
                  {skillsReadinessRecommendations.complementarySkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                        <BriefcaseIcon className="h-5 w-5 text-indigo-600 mr-2" />
                        Complementary Skills
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {skillsReadinessRecommendations.complementarySkills.map((skill, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="card-base border border-saas-cyan/20 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <h4 className="font-semibold text-gray-900 mb-2">{skill.skill}</h4>
                            <p className="text-sm text-saas-text-heading mb-2">{skill.synergy}</p>
                            <p className="text-xs text-gray-600 mb-2"><strong>Value:</strong> {skill.value}</p>
                            <div className="mt-2">
                              <p className="text-xs text-saas-text-heading-secondary mb-1"><strong>Works well with:</strong></p>
                              <div className="flex flex-wrap gap-1">
                                {skill.complements.map((comp, compIndex) => (
                                  <span key={compIndex} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                                    {comp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emerging Skills */}
                  {skillsReadinessRecommendations.emergingSkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                        <ArrowRightIcon className="h-5 w-5 text-blue-600 mr-2" />
                        Emerging Skills to Watch
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {skillsReadinessRecommendations.emergingSkills.map((skill, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="card-base border border-saas-cyan/30 bg-saas-cyan/10 rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{skill.skill}</h4>
                              <span                               className={`px-2 py-1 rounded text-xs font-medium ${
                                skill.adoptionRate === 'fast' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' :
                                skill.adoptionRate === 'medium' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30' :
                                'bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30'
                              }`}
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                                {skill.adoptionRate}
                              </span>
                            </div>
                            <p className="text-sm text-saas-text-heading mb-2">{skill.trend}</p>
                            <p className="text-xs text-blue-600"><strong>Future Value:</strong> {skill.futureValue}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Obsolete Skills */}
                  {skillsReadinessRecommendations.obsoleteSkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                        <XMarkIcon className="h-5 w-5 text-red-400 mr-2" />
                        Skills Becoming Obsolete
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {skillsReadinessRecommendations.obsoleteSkills.map((skill, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="card-base border border-red-500/30 bg-red-900/10 rounded-lg p-4"
                          >
                            <h4 className="font-semibold text-gray-900 mb-2">{skill.skill}</h4>
                            <p className="text-sm text-saas-text-heading mb-2">{skill.status}</p>
                            <p className="text-sm text-saas-text-heading mb-2"><strong>Replace with:</strong> {skill.replacement}</p>
                            <p className="text-xs text-red-600"><strong>Transition:</strong> {skill.transition}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Plan */}
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4 flex items-center">
                      <ArrowRightIcon className="h-5 w-5 text-[#22C55E] mr-2" />
                      Recommended Action Plan
                    </h3>
                    <div className="space-y-2">
                      {skillsReadinessRecommendations.actionPlan.map((action, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start card-base rounded-lg p-4 hover:border-[#22C55E]/50 transition-all"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-[#22C55E]/20 border border-[#22C55E]/30 text-[#22C55E] rounded-full flex items-center justify-center text-sm font-semibold mr-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {index + 1}
                          </span>
                          <p className="text-saas-text-heading flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{action}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Failed to load recommendations. Please try again.</p>
                  <Button
                    onClick={handleSkillsReadinessClick}
                    className="mt-4"
                    variant="primary"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Geographic Recommendations Modal */}
      {showGeographicModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-base rounded-xl shadow-2xl border border-saas-cyan/30 max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-saas-border rounded-t-xl px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-saas-cyan/20 border border-saas-cyan/30 rounded-lg flex items-center justify-center">
                  <GlobeAltIcon className="h-6 w-6 text-saas-cyan" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Geographic Opportunities</h2>
                  <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Visa information & immigration guidance</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGeographicModal(false);
                  setGeographicCountries([]);
                  setSelectedCountry(null);
                  setVisaInfo(null);
                }}
                className="p-2 hover:bg-saas-cyan/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-saas-text-heading-secondary hover:text-[#22D3EE]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-white">
              {loadingGeographicRecs ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan mb-4"></div>
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Analyzing your profile for geographic opportunities...</p>
                </div>
              ) : geographicCountries.length > 0 ? (
                <div className="space-y-6">
                  {!selectedCountry ? (
                    /* Countries List */
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4">Recommended Countries</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {geographicCountries.map((country, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={() => handleCountrySelect(country.country)}
                              className="card-base border-2 border-saas-cyan/20 rounded-lg p-5 hover:border-saas-cyan/50 hover:shadow-lg transition-all cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <MapPinIcon className="h-6 w-6 text-saas-cyan" />
                                  <h4 className="text-lg font-bold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{country.country}</h4>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  country.priority === 'high' ? 'bg-red-900/20 text-red-400 border border-red-500/30' :
                                  country.priority === 'medium' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30' :
                                  'bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30'
                                }`}
                                style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {country.priority}
                                </span>
                              </div>
                              <p className="text-sm text-saas-text-heading mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>{country.reason}</p>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  <BriefcaseIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                                  <span><strong>Job Market:</strong> {country.jobMarket}</span>
                                </div>
                                <div className="flex items-center text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  <CurrencyDollarIcon className="h-4 w-4 mr-2 text-[#22C55E]" />
                                  <span><strong>Salary Potential:</strong> {country.salaryPotential}</span>
                                </div>
                                <div className="flex items-center text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  <GlobeAltIcon className="h-4 w-4 mr-2 text-saas-purple" />
                                  <span><strong>Immigration Ease:</strong> 
                                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                      country.immigrationEase === 'easy' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' :
                                      country.immigrationEase === 'medium' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30' :
                                      'bg-red-900/20 text-red-400 border border-red-500/30'
                                    }`}
                                    style={{ fontFamily: 'Inter, sans-serif' }}>
                                      {country.immigrationEase}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-saas-cyan/20">
                                <p className="text-xs text-saas-cyan font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Click to view visa details →</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Visa Information for Selected Country */
                    <div className="space-y-6">
                      {/* Back Button */}
                      <button
                        onClick={() => {
                          setSelectedCountry(null);
                          setVisaInfo(null);
                        }}
                        className="flex items-center text-saas-cyan hover:opacity-80 font-medium transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <ArrowRightIcon className="h-5 w-5 mr-2 rotate-180" />
                        Back to Countries
                      </button>

                      {/* Country Header */}
                      <div className="card-base rounded-xl p-6 border border-saas-cyan/30 bg-gradient-to-r from-[#22D3EE]/10 to-[#22D3EE]/5">
                        <div className="flex items-center space-x-3 mb-2">
                          <MapPinIcon className="h-8 w-8 text-saas-cyan" />
                          <h3 className="text-2xl font-bold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>{selectedCountry}</h3>
                        </div>
                        {visaInfo?.generalInfo.overview && (
                          <p className="text-saas-text-heading mt-3" style={{ fontFamily: 'Inter, sans-serif' }}>{visaInfo.generalInfo.overview}</p>
                        )}
                      </div>

                      {loadingVisaInfo ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan mb-4"></div>
                          <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Loading visa information from knowledge base...</p>
                        </div>
                      ) : visaInfo ? (
                        <>
                          {/* Visa Types */}
                          {visaInfo.visaTypes && visaInfo.visaTypes.length > 0 && (
                            <div>
                              <h4 className="text-lg font-semibold text-saas-text-heading font-semibold mb-4" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Available Visa Types</h4>
                              <div className="space-y-4">
                                {visaInfo.visaTypes.map((visaType, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="card-base border border-saas-cyan/20 rounded-lg p-5 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <h5 className="text-lg font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{visaType.type}</h5>
                                    </div>
                                    <p className="text-sm text-saas-text-heading mb-4">{visaType.description}</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                      <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Eligibility:</p>
                                        <ul className="space-y-1">
                                          {visaType.eligibility.map((req, reqIndex) => (
                                            <li key={reqIndex} className="text-sm text-gray-700 flex items-start">
                                              <CheckCircleIcon className="h-4 w-4 text-[#22C55E] mr-2 mt-0.5 flex-shrink-0" />
                                              {req}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Requirements:</p>
                                        <ul className="space-y-1">
                                          {visaType.requirements.map((req, reqIndex) => (
                                            <li key={reqIndex} className="text-sm text-gray-700 flex items-start">
                                              <CheckCircleIcon className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                                              {req}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>

                                    {visaType.processSteps && visaType.processSteps.length > 0 && (
                                      <div className="mb-4">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Application Process:</p>
                                        <ol className="space-y-2">
                                          {visaType.processSteps.map((step, stepIndex) => (
                                            <li key={stepIndex} className="text-sm text-gray-700 flex items-start">
                                              <span className="flex-shrink-0 w-6 h-6 bg-saas-cyan/20 border border-saas-cyan/30 text-[#22D3EE] rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                                                {stepIndex + 1}
                                              </span>
                                              {step}
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                                      <div>
                                        <p className="text-xs font-semibold text-gray-600">Processing Time</p>
                                        <p className="text-sm text-gray-900 font-medium">{visaType.processingTime}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-gray-600">Cost</p>
                                        <p className="text-sm text-gray-900 font-medium">{visaType.cost}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-gray-600">Validity</p>
                                        <p className="text-sm text-gray-900 font-medium">{visaType.validity}</p>
                                      </div>
                                    </div>

                                    {visaType.links && visaType.links.length > 0 && (
                                      <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Official Resources:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {visaType.links.map((link, linkIndex) => (
                                            <a
                                              key={linkIndex}
                                              href={link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-orange-600 hover:text-orange-700 underline"
                                            >
                                              {link}
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {visaType.notes && (
                                      <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs font-semibold text-gray-600 mb-2">Important Notes:</p>
                                        <p className="text-sm text-saas-text-heading">{visaType.notes}</p>
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* General Info */}
                          {visaInfo.generalInfo && (
                            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">General Information</h4>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-semibold text-gray-700 mb-2">Best For:</p>
                                  <p className="text-sm text-saas-text-heading-secondary">{visaInfo.generalInfo.bestFor}</p>
                                </div>
                                {visaInfo.generalInfo.tips && visaInfo.generalInfo.tips.length > 0 && (
                                  <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Tips:</p>
                                    <ul className="space-y-1">
                                      {visaInfo.generalInfo.tips.map((tip, tipIndex) => (
                                        <li key={tipIndex} className="text-sm text-gray-600 flex items-start">
                                          <StarIcon className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                          {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {visaInfo.generalInfo.commonMistakes && visaInfo.generalInfo.commonMistakes.length > 0 && (
                                  <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Common Mistakes to Avoid:</p>
                                    <ul className="space-y-1">
                                      {visaInfo.generalInfo.commonMistakes.map((mistake, mistakeIndex) => (
                                        <li key={mistakeIndex} className="text-sm text-gray-600 flex items-start">
                                          <XMarkIcon className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                          {mistake}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Enhanced Info */}
                          {visaInfo.enhancedInfo && (
                            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Insights</h4>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-semibold text-gray-700 mb-2">Current Market Conditions:</p>
                                  <p className="text-sm text-saas-text-heading-secondary">{visaInfo.enhancedInfo.marketConditions}</p>
                                </div>
                                {visaInfo.enhancedInfo.recentUpdates && (
                                  <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Recent Updates:</p>
                                    <p className="text-sm text-saas-text-heading-secondary">{visaInfo.enhancedInfo.recentUpdates}</p>
                                  </div>
                                )}
                                {visaInfo.enhancedInfo.bestPractices && visaInfo.enhancedInfo.bestPractices.length > 0 && (
                                  <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Best Practices:</p>
                                    <ul className="space-y-1">
                                      {visaInfo.enhancedInfo.bestPractices.map((practice, practiceIndex) => (
                                        <li key={practiceIndex} className="text-sm text-gray-600 flex items-start">
                                          <CheckCircleIcon className="h-4 w-4 text-[#22C55E] mr-2 mt-0.5 flex-shrink-0" />
                                          {practice}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Failed to load visa information. Please try again.</p>
                          <Button
                            onClick={() => handleCountrySelect(selectedCountry)}
                            className="mt-4"
                            variant="primary"
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Failed to load geographic recommendations. Please try again.</p>
                  <Button
                    onClick={handleGeographicClick}
                    className="mt-4"
                    variant="primary"
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* All Jobs Modal */}
      {showAllJobsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-base rounded-xl shadow-2xl border border-saas-cyan/30 max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-saas-border rounded-t-xl px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>All Recommended Jobs</h2>
                <p className="text-sm text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {personalizedJobs?.jobs?.length || 0} personalized job recommendations
                </p>
              </div>
              <button
                onClick={() => setShowAllJobsModal(false)}
                className="p-2 hover:bg-saas-cyan/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-saas-text-heading-secondary hover:text-[#22D3EE]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-white">
              {loadingPersonalizedJobs ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan mb-4"></div>
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Analyzing your CV and finding the best job matches...</p>
                </div>
              ) : !personalizedJobs ? (
                <div className="text-center py-12">
                  <BriefcaseIcon className="h-12 w-12 text-saas-text-heading-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Job Recommendations Not Loaded
                  </h3>
                  <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Click the "Get Job Recommendations" button on the dashboard to load personalized jobs.
                  </p>
                  <Button
                    onClick={() => {
                      setShowAllJobsModal(false);
                      loadPersonalizedJobs();
                    }}
                    variant="primary"
                  >
                    Load Recommendations
                  </Button>
                </div>
              ) : personalizedJobs.jobs && personalizedJobs.jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {personalizedJobs.jobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="h-full"
                    >
                      <Card className="p-6 h-full flex flex-col" hover>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-saas-text-heading text-lg flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {job.title}
                          </h3>
                          <div className="flex flex-col items-end space-y-1 ml-2">
                            <span className="px-3 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 rounded-full text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {job.type}
                            </span>
                            {job.similarity_score && (
                              <span className="px-2 py-1 bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 rounded-full text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {Math.round((job.similarity_score || 0) * 100)}% Match
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-saas-text-heading-secondary mb-4 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{job.company}</p>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <MapPinIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                            {job.location}
                          </div>
                          {job.salary && (
                            <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                              <CurrencyDollarIcon className="h-4 w-4 mr-2 text-[#22C55E]" />
                              {job.salary}
                            </div>
                          )}
                          {job.experience && (
                            <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                              <UserGroupIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                              {job.experience}
                            </div>
                          )}
                          {job.remote && (
                            <div className="flex items-center text-sm text-[#22C55E]" style={{ fontFamily: 'Inter, sans-serif' }}>
                              <GlobeAltIcon className="h-4 w-4 mr-2" />
                              Remote Available
                            </div>
                          )}
                        </div>
                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.skills.slice(0, 4).map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="px-2 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 rounded text-xs"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                        {(job.matchReason || job.match_reason) && (
                          <div className="mb-4 p-3 bg-saas-bg-secondary border border-saas-border rounded-lg">
                            <p className="text-xs text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                              <strong>Why this job:</strong> {job.matchReason || job.match_reason}
                            </p>
                          </div>
                        )}
                        <div className="mt-auto pt-4">
                        {job.applyLink ? (
                          <a
                            href={job.applyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                          >
                            <Button variant="primary" className="w-full">
                              Apply Now
                              <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Button>
                          </a>
                        ) : (
                          <Link to={`/internships/${job.id}`}>
                            <Button variant="outline" className="w-full">
                              View Details
                            </Button>
                          </Link>
                        )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BriefcaseIcon className="h-12 w-12 text-saas-text-heading-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    No Job Recommendations Yet
                  </h3>
                  <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Upload your CV in the Profile section to get personalized job recommendations based on your skills and experience.
                  </p>
                  <Link to="/profile">
                    <Button variant="primary">
                      Upload CV
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* All Courses Modal */}
      {showAllCoursesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-base rounded-xl shadow-2xl border border-saas-cyan/30 max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-saas-border rounded-t-xl px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>All Recommended Courses</h2>
                <p className="text-sm text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {personalizedCourses?.courses?.length || 0} personalized course recommendations
                </p>
              </div>
              <button
                onClick={() => setShowAllCoursesModal(false)}
                className="p-2 hover:bg-saas-cyan/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-saas-text-heading-secondary hover:text-[#22D3EE]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-white">
              {loadingPersonalizedCourses ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan mb-4"></div>
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Analyzing your CV and finding the best course matches...</p>
                </div>
              ) : !personalizedCourses ? (
                <div className="text-center py-12">
                  <AcademicCapIcon className="h-12 w-12 text-saas-text-heading-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Course Recommendations Not Loaded
                  </h3>
                  <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Click the "Get Course Recommendations" button on the dashboard to load personalized courses.
                  </p>
                  <Button
                    onClick={() => {
                      setShowAllCoursesModal(false);
                      loadPersonalizedCourses();
                    }}
                    variant="primary"
                  >
                    Load Recommendations
                  </Button>
                </div>
              ) : personalizedCourses.courses && personalizedCourses.courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {personalizedCourses.courses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="h-full"
                    >
                      <Card className="p-6 h-full flex flex-col" hover>
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-saas-text-heading text-lg flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {course.title}
                          </h3>
                          <div className="flex flex-col items-end space-y-1 ml-2">
                            <span className="px-2 py-1 bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30 rounded-full text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {course.provider}
                            </span>
                            {course.similarityScore && (
                              <span className="px-2 py-1 bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 rounded-full text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {Math.round(course.similarityScore * 100)}% Match
                              </span>
                            )}
                          </div>
                        </div>
                        {course.instructor && (
                          <p className="text-saas-text-heading-secondary mb-2 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Instructor: {course.instructor}
                          </p>
                        )}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                              Duration: {course.duration}
                            </span>
                            <div className="flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-saas-text-heading-secondary ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {course.rating?.toFixed(1) || '4.0'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <ClockIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                            Level: {course.level}
                          </div>
                          <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <CurrencyDollarIcon className="h-4 w-4 mr-2 text-[#22C55E]" />
                            Price: {course.price}
                          </div>
                          {course.certificate && (
                            <div className="flex items-center text-sm text-[#22C55E]" style={{ fontFamily: 'Inter, sans-serif' }}>
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              Certificate: {course.certificate}
                            </div>
                          )}
                          {course.format && (
                            <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                              <AcademicCapIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                              Format: {course.format}
                            </div>
                          )}
                          {course.language && (
                            <div className="flex items-center text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                              <LanguageIcon className="h-4 w-4 mr-2 text-saas-cyan" />
                              Language: {course.language}
                            </div>
                          )}
                        </div>
                        {course.skills_taught && course.skills_taught.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-saas-text-heading-secondary mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Skills Taught:</p>
                            <div className="flex flex-wrap gap-2">
                              {course.skills_taught.map((skill, skillIndex) => (
                                <span
                                  key={skillIndex}
                                  className="px-2 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 rounded text-xs"
                                  style={{ fontFamily: 'Inter, sans-serif' }}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {course.description && (
                          <p className="text-sm text-saas-text-heading-secondary mb-4 line-clamp-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {course.description}
                          </p>
                        )}
                        {course.matchReason && (
                          <div className="mb-4 p-3 bg-saas-bg-secondary border border-saas-border rounded-lg">
                            <p className="text-xs text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                              <strong>Why this course:</strong> {course.matchReason}
                            </p>
                          </div>
                        )}
                        <div className="mt-auto pt-4">
                        {course.enrollmentLink ? (
                          <a
                            href={course.enrollmentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                          >
                            <Button variant="primary" className="w-full">
                              Enroll Now
                              <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Button>
                          </a>
                        ) : (
                          <Button variant="outline" className="w-full" disabled>
                            Link Not Available
                          </Button>
                        )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AcademicCapIcon className="h-12 w-12 text-saas-text-heading-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    No Course Recommendations Yet
                  </h3>
                  <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Upload your CV in the Profile section to get personalized course recommendations to improve your skills.
                  </p>
                  <Link to="/profile">
                    <Button variant="primary">
                      Upload CV
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
