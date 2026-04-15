import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import {
  ChatBubbleLeftIcon,
  HandThumbUpIcon,
  ShareIcon,
  BookmarkIcon,
  UserIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface Post {
  id: number;
  user_id: string;
  user_name: string;
  user_bio: string;
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

const RecruiterPosts: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  const userId = user?._id || user?.id || JSON.parse(localStorage.getItem('user') || '{}')._id || JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    loadPosts();
    if (userId) {
      loadSavedPostIds();
    }
  }, [userId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/posts/feed');
      const data = await response.json();
      if (data.success) {
        setPosts(data.data || []);
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPostIds = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/saved/${userId}`);
      const data = await response.json();
      if (data.success) {
        setSavedPostIds(data.data.map((p: Post) => p.id));
      }
    } catch (err) {
      console.error('Error loading saved posts:', err);
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
        setPosts(posts.map(post => {
          if (post.id === postId) {
            const isLiked = post.likes.includes(userId);
            return {
              ...post,
              likes: isLiked 
                ? post.likes.filter(id => id !== userId)
                : [...post.likes, userId],
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
    if (!userId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
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

  return (
    <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-saas-text-heading font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>Posts Feed</h1>
          <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Stay connected with the community and discover talent</p>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-saas-text-heading-secondary mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <SparklesIcon className="h-16 w-16 text-saas-text-heading-secondary mx-auto mb-4" />
            <p className="text-saas-text-heading text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>No posts yet</p>
            <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Be the first to share something!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      src={post.user_profile_picture}
                      name={post.user_name}
                      size="md"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{post.user_name || 'Unknown User'}</h3>
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
                <div className="flex items-center space-x-6 text-sm text-saas-text-body mb-4 border-t border-saas-cyan/20 pt-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={!userId}
                    className={`flex items-center space-x-2 hover:text-saas-cyan transition-colors ${
                      userId && post.likes.includes(userId) ? 'text-saas-cyan' : ''
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
                {userId && (
                  <div className="flex items-center space-x-4 border-t border-saas-cyan/20 pt-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-saas-cyan/10 transition-colors ${
                        post.likes.includes(userId) ? 'text-saas-cyan' : 'text-saas-text-body'
                      }`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <HandThumbUpIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Like</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-saas-cyan/10 transition-colors text-saas-text-body" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Comment</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-saas-cyan/10 transition-colors text-saas-text-body" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <ShareIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Share</span>
                    </button>
                    <button
                      onClick={() => handleSave(post.id)}
                      className={`ml-auto flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-saas-cyan/10 transition-colors ${
                        savedPostIds.includes(post.id) ? 'text-saas-cyan' : 'text-saas-text-body'
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

                {/* Comments Preview */}
                {post.comments && post.comments.length > 0 && expandedPost === post.id && (
                  <div className="mt-4 border-t border-saas-cyan/20 pt-4 space-y-3">
                    {post.comments.slice(0, 5).map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        <Avatar 
                      src={comment.user_profile_picture}
                      name={comment.user_name}
                      size="sm"
                    />
                        <div className="flex-1">
                          <div className="card-base rounded-lg p-3">
                            <p className="font-semibold text-sm text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>{comment.user_name}</p>
                            <p className="text-sm text-saas-text-heading mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{comment.content}</p>
                          </div>
                          <p className="text-xs text-saas-text-heading-secondary mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{formatTimeAgo(comment.created_at)}</p>
                        </div>
                      </div>
                    ))}
                    {post.comments.length > 5 && (
                      <p className="text-sm text-saas-cyan cursor-pointer hover:opacity-80" style={{ fontFamily: 'Inter, sans-serif' }}>
                        View all {post.comments.length} comments
                      </p>
                    )}
                  </div>
                )}

                {/* Expand Comments */}
                {post.comments && post.comments.length > 0 && expandedPost !== post.id && (
                  <button
                    onClick={() => setExpandedPost(post.id)}
                    className="mt-4 text-sm text-saas-cyan hover:opacity-80"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    View {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterPosts;

