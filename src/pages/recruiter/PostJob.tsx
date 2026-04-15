import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const PostJob: React.FC = () => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('full-time');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<{text:string,type:'success'|'error'|''}>({text:'',type:''});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setStatus({text:'',type:''});
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterId = currentUser._id || currentUser.id;
      if (!recruiterId) throw new Error('Not logged in');
      const res = await fetch('http://localhost:5000/api/recruiter/jobs',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ recruiterId, title, company, location, description, salary, type })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({text:'Job posted successfully!', type:'success'});
        setTitle('');setCompany('');setLocation('');setType('full-time');setSalary('');setDescription('');
      } else {
        throw new Error(data.error || 'Failed to post job');
      }
    } catch (e:any) {
      setStatus({text:e.message, type:'error'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto min-h-screen" style={{ background: '#FFFFFF' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-2xl font-bold text-saas-text-heading font-semibold mb-4" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Post a Job</h1>
        <Card className="p-6">
          {status.text && (
            <div className={`mb-4 p-3 rounded border text-sm ${status.type==='success'?'bg-green-50 border-green-200 text-green-700':'bg-red-50 border-red-200 text-red-700'}`}>
              {status.text}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-saas-text-heading mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full px-4 py-3 border border-saas-border rounded-lg bg-white/20 backdrop-blur-sm text-saas-text-heading placeholder-saas-text-muted focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                placeholder="e.g., Software Engineer" 
                value={title} 
                onChange={e=>setTitle(e.target.value)} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-saas-text-heading mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input 
                className="w-full px-4 py-3 border border-saas-border rounded-lg bg-white/20 backdrop-blur-sm text-saas-text-heading placeholder-saas-text-muted focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                placeholder="e.g., Tech Corp" 
                value={company} 
                onChange={e=>setCompany(e.target.value)} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-saas-text-heading mb-2">
                Location
              </label>
              <input 
                className="w-full px-4 py-3 border border-saas-border rounded-lg bg-white/20 backdrop-blur-sm text-saas-text-heading placeholder-saas-text-muted focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                placeholder="e.g., New York, NY or Remote" 
                value={location} 
                onChange={e=>setLocation(e.target.value)} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-saas-text-heading mb-2">
                Job Type
              </label>
              <select 
                className="w-full px-4 py-3 border border-saas-border rounded-lg bg-white/20 backdrop-blur-sm text-saas-text-heading focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                value={type} 
                onChange={e=>setType(e.target.value)}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-saas-text-heading mb-2">
                Salary
              </label>
              <input 
                className="w-full px-4 py-3 border border-saas-border rounded-lg bg-white/20 backdrop-blur-sm text-saas-text-heading placeholder-saas-text-muted focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                placeholder="e.g., $50,000 - $70,000" 
                value={salary} 
                onChange={e=>setSalary(e.target.value)} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-saas-text-heading mb-2">
                Job Description
              </label>
              <textarea 
                className="w-full px-4 py-3 border border-saas-border rounded-lg bg-white/20 backdrop-blur-sm text-saas-text-heading placeholder-saas-text-muted focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-y" 
                rows={6}
                placeholder="Describe the job responsibilities, requirements, and benefits..." 
                value={description} 
                onChange={e=>setDescription(e.target.value)} 
              />
            </div>
            
            <Button onClick={handleSubmit} disabled={loading || !title || !company}>
              {loading? 'Posting...' : 'Post Job'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default PostJob;

