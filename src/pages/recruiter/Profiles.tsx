import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserIcon,
  BriefcaseIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

type Profile = {
  id: number;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  location?: string;
  profile_picture?: string | null;
  education: any[];
  experience: any[];
  skills: string[];
  certificates?: any[];
  overall_score?: number;
  education_score?: number;
  skills_readiness_score?: number;
  future_readiness_score?: number;
  geographic_score?: number;
  ilo_level?: number;
  ilo_label?: string;
};

const Profiles: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'recent'>('score');

  // Modals state
  const [offerModal, setOfferModal] = useState<{open:boolean,userId:string|null,roleTitle:string,salary:string,notes:string}>({open:false,userId:null,roleTitle:'',salary:'',notes:''});
  const [interviewModal, setInterviewModal] = useState<{open:boolean,userId:string|null,roleTitle:string,datetime:string,mode:string,notes:string}>({open:false,userId:null,roleTitle:'',datetime:'',mode:'online',notes:''});

  const submitOffer = async () => {
    try {
      if (!offerModal.userId) return;
      setBusy(offerModal.userId+':offer');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterId = currentUser._id || currentUser.id;
      if (!recruiterId) throw new Error('Not logged in');
      // For demo: pick first job of recruiter
      const jobsRes = await fetch(`http://localhost:5000/api/recruiter/jobs?recruiterId=${recruiterId}`);
      const jobsData = await jobsRes.json();
      const jobId = jobsData.success && jobsData.data[0]?.id ? jobsData.data[0].id : null;
      const res = await fetch('http://localhost:5000/api/recruiter/offers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobId, userId: offerModal.userId, recruiterId, roleTitle: offerModal.roleTitle || null, salary: offerModal.salary || null, notes: offerModal.notes || null})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      alert('Offer created');
      setOfferModal({open:false,userId:null,roleTitle:'',salary:'',notes:''});
    } catch(e:any){
      alert('Error: '+e.message);
    } finally { setBusy(null); }
  };

  const submitInterview = async () => {
    try {
      if (!interviewModal.userId) return;
      setBusy(interviewModal.userId+':interview');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterId = currentUser._id || currentUser.id;
      if (!recruiterId) throw new Error('Not logged in');
      const jobsRes = await fetch(`http://localhost:5000/api/recruiter/jobs?recruiterId=${recruiterId}`);
      const jobsData = await jobsRes.json();
      const jobId = jobsData.success && jobsData.data[0]?.id ? jobsData.data[0].id : null;
      const scheduledAt = interviewModal.datetime || new Date(Date.now()+3*24*3600*1000).toISOString();
      const res = await fetch('http://localhost:5000/api/recruiter/interviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobId, userId: interviewModal.userId, recruiterId, roleTitle: interviewModal.roleTitle || null, scheduledAt, mode: interviewModal.mode || 'online', notes: interviewModal.notes || null})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      alert('Interview scheduled');
      setInterviewModal({open:false,userId:null,roleTitle:'',datetime:'',mode:'online',notes:''});
    } catch(e:any){
      alert('Error: '+e.message);
    } finally { setBusy(null); }
  };

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/recruiter/profiles');
        const data = await res.json();
        if (data.success) {
          setProfiles(data.data);
          setFilteredProfiles(data.data);
        } else throw new Error(data.error || 'Failed');
      } catch (e:any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadProfiles();
  }, []);

  // Filter and sort profiles
  useEffect(() => {
    let filtered = [...profiles];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.skills?.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.experience?.some((exp: any) =>
          exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.company?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter((p) => {
        const score = p.overall_score ?? 75;
        if (scoreFilter === 'high') return score >= 80;
        if (scoreFilter === 'medium') return score >= 60 && score < 80;
        if (scoreFilter === 'low') return score < 60;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'score') {
        return (b.overall_score ?? 75) - (a.overall_score ?? 75);
      } else if (sortBy === 'name') {
        return (a.name ?? '').localeCompare(b.name ?? '');
      } else {
        // recent - already sorted by backend
        return 0;
      }
    });

    setFilteredProfiles(filtered);
  }, [profiles, searchTerm, scoreFilter, sortBy]);

  const getScoreColor = (score?: number | string) => {
    const s = Number(score ?? 0);
    if (s >= 80) return 'text-[#22C55E] bg-[#22C55E]/20 border-[#22C55E]/30';
    if (s >= 60) return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-500 bg-red-500/20 border-red-500/30';
  };

  const getScoreLabel = (score?: number | string) => {
    const s = Number(score ?? 0);
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-saas-text-heading font-semibold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Browse Candidate Profiles</h1>
          <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Discover top talent and filter by scores</p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-saas-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, skills, company..."
                className="w-full pl-10 pr-4 py-2 border border-saas-border rounded-lg bg-white text-saas-text-heading placeholder-saas-text-muted focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            {/* Score Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-saas-text-muted" />
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-saas-border rounded-lg bg-white text-saas-text-heading focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent appearance-none transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <option value="all">All Scores</option>
                <option value="high">High (80+)</option>
                <option value="medium">Medium (60-79)</option>
                <option value="low">Low (&lt;60)</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <ChartBarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-saas-text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-saas-border rounded-lg bg-white text-saas-text-heading focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent appearance-none transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <option value="score">Sort by Score</option>
                <option value="name">Sort by Name</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-saas-border">
            <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
              Showing <span className="font-semibold text-saas-text-heading">{filteredProfiles.length}</span> of{' '}
              <span className="font-semibold text-saas-text-heading">{profiles.length}</span> candidates
            </p>
          </div>
        </Card>

        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent mx-auto"></div>
            <p className="text-saas-text-heading-secondary mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>Loading profiles...</p>
          </div>
        )}

        {error && (
          <Card className="p-6">
            <p className="text-red-500" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
          </Card>
        )}

      {!loading && !error && (
          <>
            {filteredProfiles.length === 0 ? (
              <Card className="p-12 text-center">
                <UserIcon className="h-16 w-16 text-saas-text-muted mx-auto mb-4" />
                <p className="text-saas-text-heading-secondary text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>No profiles found</p>
                <p className="text-sm text-saas-text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Try adjusting your filters</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map((p) => (
                  <motion.div
                    key={p.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full"
                  >
                    <Card className="p-6 h-full flex flex-col hover:shadow-lg transition-all duration-200 border border-saas-border hover:border-primary-accent/40 overflow-hidden">
                      {/* Profile Header with Score */}
                      <div className="flex items-start justify-between mb-4 gap-2">
                        <div className="flex items-center space-x-3 flex-1 min-w-0 overflow-hidden">
                          <Avatar 
                            src={p.profile_picture || (p.user_id ? `http://localhost:5000/api/profile-picture/${p.user_id}` : null)}
                            name={p.name}
                            size="lg"
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h3 className="text-base font-semibold text-saas-text-heading truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {p.name || 'Unnamed'}
                            </h3>
                            {p.experience && p.experience.length > 0 && (
                              <p className="text-sm text-saas-text-heading-secondary truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {p.experience[0]?.title} {p.experience[0]?.company ? `at ${p.experience[0]?.company}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Score Badge */}
                        <div className={`px-2 py-1 rounded-lg border-2 font-bold text-xs flex-shrink-0 ${getScoreColor(p.overall_score)}`}>
                          <div className="text-center whitespace-nowrap">
                            <div className="text-sm leading-tight font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>{Number(p.overall_score ?? 0).toFixed(2)}</div>
                            <div className="text-[10px] leading-tight mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{getScoreLabel(p.overall_score)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Email */}
                      {p.email && (
                        <div className="mb-3">
                          <p className="text-sm text-saas-text-heading-secondary truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {p.email}
                          </p>
                        </div>
                      )}

                      {/* Bio */}
                      {p.bio && (
                        <p className="text-sm text-saas-text-heading-secondary mb-4 line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {p.bio}
                        </p>
                      )}

                      {/* Score Breakdown */}
                      <div className="mb-4 p-3 bg-saas-bg-secondary border border-saas-border rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Education:</span>
                            <span className="font-semibold text-saas-text-heading ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>{Number(p.education_score ?? 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Skills:</span>
                            <span className="font-semibold text-saas-text-heading ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>{Number(p.skills_readiness_score ?? 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Future Ready:</span>
                            <span className="font-semibold text-saas-text-heading ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>{Number(p.future_readiness_score ?? 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Geographic:</span>
                            <span className="font-semibold text-saas-text-heading ml-1" style={{ fontFamily: 'Inter, sans-serif' }}>{Number(p.geographic_score ?? 0).toFixed(2)}</span>
                          </div>
                        </div>
                        {(p.ilo_label || p.ilo_level) && (
                          <div className="mt-2 pt-2 border-t border-saas-border">
                            <span className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>ILO Level: </span>
                            <Link to={`/profile/${p.user_id}`} className="text-xs font-semibold text-primary-accent hover:text-primary-accent/80 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {p.ilo_level ?? 2} - {p.ilo_label ?? 'Entry level'}
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Experience Preview */}
                      {p.experience && p.experience.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-saas-border">
                          <div className="flex items-center space-x-2 mb-2">
                            <BriefcaseIcon className="h-4 w-4 text-saas-text-muted" />
                            <span className="text-xs font-semibold text-saas-text-heading uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>Experience</span>
                          </div>
                          <div className="space-y-1">
                            {p.experience.slice(0, 2).map((exp: any, index: number) => (
                              <div key={index}>
                                <p className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{exp.title}</p>
                                <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{exp.company}</p>
                              </div>
                            ))}
                            {p.experience.length > 2 && (
                              <Link to={`/profile/${p.user_id}`} className="text-xs text-primary-accent hover:text-primary-accent/80 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                                +{p.experience.length - 2} more
                              </Link>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Education Preview */}
                      {p.education && p.education.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-saas-border">
                          <div className="flex items-center space-x-2 mb-2">
                            <AcademicCapIcon className="h-4 w-4 text-saas-text-muted" />
                            <span className="text-xs font-semibold text-saas-text-heading uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>Education</span>
                          </div>
                          <div className="space-y-1">
                            {p.education.slice(0, 2).map((edu: any, index: number) => (
                              <div key={index}>
                                <p className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{edu.degree}</p>
                                <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{edu.institute}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {p.skills && p.skills.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1.5">
                            {p.skills.slice(0, 5).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-primary-accent/10 text-primary-accent border border-primary-accent/20 text-xs rounded-full font-medium"
                                style={{ fontFamily: 'Inter, sans-serif' }}
                              >
                                {skill}
                              </span>
                            ))}
                            {p.skills.length > 5 && (
                              <span className="px-2 py-1 bg-saas-bg-secondary text-saas-text-heading-secondary border border-saas-border text-xs rounded-full font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                +{p.skills.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-auto pt-4 flex flex-col gap-2">
                        <Link to={`/profile/${p.user_id}`}>
                          <Button variant="primary" className="w-full">
                            View Full Profile
                          </Button>
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOfferModal({ open: true, userId: p.user_id, roleTitle: '', salary: '', notes: '' })}
                            disabled={busy === p.user_id + ':offer'}
                          >
                            {busy === p.user_id + ':offer' ? 'Sending...' : 'Make Offer'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInterviewModal({ open: true, userId: p.user_id, roleTitle: '', datetime: '', mode: 'online', notes: '' })}
                            disabled={busy === p.user_id + ':interview'}
                          >
                            {busy === p.user_id + ':interview' ? 'Scheduling...' : 'Schedule Interview'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

      {/* Offer Modal */}
      {offerModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md border border-saas-border shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Make Offer</h3>
            <input 
              className="w-full px-4 py-3 border border-saas-border rounded-lg mb-3 bg-white text-saas-text-heading placeholder-saas-text-muted focus:ring-2 focus:ring-primary-accent focus:border-transparent transition-all" 
              placeholder="Role Title (e.g., Frontend Engineer)" 
              value={offerModal.roleTitle} 
              onChange={e=>setOfferModal({...offerModal,roleTitle:e.target.value})}
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <input 
              className="w-full px-4 py-3 border border-saas-border rounded-lg mb-3 bg-white text-saas-text-heading placeholder-saas-text-muted focus:ring-2 focus:ring-primary-accent focus:border-transparent transition-all" 
              placeholder="Salary (optional)" 
              value={offerModal.salary} 
              onChange={e=>setOfferModal({...offerModal,salary:e.target.value})}
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <textarea 
              className="w-full px-4 py-3 border border-saas-border rounded-lg mb-4 h-24 bg-white text-saas-text-heading placeholder-saas-text-muted focus:ring-2 focus:ring-primary-accent focus:border-transparent transition-all resize-none" 
              placeholder="Notes (optional)" 
              value={offerModal.notes} 
              onChange={e=>setOfferModal({...offerModal,notes:e.target.value})}
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setOfferModal({open:false,userId:null,roleTitle:'',salary:'',notes:''})}>Cancel</Button>
              <Button onClick={submitOffer} disabled={busy===offerModal.userId+':offer'}>{busy===offerModal.userId+':offer'?'Sending...':'Send Offer'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {interviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md border border-saas-border shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Schedule Interview</h3>
            <label className="block text-sm mb-1 text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Role Title</label>
            <input 
              className="w-full px-4 py-3 border border-saas-border rounded-lg mb-3 bg-white text-saas-text-heading placeholder-saas-text-muted focus:ring-2 focus:ring-primary-accent focus:border-transparent transition-all" 
              placeholder="Role Title (e.g., Backend Engineer)" 
              value={interviewModal.roleTitle} 
              onChange={e=>setInterviewModal({...interviewModal,roleTitle:e.target.value})}
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <label className="block text-sm mb-1 text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Date & Time</label>
            <input 
              type="datetime-local" 
              className="w-full px-4 py-3 border border-saas-border rounded-lg mb-3 bg-white text-saas-text-heading focus:ring-2 focus:ring-primary-accent focus:border-transparent transition-all" 
              value={interviewModal.datetime} 
              onChange={e=>setInterviewModal({...interviewModal,datetime:e.target.value})}
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <label className="block text-sm mb-1 text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>Mode</label>
            <select 
              className="w-full px-4 py-3 border border-saas-border rounded-lg mb-3 bg-white text-saas-text-heading focus:ring-2 focus:ring-primary-accent focus:border-transparent transition-all" 
              value={interviewModal.mode} 
              onChange={e=>setInterviewModal({...interviewModal,mode:e.target.value})}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <option value="online">Online</option>
              <option value="onsite">Onsite</option>
            </select>
            <textarea 
              className="w-full px-4 py-3 border border-saas-border rounded-lg mb-4 h-24 bg-white text-saas-text-heading placeholder-saas-text-muted focus:ring-2 focus:ring-primary-accent focus:border-transparent transition-all resize-none" 
              placeholder="Notes (optional)" 
              value={interviewModal.notes} 
              onChange={e=>setInterviewModal({...interviewModal,notes:e.target.value})}
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setInterviewModal({open:false,userId:null,roleTitle:'',datetime:'',mode:'online',notes:''})}>Cancel</Button>
              <Button onClick={submitInterview} disabled={busy===interviewModal.userId+':interview'}>{busy===interviewModal.userId+':interview'?'Scheduling...':'Schedule'}</Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Profiles;

