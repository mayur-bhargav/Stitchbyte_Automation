'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LuMail, 
  LuSend, 
  LuFileText, 
  LuUsers, 
  LuTrendingUp,
  LuCircleCheck,
  LuCircleX,
  LuClock,
  LuSettings,
  LuLogOut,
  LuArrowRight,
  LuPlus
} from 'react-icons/lu';
import { apiService } from '../../services/apiService';

interface EmailStats {
  total_sent: number;
  total_failed: number;
  success_rate: number;
  recent_campaigns: number;
}

interface RecentActivity {
  id: string;
  subject: string;
  recipients_count: number;
  success_count: number;
  failed_count: number;
  sent_at: string;
  status: 'success' | 'partial' | 'failed';
}

export default function EmailDashboard() {
  const router = useRouter();
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [stats, setStats] = useState<EmailStats>({
    total_sent: 0,
    total_failed: 0,
    success_rate: 0,
    recent_campaigns: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkEmailConfig();
  }, []);

  const checkEmailConfig = async () => {
    try {
      const response = await apiService.get('/api/email/config');
      if (response.configured && response.is_verified) {
        setEmailConfig(response);
        // Fetch real statistics from backend
        await fetchEmailStats();
      } else {
        router.push('/email-sender');
      }
    } catch (error) {
      console.error('Failed to check email config:', error);
      router.push('/email-sender');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmailStats = async () => {
    try {
      const statsData = await apiService.get('/api/email/stats');
      setStats({
        total_sent: statsData.total_sent || 0,
        total_failed: statsData.total_failed || 0,
        success_rate: statsData.success_rate || 0,
        recent_campaigns: statsData.recent_campaigns || 0
      });

      // Note: Recent activity endpoint will be implemented later
      // For now, we show empty state
      setRecentActivity([]);
      
      // Uncomment when backend endpoint is ready:
      /*
      try {
        const activityData = await apiService.getOptional('/api/email/recent-activity');
        if (activityData && Array.isArray(activityData.activities)) {
          setRecentActivity(activityData.activities.slice(0, 5));
        } else if (activityData && Array.isArray(activityData)) {
          setRecentActivity(activityData.slice(0, 5));
        }
      } catch (activityError) {
        setRecentActivity([]);
      }
      */
    } catch (error) {
      console.error('Failed to fetch email stats:', error);
      setStats({
        total_sent: 0,
        total_failed: 0,
        success_rate: 0,
        recent_campaigns: 0
      });
      setRecentActivity([]);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiService.delete('/api/email/config');
      router.push('/email-sender');
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'success':
        return { Icon: LuCircleCheck, bgColor: 'bg-green-100', iconColor: 'text-green-600' };
      case 'partial':
        return { Icon: LuClock, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' };
      case 'failed':
        return { Icon: LuCircleX, bgColor: 'bg-red-100', iconColor: 'text-red-600' };
      default:
        return { Icon: LuCircleCheck, bgColor: 'bg-green-100', iconColor: 'text-green-600' };
    }
  };

  const getSuccessRateColor = (successRate: number) => {
    if (successRate >= 90) return 'text-green-600';
    if (successRate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        {/* Skeleton Header */}
        <div className="mb-8 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg w-64 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-96"></div>
        </div>

        {/* Skeleton Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl">
                <LuMail size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Email Campaign Studio
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <p className="text-sm text-gray-600">
                    Connected as <span className="font-semibold text-gray-900">{emailConfig?.email}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/email-sender/settings')}
                className="p-4 bg-white/80 hover:bg-white rounded-2xl transition-all duration-200 backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl"
              >
                <LuSettings size={22} className="text-gray-900" />
              </button>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white hover:bg-gray-800 rounded-2xl transition-all duration-200 font-bold shadow-xl"
              >
                <LuLogOut size={20} />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Total Sent */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <LuCircleCheck size={24} className="text-green-600" />
              </div>
              {stats.total_sent > 0 && (
                <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  ✓ Sent
                </span>
              )}
            </div>
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-1">
              Total Sent
            </h3>
            <p className="text-3xl font-black text-gray-900">{stats.total_sent.toLocaleString()}</p>
          </div>

          {/* Failed */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <LuCircleX size={24} className="text-red-600" />
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                {stats.total_failed}
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-1">
              Failed
            </h3>
            <p className="text-3xl font-black text-gray-900">{stats.total_failed}</p>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <LuTrendingUp size={24} className="text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                Excellent
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-1">
              Success Rate
            </h3>
            <p className="text-3xl font-black text-gray-900">{stats.success_rate}%</p>
          </div>

          {/* Recent Campaigns */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <LuClock size={24} className="text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                This month
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-1">
              Campaigns
            </h3>
            <p className="text-3xl font-black text-gray-900">{stats.recent_campaigns}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Send Email */}
          <button
            onClick={() => router.push('/email-sender/send')}
            className="group bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <LuSend size={32} className="text-white" />
              </div>
              <LuArrowRight size={24} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Send Email</h3>
            <p className="text-gray-300 text-sm">
              Compose and send emails to your contacts
            </p>
          </button>

          {/* Manage Templates */}
          <button
            onClick={() => router.push('/email-sender/templates')}
            className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <LuFileText size={32} className="text-gray-900" />
              </div>
              <LuArrowRight size={24} className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Templates</h3>
            <p className="text-gray-600 text-sm">
              Create and manage email templates
            </p>
          </button>

          {/* Manage Contacts */}
          <button
            onClick={() => router.push('/contacts')}
            className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <LuUsers size={32} className="text-gray-900" />
              </div>
              <LuArrowRight size={24} className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Contacts</h3>
            <p className="text-gray-600 text-sm">
              Manage your contact list
            </p>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            <button 
              onClick={() => router.push('/email-sender/history')}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => {
                const successRate = activity.recipients_count > 0 
                  ? Math.round((activity.success_count / activity.recipients_count) * 100)
                  : 0;
                const { Icon, bgColor, iconColor } = getActivityIcon(activity.status);

                return (
                  <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon size={20} className={iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">
                        {activity.subject || 'Email Campaign'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {activity.recipients_count} recipient{activity.recipients_count !== 1 ? 's' : ''} • {getTimeAgo(activity.sent_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${getSuccessRateColor(successRate)}`}>
                        {successRate}% success
                      </p>
                      {activity.failed_count > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.failed_count} failed
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LuMail size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Start sending emails to see your campaign history here
                </p>
                <button
                  onClick={() => router.push('/email-sender/send')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all"
                >
                  <LuPlus size={20} />
                  Send Your First Email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
