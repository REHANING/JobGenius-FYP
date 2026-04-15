import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

type Interview = {
  id: number;
  job_id: number;
  user_id: string;
  recruiter_id: string;
  scheduled_at: string;
  mode: string;
  notes: string;
  status: string;
  created_at: string;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
  candidate_name?: string;
  candidate_email?: string;
};

const RecruiterInterviews: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    loadInterviews();
    // Poll for updates every 30 seconds
    const interval = setInterval(loadInterviews, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadInterviews = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterId = currentUser._id || currentUser.id;
      if (!recruiterId) {
        setError('Please log in as a recruiter');
        return;
      }

      const res = await fetch(`http://localhost:5000/api/recruiter/interviews?recruiterId=${recruiterId}`);
      const data = await res.json();
      if (data.success) {
        setInterviews(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load interviews');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;
    try {
      setDeleting(id);
      const res = await fetch(`http://localhost:5000/api/recruiter/interviews/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setInterviews(interviews.filter((i) => i.id !== id));
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
    if (!window.confirm(`Are you sure you want to delete all ${interviews.length} interviews? This cannot be undone.`)) return;
    try {
      setDeletingAll(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterId = currentUser._id || currentUser.id;
      const res = await fetch(`http://localhost:5000/api/recruiter/interviews?recruiterId=${recruiterId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setInterviews([]);
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
      case 'accepted':
        return 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30';
      case 'declined':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    const displayStatus = status === 'pending' ? 'Pending Response' : status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status || 'pending')}`}>
        {displayStatus}
      </span>
    );
  };

  const responseCount = interviews.filter((i) => i.status === 'accepted' || i.status === 'declined').length;
  // Show all responses as notifications - they persist until deleted
  const newResponsesCount = responseCount;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen" style={{ background: '#FFFFFF' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Scheduled Interviews</h1>
            <p className="text-saas-text-heading-secondary mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              View interviews you've scheduled and track candidate responses
            </p>
            {newResponsesCount > 0 && (
              <div className="flex items-center gap-2 bg-[#22C55E]/20 border border-[#22C55E]/30 px-4 py-2 rounded-lg mt-2 inline-block">
                <span className="text-[#22C55E] font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  🔔 {newResponsesCount} new response{newResponsesCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          {interviews.length > 0 && (
            <Button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              variant="danger"
            >
              {deletingAll ? 'Deleting...' : `Delete All (${interviews.length})`}
            </Button>
          )}
        </div>
      </motion.div>

      {loading && <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Loading interviews...</p>}
      {error && <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {interviews.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 text-lg">No interviews scheduled yet.</p>
              <p className="text-gray-400 text-sm mt-2">Schedule interviews from the Profiles page.</p>
            </Card>
          ) : (
            interviews.map((interview) => {
              const roleMatch = interview.notes && interview.notes.match(/Role:\s*([^\.]+)\./i);
              const roleTitle = roleMatch ? roleMatch[1].trim() : null;
              const displayTitle = roleTitle || interview.title || 'Job Position';
              return (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <Card className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-saas-text-heading ">
                            {interview.candidate_name || 'Candidate'}
                          </h3>
                          {getStatusBadge(interview.status || 'pending')}
                        </div>
                        <p className="text-sm text-saas-text-heading-secondary  mb-1">
                          {interview.candidate_email || interview.user_id}
                        </p>
                        <div className="mt-3">
                          <p className="text-sm font-medium text-saas-text-heading  mb-1">
                            Interview for: <span className="font-semibold">{displayTitle}</span>
                          </p>
                          <p className="text-xs text-gray-500 ">
                            {interview.company} • {interview.location || 'Location not specified'} • {interview.type || 'full-time'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500  mt-2">
                          Scheduled: {new Date(interview.scheduled_at).toLocaleString()} • Mode: {interview.mode || 'Not specified'}
                        </p>
                        {interview.notes && (
                          <p className="text-xs text-saas-text-heading-secondary  mt-2">Notes: {interview.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleDelete(interview.id)}
                        disabled={deleting === interview.id}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default RecruiterInterviews;

