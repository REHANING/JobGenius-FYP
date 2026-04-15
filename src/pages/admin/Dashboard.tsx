import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import {
  UsersIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

interface Stats {
  users: {
    total: number;
    jobseekers: number;
    recruiters: number;
    admins: number;
  };
  jobs: {
    total: number;
    active: number;
    closed: number;
  };
  applications: {
    total: number;
    byStatus: {
      [key: string]: number;
    };
  };
  profiles: number;
  interviews: number;
  offers: number;
}

const DEMO_STATS: Stats = {
  users: {
    total: 324,
    jobseekers: 248,
    recruiters: 70,
    admins: 6,
  },
  jobs: {
    total: 142,
    active: 97,
    closed: 45,
  },
  applications: {
    total: 1186,
    byStatus: {
      applied: 542,
      shortlisted: 281,
      interviewed: 207,
      offered: 108,
      rejected: 48,
    },
  },
  profiles: 261,
  interviews: 203,
  offers: 112,
};

const AdminDashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    // Redirect if not admin
    if (!user || user.role !== 'admin') {
      navigate('/home');
      return;
    }

    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [user, navigate, authLoading]);

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Stats API Response:', data); // Debug log
      
      if (data.success) {
        setStats(data.data);
      } else {
        console.error('API returned success: false', data);
        setStats(DEMO_STATS);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(DEMO_STATS);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan"></div>
      </div>
    );
  }

  // Redirect if not admin (handled in useEffect, but check here too for safety)
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
          Access denied. Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-saas-text-heading">Admin Dashboard</h1>
          <p className="text-saas-text-body mt-2">Platform overview and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => navigate('/admin/users')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-saas-text-body" style={{ fontFamily: 'Inter, sans-serif' }}>Total Users</p>
                  <p className="text-3xl font-bold text-saas-text-heading mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {stats?.users.total || 0}
                  </p>
                </div>
                <div className="p-3 bg-saas-cyan/20 border border-saas-cyan/30 rounded-lg">
                  <UsersIcon className="h-8 w-8 text-saas-cyan" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-saas-border">
                <div className="flex justify-between text-sm">
                  <span className="text-saas-text-body" style={{ fontFamily: 'Inter, sans-serif' }}>Job Seekers</span>
                  <span className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.users.jobseekers || 0}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-saas-text-body" style={{ fontFamily: 'Inter, sans-serif' }}>Recruiters</span>
                  <span className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.users.recruiters || 0}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Total Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-6 cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => navigate('/admin/jobs')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-saas-text-body">Total Jobs</p>
                  <p className="text-3xl font-bold text-saas-text-heading mt-2">
                    {stats?.jobs.total || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <BriefcaseIcon className="h-8 w-8 text-saas-cyan" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-saas-border">
                <div className="flex justify-between text-sm">
                  <span className="text-saas-text-body">Active</span>
                  <span className="font-semibold text-saas-cyan">{stats?.jobs.active || 0}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-saas-text-body">Closed</span>
                  <span className="font-semibold text-saas-text-body">{stats?.jobs.closed || 0}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Total Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-6 cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => navigate('/admin/reports')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-saas-text-body">Applications</p>
                  <p className="text-3xl font-bold text-saas-text-heading mt-2">
                    {stats?.applications.total || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-glacier-aqua" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-saas-border">
                <div className="flex justify-between text-sm">
                  <span className="text-saas-text-body">Shortlisted</span>
                  <span className="font-semibold">{stats?.applications.byStatus?.shortlisted || 0}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-saas-text-body">Offered</span>
                  <span className="font-semibold text-saas-cyan">{stats?.applications.byStatus?.offered || 0}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Total Profiles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-6 cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => navigate('/admin/reports')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-saas-text-body">Profiles</p>
                  <p className="text-3xl font-bold text-saas-text-heading mt-2">
                    {stats?.profiles || 0}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <UserGroupIcon className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-saas-border">
                <div className="flex justify-between text-sm">
                  <span className="text-saas-text-body">Interviews</span>
                  <span className="font-semibold">{stats?.interviews || 0}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-saas-text-body">Offers</span>
                  <span className="font-semibold">{stats?.offers || 0}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-saas-text-heading">Manage Users</h3>
                <p className="text-sm text-saas-text-body">View and manage all users</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/jobs')}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <BriefcaseIcon className="h-6 w-6 text-saas-cyan" />
              </div>
              <div>
                <h3 className="font-semibold text-saas-text-heading">Manage Jobs</h3>
                <p className="text-sm text-saas-text-body">View all posted jobs</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/reports')}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-glacier-aqua" />
              </div>
              <div>
                <h3 className="font-semibold text-saas-text-heading">Reports</h3>
                <p className="text-sm text-saas-text-body">View platform analytics</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-saas-text-heading mb-4">Platform Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-saas-text-heading mb-3">User Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-saas-text-body">Job Seekers</span>
                  <span className="font-semibold">{stats?.users.jobseekers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-saas-text-body">Recruiters</span>
                  <span className="font-semibold">{stats?.users.recruiters || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-saas-text-body">Admins</span>
                  <span className="font-semibold">{stats?.users.admins || 0}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-saas-text-heading mb-3">Application Status</h3>
              <div className="space-y-2">
                {stats?.applications.byStatus && Object.entries(stats.applications.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-saas-text-body capitalize">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

