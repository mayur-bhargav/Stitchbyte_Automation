"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LuMessageCircle,
  LuMessageSquare,
  LuImage,
  LuCalendar,
  LuBot,
  LuChartBar,
  LuCircleAlert,
  LuSettings
} from "react-icons/lu";
import { buildApiUrl } from "@/config/server";

const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

interface InstagramStats {
  totalDMs: number;
  automatedReplies: number;
  commentEngagements: number;
  storyReplies: number;
  scheduledPosts: number;
  aiInteractions: number;
  responseTime: string;
  engagementRate: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  bgColor: string;
}

interface InstagramAccount {
  account_id?: string;
  instagram_account_id: string;
  username?: string;
  page_name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  status: string;
  connected_at?: string;
  token_expires_at?: string;
  days_until_expiry?: number;
  needs_attention?: boolean;
}

export default function InstagramHub() {
  const [stats, setStats] = useState<InstagramStats>({
    totalDMs: 0,
    automatedReplies: 0,
    commentEngagements: 0,
    storyReplies: 0,
    scheduledPosts: 0,
    aiInteractions: 0,
    responseTime: "0s",
    engagementRate: "0%"
  });

  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [connectingToInstagram, setConnectingToInstagram] = useState(false);

  useEffect(() => {
    fetchInstagramAccounts();
  }, []);

  const fetchInstagramAccounts = async () => {
    try {
      setLoading(true);
    const token = localStorage.getItem('token');
    const response = await fetch(buildApiUrl('/api/v1/instagram/status'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
    const data = await response.json();
    debugLog('Instagram status:', data);
        setAccounts(data.accounts || []);
        setIsConnected(Boolean(data.connected));

        if (data.accounts && data.accounts.length > 0) {
          const firstAccount = data.accounts[0];
          await fetchInstagramStats(firstAccount);
        }
      } else {
        console.error('Failed to fetch accounts:', response.status);
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error fetching Instagram accounts:", error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstagramStats = async (account: InstagramAccount) => {
    try {
    const token = localStorage.getItem('token');
    const analyticsAccountId = account.account_id || account.instagram_account_id;
      
    const response = await fetch(buildApiUrl(`/api/instagram/analytics?account_id=${analyticsAccountId}&days=30`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalDMs: data.dm_responses || 0,
          automatedReplies: data.dm_responses || 0,
          commentEngagements: data.comment_replies || 0,
          storyReplies: data.story_replies || 0,
          scheduledPosts: 0,
          aiInteractions: data.total_automations || 0,
          responseTime: "< 30s",
          engagementRate: "8.4%"
        });
      }
    } catch (error) {
      console.error("Error fetching Instagram stats:", error);
    }
  };

  const connectInstagram = async () => {
    // Check if user understands the requirement
    const message = `Before connecting:\n\n` +
      `✅ Your Instagram account MUST be converted to:\n` +
      `   • Creator Account (Recommended - Easy to set up)\n` +
      `   OR\n` +
      `   • Business Account\n\n` +
      `❌ Personal accounts will NOT work\n\n` +
      `How to convert:\n` +
      `1. Open Instagram app\n` +
      `2. Go to Settings → Account\n` +
      `3. Tap "Switch to Professional Account"\n` +
      `4. Choose "Creator" (easier, no Facebook Page needed)\n\n` +
      `✅ NO Facebook Page required!\n\n` +
      `Continue to connect?`;
    
    if (!confirm(message)) {
      return;
    }
    
    setConnectingToInstagram(true);

    let redirected = false;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(buildApiUrl('/api/v1/instagram/connect-url'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Failed to get Instagram connect URL', response.status);
        alert('Unable to start Instagram connection. Please try again.');
        return;
      }

      const data = await response.json();
      debugLog('Instagram connect payload:', data);

      // Redirect user to Meta OAuth dialog handled by backend
      window.location.href = data.connectUrl;
      redirected = true;
    } catch (error) {
      console.error('Error initiating Instagram connect flow:', error);
      alert('Unable to start Instagram connection. Please try again.');
    } finally {
      if (!redirected) {
        setConnectingToInstagram(false);
      }
    }
  };

  const disconnectInstagram = async (account: InstagramAccount) => {
    if (!confirm('Are you sure you want to disconnect this Instagram account?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
  const response = await fetch(buildApiUrl('/api/v1/instagram/disconnect'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: account.account_id,
          instagram_account_id: account.instagram_account_id
        })
      });
      
      if (response.ok) {
        await fetchInstagramAccounts();
      } else {
        alert('Failed to disconnect Instagram account');
      }
    } catch (error) {
      console.error("Error disconnecting Instagram:", error);
      alert('Failed to disconnect Instagram account');
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: "DM Automation",
      description: "Auto-reply to DMs with AI-powered responses",
      icon: <LuMessageCircle size={24} />,
      href: "/instagram/dm-automation",
      color: "text-[#2A8B8A]",
      bgColor: "bg-white"
    },
    {
      title: "Comment Automation",
      description: "Engage with comments automatically",
      icon: <LuMessageSquare size={24} />,
      href: "/instagram/comments",
      color: "text-[#2A8B8A]",
      bgColor: "bg-white"
    },
    {
      title: "Story Replies",
      description: "Auto-respond to story interactions",
      icon: <LuImage size={24} />,
      href: "/instagram/stories",
      color: "text-[#2A8B8A]",
      bgColor: "bg-white"
    },
    {
      title: "Post Scheduler",
      description: "Schedule posts with AI assistance",
      icon: <LuCalendar size={24} />,
      href: "/instagram/scheduler",
      color: "text-[#2A8B8A]",
      bgColor: "bg-white"
    },
    {
      title: "AI Reply Engine",
      description: "Train AI on your brand voice",
      icon: <LuBot size={24} />,
      href: "/instagram/ai-engine",
      color: "text-[#2A8B8A]",
      bgColor: "bg-white"
    },
    {
      title: "Analytics",
      description: "Track performance and insights",
      icon: <LuChartBar size={24} />,
      href: "/instagram/analytics",
      color: "text-[#2A8B8A]",
      bgColor: "bg-white"
    },
    {
      title: "Settings",
      description: "Configure automation preferences",
      icon: <LuSettings size={24} />,
      href: "/instagram/settings",
      color: "text-[#2A8B8A]",
      bgColor: "bg-white"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-black">Instagram Connection</h2>
          <p className="text-sm text-slate-600 mt-1">
            Connect your Instagram Business account to enable DM automation, analytics, and more.
          </p>
        </div>
        <button
          onClick={connectInstagram}
          disabled={connectingToInstagram}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2A8B8A] text-white font-semibold hover:bg-[#238080] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {connectingToInstagram ? 'Opening Instagram...' : isConnected ? 'Reconnect Account' : 'Connect Instagram'}
        </button>
      </div>

      {isConnected && accounts.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-black mb-4">Connected Accounts</h2>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.instagram_account_id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  {account.profile_picture_url ? (
                    <img
                      src={account.profile_picture_url}
                      alt={account.username || account.page_name || 'Instagram account'}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2A8B8A] flex items-center justify-center text-white font-bold">
                      {(account.username || account.page_name || 'IG').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-black">
                      @{account.username || account.page_name || account.instagram_account_id}
                    </p>
                    <p className="text-sm text-slate-600">
                      {account.followers_count ? account.followers_count.toLocaleString() : 0} followers
                    </p>
                    {account.token_expires_at && (
                      <p className="text-xs text-slate-500">
                        Token expires {new Date(account.token_expires_at).toLocaleDateString()}
                      </p>
                    )}
                    {account.needs_attention && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <LuCircleAlert size={14} />
                        Action required
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => disconnectInstagram(account)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-black mb-4">Instagram Hub</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="group relative rounded-xl border border-slate-200 bg-white p-6 transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className={`${action.bgColor} ${action.color} mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110`}>
                {action.icon}
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">{action.title}</h3>
              <p className="text-sm text-slate-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
