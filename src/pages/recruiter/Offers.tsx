import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

type Offer = {
  id: number;
  job_id: number;
  user_id: string;
  recruiter_id: string;
  status: string;
  salary: string;
  notes: string;
  created_at: string;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
  candidate_name?: string;
  candidate_email?: string;
};

const RecruiterOffers: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    loadOffers();
    // Poll for updates every 30 seconds
    const interval = setInterval(loadOffers, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOffers = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterId = currentUser._id || currentUser.id;
      if (!recruiterId) {
        setError('Please log in as a recruiter');
        return;
      }

      const res = await fetch(`http://localhost:5000/api/recruiter/offers?recruiterId=${recruiterId}`);
      const data = await res.json();
      if (data.success) {
        setOffers(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load offers');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      setDeleting(id);
      const res = await fetch(`http://localhost:5000/api/recruiter/offers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setOffers(offers.filter((o) => o.id !== id));
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
    if (!window.confirm(`Are you sure you want to delete all ${offers.length} offers? This cannot be undone.`)) return;
    try {
      setDeletingAll(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterId = currentUser._id || currentUser.id;
      const res = await fetch(`http://localhost:5000/api/recruiter/offers?recruiterId=${recruiterId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setOffers([]);
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
    const displayStatus = status === 'pending' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status || 'pending')}`}>
        {displayStatus}
      </span>
    );
  };

  const responseCount = offers.filter((o) => o.status === 'accepted' || o.status === 'declined').length;
  // Show all responses as notifications - they persist until deleted
  const newResponsesCount = responseCount;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen" style={{ background: '#FFFFFF' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-saas-text-heading font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Job Offers</h1>
            <p className="text-saas-text-heading-secondary mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              View offers you've made and track candidate responses
            </p>
            {newResponsesCount > 0 && (
              <div className="flex items-center gap-2 bg-[#22C55E]/20 border border-[#22C55E]/30 px-4 py-2 rounded-lg mt-2 inline-block">
                <span className="text-[#22C55E] font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  🔔 {newResponsesCount} new response{newResponsesCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          {offers.length > 0 && (
            <Button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              variant="danger"
            >
              {deletingAll ? 'Deleting...' : `Delete All (${offers.length})`}
            </Button>
          )}
        </div>
      </motion.div>

      {loading && <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Loading offers...</p>}
      {error && <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {offers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 text-lg">No offers made yet.</p>
              <p className="text-gray-400 text-sm mt-2">Make offers to candidates from the Profiles page.</p>
            </Card>
          ) : (
            offers.map((offer) => {
              const roleMatch = offer.notes && offer.notes.match(/Role:\s*([^\.]+)\./i);
              const roleTitle = roleMatch ? roleMatch[1].trim() : null;
              const displayTitle = roleTitle || offer.title || 'Job Position';
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <Card className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-saas-text-heading ">
                            {offer.candidate_name || 'Candidate'}
                          </h3>
                          {getStatusBadge(offer.status || 'pending')}
                        </div>
                        <p className="text-sm text-saas-text-heading-secondary  mb-1">
                          {offer.candidate_email || offer.user_id}
                        </p>
                        <div className="mt-3">
                          <p className="text-sm font-medium text-saas-text-heading  mb-1">
                            Offer for: <span className="font-semibold">{displayTitle}</span>
                          </p>
                          <p className="text-xs text-gray-500 ">
                            {offer.company} • {offer.location || 'Location not specified'} • {offer.type || 'full-time'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500  mt-2">
                          Salary: {offer.salary || '—'} • Sent: {new Date(offer.created_at).toLocaleDateString()}
                        </p>
                        {offer.notes && (
                          <p className="text-xs text-saas-text-heading-secondary  mt-2">Notes: {offer.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => handleDelete(offer.id)}
                        disabled={deleting === offer.id}
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

export default RecruiterOffers;

