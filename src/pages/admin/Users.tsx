import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  UsersIcon, 
  BriefcaseIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  NoSymbolIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'jobseeker' | 'recruiter' | 'admin';
  status?: 'active' | 'suspended' | 'terminated';
  warnings?: number;
  terminationReason?: string;
  createdAt: string;
  isPaid?: boolean;
  subscriptionPlan?: string | null;
  subscriptionDate?: string | null;
}

const AdminUsers: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    if (!user || user.role !== 'admin') {
      navigate('/home');
      return;
    }
    
    loadUsers();
  }, [user, navigate, authLoading]);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Users API Response:', data); // Debug log
      
      if (data.success) {
        setUsers(data.data || []);
      } else {
        console.error('API returned success: false', data);
        alert('Failed to load users: ' + (data.error || data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users. Please check the console for details.');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'warn' | 'suspend' | 'terminate' | 'reactivate', reason?: string) => {
    if (!window.confirm(`Are you sure you want to ${action} this user?${reason ? ` Reason: ${reason}` : ''}`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'reactivate' 
        ? `http://localhost:5000/api/admin/users/${userId}/reactivate`
        : `http://localhost:5000/api/admin/users/${userId}/${action}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || 'Admin action' })
      });

      const data = await response.json();
      if (data.success) {
        loadUsers(); // Reload users
        alert(`User ${action}ed successfully`);
      } else {
        alert(data.message || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Failed to ${action} user. Please try again.`);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'jobseeker':
        return <UsersIcon className="h-5 w-5 text-blue-400" />;
      case 'recruiter':
        return <BriefcaseIcon className="h-5 w-5 text-green-400" />;
      case 'admin':
        return <ShieldCheckIcon className="h-5 w-5 text-purple-400" />;
      default:
        return <UsersIcon className="h-5 w-5 text-saas-text-heading-secondary" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'jobseeker':
        return 'bg-blue-100 text-blue-800';
      case 'recruiter':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="neon-cyan hover:opacity-80 mb-4 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Manage Users</h1>
          <p className="text-saas-text-heading-secondary mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Total Users: {users.length}</p>
        </div>

        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-glacier-dark/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-saas-text-heading-muted uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-saas-text-heading-muted uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-saas-text-heading-muted uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-saas-text-heading-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-saas-text-heading-muted uppercase tracking-wider">
                    Warnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-saas-text-heading-muted uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-saas-text-heading-muted uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-saas-text-heading-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glacier-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                        No users found.
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                  <tr key={u._id} className="hover:bg-saas-bg-secondary">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-accent/10 border border-primary-accent/30 rounded-full flex items-center justify-center">
                          {getRoleIcon(u.role)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{u.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(u.role)}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.status === 'active' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' :
                        u.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30' :
                        u.status === 'terminated' ? 'bg-red-500/20 text-red-600 border border-red-500/30' :
                        'bg-primary-accent/20 text-primary-accent border border-primary-accent/30'
                      }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {u.warnings || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.role === 'jobseeker' ? (
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            u.isPaid ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                            {u.isPaid ? '✓ Paid' : 'Free'}
                          </span>
                          {u.isPaid && u.subscriptionPlan && (
                            <span className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {u.subscriptionPlan.charAt(0).toUpperCase() + u.subscriptionPlan.slice(1)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {u.role !== 'admin' && (
                        <div className="flex items-center space-x-2">
                          {u.status !== 'terminated' && u.status !== 'suspended' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction(u._id, 'warn')}
                                title="Issue Warning"
                              >
                                <ExclamationTriangleIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction(u._id, 'suspend')}
                                title="Suspend User"
                              >
                                <NoSymbolIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleAction(u._id, 'terminate')}
                                title="Terminate User"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {(u.status === 'suspended' || u.status === 'terminated') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAction(u._id, 'reactivate')}
                              title="Reactivate User"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;

