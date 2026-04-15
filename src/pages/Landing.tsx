import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ChartBarIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI-Powered Resume Analysis',
      description: 'Get instant insights into your career profile with our advanced AI that evaluates your skills, education, and experience.',
      color: 'purple-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      route: '/profile',
    },
    {
      icon: ChartBarIcon,
      title: 'Career Score & Analytics',
      description: 'Track your professional growth with comprehensive scoring across education, skills, future readiness, and geographic value.',
      color: 'blue-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      route: '/dashboard',
    },
    {
      icon: BriefcaseIcon,
      title: 'Smart Job Matching',
      description: 'Discover opportunities that perfectly match your skills and aspirations from thousands of companies worldwide.',
      color: 'green-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      route: '/jobs',
    },
    {
      icon: UserGroupIcon,
      title: 'Professional Network',
      description: 'Connect with recruiters, industry professionals, and like-minded job seekers to expand your career opportunities.',
      color: 'orange-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      route: '/profiles',
    },
    {
      icon: AcademicCapIcon,
      title: 'Course Recommendations',
      description: 'Get personalized course suggestions to enhance your skills and boost your career readiness score.',
      color: 'indigo-500',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      route: '/dashboard',
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Opportunities',
      description: 'Explore international job markets and discover where your skills are most in demand worldwide.',
      color: 'teal-500',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
      route: '/dashboard',
    },
  ];

  const handleFeatureClick = (route: string) => {
    if (user) {
      navigate(route);
    } else {
      navigate('/login');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      if (searchQuery.trim()) {
        navigate(`/jobs?search=${encodeURIComponent(searchQuery)}`);
      } else {
        navigate('/jobs');
      }
    } else {
      navigate('/login');
    }
  };


  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#FFFFFF' }}>
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 navbar-glass" 
        style={{ 
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          height: '68px'
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <div className="flex justify-between items-center w-full">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 flex items-center justify-center transition-all duration-300">
                <span className="text-saas-text-heading font-semibold text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>JG</span>
              </div>
              <span className="text-2xl font-semibold text-saas-text-heading" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Job Genius
              </span>
            </Link>
            <div className="flex items-center space-x-6">
              {user ? (
                <>
                  <Link
                    to="/jobs"
                    className="hidden md:block text-sm font-semibold text-saas-text-heading-secondary hover:text-saas-cyan transition-colors duration-300"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Browse Jobs
                  </Link>
                  <Link
                    to="/profiles"
                    className="hidden md:block text-sm font-semibold text-saas-text-heading-secondary hover:text-saas-cyan transition-colors duration-300"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Network
                  </Link>
                  <Link
                    to={user.role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard'}
                    className="px-4 py-2 text-sm font-semibold text-saas-text-heading-secondary hover:text-saas-cyan transition-colors duration-300"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/jobs"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/login');
                    }}
                    className="hidden md:block text-sm font-semibold text-saas-text-heading-secondary hover:text-saas-cyan transition-colors duration-300"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Browse Jobs
                  </Link>
                  <Link
                    to="/profiles"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/login');
                    }}
                    className="hidden md:block text-sm font-semibold text-saas-text-heading-secondary hover:text-saas-cyan transition-colors duration-300"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Network
                  </Link>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-saas-text-heading hover:text-saas-cyan transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                    className="btn-primary-glacier text-sm"
              >
                Join now
              </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">

        <div className="relative max-w-screen-2xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center space-x-2 px-4 py-2 card-base-sm mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <SparklesIcon className="h-4 w-4 text-saas-purple" />
              <span className="text-sm font-semibold text-saas-purple" style={{ fontFamily: 'Poppins, sans-serif' }}>AI-Powered Career Platform</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-saas-text-heading mb-6 leading-tight" style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px' }}>
              Launch Your Career with
              <span className="block mt-2 text-saas-cyan">
                Intelligent Insights
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-saas-text-heading-secondary mb-10 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Get AI-powered career analysis, discover global opportunities, and connect with top recruiters. 
              Your next career move starts here.
            </p>

            {/* Search Bar */}
            <motion.form
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex flex-col sm:flex-row gap-3 card-base p-2">
                <div className="flex-1 flex items-center space-x-3 px-4">
                  <MagnifyingGlassIcon className="h-5 w-5 text-saas-cyan" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search jobs, companies, or skills..."
                    className="flex-1 py-3 text-saas-text-heading focus:outline-none text-lg bg-transparent"
                    style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary-glacier"
                >
                  <span>Search</span>
                  <ArrowRightIcon className="h-5 w-5 text-saas-text-heading" />
                </button>
              </div>
            </motion.form>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {user ? (
                <Link to={user.role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard'}>
                  <button className="btn-primary-glacier text-lg">
                    Go to Dashboard <ArrowRightIcon className="h-5 w-5 ml-2 inline text-saas-text-heading" />
                  </button>
                </Link>
              ) : (
                <>
              <Link to="/signup">
                    <button className="btn-primary-glacier text-lg">
                      Get Started Free <ArrowRightIcon className="h-5 w-5 ml-2 inline text-saas-text-heading" />
                </button>
              </Link>
              <Link to="/login">
                    <button className="btn-secondary-glacier text-lg">
                  Sign In
                </button>
              </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Hero Visual - Code Style */}
          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="relative card-base p-8">
              {/* Code-style preview */}
              <div className="code-block mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-saas-cyan">$</span>
                  <span className="text-saas-text-heading-secondary">analyze_career_profile()</span>
                </div>
                <div className="text-saas-text-heading-secondary ml-4">
                  <div className="mb-2">→ Loading AI analysis...</div>
                  <div className="mb-2">→ Career Score: <span className="text-saas-cyan">85/100</span></div>
                  <div className="mb-2">→ Job Matches: <span className="text-saas-purple">127 found</span></div>
                  <div>→ Status: <span className="text-saas-cyan">Ready</span></div>
                </div>
              </div>
              
              {/* Dashboard Preview */}
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-base ai-active p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 border border-saas-cyan/30 bg-saas-bg-secondary/20 flex items-center justify-center">
                      <ChartBarIcon className="h-6 w-6 text-saas-cyan" />
                    </div>
                    <span className="text-2xl font-bold text-saas-cyan" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Career Score</span>
                  </div>
                  <p className="text-sm font-semibold text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>Track your professional growth</p>
                  <div className="mt-2 h-2 bg-saas-bg-secondary/20 border border-saas-cyan/30 rounded-full overflow-hidden">
                    <div className="h-full bg-saas-cyan" style={{ width: '75%' }}></div>
                  </div>
                </div>

                <div className="card-base ai-active p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 border border-saas-purple/30 bg-saas-bg-secondary/20 flex items-center justify-center">
                      <BriefcaseIcon className="h-6 w-6 text-saas-purple" />
                    </div>
                    <span className="text-2xl font-bold text-saas-purple" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Job Matches</span>
                  </div>
                  <p className="text-sm font-semibold text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>Personalized recommendations</p>
                  <div className="mt-2 flex items-center space-x-1">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-saas-purple" />
                    <span className="text-xs text-saas-purple font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>AI-powered matching</span>
                  </div>
                </div>

                <div className="card-base ai-active p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 border border-saas-cyan/30 bg-saas-bg-secondary/20 flex items-center justify-center">
                      <GlobeAltIcon className="h-6 w-6 text-saas-cyan" />
                    </div>
                    <span className="text-2xl font-bold text-saas-cyan" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Global</span>
                  </div>
                  <p className="text-sm font-semibold text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>International opportunities</p>
                  <div className="mt-2 flex items-center space-x-1">
                    <SparklesIcon className="h-4 w-4 text-saas-cyan" />
                    <span className="text-xs text-saas-cyan font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Visa information</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 relative ">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-saas-text-heading font-semibold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Why Choose Job Genius?
            </h2>
            <p className="text-xl text-saas-text-heading-secondary max-w-2xl mx-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Your intelligent career companion powered by AI
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: SparklesIcon,
                title: 'AI-Powered Insights',
                description: 'Get personalized career recommendations based on your profile and skills.',
                color: 'purple',
              },
              {
                icon: ChartBarIcon,
                title: 'Career Analytics',
                description: 'Track your professional growth with comprehensive scoring and metrics.',
                color: 'cyan',
              },
              {
                icon: BriefcaseIcon,
                title: 'Job Matching',
                description: 'Discover opportunities that match your skills and career goals.',
                color: 'purple',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              const cardClass = item.color === 'purple' ? 'card-base' : item.color === 'cyan' ? 'card-base' : 'card-base';
              const borderColor = item.color === 'purple' ? 'border-saas-purple/30' : item.color === 'cyan' ? 'border-saas-cyan/30' : 'border-saas-cyan/30';
              const textColor = item.color === 'purple' ? 'text-saas-purple' : item.color === 'cyan' ? 'text-saas-cyan' : 'text-saas-cyan';
              return (
                <motion.div
                  key={index}
                  className={`text-center ${cardClass} ai-active p-8`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <div className={`w-16 h-16 border ${borderColor} bg-saas-bg-secondary/20 flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`h-8 w-8 ${textColor}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${textColor}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.title}</h3>
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative ">
        <div className="max-w-screen-2xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-saas-text-heading font-semibold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-saas-text-heading-secondary max-w-2xl mx-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Powerful tools and AI-driven insights to accelerate your career journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              // Map features to colors: AI/Analytics = Cyan (primary), Job Matching = Purple (AI highlight), others = Cyan
              let cardClass = 'card-base';
              let borderColor = 'border-saas-cyan/30';
              let textColor = 'text-saas-cyan';
              
              if (feature.title.includes('Job') || feature.title.includes('Matching') || feature.title.includes('AI')) {
                cardClass = 'card-base';
                borderColor = 'border-saas-purple/30';
                textColor = 'text-saas-purple';
              } else if (feature.title.includes('Global')) {
                cardClass = 'card-base';
                borderColor = 'border-saas-cyan/30';
                textColor = 'text-saas-cyan';
              }
              
              return (
                <motion.div
                  key={index}
                  className={`group relative ${cardClass} p-8 cursor-pointer`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => handleFeatureClick(feature.route)}
                >
                  <div className={`w-16 h-16 border ${borderColor} bg-saas-bg-secondary/20 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className={`h-8 w-8 ${textColor}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${textColor}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{feature.title}</h3>
                  <p className="text-saas-text-heading-secondary leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>{feature.description}</p>
                  <button
                    onClick={() => handleFeatureClick(feature.route)}
                    className={`mt-6 flex items-center font-semibold group-hover:translate-x-2 transition-transform duration-300 cursor-pointer ${textColor}`}
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <span className="text-sm">Explore</span>
                    <ArrowRightIcon className={`h-4 w-4 ml-2 ${textColor}`} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative ">
        <div className="max-w-screen-2xl mx-auto">
          <motion.div
            className="text-center mb-16"
                  initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-saas-text-heading font-semibold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>How It Works</h2>
            <p className="text-xl text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>Get started in three simple steps</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Profile',
                description: 'Upload your resume or build your profile manually. Our AI will analyze your skills and experience.',
                icon: UserGroupIcon,
                color: 'cyan',
              },
              {
                step: '02',
                title: 'Get AI Analysis',
                description: 'Receive instant career scores, skill assessments, and personalized recommendations.',
                icon: SparklesIcon,
                color: 'cyan',
              },
              {
                step: '03',
                title: 'Find Opportunities',
                description: 'Discover jobs, connect with recruiters, and track your applications all in one place.',
                icon: RocketLaunchIcon,
                color: 'purple',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              const cardClass = item.color === 'purple' ? 'card-base' : item.color === 'cyan' ? 'card-base' : 'card-base';
              const borderColor = item.color === 'purple' ? 'border-saas-purple/30' : item.color === 'cyan' ? 'border-saas-cyan/30' : 'border-saas-cyan/30';
              const textColor = item.color === 'purple' ? 'text-saas-purple' : item.color === 'cyan' ? 'text-saas-cyan' : 'text-saas-cyan';
              return (
                <motion.div
                  key={index}
                  className={`relative ${cardClass} p-8 pt-12`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="absolute -top-4 left-8">
                    <div className={`w-12 h-12 border ${borderColor} bg-saas-bg-secondary/20 flex items-center justify-center`}>
                      <span className={`font-bold text-lg ${textColor}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.step}</span>
                    </div>
                  </div>
                  <div className="mt-2 mb-6">
                    <div className={`w-16 h-16 border ${borderColor} bg-saas-bg-secondary/20 flex items-center justify-center`}>
                      <Icon className={`h-8 w-8 ${textColor}`} />
                    </div>
                  </div>
                  <h3 className={`text-xl font-bold mb-3 ${textColor}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.title}</h3>
                  <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.description}</p>
                </motion.div>
              );
            })}
                    </div>
                  </div>
      </section>

      {/* Platform Highlights Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative ">
        <div className="max-w-screen-2xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-saas-text-heading font-semibold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Platform Highlights</h2>
            <p className="text-xl text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>Everything you need to advance your career</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: SparklesIcon,
                title: 'AI Career Analysis',
                description: 'Get comprehensive career insights powered by advanced AI technology.',
                action: () => handleFeatureClick('/dashboard'),
                color: 'purple',
              },
              {
                icon: BriefcaseIcon,
                title: 'Job Recommendations',
                description: 'Receive personalized job recommendations based on your CV and skills.',
                action: () => handleFeatureClick('/dashboard'),
                color: 'purple',
              },
              {
                icon: AcademicCapIcon,
                title: 'Course Suggestions',
                description: 'Discover courses that enhance your skills and career readiness.',
                action: () => handleFeatureClick('/dashboard'),
                color: 'cyan',
              },
              {
                icon: GlobeAltIcon,
                title: 'Geographic Opportunities',
                description: 'Explore visa information and career opportunities worldwide.',
                action: () => handleFeatureClick('/dashboard'),
                color: 'cyan',
              },
              {
                icon: UserGroupIcon,
                title: 'Professional Network',
                description: 'Connect with professionals and expand your career network.',
                action: () => handleFeatureClick('/profiles'),
                color: 'cyan',
              },
              {
                icon: ChartBarIcon,
                title: 'Career Dashboard',
                description: 'Track your progress with detailed analytics and scoring.',
                action: () => handleFeatureClick('/dashboard'),
                color: 'cyan',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              const cardClass = item.color === 'purple' ? 'card-base' : item.color === 'cyan' ? 'card-base' : 'card-base';
              const borderColor = item.color === 'purple' ? 'border-saas-purple/30' : item.color === 'cyan' ? 'border-saas-cyan/30' : 'border-saas-cyan/30';
              const textColor = item.color === 'purple' ? 'text-saas-purple' : item.color === 'cyan' ? 'text-saas-cyan' : 'text-saas-cyan';
              return (
                <motion.div
                  key={index}
                  onClick={item.action}
                  className={`${cardClass} p-8 cursor-pointer`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <div className={`w-12 h-12 border ${borderColor} bg-saas-bg-secondary/20 flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${textColor}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${textColor}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.title}</h3>
                  <p className="text-saas-text-heading-secondary leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative ">
        <div className="max-w-screen-2xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-saas-text-heading font-semibold mb-6" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl text-saas-text-heading-secondary mb-10 max-w-2xl mx-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Start your career journey with Job Genius. Get AI-powered insights, discover opportunities, and connect with professionals. 
              Get started today - it's free!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {user ? (
                <Link to={user.role === 'recruiter' ? '/recruiter/dashboard' : '/dashboard'}>
                  <button className="btn-primary-glacier text-lg px-10 py-4 hover:scale-105 transition-all duration-300 font-bold">
                    Go to Dashboard <RocketLaunchIcon className="h-5 w-5 ml-2 inline text-saas-text-heading" />
                  </button>
                </Link>
              ) : (
                <>
            <Link to="/signup">
                    <button className="btn-primary-glacier text-lg px-10 py-4 hover:scale-105 transition-all duration-300 font-bold">
                      Start Free Today <RocketLaunchIcon className="h-5 w-5 ml-2 inline text-saas-text-heading" />
                    </button>
                  </Link>
                  <Link to="/login">
                    <button className="btn-secondary-glacier text-lg px-10 py-4 font-semibold transition-all duration-300 hover:scale-105">
                      Sign In
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Landing;
