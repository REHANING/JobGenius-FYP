import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import {
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ArrowLeftIcon,
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface Profile {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  profile_picture?: string | null;
  education: any[];
  experience: any[];
  skills: string[];
  certificates: any[];
}

interface Post {
  id: number;
  user_id: string;
  user_name: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  likes: string[];
  comments: Array<{
    id: number;
    user_id: string;
    user_name: string;
    content: string;
    created_at: string;
  }>;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);

  const currentUserId = user?._id || user?.id || JSON.parse(localStorage.getItem('user') || '{}')._id || JSON.parse(localStorage.getItem('user') || '{}').id;
  const isOwnProfile = currentUserId === userId;
  const userRole = user?.role || JSON.parse(localStorage.getItem('user') || '{}').role;

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadUserPosts();
      if (currentUserId) {
        loadSavedPostIds();
      }
    }
  }, [userId, currentUserId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setProfile(data.data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await fetch(`http://localhost:5000/api/posts/user/${userId}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.data || []);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadSavedPostIds = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/saved/${currentUserId}`);
      const data = await response.json();
      if (data.success) {
        setSavedPostIds(data.data.map((p: Post) => p.id));
      }
    } catch (err) {
      console.error('Error loading saved posts:', err);
    }
  };

  const handleLike = async (postId: number) => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });
      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            const isLiked = post.likes.includes(currentUserId);
            return {
              ...post,
              likes: isLiked 
                ? post.likes.filter(id => id !== currentUserId)
                : [...post.likes, currentUserId],
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleSave = async (postId: number) => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });
      const data = await response.json();
      if (data.success) {
        if (savedPostIds.includes(postId)) {
          setSavedPostIds(savedPostIds.filter(id => id !== postId));
        } else {
          setSavedPostIds([...savedPostIds, postId]);
        }
      }
    } catch (err) {
      console.error('Error saving post:', err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className=" min-h-screen flex items-center justify-center" >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan mx-auto"></div>
          <p className="text-saas-text-heading-secondary mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className=" min-h-screen flex items-center justify-center" >
        <Card className="p-8 text-center">
          <p className="text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Profile not found</p>
          <Button onClick={() => navigate('/profiles')}>Back to Network</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => {
            // Redirect based on user role
            if (userRole === 'recruiter') {
              navigate('/recruiter/profiles');
            } else {
              navigate('/profiles');
            }
          }}
          className="flex items-center space-x-2 text-saas-text-heading-secondary hover:text-primary-accent mb-4 transition-colors"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>{userRole === 'recruiter' ? 'Back to Browse Profiles' : 'Back to Network'}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <Avatar 
                  src={profile.profile_picture || (profile.user_id ? `http://localhost:5000/api/profile-picture/${profile.user_id}` : null)}
                  name={profile.name}
                  size="xl"
                  className="mx-auto mb-4"
                />
                <h1 className="text-2xl font-bold text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{profile.name || 'Unknown'}</h1>
                {profile.bio && (
                  <p className="text-sm text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>{profile.bio}</p>
                )}
                {isOwnProfile && (
                  <Link to="/profile">
                    <Button variant="outline" className="w-full">
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-3 border-t border-saas-cyan/20 pt-4">
                {profile.email && (
                  <div className="flex items-center space-x-3 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <EnvelopeIcon className="h-5 w-5 text-saas-text-heading-secondary" />
                    <span className="text-saas-text-heading">{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center space-x-3 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <PhoneIcon className="h-5 w-5 text-saas-text-heading-secondary" />
                    <span className="text-saas-text-heading">{profile.phone}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center space-x-3 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <MapPinIcon className="h-5 w-5 text-saas-text-heading-secondary" />
                    <span className="text-saas-text-heading">{profile.location}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Experience Card */}
            {profile.experience && profile.experience.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-saas-text-heading mb-4 flex items-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <BriefcaseIcon className="h-5 w-5 mr-2 text-saas-cyan" />
                  Experience
                </h2>
                <div className="space-y-4">
                  {profile.experience.map((exp: any, index: number) => (
                    <div key={index} className="border-l-2 border-saas-cyan pl-4">
                      <h3 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{exp.title}</h3>
                      <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{exp.company}</p>
                      {exp.duration && (
                        <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{exp.duration}</p>
                      )}
                      {exp.description && (
                        <p className="text-sm text-saas-text-heading mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Education Card */}
            {profile.education && profile.education.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-saas-text-heading mb-4 flex items-center" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <AcademicCapIcon className="h-5 w-5 mr-2 text-saas-cyan" />
                  Education
                </h2>
                <div className="space-y-4">
                  {profile.education.map((edu: any, index: number) => (
                    <div key={index}>
                      <h3 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{edu.degree}</h3>
                      <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{edu.institute}</p>
                      {edu.year && (
                        <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{edu.year}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Skills Card */}
            {profile.skills && profile.skills.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-saas-text-heading mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-saas-cyan/20 text-[#22D3EE] border border-saas-cyan/30 text-sm rounded-full font-medium"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Certificates Card */}
            {profile.certificates && profile.certificates.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-saas-text-heading mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Certifications</h2>
                <div className="space-y-3">
                  {profile.certificates.map((cert: any, index: number) => (
                    <div key={index} className="border-l-2 border-[#22C55E] pl-4">
                      <h3 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{cert.name}</h3>
                      {cert.issuer && (
                        <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{cert.issuer}</p>
                      )}
                      {cert.date && (
                        <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{cert.date}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Posts */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold text-saas-text-heading mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Activity</h2>
              <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </p>
            </Card>

            {postsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saas-cyan mx-auto"></div>
                <p className="text-saas-text-heading-secondary mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>No posts yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="p-6">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          src={post.user_profile_picture}
                          name={post.user_name}
                          size="md"
                        />
                        <div>
                          <h3 className="font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{post.user_name || profile.name}</h3>
                          <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{formatTimeAgo(post.created_at)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-saas-text-heading mb-4 whitespace-pre-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>{post.content}</p>

                    {/* Post Image */}
                    {post.image_url && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}

                    {/* Post Stats */}
                    <div className="flex items-center space-x-6 text-sm text-saas-text-heading-secondary mb-4 border-t border-saas-cyan/20 pt-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <button
                        onClick={() => currentUserId && handleLike(post.id)}
                        disabled={!currentUserId}
                        className={`flex items-center space-x-2 hover:text-saas-cyan transition-colors ${
                          currentUserId && post.likes.includes(currentUserId) ? 'text-saas-cyan' : ''
                        }`}
                      >
                        <HandThumbUpIcon className="h-5 w-5" />
                        <span>{post.likes_count}</span>
                      </button>
                      <div className="flex items-center space-x-2">
                        <ChatBubbleLeftIcon className="h-5 w-5" />
                        <span>{post.comments_count}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ShareIcon className="h-5 w-5" />
                        <span>{post.shares_count}</span>
                      </div>
                    </div>

                    {/* Post Actions */}
                    {currentUserId && (
                      <div className="flex items-center space-x-4 border-t border-saas-cyan/20 pt-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-saas-cyan/10 transition-colors ${
                            post.likes.includes(currentUserId) ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'
                          }`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          <HandThumbUpIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Like</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-saas-cyan/10 transition-colors text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <ChatBubbleLeftIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Comment</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-saas-cyan/10 transition-colors text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <ShareIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Share</span>
                        </button>
                        <button
                          onClick={() => handleSave(post.id)}
                          className={`ml-auto flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-saas-cyan/10 transition-colors ${
                            savedPostIds.includes(post.id) ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'
                          }`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {savedPostIds.includes(post.id) ? (
                            <BookmarkSolidIcon className="h-5 w-5" />
                          ) : (
                            <BookmarkIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Comments */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-4 border-t border-saas-cyan/20 pt-4 space-y-3">
                        {post.comments.slice(0, 3).map((comment) => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-saas-cyan/20 border border-saas-cyan/30 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserIcon className="h-5 w-5 text-saas-cyan" />
                            </div>
                            <div className="flex-1">
                              <div className="glass-card rounded-lg p-3">
                                <p className="font-semibold text-sm text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{comment.user_name}</p>
                                <p className="text-sm text-saas-text-heading mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{comment.content}</p>
                              </div>
                              <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{formatTimeAgo(comment.created_at)}</p>
                            </div>
                          </div>
                        ))}
                        {post.comments.length > 3 && (
                          <p className="text-sm text-saas-cyan cursor-pointer hover:opacity-80" style={{ fontFamily: 'Inter, sans-serif' }}>
                            View all {post.comments.length} comments
                          </p>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

