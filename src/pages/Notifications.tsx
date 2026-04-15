import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import {
  BellIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  StarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

interface Notification {
  id: number;
  type: 'application' | 'interview' | 'offer' | 'profile_view' | 'job_match' | 'post_like' | 'post_comment' | 'post_share';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = user?._id || user?.id || JSON.parse(localStorage.getItem('user') || '{}')._id || JSON.parse(localStorage.getItem('user') || '{}').id;

  useEffect(() => {
    if (userId) {
      loadNotifications();
      // Mark all notifications as read when viewing the page
      markAllAsRead();
    }
  }, [userId]);

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await fetch(`http://localhost:5000/api/posts/notifications/${userId}/read-all`, {
        method: 'PUT'
      });
      // Reload notifications to update read status
      loadNotifications();
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Load applications
      const appsRes = await fetch(`http://localhost:5000/api/recruiter/applications?userId=${userId}`);
      const appsData = await appsRes.json();
      
      // Load interviews
      const interviewsRes = await fetch(`http://localhost:5000/api/recruiter/interviews?userId=${userId}`);
      const interviewsData = await interviewsRes.json();
      
      // Load offers
      const offersRes = await fetch(`http://localhost:5000/api/recruiter/offers?userId=${userId}`);
      const offersData = await offersRes.json();
      
      // Load profile views
      const scoresRes = await fetch(`http://localhost:5000/api/scores/${userId}`);
      const scoresData = await scoresRes.json();

      // Load post notifications
      const notificationsRes = await fetch(`http://localhost:5000/api/posts/notifications/${userId}`);
      let notificationsData = { success: false, data: [] };
      try {
        notificationsData = await notificationsRes.json();
      } catch (e) {
        console.log('Notifications endpoint not available yet');
      }

      const allNotifications: Notification[] = [];

      // Post notifications
      if (notificationsData.success && notificationsData.data) {
        notificationsData.data.forEach((notif: any) => {
          allNotifications.push({
            id: notif.id,
            type: notif.type as any,
            title: notif.title,
            message: notif.message,
            link: notif.link || '/home',
            read: notif.read || false,
            created_at: notif.created_at
          });
        });
      }

      // Applications
      if (appsData.success && appsData.data) {
        appsData.data.forEach((app: any) => {
          allNotifications.push({
            id: app.id,
            type: 'application',
            title: 'Application Update',
            message: `Your application for ${app.title || 'a job'} has been ${app.status}`,
            link: '/applications',
            read: false,
            created_at: app.created_at
          });
        });
      }

      // Interviews
      if (interviewsData.success && interviewsData.data) {
        interviewsData.data.forEach((interview: any) => {
          allNotifications.push({
            id: interview.id,
            type: 'interview',
            title: 'Interview Scheduled',
            message: `Interview scheduled for ${interview.title || 'a position'} on ${new Date(interview.scheduled_at).toLocaleDateString()}`,
            link: '/interviews',
            read: false,
            created_at: interview.created_at
          });
        });
      }

      // Offers
      if (offersData.success && offersData.data) {
        offersData.data.forEach((offer: any) => {
          allNotifications.push({
            id: offer.id,
            type: 'offer',
            title: 'New Offer',
            message: `You received an offer for ${offer.title || 'a position'}${offer.salary ? ` - ${offer.salary}` : ''}`,
            link: '/offers',
            read: false,
            created_at: offer.created_at
          });
        });
      }

      // Profile views
      if (scoresData.success && scoresData.data && scoresData.data.profile_views > 0) {
        allNotifications.push({
          id: 999999,
          type: 'profile_view',
          title: 'Profile Views',
          message: `Your profile has been viewed ${scoresData.data.profile_views} time${scoresData.data.profile_views !== 1 ? 's' : ''}`,
          link: '/profile',
          read: false,
          created_at: new Date().toISOString()
        });
      }

      // Sort by date (newest first)
      allNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(allNotifications);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <BriefcaseIcon className="h-5 w-5" />;
      case 'interview':
        return <AcademicCapIcon className="h-5 w-5" />;
      case 'offer':
        return <StarIcon className="h-5 w-5" />;
      case 'profile_view':
        return <EyeIcon className="h-5 w-5" />;
      case 'post_like':
        return <HandThumbUpIcon className="h-5 w-5" />;
      case 'post_comment':
        return <ChatBubbleLeftIcon className="h-5 w-5" />;
      case 'post_share':
        return <ShareIcon className="h-5 w-5" />;
      default:
        return <BellIcon className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'application':
        return 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30';
      case 'interview':
        return 'bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30';
      case 'offer':
        return 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30';
      case 'profile_view':
        return 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30';
      case 'post_like':
        return 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30';
      case 'post_comment':
        return 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30';
      case 'post_share':
        return 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30';
      default:
        return 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30';
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-saas-text-heading font-semibold mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Notifications</h1>
          <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Stay updated with your career activities</p>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22D3EE] mx-auto"></div>
            <p className="text-saas-text-heading-secondary mt-4" style={{ fontFamily: 'Inter, sans-serif' }}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <BellIcon className="h-12 w-12 text-saas-text-heading-secondary mx-auto mb-4" />
            <p className="text-saas-text-heading" style={{ fontFamily: 'Inter, sans-serif' }}>No notifications yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 hover:border-[#22D3EE]/50 transition-all ${!notification.read ? 'border-[#22D3EE]/50' : ''}`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-saas-text-heading mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{notification.title}</h3>
                        <p className="text-sm text-saas-text-heading mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{notification.message}</p>
                        <p className="text-xs text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>{formatTimeAgo(notification.created_at)}</p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-[#22D3EE] rounded-full flex-shrink-0 mt-2" style={{ boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)' }}></span>
                      )}
                    </div>
                    {notification.link && (
                      <Link
                        to={notification.link}
                        className="text-sm text-saas-cyan hover:opacity-80 font-medium mt-2 inline-block transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

