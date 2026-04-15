import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

type Interview = {
  id: number;
  job_id: number;
  recruiter_id: string;
  scheduled_at: string;
  mode: string;
  notes: string;
  status?: string;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
};

const DEMO_INTERVIEWS: Interview[] = [
  {
    id: 2001,
    job_id: 701,
    recruiter_id: 'demo-rec-1',
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    mode: 'Google Meet',
    notes: 'Role: Frontend Developer Intern. Bring portfolio and explain one project architecture.',
    status: 'pending',
    title: 'Frontend Developer Intern',
    company: 'Nova Labs',
    location: 'Remote',
    type: 'Internship',
  },
  {
    id: 2002,
    job_id: 702,
    recruiter_id: 'demo-rec-2',
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    mode: 'On-site',
    notes: 'Role: UI Engineer. Focus on accessibility and responsive design.',
    status: 'accepted',
    title: 'UI Engineer',
    company: 'Blue Orbit',
    location: 'Karachi, PK',
    type: 'Full-time',
  },
];

const Interviews: React.FC = () => {
  const [items, setItems] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);

  useEffect(()=>{
    load();
    // Poll for new interviews every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  },[]);

  const load = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id;
      if (!userId) {
        setItems(DEMO_INTERVIEWS);
        setError('Demo mode: login required for live interviews.');
        return;
      }
      const res = await fetch(`http://localhost:5000/api/recruiter/interviews?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        const newItems = data.data || [];
        if (newItems.length > 0) {
          setItems(newItems);
          setError(null);
        } else {
          setItems(DEMO_INTERVIEWS);
          setError('Demo mode: no live interviews found yet.');
        }
        if (previousCount === 0) {
          setPreviousCount(newItems.length);
        }
      } else throw new Error(data.error || 'Failed');
    } catch(e:any){
      setItems(DEMO_INTERVIEWS);
      setError('Demo mode: failed to load live interviews.');
    } finally { setLoading(false); }
  };

  const updateInterviewStatus = async (id: number, status: 'accepted' | 'declined') => {
    try {
      setUpdating(id);
      const res = await fetch(`http://localhost:5000/api/recruiter/interviews/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
        alert(`Interview ${status} successfully!`);
      } else {
        alert(data.error || 'Failed to update interview status');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;
    try {
      setDeleting(id);
      const res = await fetch(`http://localhost:5000/api/recruiter/interviews/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems(items.filter((i) => i.id !== id));
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
    if (!window.confirm(`Are you sure you want to delete all ${items.length} interviews? This cannot be undone.`)) return;
    try {
      setDeletingAll(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id;
      const res = await fetch(`http://localhost:5000/api/recruiter/interviews?userId=${userId}`, { method: 'DELETE' });
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

  const pendingInterviewsCount = items.filter((i) => !i.status || i.status === 'pending').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded-full">Accepted</span>;
      case 'declined':
        return <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">Declined</span>;
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-medium rounded-full">Pending</span>;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen" style={{ background: '#FFFFFF' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Your Interviews</h1>
          {pendingInterviewsCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 rounded-lg mt-2 inline-block">
              <span className="text-yellow-400 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                🔔 {pendingInterviewsCount} pending interview{pendingInterviewsCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
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
      {loading && <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Loading...</p>}
      {error && <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>}
      {!loading && !error && (
        <div className="space-y-4">
          {items.map((i)=> {
            const roleMatch = i.notes && i.notes.match(/Role:\s*([^\.]+)\./i);
            const roleTitle = roleMatch ? roleMatch[1].trim() : null;
            const displayTitle = roleTitle || i.title || 'Job';
            const isPending = !i.status || i.status === 'pending';
            return (
            <motion.div key={i.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
              <Card className={`p-4 ${isPending ? 'border-yellow-500/50 ring-2 ring-yellow-500/30' : ''}`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{displayTitle}</h3>
                      {getStatusBadge(i.status || 'pending')}
                    </div>
                    <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{i.company} • {i.location} • {i.type}</p>
                    <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Scheduled: {new Date(i.scheduled_at).toLocaleString()} ({i.mode})</p>
                    {i.notes && <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Notes: {i.notes}</p>}
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => updateInterviewStatus(i.id, 'accepted')}
                          disabled={updating === i.id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {updating === i.id ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => updateInterviewStatus(i.id, 'declined')}
                          disabled={updating === i.id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {updating === i.id ? '...' : 'Decline'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(i.id)}
                      disabled={deleting === i.id}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg disabled:opacity-50"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )})}
          {items.length===0 && <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>No interviews yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Interviews;

