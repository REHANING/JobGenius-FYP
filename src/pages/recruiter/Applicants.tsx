import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

type Application = {
  id: number;
  job_id: number;
  user_id: string;
  status: string;
  created_at: string;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
  candidate_name?: string;
  candidate_email?: string;
};

const Applicants: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    loadApplications();
    // Poll for new applications every 30 seconds
    const interval = setInterval(loadApplications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadApplications = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterId = currentUser._id || currentUser.id;
      if (!recruiterId) {
        setError('Please log in as a recruiter');
        return;
      }

      const res = await fetch(`http://localhost:5000/api/recruiter/applications?recruiterId=${recruiterId}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.data);
      } else {
        throw new Error(data.error || 'Failed to load applications');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: number, status: string) => {
    try {
      setUpdating(id);
      const res = await fetch(`http://localhost:5000/api/recruiter/applications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status } : app)));
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      setDeleting(id);
      const res = await fetch(`http://localhost:5000/api/recruiter/applications/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setApplications(applications.filter((app) => app.id !== id));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`Are you sure you want to delete all ${applications.length} applications? This cannot be undone.`)) return;
    try {
      setDeletingAll(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterId = currentUser._id || currentUser.id;
      const res = await fetch(`http://localhost:5000/api/recruiter/applications?recruiterId=${recruiterId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setApplications([]);
        alert(data.message);
      } else {
        alert(data.error || 'Failed to delete all');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setDeletingAll(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-saas-cyan/20 text-glacier-mint border border-saas-cyan/30';
      case 'shortlisted':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'offered':
        return 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-saas-cyan/20 text-glacier-mint border border-saas-cyan/30';
    }
  };

  const getStatusBadge = (status: string) => {
    const displayStatus = status === 'applied' ? 'New' : status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {displayStatus}
      </span>
    );
  };

  const newApplicationsCount = applications.filter((app) => app.status === 'applied' || app.status === 'pending').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen" style={{ background: '#FFFFFF' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Job Applications</h1>
            <p className="text-saas-text-heading-secondary mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Review and manage applications for your posted jobs
            </p>
            {newApplicationsCount > 0 && (
              <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 rounded-lg mt-2 inline-block">
                <span className="text-yellow-400 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  🔔 {newApplicationsCount} new application{newApplicationsCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          {applications.length > 0 && (
            <Button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              variant="danger"
            >
              {deletingAll ? 'Deleting...' : `Delete All (${applications.length})`}
            </Button>
          )}
        </div>
      </motion.div>

      {loading && <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Loading applications...</p>}
      {error && <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-saas-text-heading-muted text-lg">No applications yet.</p>
              <p className="text-gray-400 text-sm mt-2">Applications will appear here when candidates apply to your jobs.</p>
            </Card>
          ) : (
            applications.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <Card className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-saas-text-heading dark:text-gray-100">
                          {app.candidate_name || 'Candidate'}
                        </h3>
                        {getStatusBadge(app.status)}
                      </div>
                      <p className="text-sm text-saas-text-heading-secondary  mb-1">
                        {app.candidate_email || app.user_id}
                      </p>
                      <div className="mt-3">
                        <p className="text-sm font-medium text-saas-text-heading dark:text-gray-100 mb-1">
                          Applied for: <span className="font-semibold">{app.title || 'Job Position'}</span>
                        </p>
                        <p className="text-xs text-saas-text-heading-muted ">
                          {app.company} • {app.location || 'Location not specified'} • {app.type || 'full-time'}
                        </p>
                      </div>
                      <p className="text-xs text-saas-text-heading-muted  mt-2">
                        Applied on: {new Date(app.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      {/* Show action buttons for applied/pending/shortlisted statuses */}
                      {(['applied', 'pending', 'shortlisted', 'reviewed'].includes(app.status)) && (
                        <>
                          {app.status !== 'shortlisted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateApplicationStatus(app.id, 'shortlisted')}
                              disabled={updating === app.id}
                              className="whitespace-nowrap"
                            >
                              {updating === app.id ? '...' : 'Shortlist'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateApplicationStatus(app.id, 'offered')}
                            disabled={updating === app.id}
                            className="whitespace-nowrap bg-green-50 hover:bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-700"
                          >
                            {updating === app.id ? '...' : 'Accept'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateApplicationStatus(app.id, 'rejected')}
                            disabled={updating === app.id}
                            className="whitespace-nowrap bg-red-50 hover:bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-700"
                          >
                            {updating === app.id ? '...' : 'Reject'}
                          </Button>
                        </>
                      )}
                      {/* Show status message for final statuses */}
                      {(app.status === 'offered' || app.status === 'rejected') && (
                        <span className="text-xs text-saas-text-heading-muted  italic">
                          Status updated
                        </span>
                      )}
                      {/* Delete button - always visible */}
                      <button
                        onClick={() => handleDelete(app.id)}
                        disabled={deleting === app.id}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 mt-2"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Applicants;
