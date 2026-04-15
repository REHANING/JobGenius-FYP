import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import {
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  MapPinIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface Profile {
  user_id: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  profile_picture?: string;
  education: any[];
  experience: any[];
  skills: string[];
  certificates: any[];
}

const Profiles: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/profile');
      const data = await response.json();
      if (data.success) {
        setProfiles(data.data || []);
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.skills?.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
    profile.experience?.some((exp: any) => 
      exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-2">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-saas-text-heading font-semibold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Network</h1>
          <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Connect with talented professionals and expand your network</p>
        </div>

        {/* Search Bar */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-saas-text-heading-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, skills, company, or education..."
              className="w-full pl-12 pr-4 py-3 border border-saas-border rounded-lg focus:outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan text-sm text-saas-text-heading placeholder-saas-text-muted bg-white"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </Card>

        {/* Results Count */}
        {!loading && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
              {filteredProfiles.length} {filteredProfiles.length === 1 ? 'profile' : 'profiles'} found
            </p>
          </div>
        )}

        {/* Profiles Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan mx-auto"></div>
            <p className="text-saas-text-heading-secondary mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>Loading profiles...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <Card className="p-12 text-center">
            <UserIcon className="h-16 w-16 text-saas-text-heading-secondary mx-auto mb-4" />
            <p className="text-saas-text-heading text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>No profiles found</p>
            <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Try adjusting your search terms</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <Card 
                key={profile.user_id} 
                className="p-6 hover:border-saas-cyan/50 transition-all duration-200"
              >
                {/* Profile Header */}
                <Link to={`/profile/${profile.user_id}`} className="block">
                  <div className="flex items-start space-x-4 mb-4">
                    <Avatar 
                      src={profile.profile_picture}
                      name={profile.name}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-saas-text-heading truncate text-lg hover:text-[#22D3EE] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {profile.name || 'Unknown'}
                      </h3>
                      {profile.experience && profile.experience.length > 0 && (
                        <p className="text-sm text-saas-text-heading-secondary truncate mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {profile.experience[0]?.title}
                        </p>
                      )}
                      {profile.experience && profile.experience.length > 0 && profile.experience[0]?.company && (
                        <p className="text-xs text-saas-text-heading-secondary truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {profile.experience[0]?.company}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Location */}
                {profile.location && (
                  <div className="flex items-center space-x-2 mb-3 text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <MapPinIcon className="h-4 w-4" />
                    <span className="truncate">{profile.location}</span>
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-saas-text-heading mb-4 line-clamp-3" style={{ fontFamily: 'Inter, sans-serif' }}>{profile.bio}</p>
                )}

                {/* Experience Preview */}
                {profile.experience && profile.experience.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-saas-cyan/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <BriefcaseIcon className="h-4 w-4 text-saas-text-heading-secondary" />
                      <span className="text-xs font-semibold text-saas-text-heading uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>Experience</span>
                    </div>
                    <div className="space-y-2">
                      {profile.experience.slice(0, 2).map((exp: any, index: number) => (
                        <div key={index}>
                          <p className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{exp.title}</p>
                          <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{exp.company}</p>
                        </div>
                      ))}
                      {profile.experience.length > 2 && (
                        <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>+{profile.experience.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Education Preview */}
                {profile.education && profile.education.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-saas-cyan/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <AcademicCapIcon className="h-4 w-4 text-saas-text-heading-secondary" />
                      <span className="text-xs font-semibold text-saas-text-heading uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>Education</span>
                    </div>
                    <div className="space-y-2">
                      {profile.education.slice(0, 2).map((edu: any, index: number) => (
                        <div key={index}>
                          <p className="text-sm font-medium text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{edu.degree}</p>
                          <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{edu.institute}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.slice(0, 4).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 text-xs rounded-full font-medium"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {skill}
                        </span>
                      ))}
                      {profile.skills.length > 4 && (
                        <span className="px-2.5 py-1 bg-saas-cyan/10 text-saas-text-heading-secondary border border-saas-cyan/20 text-xs rounded-full font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                          +{profile.skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* View Profile Button */}
                <Link to={`/profile/${profile.user_id}`}>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                  >
                    View Profile
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profiles;

