import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import { motion } from 'framer-motion';
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  HandThumbUpIcon,
  ShareIcon,
  BookmarkIcon,
  UserCircleIcon,
  BriefcaseIcon,
  SparklesIcon,
  BookmarkSquareIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface Post {
  id: number;
  user_id: string;
  user_name: string;
  user_bio: string;
  user_profile_picture?: string;
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
    user_profile_picture?: string;
    content: string;
    created_at: string;
  }>;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [showCommentBox, setShowCommentBox] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [showPostMenu, setShowPostMenu] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'feed' | 'myPosts' | 'saved'>('feed');
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const userId = user?._id || user?.id || JSON.parse(localStorage.getItem('user') || '{}')._id || JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    if (viewMode === 'feed') {
    loadPosts();
    } else if (viewMode === 'myPosts') {
      loadMyPosts();
    } else if (viewMode === 'saved') {
      loadSavedPosts();
    }
  }, [viewMode]);

  useEffect(() => {
    if (userId && posts.length > 0) {
      loadSavedPostIds();
    }
  }, [userId, posts.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on dropdown menu or its children
      if (target.closest('[data-dropdown-menu]') || target.closest('[data-delete-button]')) {
        return;
      }
      if (showPostMenu !== null) {
        setShowPostMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPostMenu]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/posts/feed');
      const data = await response.json();
      if (data.success) {
        setPosts(data.data || []);
        // Load saved post IDs after loading posts
        if (userId) {
          loadSavedPostIds();
        }
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !userId) return;

    try {
      setPosting(true);
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          content: postContent
        })
      });

      const data = await response.json();
      if (data.success) {
        setPostContent('');
        // Reload posts based on current view mode
        if (viewMode === 'feed') {
        loadPosts();
        } else if (viewMode === 'myPosts') {
          loadMyPosts();
        }
      }
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: number) => {
    if (!userId) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        // Update state without reloading
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            const wasLiked = post.likes.includes(userId);
            const newLikes = wasLiked 
              ? post.likes.filter(id => id !== userId)
              : [...post.likes, userId];
            
            return {
              ...post,
              likes: newLikes,
              likes_count: wasLiked ? post.likes_count - 1 : post.likes_count + 1
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (postId: number) => {
    if (!commentText.trim() || !userId) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          content: commentText
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update state without reloading
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [data.data, ...post.comments],
              comments_count: post.comments_count + 1
            };
          }
          return post;
        }));
        setCommentText('');
        setShowCommentBox(null);
      }
    } catch (err) {
      console.error('Error commenting:', err);
    }
  };

  const handleShare = async (postId: number) => {
    if (!userId) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      if (data.success) {
        // Update state without reloading
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              shares_count: post.shares_count + 1
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const loadMyPosts = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      // Load both user's posts and shared posts
      const [myPostsRes, sharedPostsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/posts/user/${userId}`),
        fetch(`http://localhost:5000/api/posts/shared/${userId}`)
      ]);
      
      const myPostsData = await myPostsRes.json();
      const sharedPostsData = await sharedPostsRes.json();
      
      const allPosts = [
        ...(myPostsData.success ? myPostsData.data : []),
        ...(sharedPostsData.success ? sharedPostsData.data : [])
      ];
      
      // Remove duplicates and sort by date
      const uniquePosts = allPosts.filter((post, index, self) =>
        index === self.findIndex(p => p.id === post.id)
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setPosts(uniquePosts);
    } catch (err) {
      console.error('Error loading my posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPosts = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/posts/saved/${userId}`);
      const data = await response.json();
      if (data.success) {
        setPosts(data.data || []);
      }
    } catch (err) {
      console.error('Error loading saved posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPostIds = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`http://localhost:5000/api/posts/saved/${userId}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setSavedPostIds(data.data.map((post: Post) => post.id));
      }
    } catch (err) {
      // Silently fail - saved posts might not exist yet
      setSavedPostIds([]);
    }
  };

  const handleSave = async (postId: number) => {
    if (!userId) return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        // Update saved post IDs
        if (data.saved) {
          setSavedPostIds(prev => [...prev, postId]);
        } else {
          setSavedPostIds(prev => prev.filter(id => id !== postId));
        }
      }
    } catch (err) {
      console.error('Error saving post:', err);
    }
  };

  const handleDelete = async (postId: number) => {
    if (!userId) return;

    try {
      setDeleting(true);
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        // Remove post from state
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        // Also remove from saved posts if it was saved
        setSavedPostIds(prev => prev.filter(id => id !== postId));
        setShowDeleteConfirm(null);
        setShowPostMenu(null);
      } else {
        alert(data.error || 'Failed to delete post');
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
      setShowDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setUserProfile(data.data);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-4 pb-6" style={{ paddingTop: '0' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - User Profile & Quick Actions */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            {/* User Profile Card */}
            <Card className="p-4 sticky top-20">
              <div className="text-center border-b border-saas-border pb-4 mb-4">
                <Avatar 
                  src={user?.profilePicture}
                  name={user?.name}
                  size="xl"
                  className="mx-auto mb-3 shadow-lg ring-2 ring-saas-cyan/30"
                />
                <h3 className="font-semibold text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{user?.name || 'User'}</h3>
                {userProfile?.bio && (
                  <p className="text-xs text-saas-text-heading-secondary mb-3 line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>{userProfile.bio}</p>
                )}
                <Link to="/profile">
                  <Button variant="outline" className="w-full" size="sm">
                    View Profile
                  </Button>
                </Link>
              </div>
              
                {userProfile?.skills && userProfile.skills.length > 0 && (
                  <div className="mb-4">
                  <p className="text-xs font-semibold text-saas-text-heading mb-2 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                      {userProfile.skills.slice(0, 5).map((skill: string, index: number) => (
                        <span
                          key={index}
                        className="px-2 py-1 bg-saas-cyan/20 text-saas-cyan border border-saas-cyan/30 text-xs rounded-md font-medium"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {skill}
              </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Quick Links */}
              <div className="space-y-2 pt-4 border-t border-saas-border">
                <Link to="/jobs" className="flex items-center space-x-2 text-sm text-saas-text-heading-secondary hover:text-saas-cyan transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <BriefcaseIcon className="h-4 w-4" />
                  <span>Jobs</span>
                </Link>
                <Link to="/dashboard" className="flex items-center space-x-2 text-sm text-saas-text-heading-secondary hover:text-saas-cyan transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <SparklesIcon className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/applications" className="flex items-center space-x-2 text-sm text-saas-text-heading-secondary hover:text-saas-cyan transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Applications</span>
                </Link>
              </div>
            </Card>

          </aside>

          {/* Main Feed */}
          <div className="lg:col-span-6 space-y-4">
            {/* View Mode Tabs */}
            <div className="flex items-center space-x-2 border-b border-saas-cyan/20 pb-2">
              <button
                onClick={() => setViewMode('feed')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'feed'
                    ? 'text-saas-cyan border-b-2 border-saas-cyan'
                    : 'text-saas-text-heading-secondary hover:text-saas-cyan'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Feed
              </button>
              <button
                onClick={() => setViewMode('myPosts')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'myPosts'
                    ? 'text-saas-cyan border-b-2 border-saas-cyan'
                    : 'text-saas-text-heading-secondary hover:text-saas-cyan'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                My Posts
              </button>
              <button
                onClick={() => setViewMode('saved')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'saved'
                    ? 'text-saas-cyan border-b-2 border-saas-cyan'
                    : 'text-saas-text-heading-secondary hover:text-saas-cyan'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Saved
              </button>
            </div>

            {/* Create Post Card - LinkedIn Style */}
            {user && viewMode === 'feed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar 
                      src={user.profilePicture}
                      name={user.name}
                      size="lg"
                    />
                    <div className="flex-1">
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="What do you want to talk about?"
                        className="w-full p-3 border border-saas-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan text-sm text-saas-text-heading placeholder-saas-text-muted bg-white"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-1 text-saas-text-heading-secondary hover:text-saas-cyan transition-colors text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <PhotoIcon className="h-5 w-5" />
                            <span>Photo</span>
                          </button>
                          <button className="flex items-center space-x-1 text-saas-text-heading-secondary hover:text-saas-cyan transition-colors text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <VideoCameraIcon className="h-5 w-5" />
                            <span>Video</span>
                          </button>
                          <button className="flex items-center space-x-1 text-saas-text-heading-secondary hover:text-saas-cyan transition-colors text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <DocumentTextIcon className="h-5 w-5" />
                            <span>Document</span>
                          </button>
                        </div>
                        <Button
                          onClick={handleCreatePost}
                          disabled={!postContent.trim() || posting}
                          size="sm"
                          className="px-6"
                        >
                          {posting ? 'Posting...' : 'Post'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saas-cyan mx-auto"></div>
                <p className="text-saas-text-heading-secondary mt-4 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
              <Card className="p-12 text-center">
                <UserCircleIcon className="h-16 w-16 text-saas-text-heading-secondary mx-auto mb-4" />
                <p className="text-saas-text-heading font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>No posts yet</p>
                <p className="text-saas-text-heading-secondary text-sm mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Be the first to share something with your network!</p>
          </Card>
        ) : (
          <div className="space-y-4">
                {posts.map((post, index) => {
              const isLiked = userId && post.likes.includes(userId);
                  const showAllComments = expandedPost === post.id;
                  const displayedComments = showAllComments ? post.comments : post.comments.slice(0, 2);

              return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-0 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Post Header */}
                        <div className="p-4 pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <Avatar 
                                src={post.user_profile_picture}
                                name={post.user_name}
                                size="lg"
                              />
                              <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                                  <h3 className="text-sm font-semibold text-saas-text-heading hover:text-saas-cyan cursor-pointer" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {post.user_name || 'Unknown User'}
                                  </h3>
                                  <span className="text-saas-text-heading-secondary">•</span>
                        <span className="text-saas-text-heading-secondary text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{formatTimeAgo(post.created_at)}</span>
                      </div>
                      {post.user_bio && (
                                  <p className="text-xs text-saas-text-heading-secondary mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{post.user_bio}</p>
                                )}
                              </div>
                            </div>
                            <div className="relative">
                              <button 
                                onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                                className="p-1.5 hover:bg-saas-cyan/10 rounded-full transition-colors"
                              >
                                <EllipsisHorizontalIcon className="h-5 w-5 text-saas-text-heading-secondary" />
                              </button>
                              {showPostMenu === post.id && (
                                <div
                                  data-dropdown-menu
                                  className="absolute right-0 top-10 bg-white border border-saas-border rounded-lg shadow-lg py-1 z-20 min-w-[200px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      setViewMode('myPosts');
                                      setShowPostMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-saas-text-heading hover:bg-saas-cyan/10 flex items-center space-x-3 transition-colors"
                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                  >
                                    <DocumentDuplicateIcon className="h-4 w-4 text-saas-text-heading-secondary" />
                                    <span>My Posts & Shares</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setViewMode('saved');
                                      setShowPostMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-saas-text-heading hover:bg-saas-cyan/10 flex items-center space-x-3 transition-colors"
                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                  >
                                    <BookmarkSquareIcon className="h-4 w-4 text-saas-text-heading-secondary" />
                                    <span>Saved Posts</span>
                                  </button>
                                  {/* Delete option - only show for user's own posts */}
                                  {post.user_id === userId && (
                                    <>
                                      <div className="border-t border-saas-cyan/20 my-1"></div>
                                      <button
                                        data-delete-button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setShowPostMenu(null);
                                          setShowDeleteConfirm(post.id);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center space-x-3 transition-colors"
                                        style={{ fontFamily: 'Inter, sans-serif' }}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                        <span>Delete post</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
          </div>
        </div>

                  {/* Post Content */}
                        <div className="px-4 pb-3">
                          <p className="text-saas-text-heading text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>{post.content}</p>
                        </div>

                  {/* Post Image */}
                  {post.image_url && (
                          <div className="w-full">
                    <img
                      src={post.image_url}
                      alt="Post"
                              className="w-full h-auto object-cover"
                    />
                          </div>
                  )}

                  {/* Post Stats */}
                        {(post.likes_count > 0 || post.comments_count > 0) && (
                          <div className="px-4 py-2 border-t border-saas-cyan/20 flex items-center justify-between text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <div className="flex items-center space-x-4">
                    {post.likes_count > 0 && (
                                <span className="flex items-center space-x-1">
                                  <HandThumbUpIcon className="h-4 w-4 text-saas-cyan" />
                                  <span>{post.likes_count}</span>
                                </span>
                    )}
                    {post.comments_count > 0 && (
                      <span>{post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}</span>
                    )}
                            </div>
                    {post.shares_count > 0 && (
                      <span>{post.shares_count} share{post.shares_count !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                        )}

                  {/* Post Actions */}
                        <div className="px-2 py-2 border-t border-saas-cyan/20">
                          <div className="flex items-center justify-around">
                    <button
                      onClick={() => handleLike(post.id)}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${
                        isLiked
                                  ? 'text-saas-cyan hover:bg-saas-cyan/10'
                          : 'text-saas-text-heading-secondary hover:bg-saas-cyan/10 hover:text-saas-cyan'
                      }`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {isLiked ? (
                        <HeartSolidIcon className="h-5 w-5" />
                      ) : (
                                <HandThumbUpIcon className="h-5 w-5" />
                      )}
                      <span className="text-sm font-medium">Like</span>
                    </button>

                    <button
                      onClick={() => setShowCommentBox(showCommentBox === post.id ? null : post.id)}
                              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-saas-text-heading-secondary hover:bg-saas-cyan/10 hover:text-saas-cyan transition-colors flex-1 justify-center"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Comment</span>
                    </button>

                    <button
                      onClick={() => handleShare(post.id)}
                              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-saas-text-heading-secondary hover:bg-saas-cyan/10 hover:text-saas-cyan transition-colors flex-1 justify-center"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                              <ShareIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Share</span>
                    </button>

                            <button 
                              onClick={() => handleSave(post.id)}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                savedPostIds.includes(post.id)
                                  ? 'text-saas-cyan hover:bg-saas-cyan/10'
                                  : 'text-saas-text-heading-secondary hover:bg-saas-cyan/10 hover:text-saas-cyan'
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
                  </div>

                  {/* Comments Section */}
                  {showCommentBox === post.id && (
                          <div className="px-4 py-3 border-t border-saas-border bg-gray-50">
                      {/* Existing Comments */}
                      {post.comments.length > 0 && (
                        <div className="space-y-3 mb-4">
                                {displayedComments.map((comment) => (
                            <div key={comment.id} className="flex items-start space-x-2">
                                    <Avatar 
                                      src={comment.user_profile_picture}
                                      name={comment.user_name}
                                      size="sm"
                                      className="ring-2 ring-saas-cyan/30"
                                    />
                              <div className="flex-1">
                                      <div className="bg-gray-100 rounded-lg p-3 border border-saas-border">
                                        <p className="font-semibold text-xs text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{comment.user_name}</p>
                                        <p className="text-sm text-saas-text-heading leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{comment.content}</p>
                                      </div>
                                      <div className="flex items-center space-x-3 mt-1 ml-3">
                                        <button className="text-xs text-saas-text-heading-secondary hover:text-saas-cyan font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                          Like
                                        </button>
                                        <span className="text-saas-text-heading-secondary">•</span>
                                        <span className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{formatTimeAgo(comment.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                                {post.comments.length > 2 && !showAllComments && (
                                  <button
                                    onClick={() => setExpandedPost(post.id)}
                                    className="text-sm text-saas-cyan font-medium hover:opacity-80 ml-10"
                                    style={{ fontFamily: 'Inter, sans-serif' }}
                                  >
                                    View {post.comments.length - 2} more comment{post.comments.length - 2 !== 1 ? 's' : ''}
                                  </button>
                                )}
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="flex items-start space-x-2">
                              <Avatar 
                                src={user?.profilePicture}
                                name={user?.name}
                                size="sm"
                                className="ring-2 ring-saas-cyan/30"
                              />
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                                  placeholder="Add a comment..."
                                  className="flex-1 px-3 py-2 border border-saas-border bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan text-sm text-saas-text-heading placeholder-saas-text-muted"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && commentText.trim()) {
                                handleComment(post.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            disabled={!commentText.trim()}
                                  className="p-2 text-saas-cyan hover:bg-saas-cyan/10 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <PaperAirplaneIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
                    </motion.div>
              );
            })}
          </div>
        )}
          </div>

          {/* Right Sidebar - Suggestions */}
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            <Card className="p-4 sticky top-20">
              <h4 className="text-sm font-semibold text-saas-text-heading mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Add to your feed</h4>
              <div className="space-y-4">
                {[
                  { name: 'Tech Professionals', followers: '12.5k' },
                  { name: 'Career Development', followers: '8.2k' },
                  { name: 'Job Seekers Network', followers: '15.1k' },
                ].map((suggestion, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 border border-saas-border bg-white rounded-full flex items-center justify-center">
                        <span className="text-saas-cyan font-semibold text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {suggestion.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{suggestion.name}</p>
                        <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{suggestion.followers} followers</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs px-3">
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Footer Links */}
            <div className="text-xs text-saas-text-heading-secondary space-y-2 px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div className="flex flex-wrap gap-2">
                <a href="#" className="hover:text-saas-cyan transition-colors">About</a>
                <span>•</span>
                <a href="#" className="hover:text-saas-cyan transition-colors">Accessibility</a>
                <span>•</span>
                <a href="#" className="hover:text-saas-cyan transition-colors">Help Center</a>
              </div>
              <p className="text-xs text-saas-text-heading-secondary mt-4">© 2024 Job Genius</p>
            </div>
          </aside>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => !deleting && setShowDeleteConfirm(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-saas-border rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
                  <TrashIcon className="h-6 w-6 text-red-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Delete post?
                </h3>
                <p className="text-sm text-saas-text-heading-secondary mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                  This can't be undone. The post will be permanently deleted.
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 border border-saas-cyan/30 rounded-lg text-sm font-medium text-saas-text-heading hover:bg-saas-cyan/10 transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Home;
