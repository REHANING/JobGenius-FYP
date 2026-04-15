import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrashIcon, BriefcaseIcon, CalendarIcon, MapPinIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

type Application = {
  id: number;
  job_id: number;
  status: string;
  created_at: string;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
};

const DEMO_APPLICATIONS: Application[] = [
  {
    id: 1001,
    job_id: 501,
    status: 'Pending Review',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    title: 'Frontend Developer Intern',
    company: 'Nova Labs',
    location: 'Lahore, PK',
    type: 'Internship',
  },
  {
    id: 1002,
    job_id: 502,
    status: 'Interview Scheduled',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    title: 'React Developer',
    company: 'Pixel Forge',
    location: 'Remote',
    type: 'Full-time',
  },
  {
    id: 1003,
    job_id: 503,
    status: 'Accepted',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    title: 'UI Engineer',
    company: 'Blue Orbit',
    location: 'Karachi, PK',
    type: 'Contract',
  },
];

const Applications: React.FC = () => {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(()=>{
    load();
    // Poll for new applications every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  },[]);

  const load = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id;
      if (!userId) {
        setItems(DEMO_APPLICATIONS);
        setError('Demo mode: login required for live applications.');
        return;
      }
      const res = await fetch(`http://localhost:5000/api/recruiter/applications?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        const liveItems = data.data || [];
        if (liveItems.length > 0) {
          setItems(liveItems);
          setError(null);
        } else {
          setItems(DEMO_APPLICATIONS);
          setError('Demo mode: no live applications found yet.');
        }
      }
      else throw new Error(data.error || 'Failed');
    } catch(e:any){
      setItems(DEMO_APPLICATIONS);
      setError('Demo mode: failed to load live applications.');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      setDeleting(id);
      const res = await fetch(`http://localhost:5000/api/recruiter/applications/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems(items.filter((a) => a.id !== id));
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
    if (!window.confirm(`Are you sure you want to delete all ${items.length} applications? This cannot be undone.`)) return;
    try {
      setDeletingAll(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id;
      const res = await fetch(`http://localhost:5000/api/recruiter/applications?userId=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems([]);
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

  // Calculate statistics
  const stats = {
    total: items.length,
    pending: items.filter(a => a.status?.toLowerCase().includes('pending') || a.status?.toLowerCase().includes('applied')).length,
    interview: items.filter(a => a.status?.toLowerCase().includes('interview')).length,
    accepted: items.filter(a => a.status?.toLowerCase().includes('accepted') || a.status?.toLowerCase().includes('approved') || a.status?.toLowerCase().includes('hired')).length,
    rejected: items.filter(a => a.status?.toLowerCase().includes('rejected') || a.status?.toLowerCase().includes('declined')).length,
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('pending') || statusLower.includes('applied')) {
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-600', border: 'border-yellow-500/30' };
    }
    if (statusLower.includes('accepted') || statusLower.includes('approved') || statusLower.includes('hired')) {
      return { bg: 'bg-[#22C55E]/20', text: 'text-[#22C55E]', border: 'border-[#22C55E]/30' };
    }
    if (statusLower.includes('rejected') || statusLower.includes('declined')) {
      return { bg: 'bg-red-500/20', text: 'text-red-600', border: 'border-red-500/30' };
    }
    if (statusLower.includes('interview')) {
      return { bg: 'bg-primary-accent/20', text: 'text-primary-accent', border: 'border-primary-accent/30' };
    }
    return { bg: 'bg-saas-bg-secondary', text: 'text-saas-text-heading-secondary', border: 'border-saas-border' };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen" style={{ background: '#FFFFFF' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-saas-text-heading font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Your Applications</h1>
        <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Track and manage your job applications</p>
      </div>

      {/* Statistics Cards */}
      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{stats.total}</div>
            <div className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600" style={{ fontFamily: 'Inter, sans-serif' }}>{stats.pending}</div>
            <div className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Pending</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-accent" style={{ fontFamily: 'Inter, sans-serif' }}>{stats.interview}</div>
            <div className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Interview</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[#22C55E]" style={{ fontFamily: 'Inter, sans-serif' }}>{stats.accepted}</div>
            <div className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Accepted</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>{stats.rejected}</div>
            <div className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Rejected</div>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
          {items.length} {items.length === 1 ? 'application' : 'applications'}
        </div>
        {items.length > 0 && (
          <Button
            onClick={handleDeleteAll}
            disabled={deletingAll}
            variant="danger"
          >
            {deletingAll ? 'Deleting...' : `Delete All (${items.length})`}
          </Button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto"></div>
          <p className="text-saas-text-heading-secondary mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>Loading applications...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6">
          <p className="text-red-500" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
        </Card>
      )}

      {/* Applications List */}
      {!loading && !error && (
        <div className="space-y-4">
          {items.map((a)=> {
            const badge = getStatusBadge(a.status);
            return (
              <motion.div key={a.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                <Card className="p-6 hover:shadow-lg transition-all duration-200 border border-saas-border hover:border-primary-accent/40">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-primary-accent/20 flex items-center justify-center flex-shrink-0">
                          <BriefcaseIcon className="h-6 w-6 text-primary-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {a.title || 'Job Position'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-saas-text-heading-secondary mb-2">
                            {a.company && (
                              <div className="flex items-center gap-1">
                                <BuildingOfficeIcon className="h-4 w-4" />
                                <span style={{ fontFamily: 'Inter, sans-serif' }}>{a.company}</span>
                              </div>
                            )}
                            {a.location && (
                              <div className="flex items-center gap-1">
                                <MapPinIcon className="h-4 w-4" />
                                <span style={{ fontFamily: 'Inter, sans-serif' }}>{a.location}</span>
                              </div>
                            )}
                            {a.type && (
                              <span className="px-2 py-1 bg-saas-bg-secondary border border-saas-border rounded text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {a.type}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-saas-text-heading-secondary">
                            <CalendarIcon className="h-4 w-4" />
                            <span style={{ fontFamily: 'Inter, sans-serif' }}>
                              Applied: {new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${badge.bg} ${badge.text} ${badge.border}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                        {a.status || 'Pending'}
                      </span>
                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={deleting === a.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                        title="Delete application"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {items.length === 0 && (
            <Card className="p-12 text-center">
              <BriefcaseIcon className="h-16 w-16 text-saas-text-muted mx-auto mb-4" />
              <p className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>No applications yet</p>
              <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Start applying to jobs to see them here</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;

