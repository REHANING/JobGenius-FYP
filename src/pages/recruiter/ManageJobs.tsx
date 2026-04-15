import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

type Job = {
  id: number|string;
  title: string;
  company: string;
  location: string;
  type: string;
  status?: string;
  created_at?: string;
};

const ManageJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [busyId, setBusyId] = useState<number|string|null>(null);
  const [deleting, setDeleting] = useState<number|string|null>(null);

  const loadJobs = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterId = currentUser._id || currentUser.id;
      const res = await fetch(`http://localhost:5000/api/recruiter/jobs?recruiterId=${recruiterId}`);
      const data = await res.json();
      if (data.success) setJobs(data.data);
      else throw new Error(data.error || 'Failed');
    } catch(e:any){ setError(e.message); } finally { setLoading(false); }
  };

  useEffect(()=>{ loadJobs(); },[]);

  const toggleJobStatus = async (id: number|string, currentStatus?: string) => {
    try {
      setBusyId(id);
      const newStatus = currentStatus === 'closed' ? 'active' : 'closed';
      const res = await fetch(`http://localhost:5000/api/recruiter/jobs/${id}/status`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({status:newStatus})
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      await loadJobs();
    } catch(e:any){ alert('Error: '+e.message); } finally { setBusyId(null); }
  };

  const handleDeleteJob = async (id: number|string) => {
    if (!window.confirm('Are you sure you want to permanently delete this job? This action cannot be undone and will also delete all related applications, interviews, and offers.')) return;
    try {
      setDeleting(id);
      const res = await fetch(`http://localhost:5000/api/recruiter/jobs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadJobs(); // Reload to update the list
        alert('Job deleted permanently');
      } else {
        alert(data.error || 'Failed to delete job');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen" style={{ background: '#FFFFFF' }}>
      <h1 className="text-2xl font-bold text-saas-text-heading font-semibold mb-4" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Manage Jobs</h1>
      {loading && <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Loading...</p>}
      {error && <p className="text-red-400" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((j: any)=>(
            <motion.div key={j.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
              <Card className={`p-5 ${j.status === 'closed' ? 'opacity-75' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-saas-text-heading ">{j.title}</h3>
                  {j.status === 'closed' && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                      Closed
                    </span>
                  )}
                  {(!j.status || j.status === 'active') && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-saas-text-heading-secondary ">{j.company}</p>
                <p className="text-sm text-saas-text-heading-secondary  mb-3">{j.location || 'Location Not Specified'} • {j.type}</p>
                <div className="flex gap-2 items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={()=>toggleJobStatus(j.id, j.status)} 
                    disabled={busyId===j.id || deleting===j.id}
                    className={j.status === 'closed' ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-700' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-700'}
                  >
                    {busyId===j.id ? '...' : j.status === 'closed' ? 'Reopen Job' : 'Close Job'}
                  </Button>
                  <button
                    onClick={() => handleDeleteJob(j.id)}
                    disabled={deleting === j.id || busyId === j.id}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                    title="Delete Permanently"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageJobs;

