import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  BriefcaseIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  DocumentCheckIcon,
  PlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const RecruiterDashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [newApplicationsCount, setNewApplicationsCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);
  const [newOffersResponsesCount, setNewOffersResponsesCount] = useState(0);
  const [interviewsCount, setInterviewsCount] = useState(0);
  const [newInterviewsResponsesCount, setNewInterviewsResponsesCount] = useState(0);
  const [jobsCount, setJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  const applyDemoCounts = () => {
    setJobsCount(7);
    setApplicationsCount(26);
    setNewApplicationsCount(6);
    setInterviewsCount(11);
    setNewInterviewsResponsesCount(4);
    setOffersCount(5);
    setNewOffersResponsesCount(2);
  };

  useEffect(() => {
    if (authLoading) return;

    const loadCounts = async () => {
      try {
        const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
        const recruiterId = currentUser?._id || currentUser?.id;

        // Demo mode if no user or not recruiter
        if (!recruiterId || currentUser?.role !== 'recruiter') {
          applyDemoCounts();
          setDemoMode(true);
          return;
        }

        setDemoMode(false);

        const jobsRes = await fetch(`http://localhost:5000/api/recruiter/jobs?recruiterId=${recruiterId}`);
        const jobsData = await jobsRes.json();
        if (jobsData.success) {
          setJobsCount(jobsData.data?.length || 0);
        }

        const appsRes = await fetch(`http://localhost:5000/api/recruiter/applications?recruiterId=${recruiterId}`);
        const appsData = await appsRes.json();
        if (appsData.success) {
          const apps = appsData.data || [];
          setApplicationsCount(apps.length);
          setNewApplicationsCount(apps.filter((app: any) => app.status === 'applied').length);
        }

        const offersRes = await fetch(`http://localhost:5000/api/recruiter/offers?recruiterId=${recruiterId}`);
        const offersData = await offersRes.json();
        if (offersData.success) {
          const offers = offersData.data || [];
          setOffersCount(offers.length);
          const offerResponses = offers.filter((o: any) => o.status === 'accepted' || o.status === 'declined');
          setNewOffersResponsesCount(offerResponses.length);
        }

        const interviewsRes = await fetch(`http://localhost:5000/api/recruiter/interviews?recruiterId=${recruiterId}`);
        const interviewsData = await interviewsRes.json();
        if (interviewsData.success) {
          const interviews = interviewsData.data || [];
          setInterviewsCount(interviews.length);
          const interviewResponses = interviews.filter((i: any) => i.status === 'accepted' || i.status === 'declined');
          setNewInterviewsResponsesCount(interviewResponses.length);
        }
      } catch (e) {
        console.error('Error loading recruiter counts:', e);
        applyDemoCounts();
        setDemoMode(true);
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-saas-cyan"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {demoMode && (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            Demo Mode: Live recruiter data unavailable. Showing sample dashboard content for preview/screenshots.
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-saas-text-heading mb-2">Recruiter Dashboard</h1>
          <p className="text-saas-text-heading-secondary">Manage your recruitment pipeline and connect with top talent</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Active Jobs</p>
                <p className="text-3xl font-bold text-blue-900">{loading ? '...' : jobsCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Applications</p>
                <p className="text-3xl font-bold text-purple-900">{loading ? '...' : applicationsCount}</p>
                {newApplicationsCount > 0 && <p className="text-xs text-purple-600 mt-1 font-semibold">{newApplicationsCount} new</p>}
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">Interviews</p>
                <p className="text-3xl font-bold text-orange-900">{loading ? '...' : interviewsCount}</p>
                {newInterviewsResponsesCount > 0 && <p className="text-xs text-orange-600 mt-1 font-semibold">{newInterviewsResponsesCount} responses</p>}
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Offers</p>
                <p className="text-3xl font-bold text-green-900">{loading ? '...' : offersCount}</p>
                {newOffersResponsesCount > 0 && <p className="text-xs text-green-600 mt-1 font-semibold">{newOffersResponsesCount} responses</p>}
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <DocumentCheckIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-saas-text-heading mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-blue-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <PlusIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-saas-text-heading mb-2">Post a Job</h3>
                  <p className="text-sm text-saas-text-heading-secondary mb-4">Create and publish a new job posting to attract candidates.</p>
                  <Link to="/recruiter/post-job"><Button className="w-full">Post Job</Button></Link>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-purple-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-saas-text-heading mb-2">Browse Profiles</h3>
                  <p className="text-sm text-saas-text-heading-secondary mb-4">Explore job seeker profiles and discover top talent.</p>
                  <Link to="/recruiter/profiles"><Button variant="outline" className="w-full">View Profiles</Button></Link>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-orange-300">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BriefcaseIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-saas-text-heading mb-2">Manage Jobs</h3>
                  <p className="text-sm text-saas-text-heading-secondary mb-4">View, edit, and manage your posted job listings.</p>
                  <Link to="/recruiter/jobs"><Button variant="outline" className="w-full">Manage Jobs</Button></Link>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 hover:shadow-lg transition-all duration-200">
            <Link to="/recruiter/applicants" className="block">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading">Applications</h3>
                    <p className="text-sm text-saas-text-heading-secondary">Review candidate applications</p>
                  </div>
                </div>
                {newApplicationsCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">{newApplicationsCount}</span>}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-2xl font-bold text-saas-text-heading">{loading ? '...' : applicationsCount}</span>
                <span className="text-sm text-saas-text-heading-secondary">total applications</span>
              </div>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-200">
            <Link to="/recruiter/interviews" className="block">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading">Interviews</h3>
                    <p className="text-sm text-saas-text-heading-secondary">Schedule and manage interviews</p>
                  </div>
                </div>
                {newInterviewsResponsesCount > 0 && <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">{newInterviewsResponsesCount}</span>}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-2xl font-bold text-saas-text-heading">{loading ? '...' : interviewsCount}</span>
                <span className="text-sm text-saas-text-heading-secondary">total interviews</span>
              </div>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-200">
            <Link to="/recruiter/offers" className="block">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DocumentCheckIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-saas-text-heading">Offers</h3>
                    <p className="text-sm text-saas-text-heading-secondary">Track job offers and responses</p>
                  </div>
                </div>
                {newOffersResponsesCount > 0 && <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">{newOffersResponsesCount}</span>}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-2xl font-bold text-saas-text-heading">{loading ? '...' : offersCount}</span>
                <span className="text-sm text-saas-text-heading-secondary">total offers</span>
              </div>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-saas-text-heading">Analytics</h3>
                <p className="text-sm text-saas-text-heading-secondary">View recruitment metrics</p>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-saas-text-heading-secondary">Application Rate</span>
                <span className="text-sm font-semibold text-saas-text-heading">{jobsCount > 0 ? ((applicationsCount / jobsCount) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-saas-text-heading-secondary">Interview Rate</span>
                <span className="text-sm font-semibold text-saas-text-heading">{applicationsCount > 0 ? ((interviewsCount / applicationsCount) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-saas-text-heading-secondary">Offer Rate</span>
                <span className="text-sm font-semibold text-saas-text-heading">{interviewsCount > 0 ? ((offersCount / interviewsCount) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
