import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  BellIcon,
  ChartBarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  MapPinIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  LanguageIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { getDashboardRecommendations, getGeographicRecommendations } from '../../services/apiService';
import Avatar from '../ui/Avatar';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMeDropdown, setShowMeDropdown] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [topCountries, setTopCountries] = useState<string[]>([]);
  const [loadingGeographic, setLoadingGeographic] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [geographicLoaded, setGeographicLoaded] = useState(false);
  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only use context user, don't read from localStorage directly
  const userId = user?._id || user?.id;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMeDropdown(false);
      }
    };

    if (showMeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMeDropdown]);

  const loadGeographicOpportunities = async () => {
    if (!userId || geographicLoaded) return;
    try {
      setLoadingGeographic(true);
      const response = await getGeographicRecommendations(userId);
      if (response.success && response.data) {
        // Extract country names from recommendations
        const countryNames = response.data.map((country: any) => country.country);
        setTopCountries(countryNames);
      }
      setGeographicLoaded(true);
    } catch (err) {
      console.error('Error loading geographic opportunities:', err);
    } finally {
      setLoadingGeographic(false);
    }
  };

  const loadJobRecommendations = async () => {
    if (!userId || jobsLoaded) return;
    try {
      setLoadingJobs(true);
      const response = await getDashboardRecommendations(userId);
      if (response.success && response.data) {
        setRecommendations((prev: any) => ({
          ...prev,
          data: {
            ...prev?.data,
            jobs: response.data.jobs
          }
        }));
      }
      setJobsLoaded(true);
    } catch (err) {
      console.error('Error loading job recommendations:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadCourseRecommendations = async () => {
    if (!userId || coursesLoaded) return;
    try {
      setLoadingCourses(true);
      const response = await getDashboardRecommendations(userId);
      if (response.success && response.data) {
        setRecommendations((prev: any) => ({
          ...prev,
          data: {
            ...prev?.data,
            courses: response.data.courses
          }
        }));
      }
      setCoursesLoaded(true);
    } catch (err) {
      console.error('Error loading course recommendations:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadUnreadNotifications = async () => {
    if (!userId) return;
    try {
      const isRecruiter = user?.role === 'recruiter';
      
      if (isRecruiter) {
        // For recruiters: count applications, interviews, and offers
        let recruiterNotificationsCount = 0;
        try {
          const [appsRes, interviewsRes, offersRes] = await Promise.all([
            fetch(`http://localhost:5000/api/recruiter/applications?recruiterId=${userId}`).catch(() => null),
            fetch(`http://localhost:5000/api/recruiter/interviews?recruiterId=${userId}`).catch(() => null),
            fetch(`http://localhost:5000/api/recruiter/offers?recruiterId=${userId}`).catch(() => null),
          ]);

          if (appsRes) {
            const appsData = await appsRes.json();
            if (appsData.success && appsData.data) {
              // Count new applications (status === 'applied')
              recruiterNotificationsCount += appsData.data.filter((app: any) => app.status === 'applied').length;
            }
          }
          if (interviewsRes) {
            const interviewsData = await interviewsRes.json();
            if (interviewsData.success && interviewsData.data) {
              // Count interview responses (accepted/declined)
              recruiterNotificationsCount += interviewsData.data.filter((i: any) => i.status === 'accepted' || i.status === 'declined').length;
            }
          }
          if (offersRes) {
            const offersData = await offersRes.json();
            if (offersData.success && offersData.data) {
              // Count offer responses (accepted/declined)
              recruiterNotificationsCount += offersData.data.filter((o: any) => o.status === 'accepted' || o.status === 'declined').length;
            }
          }
        } catch (e) {
          // Ignore errors
        }
        setUnreadCount(recruiterNotificationsCount);
      } else {
        // For jobseekers: count post notifications and applications/interviews/offers
        let unreadPostCount = 0;
        try {
          const unreadRes = await fetch(`http://localhost:5000/api/posts/notifications/${userId}/unread-count`);
          const unreadData = await unreadRes.json();
          if (unreadData.success) {
            unreadPostCount = unreadData.count || 0;
          }
        } catch (e) {
          // Fallback: count manually if endpoint not available
          try {
            const notificationsRes = await fetch(`http://localhost:5000/api/posts/notifications/${userId}`);
            const notificationsData = await notificationsRes.json();
            if (notificationsData.success) {
              unreadPostCount = notificationsData.data.filter((n: any) => !n.read).length;
            }
          } catch (e2) {
            // Endpoint might not be available
          }
        }

        // Count other notifications (applications, interviews, offers) - these are always "new"
        let otherNotificationsCount = 0;
        try {
          const [appsRes, interviewsRes, offersRes] = await Promise.all([
            fetch(`http://localhost:5000/api/recruiter/applications?userId=${userId}`).catch(() => null),
            fetch(`http://localhost:5000/api/recruiter/interviews?userId=${userId}`).catch(() => null),
            fetch(`http://localhost:5000/api/recruiter/offers?userId=${userId}`).catch(() => null),
          ]);

          if (appsRes) {
            const appsData = await appsRes.json();
            if (appsData.success && appsData.data) {
              otherNotificationsCount += appsData.data.length;
            }
          }
          if (interviewsRes) {
            const interviewsData = await interviewsRes.json();
            if (interviewsData.success && interviewsData.data) {
              otherNotificationsCount += interviewsData.data.length;
            }
          }
          if (offersRes) {
            const offersData = await offersRes.json();
            if (offersData.success && offersData.data) {
              otherNotificationsCount += offersData.data.length;
            }
          }
        } catch (e) {
          // Ignore errors for other notifications
        }

        setUnreadCount(unreadPostCount + otherNotificationsCount);
      }
    } catch (err) {
      console.error('Error loading unread notifications:', err);
      setUnreadCount(0);
    }
  };

  // Load unread notifications on mount and when user changes
  useEffect(() => {
    if (userId) {
      loadUnreadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        loadUnreadNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Reload notifications when navigating to/from notifications page
  useEffect(() => {
    if (userId && (location.pathname === '/notifications' || location.pathname === '/home')) {
      loadUnreadNotifications();
    }
  }, [location.pathname, userId]);

  // Reset dropdown state when user changes (e.g., from another tab)
  useEffect(() => {
    setShowMeDropdown(false);
    setRecommendations(null);
    setTopCountries([]);
    setGeographicLoaded(false);
    setJobsLoaded(false);
    setCoursesLoaded(false);
  }, [user]);

  const handleLogout = () => {
    const currentUser = user;
    logout();
    setShowMeDropdown(false);
    // Redirect admin to admin login page, others to regular login
    if (currentUser?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  // Get navigation items based on user role
  const getNavItems = () => {
    if (!user) {
      return [
        { name: 'Jobs', href: '/jobs' },
        { name: 'Network', href: '/profiles' },
      ];
    }

    if (user.role === 'recruiter') {
      return [
        { name: 'Dashboard', href: '/recruiter' },
        { name: 'Posts', href: '/recruiter/posts' },
        { name: 'Post Job', href: '/recruiter/post-job' },
        { name: 'My Jobs', href: '/recruiter/jobs' },
        { name: 'Applicants', href: '/recruiter/applicants' },
        { name: 'Profiles', href: '/recruiter/profiles' },
      ];
    }

    if (user.role === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Jobs', href: '/admin/jobs' },
        { name: 'Reports', href: '/admin/reports' },
      ];
    }

    // Default for jobseekers
    return [
    { name: 'Posts', href: '/home' },
      { name: 'Network', href: '/profiles' },
    { name: 'Jobs', href: '/jobs' },
    { name: 'Cover Letter', href: '/cover-letter' },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
    <nav 
      className="fixed top-0 left-0 right-0 z-50 navbar-glass" 
      style={{ 
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        height: '68px',
        overflow: 'visible'
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ position: 'relative', zIndex: 50, overflow: 'visible', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div className="flex justify-between items-center w-full" style={{ overflow: 'visible' }}>
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link
              to={user ? (user.role === 'recruiter' ? "/recruiter" : "/home") : "/"}
              className="flex items-center space-x-2.5 group"
            >
              <div className="w-10 h-10 flex items-center justify-center transition-all duration-300">
                <span className="text-saas-text-heading font-bold text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>JG</span>
              </div>
              <span className="text-xl font-semibold text-saas-text-heading hidden sm:block tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>Job Genius</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-0.5 justify-end">
            {user ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`relative px-4 py-2.5 mx-0.5 text-sm font-medium transition-all duration-300 rounded-lg group ${
                      location.pathname === item.href
                        ? 'text-saas-cyan font-semibold'
                        : 'text-saas-text-body hover:text-saas-cyan'
                    }`}
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <span className="relative z-10">{item.name}</span>
                    {location.pathname === item.href && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-saas-cyan rounded-full"></span>
                    )}
                  </Link>
                ))}
                {/* Notifications */}
                <Link
                  to="/notifications"
                  className={`relative px-4 py-2.5 mx-0.5 text-sm font-medium transition-all duration-300 rounded-md group ${
                    location.pathname === '/notifications'
                      ? 'text-saas-cyan font-semibold'
                      : 'text-saas-text-body hover:text-saas-cyan'
                  }`}
                >
                  <div className="relative">
                  <BellIcon className="h-5 w-5" />
                    {/* Notification badge - only show if there are unread notifications */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  {location.pathname === '/notifications' && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-saas-cyan rounded-full"></span>
                  )}
                </Link>
                {/* Me Dropdown - LinkedIn Style */}
                <div className="relative ml-2" ref={dropdownRef} style={{ zIndex: 1000, overflow: 'visible' }}>
                  <button
                    onClick={() => setShowMeDropdown(!showMeDropdown)}
                    className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-all duration-300 ${
                      showMeDropdown 
                        ? 'bg-saas-cyan/10 border border-saas-cyan/30' 
                        : 'hover:bg-saas-bg-secondary border border-transparent'
                    }`}
                    style={{ position: 'relative', zIndex: 1000 }}
                  >
                    <Avatar 
                      src={user?.profilePicture}
                      name={user?.name}
                      size="sm"
                      className="ring-2 ring-saas-cyan/20"
                    />
                    <ChevronDownIcon className={`h-4 w-4 text-saas-text-body transition-transform duration-200 ${showMeDropdown ? 'rotate-180 text-saas-cyan' : ''}`} />
                  </button>

                          {showMeDropdown && (
                            <div 
                              className="absolute right-0 mt-2 w-80 border border-saas-border rounded-xl transition-all duration-300 ease-in-out" 
                              style={{ 
                                maxHeight: 'calc(100vh - 80px)', 
                                background: '#FFFFFF',
                                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                                zIndex: 1000,
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                overflow: 'visible'
                              }}
                            >
                              {/* Profile Header */}
                              <div className="px-5 py-4 border-b border-saas-border rounded-t-xl">
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar 
                            src={user?.profilePicture}
                            name={user?.name}
                            size="xl"
                            className="ring-2 ring-saas-cyan/20 shadow-md flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-saas-text-heading truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>{user?.name || 'User'}</p>
                            <p className="text-xs text-saas-text-body capitalize truncate mt-0.5" style={{ fontFamily: 'Poppins, sans-serif' }}>{user?.role || 'Job Seeker'}</p>
                          </div>
                        </div>
                        {user.role !== 'recruiter' && user.role !== 'admin' && (
                      <Link
                        to="/profile"
                        onClick={() => setShowMeDropdown(false)}
                            className="inline-block text-sm font-semibold text-primary-accent hover:text-primary-accent/80 transition-colors duration-300"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                            View profile →
                      </Link>
                        )}
                      </div>

                      <div className="overflow-y-auto rounded-b-xl" style={{ maxHeight: 'calc(100vh - 200px)', overflowX: 'visible', paddingBottom: '8px' }}>
                        {/* Main Menu Items */}
                        <div className="py-2">
                          {user.role === 'recruiter' ? (
                            <>
                              <Link
                                to="/recruiter"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-saas-border">
                                  <ChartBarIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Dashboard</span>
                              </Link>
                              <Link
                                to="/recruiter/post-job"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-saas-border">
                                  <BriefcaseIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Post Job</span>
                              </Link>
                              <Link
                                to="/recruiter/jobs"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-secondary-accent/20 flex items-center justify-center group-hover:bg-secondary-accent/30 transition-colors border border-secondary-accent/30">
                                  <BriefcaseIcon className="h-4 w-4 text-secondary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>My Jobs</span>
                              </Link>
                              <Link
                                to="/recruiter/applicants"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-saas-border">
                                  <AcademicCapIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Applicants</span>
                              </Link>
                              <Link
                                to="/recruiter/profiles"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-saas-border">
                                  <UserIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Browse Profiles</span>
                              </Link>
                            </>
                          ) : user.role === 'admin' ? (
                            <>
                              <Link
                                to="/admin"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-saas-border">
                                  <ChartBarIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Dashboard</span>
                              </Link>
                              <Link
                                to="/admin/users"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-saas-border">
                                  <UsersIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Users</span>
                              </Link>
                              <Link
                                to="/admin/jobs"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-secondary-accent/20 flex items-center justify-center group-hover:bg-secondary-accent/30 transition-colors border border-secondary-accent/30">
                                  <BriefcaseIcon className="h-4 w-4 text-secondary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Jobs</span>
                              </Link>
                              <Link
                                to="/admin/reports"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-saas-border">
                                  <ChartBarIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Reports</span>
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link
                                to="/profile"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-saas-border">
                                  <UserIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>My Profile</span>
                              </Link>
                              <Link
                                to="/dashboard"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-saas-border">
                                  <ChartBarIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Dashboard</span>
                              </Link>
                              <Link
                                to="/applications"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-secondary-accent/20 flex items-center justify-center group-hover:bg-secondary-accent/30 transition-colors border border-secondary-accent/30">
                                  <BriefcaseIcon className="h-4 w-4 text-secondary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Applications</span>
                              </Link>
                              <Link
                                to="/interviews"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-saas-border">
                                  <AcademicCapIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Interviews</span>
                              </Link>
                              <Link
                                to="/offers"
                                onClick={() => setShowMeDropdown(false)}
                                className="flex items-center space-x-3 px-5 py-2.5 hover:bg-primary-accent/10 transition-colors duration-300 group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-primary-accent/20 flex items-center justify-center group-hover:bg-primary-accent/30 transition-colors border border-primary-accent/30">
                                  <ChartBarIcon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Offers</span>
                              </Link>
                            </>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-saas-border my-2"></div>

                        {user.role !== 'recruiter' && user.role !== 'admin' && (
                          <>
                            {/* Geographic Opportunities */}
                            <div className="px-5 py-3">
                              <div 
                                className="flex items-center justify-between mb-3 cursor-pointer"
                                onClick={loadGeographicOpportunities}
                              >
                                <p className="text-xs font-bold text-saas-text-heading-secondary uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>Geographic Opportunities</p>
                                {!geographicLoaded && (
                                  <span className="text-xs text-saas-text-heading-secondary">Click to load</span>
                                )}
                              </div>
                              {loadingGeographic ? (
                                <div className="flex items-center space-x-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-saas-border border-t-[#22D3EE]"></div>
                                  <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading...</p>
                                </div>
                              ) : geographicLoaded && topCountries && topCountries.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                  {topCountries.slice(0, 6).map((country: string, index: number) => (
                                    <div
                                      key={index}
                                      className="glass-card-sm p-2.5 rounded-lg text-center text-xs font-semibold text-saas-text-heading hover:border-saas-cyan/40 hover:text-saas-cyan transition-all duration-300 cursor-pointer"
                                      style={{ fontFamily: 'Poppins, sans-serif' }}
                                      onClick={() => {
                                        setShowMeDropdown(false);
                                        navigate('/dashboard');
                                      }}
                                    >
                                      {country}
                                    </div>
                                  ))}
                                </div>
                              ) : geographicLoaded ? (
                                <Link
                                  to="/dashboard"
                                  onClick={() => setShowMeDropdown(false)}
                                  className="flex items-center space-x-2 text-xs font-medium text-saas-cyan hover:opacity-80 transition-colors"
                                  style={{ fontFamily: 'Poppins, sans-serif' }}
                                >
                                  <MapPinIcon className="h-4 w-4" />
                                  <span>View opportunities</span>
                                </Link>
                              ) : (
                                <p className="text-xs text-saas-text-heading-secondary italic" style={{ fontFamily: 'Poppins, sans-serif' }}>Click above to load opportunities</p>
                              )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100 my-2"></div>

                            {/* Job Recommendations */}
                            <div className="px-5 py-3">
                              <div 
                                className="flex items-center justify-between mb-3 cursor-pointer"
                                onClick={loadJobRecommendations}
                              >
                                <p className="text-xs font-bold text-saas-text-heading-secondary uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>Job Recommendations</p>
                                {!jobsLoaded && (
                                  <span className="text-xs text-saas-text-heading-secondary">Click to load</span>
                                )}
                              </div>
                              {loadingJobs ? (
                                <div className="flex items-center space-x-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-saas-border border-t-[#22D3EE]"></div>
                                  <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading...</p>
                                </div>
                              ) : jobsLoaded && recommendations?.data?.jobs && recommendations.data.jobs.length > 0 ? (
                                <div className="space-y-2.5">
                                  {recommendations.data.jobs.slice(0, 2).map((job: any, index: number) => (
                                    <div
                                      key={index}
                                      className="glass-card-sm p-3 rounded-lg transition-all duration-300 cursor-pointer hover:border-saas-cyan/40"
                                      style={{ fontFamily: 'Poppins, sans-serif' }}
                                      onClick={() => {
                                        setShowMeDropdown(false);
                                        navigate('/jobs');
                                      }}
                                    >
                                      <p className="text-sm font-semibold text-saas-text-heading truncate">{job.title || 'Job Opportunity'}</p>
                                      <p className="text-xs text-saas-text-heading-secondary truncate mt-0.5">{job.company || 'Company'}</p>
                                    </div>
                                  ))}
                                  <Link
                                    to="/jobs"
                                    onClick={() => setShowMeDropdown(false)}
                                    className="block text-xs font-semibold text-saas-cyan hover:opacity-80 mt-2 transition-colors"
                                    style={{ fontFamily: 'Poppins, sans-serif' }}
                                  >
                                    View all jobs →
                                  </Link>
                                </div>
                              ) : jobsLoaded ? (
                                <Link
                                  to="/jobs"
                                  onClick={() => setShowMeDropdown(false)}
                                  className="flex items-center space-x-2 text-xs font-medium text-saas-cyan hover:opacity-80 transition-colors"
                                  style={{ fontFamily: 'Poppins, sans-serif' }}
                                >
                                  <BriefcaseIcon className="h-4 w-4" />
                                  <span>Browse jobs</span>
                                </Link>
                              ) : (
                                <p className="text-xs text-saas-text-heading-secondary italic" style={{ fontFamily: 'Poppins, sans-serif' }}>Click above to load recommendations</p>
                              )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-saas-border my-2"></div>

                            {/* Course Recommendations */}
                            <div className="px-5 py-3">
                              <div 
                                className="flex items-center justify-between mb-3 cursor-pointer"
                                onClick={loadCourseRecommendations}
                              >
                                <p className="text-xs font-bold text-saas-text-heading-secondary uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>Course Recommendations</p>
                                {!coursesLoaded && (
                                  <span className="text-xs text-saas-text-heading-secondary">Click to load</span>
                                )}
                              </div>
                              {loadingCourses ? (
                                <div className="flex items-center space-x-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-saas-border border-t-[#22D3EE]"></div>
                                  <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading...</p>
                                </div>
                              ) : coursesLoaded && recommendations?.data?.courses && recommendations.data.courses.length > 0 ? (
                                <div className="space-y-2.5">
                                  {recommendations.data.courses.slice(0, 2).map((course: any, index: number) => (
                                    <div
                                      key={index}
                                      className="glass-card-sm p-3 rounded-lg transition-all duration-300 cursor-pointer hover:border-saas-cyan/40"
                                      style={{ fontFamily: 'Poppins, sans-serif' }}
                                      onClick={() => {
                                        setShowMeDropdown(false);
                                        navigate('/marketplace');
                                      }}
                                    >
                                      <p className="text-sm font-semibold text-saas-text-heading truncate">{course.title || 'Course'}</p>
                                      <p className="text-xs text-saas-text-heading-secondary truncate mt-0.5">{course.provider || 'Provider'}</p>
                                    </div>
                                  ))}
                                  <Link
                                    to="/marketplace"
                                    onClick={() => setShowMeDropdown(false)}
                                    className="block text-xs font-semibold text-saas-cyan hover:opacity-80 mt-2 transition-colors"
                                    style={{ fontFamily: 'Poppins, sans-serif' }}
                                  >
                                    View all courses →
                                  </Link>
                                </div>
                              ) : coursesLoaded ? (
                                <Link
                                  to="/marketplace"
                                  onClick={() => setShowMeDropdown(false)}
                                  className="flex items-center space-x-2 text-xs font-medium text-saas-cyan hover:opacity-80 transition-colors"
                                  style={{ fontFamily: 'Poppins, sans-serif' }}
                                >
                                  <AcademicCapIcon className="h-4 w-4" />
                                  <span>Browse courses</span>
                                </Link>
                              ) : (
                                <p className="text-xs text-saas-text-heading-secondary italic" style={{ fontFamily: 'Poppins, sans-serif' }}>Click above to load recommendations</p>
                              )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-saas-border my-2"></div>
                          </>
                        )}

                        {/* Account Settings */}
                        <div className="py-2">
                          <Link
                            to="/settings"
                            onClick={() => setShowMeDropdown(false)}
                            className="flex items-center space-x-3 px-5 py-2.5 hover:bg-saas-cyan/10 transition-colors duration-300 group"
                          >
                                <div className="w-8 h-8 rounded-lg bg-saas-cyan/20 flex items-center justify-center group-hover:bg-saas-cyan/30 transition-colors border border-saas-border">
                                  <Cog6ToothIcon className="h-4 w-4 text-saas-cyan" />
                            </div>
                            <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Poppins, sans-serif' }}>Settings & Privacy</span>
                          </Link>
                          <Link
                            to="/help"
                            onClick={() => setShowMeDropdown(false)}
                            className="flex items-center space-x-3 px-5 py-2.5 hover:bg-saas-cyan/10 transition-colors duration-300 group"
                          >
                                <div className="w-8 h-8 rounded-lg bg-saas-cyan/20 flex items-center justify-center group-hover:bg-saas-cyan/30 transition-colors border border-saas-border">
                                  <QuestionMarkCircleIcon className="h-4 w-4 text-saas-cyan" />
                            </div>
                            <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Poppins, sans-serif' }}>Help</span>
                          </Link>
                          <button
                            className="flex items-center space-x-3 px-5 py-2.5 hover:bg-saas-cyan/10 transition-colors duration-300 w-full text-left group"
                          >
                                <div className="w-8 h-8 rounded-lg bg-saas-cyan/20 flex items-center justify-center group-hover:bg-saas-cyan/30 transition-colors border border-saas-border">
                                  <LanguageIcon className="h-4 w-4 text-saas-cyan" />
                            </div>
                            <span className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Poppins, sans-serif' }}>Language</span>
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-saas-border my-2"></div>

                        {/* Sign Out */}
                        <div className="pb-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-5 py-2.5 hover:bg-red-500/20 transition-colors duration-300 w-full text-left group rounded-lg"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors border border-red-500/30">
                              <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-400" />
                            </div>
                            <span className="text-sm font-medium text-saas-text-heading group-hover:text-red-400 transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>Sign out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link
                  to="/login"
                  className="px-5 py-2 text-sm font-semibold text-saas-text-heading hover:text-saas-cyan transition-colors duration-200 rounded-md hover:bg-saas-cyan/10"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary-glacier text-sm"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Join now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-saas-text-heading-secondary hover:text-saas-cyan hover:bg-saas-cyan/10 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

          {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-saas-border shadow-lg transition-all duration-300 ease-out" style={{ background: 'linear-gradient(180deg, #0B5C6E, #085078)', borderRadius: '0 0 20px 20px' }}>
          <div className="px-4 pt-4 pb-6 space-y-1">
            {user ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 ${
                      location.pathname === item.href
                        ? 'bg-saas-cyan/20 text-saas-cyan font-semibold border border-saas-cyan/40'
                        : 'text-saas-text-heading-secondary hover:bg-saas-cyan/10 hover:text-saas-cyan'
                    }`}
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 relative ${
                    location.pathname === '/notifications'
                      ? 'bg-saas-cyan/20 text-saas-cyan font-semibold border border-saas-cyan/40'
                      : 'text-saas-text-heading-secondary hover:bg-saas-cyan/10 hover:text-saas-cyan'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <div className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="min-w-[20px] h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-2">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
                {user.role !== 'recruiter' && (
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-saas-text-heading-secondary hover:bg-saas-cyan/10 hover:text-saas-cyan rounded-lg transition-all duration-300"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                    My Profile
                </Link>
                )}
                <div className="border-t border-saas-border my-2"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 text-base font-medium text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-semibold text-saas-text-heading-secondary hover:bg-saas-cyan/10 hover:text-saas-cyan rounded-lg transition-all duration-300 text-center"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-base font-semibold btn-primary-glacier rounded-xl mx-0 text-center shadow-sm hover:shadow-md transition-all duration-300"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Join now
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

export default Navbar;

