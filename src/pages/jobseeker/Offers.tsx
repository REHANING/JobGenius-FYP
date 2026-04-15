import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

type Offer = {
  id: number;
  job_id: number;
  recruiter_id: string;
  status: string;
  salary: string;
  notes: string;
  created_at: string;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
};

const DEMO_OFFERS: Offer[] = [
  {
    id: 3001,
    job_id: 801,
    recruiter_id: 'demo-rec-3',
    status: 'pending',
    salary: 'PKR 120,000 / month',
    notes: 'Role: Frontend Engineer. Includes medical and annual bonus.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    title: 'Frontend Engineer',
    company: 'Apex Systems',
    location: 'Islamabad, PK',
    type: 'Full-time',
  },
  {
    id: 3002,
    job_id: 802,
    recruiter_id: 'demo-rec-4',
    status: 'accepted',
    salary: 'USD 1,200 / month',
    notes: 'Role: React Intern. Flexible remote working hours.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    title: 'React Intern',
    company: 'Pixel Forge',
    location: 'Remote',
    type: 'Internship',
  },
];

const Offers: React.FC = () => {
  const [items, setItems] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);

  useEffect(()=>{
    load();
    // Poll for new offers every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  },[]);

  const load = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id;
      if (!userId) {
        setItems(DEMO_OFFERS);
        setError('Demo mode: login required for live offers.');
        return;
      }
      const res = await fetch(`http://localhost:5000/api/recruiter/offers?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        const newItems = data.data || [];
        if (newItems.length > 0) {
          setItems(newItems);
          setError(null);
        } else {
          setItems(DEMO_OFFERS);
          setError('Demo mode: no live offers found yet.');
        }
        if (previousCount === 0) {
          setPreviousCount(newItems.length);
        }
      } else throw new Error(data.error || 'Failed');
    } catch(e:any){
      setItems(DEMO_OFFERS);
      setError('Demo mode: failed to load live offers.');
    } finally { setLoading(false); }
  };

  const updateOfferStatus = async (id: number, status: 'accepted' | 'declined') => {
    try {
      setUpdating(id);
      const res = await fetch(`http://localhost:5000/api/recruiter/offers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
        alert(`Offer ${status} successfully!`);
      } else {
        alert(data.error || 'Failed to update offer status');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      setDeleting(id);
      const res = await fetch(`http://localhost:5000/api/recruiter/offers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems(items.filter((o) => o.id !== id));
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
    if (!window.confirm(`Are you sure you want to delete all ${items.length} offers? This cannot be undone.`)) return;
    try {
      setDeletingAll(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser._id || currentUser.id;
      const res = await fetch(`http://localhost:5000/api/recruiter/offers?userId=${userId}`, { method: 'DELETE' });
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

  const pendingOffersCount = items.filter((o) => !o.status || o.status === 'pending').length;

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
          <h1 className="text-2xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Your Offers</h1>
          {pendingOffersCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 rounded-lg mt-2 inline-block">
              <span className="text-yellow-400 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                🔔 {pendingOffersCount} pending offer{pendingOffersCount > 1 ? 's' : ''}
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
          {items.map((o)=> {
            const roleMatch = o.notes && o.notes.match(/Role:\s*([^\.]+)\./i);
            const roleTitle = roleMatch ? roleMatch[1].trim() : null;
            const displayTitle = roleTitle || o.title || 'Job';
            const isPending = !o.status || o.status === 'pending';
            return (
            <motion.div key={o.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
              <Card className={`p-4 ${isPending ? 'border-yellow-500/50 ring-2 ring-yellow-500/30' : ''}`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{displayTitle}</h3>
                      {getStatusBadge(o.status || 'pending')}
                    </div>
                    <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{o.company} • {o.location} • {o.type}</p>
                    <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Offer: {o.salary || '—'} • Received: {new Date(o.created_at).toLocaleDateString()}</p>
                    {o.notes && <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Notes: {o.notes}</p>}
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => updateOfferStatus(o.id, 'accepted')}
                          disabled={updating === o.id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {updating === o.id ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => updateOfferStatus(o.id, 'declined')}
                          disabled={updating === o.id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {updating === o.id ? '...' : 'Decline'}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(o.id)}
                      disabled={deleting === o.id}
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
          {items.length===0 && <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>No offers yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Offers;

