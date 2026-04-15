import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminReports: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/home');
      return;
    }
    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Prepare chart data
  const userData = stats?.users ? [
    { name: 'Job Seekers', value: stats.users.jobseekers || 0 },
    { name: 'Recruiters', value: stats.users.recruiters || 0 },
    { name: 'Admins', value: stats.users.admins || 0 },
  ] : [];

  const applicationStatusData = stats?.applications?.byStatus 
    ? Object.entries(stats.applications.byStatus).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    : [];

  const jobData = stats?.jobs ? [
    { name: 'Active', value: stats.jobs.active || 0 },
    { name: 'Closed', value: stats.jobs.closed || 0 },
  ] : [];

  const COLORS = ['#22D3EE', '#A855F7', '#22C55E', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="text-primary-accent hover:text-primary-accent/80 mb-4 transition-colors flex items-center gap-2"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-saas-text-heading font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Reports & Analytics</h1>
          <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Platform insights and statistics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="text-3xl font-bold text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.users?.total || 0}</div>
            <div className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Total Users</div>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.jobs?.total || 0}</div>
            <div className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Total Jobs</div>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.applications?.total || 0}</div>
            <div className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Applications</div>
          </Card>
          <Card className="p-6">
            <div className="text-3xl font-bold text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.profiles || 0}</div>
            <div className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Profiles</div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Distribution Pie Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-saas-text-heading mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>User Distribution</h2>
            {userData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</div>
            )}
          </Card>

          {/* Application Status Bar Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-saas-text-heading mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Application Status</h2>
            {applicationStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={applicationStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="#22D3EE" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</div>
            )}
          </Card>

          {/* Job Status Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-saas-text-heading mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Job Status</h2>
            {jobData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="#A855F7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>No data available</div>
            )}
          </Card>

          {/* Platform Metrics */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-saas-text-heading mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Platform Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-saas-border">
                <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Interviews</span>
                <span className="text-xl font-bold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.interviews || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-saas-border">
                <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Offers</span>
                <span className="text-xl font-bold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.offers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Active Jobs</span>
                <span className="text-xl font-bold text-[#22C55E]" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.jobs?.active || 0}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-saas-text-heading mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>User Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-saas-border">
                <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Job Seekers</span>
                <span className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.users?.jobseekers || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-saas-border">
                <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Recruiters</span>
                <span className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.users?.recruiters || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Admins</span>
                <span className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{stats?.users?.admins || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-saas-text-heading mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Application Status Breakdown</h2>
            <div className="space-y-3">
              {stats?.applications?.byStatus && Object.entries(stats.applications.byStatus).length > 0 ? (
                Object.entries(stats.applications.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center pb-3 border-b border-saas-border last:border-0">
                    <span className="text-saas-text-heading-secondary capitalize" style={{ fontFamily: 'Inter, sans-serif' }}>{status}</span>
                    <span className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{count as number}</span>
                  </div>
                ))
              ) : (
                <div className="text-saas-text-heading-secondary text-center py-4" style={{ fontFamily: 'Inter, sans-serif' }}>No application data</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;

