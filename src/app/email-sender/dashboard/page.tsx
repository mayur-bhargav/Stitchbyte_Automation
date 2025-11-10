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
  LuChevronRight
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
      <div className="min-h-screen bg-transparent p-6 md:p-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Skeleton Header */}
          <div className="mb-6 animate-pulse">
            <div className="h-20 bg-white/50 backdrop-blur-sm rounded-[28px] mb-4 border border-gray-200"></div>
          </div>

          {/* Skeleton Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[140px] bg-white/50 backdrop-blur-sm rounded-[22px] animate-pulse border border-gray-200"></div>
            ))}
          </div>

          {/* Skeleton Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[220px] bg-white/50 backdrop-blur-sm rounded-[26px] animate-pulse border border-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-transparent"
      style={{
        color: 'hsl(220, 20%, 12%)'
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-7 py-6 md:py-7">
        
        {/* Header */}
        <header className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center mb-6">
          <div 
            className="flex gap-4 items-center p-4 rounded-[28px] backdrop-blur-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid hsl(220, 20%, 90%)',
              boxShadow: '0 1px 2px hsl(220, 20%, 40%, 0.1)'
            }}
          >
            <div 
              className="w-12 h-12 rounded-[14px] flex items-center justify-center"
              style={{
                background: '#2A8B8A',
                boxShadow: 'inset 0 1px 0 hsl(0, 0%, 100%, 0.25), 0 1px 2px hsl(220, 20%, 40%, 0.1)'
              }}
            >
              <LuMail size={26} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-0.5" style={{ color: 'hsl(220, 20%, 12%)' }}>
                Email Campaign Studio
              </h1>
              <div className="flex items-center gap-2.5 text-sm" style={{ color: 'hsl(220, 12%, 38%)' }}>
                <span 
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{
                    background: 'hsl(146, 64%, 50%)',
                    boxShadow: '0 0 0 4px hsl(146, 64%, 50%, 0.15)'
                  }}
                />
                <span className="font-medium">Connected as</span>
                <strong style={{ color: 'hsl(220, 20%, 12%)' }}>{emailConfig?.email}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push('/email-sender/settings')}
              className="flex items-center gap-2.5 px-4 py-3 rounded-[14px] backdrop-blur-sm font-semibold"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid hsl(220, 20%, 90%)',
                color: 'hsl(220, 20%, 12%)',
                boxShadow: '0 1px 2px hsl(220, 20%, 40%, 0.1)'
              }}
            >
              <LuSettings size={18} />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2.5 px-4 py-3 rounded-[14px] backdrop-blur-sm font-semibold"
              style={{
                background: 'hsl(220, 20%, 12%)',
                border: '1px solid hsl(220, 20%, 12%)',
                color: 'white',
                boxShadow: '0 1px 2px hsl(220, 20%, 40%, 0.1)'
              }}
            >
              <LuLogOut size={18} />
              <span className="hidden sm:inline">Disconnect</span>
            </button>
          </div>
        </header>

        {/* KPIs Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          {/* Total Sent */}
          <div 
            className="relative min-h-[140px] p-[18px] rounded-[22px] backdrop-blur-sm overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid hsl(220, 20%, 90%)',
              boxShadow: '0 2px 8px hsl(220, 20%, 40%, 0.08)'
            }}
          >
            <div className="flex justify-between items-center mb-3.5">
              <div className="text-sm font-semibold tracking-wide" style={{ color: 'hsl(220, 12%, 38%)' }}>
                Total Sent
              </div>
              <span 
                className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full"
                style={{
                  color: 'hsl(146, 64%, 40%)',
                  border: '1px solid hsl(146, 64%, 50%, 0.3)',
                  background: 'hsl(146, 64%, 50%, 0.1)'
                }}
              >
                <LuCircleCheck size={14} />
                Sent
              </span>
            </div>
            <div className="text-4xl font-extrabold tracking-tight" style={{ color: 'hsl(220, 20%, 12%)' }}>
              {stats.total_sent.toLocaleString()}
            </div>
            <div className="absolute right-3.5 bottom-3 text-xs" style={{ color: 'hsl(220, 12%, 38%)' }}>
              all-time
            </div>
            <div 
              className="absolute w-[180px] h-[180px] -right-[60px] -bottom-[60px] rounded-full rotate-[25deg] pointer-events-none"
              style={{
                background: 'radial-gradient(closest-side, hsl(210, 100%, 60%, 0.08), transparent 70%)'
              }}
            />
          </div>

          {/* Failed */}
          <div 
            className="relative min-h-[140px] p-[18px] rounded-[22px] backdrop-blur-sm overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid hsl(220, 20%, 90%)',
              boxShadow: '0 2px 8px hsl(220, 20%, 40%, 0.08)'
            }}
          >
            <div className="flex justify-between items-center mb-3.5">
              <div className="text-sm font-semibold tracking-wide" style={{ color: 'hsl(220, 12%, 38%)' }}>
                Failed
              </div>
              <span 
                className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full"
                style={{
                  color: 'hsl(350, 84%, 50%)',
                  border: '1px solid hsl(350, 84%, 60%, 0.3)',
                  background: 'hsl(350, 84%, 60%, 0.1)'
                }}
              >
                <LuCircleX size={14} />
                {stats.total_failed}
              </span>
            </div>
            <div className="text-4xl font-extrabold tracking-tight" style={{ color: 'hsl(220, 20%, 12%)' }}>
              {stats.total_failed}
            </div>
            <div className="absolute right-3.5 bottom-3 text-xs" style={{ color: 'hsl(220, 12%, 38%)' }}>
              last 30 days
            </div>
            <div 
              className="absolute w-[180px] h-[180px] -right-[60px] -bottom-[60px] rounded-full rotate-[25deg] pointer-events-none"
              style={{
                background: 'radial-gradient(closest-side, hsl(210, 100%, 60%, 0.08), transparent 70%)'
              }}
            />
          </div>

          {/* Success Rate */}
          <div 
            className="relative min-h-[140px] p-[18px] rounded-[22px] backdrop-blur-sm overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid hsl(220, 20%, 90%)',
              boxShadow: '0 2px 8px hsl(220, 20%, 40%, 0.08)'
            }}
          >
            <div className="flex justify-between items-center mb-3.5">
              <div className="text-sm font-semibold tracking-wide" style={{ color: 'hsl(220, 12%, 38%)' }}>
                Success Rate
              </div>
              <span 
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  color: 'hsl(210, 100%, 50%)',
                  border: '1px solid hsl(210, 100%, 60%, 0.3)',
                  background: 'hsl(210, 100%, 60%, 0.1)'
                }}
              >
                Excellent
              </span>
            </div>
            <div className="text-4xl font-extrabold tracking-tight" style={{ color: 'hsl(220, 20%, 12%)' }}>
              {stats.success_rate}%
            </div>
            <div className="absolute right-3.5 bottom-3 text-xs" style={{ color: 'hsl(220, 12%, 38%)' }}>
              delivery
            </div>
            <div 
              className="absolute w-[180px] h-[180px] -right-[60px] -bottom-[60px] rounded-full rotate-[25deg] pointer-events-none"
              style={{
                background: 'radial-gradient(closest-side, hsl(210, 100%, 60%, 0.08), transparent 70%)'
              }}
            />
          </div>

          {/* Campaigns */}
          <div 
            className="relative min-h-[140px] p-[18px] rounded-[22px] backdrop-blur-sm overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid hsl(220, 20%, 90%)',
              boxShadow: '0 2px 8px hsl(220, 20%, 40%, 0.08)'
            }}
          >
            <div className="flex justify-between items-center mb-3.5">
              <div className="text-sm font-semibold tracking-wide" style={{ color: 'hsl(220, 12%, 38%)' }}>
                Campaigns
              </div>
              <span 
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  color: 'hsl(264, 88%, 56%)',
                  border: '1px solid hsl(264, 88%, 66%, 0.3)',
                  background: 'hsl(264, 88%, 66%, 0.1)'
                }}
              >
                This month
              </span>
            </div>
            <div className="text-4xl font-extrabold tracking-tight" style={{ color: 'hsl(220, 20%, 12%)' }}>
              {stats.recent_campaigns}
            </div>
            <div className="absolute right-3.5 bottom-3 text-xs" style={{ color: 'hsl(220, 12%, 38%)' }}>
              active
            </div>
            <div 
              className="absolute w-[180px] h-[180px] -right-[60px] -bottom-[60px] rounded-full rotate-[25deg] pointer-events-none"
              style={{
                background: 'radial-gradient(closest-side, hsl(210, 100%, 60%, 0.08), transparent 70%)'
              }}
            />
          </div>
        </section>

        {/* Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Send Email */}
          <article 
            onClick={() => router.push('/email-sender/send')}
            className="relative backdrop-blur-sm min-h-[220px] p-[22px] rounded-[26px] overflow-hidden cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid hsl(220, 20%, 90%)',
              boxShadow: '0 2px 8px hsl(220, 20%, 40%, 0.08)'
            }}
          >
            <div 
              className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-[18px]"
              style={{
                background: '#2A8B8A',
                boxShadow: 'inset 0 1px 0 hsl(0, 0%, 100%, 0.25), 0 1px 2px hsl(220, 20%, 40%, 0.1)'
              }}
            >
              <LuSend size={26} className="text-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: 'hsl(220, 20%, 12%)' }}>
              Send Email
            </h3>
            <p style={{ color: 'hsl(220, 12%, 38%)', margin: 0 }}>
              Compose and distribute campaigns to your contacts.
            </p>
            <div 
              className="absolute right-[18px] bottom-[18px] w-10 h-10 rounded-[12px] flex items-center justify-center"
              style={{
                border: '1px solid hsl(220, 20%, 90%)',
                background: 'hsl(0, 0%, 98%)',
                color: 'hsl(220, 20%, 12%)'
              }}
            >
              <LuChevronRight size={18} />
            </div>
          </article>

          {/* Templates */}
                    {/* Templates */}
          <article 
            onClick={() => router.push('/email-sender/templates')}
            className="relative cursor-pointer backdrop-blur-sm min-h-[160px] p-[18px] rounded-[22px] overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid hsl(220, 20%, 90%)',
              boxShadow: '0 2px 8px hsl(220, 20%, 40%, 0.08)'
            }}
          >
            <div 
              className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-[18px]"
              style={{
                background: '#2A8B8A',
                boxShadow: 'inset 0 1px 0 hsl(0, 0%, 100%, 0.25), 0 1px 2px hsl(220, 20%, 40%, 0.1)'
              }}
            >
              <LuFileText size={26} className="text-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: 'hsl(220, 20%, 12%)' }}>
              Templates
            </h3>
            <p style={{ color: 'hsl(220, 12%, 38%)', margin: 0 }}>
              Create, manage, and reuse branded email templates.
            </p>
            <div 
              className="absolute right-[18px] bottom-[18px] w-10 h-10 rounded-[12px] flex items-center justify-center"
              style={{
                border: '1px solid hsl(220, 20%, 90%)',
                background: 'hsl(0, 0%, 98%)',
                color: 'hsl(220, 20%, 12%)'
              }}
            >
              <LuChevronRight size={18} />
            </div>
          </article>

          {/* Contacts */}
          <article 
            onClick={() => router.push('/email-sender/contacts')}
            className="relative cursor-pointer backdrop-blur-sm min-h-[160px] p-[18px] rounded-[22px] overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid hsl(220, 20%, 90%)',
              boxShadow: '0 2px 8px hsl(220, 20%, 40%, 0.08)'
            }}
          >
            <div 
              className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-[18px]"
              style={{
                background: '#2A8B8A',
                boxShadow: 'inset 0 1px 0 hsl(0, 0%, 100%, 0.25), 0 1px 2px hsl(220, 20%, 40%, 0.1)'
              }}
            >
              <LuUsers size={26} className="text-white" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: 'hsl(220, 20%, 12%)' }}>
              Contacts
            </h3>
            <p style={{ color: 'hsl(220, 12%, 38%)', margin: 0 }}>
              Manage your audience and import lists securely.
            </p>
            <div 
              className="absolute right-[18px] bottom-[18px] w-10 h-10 rounded-[12px] flex items-center justify-center"
              style={{
                border: '1px solid hsl(220, 20%, 90%)',
                background: 'hsl(0, 0%, 98%)',
                color: 'hsl(220, 20%, 12%)'
              }}
            >
              <LuChevronRight size={18} />
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
