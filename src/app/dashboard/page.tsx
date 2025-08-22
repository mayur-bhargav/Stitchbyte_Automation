"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import { apiService } from "../services/apiService";
import { 
  LuMessageSquare, 
  LuUsers, 
  LuFileText, 
  LuZap, 
  LuRocket, 
  LuMessageCircle,
  LuSparkles,
  LuPartyPopper,
  LuPhoneCall,
  LuLink2,
  LuUpload,
  LuImage,
  LuUser,
  LuTag,
  LuInfo,
  LuSave,
  LuMoon,
  LuSun
} from "react-icons/lu";

// UI helpers
import React, { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={
        // Modern glassmorphism design with consistent brand styling
        "relative rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-xl dark:bg-slate-900/60 dark:border-slate-800/60"
      }
   >
      <div
        className={`rounded-2xl ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

type SectionTitleProps = {
  children: ReactNode;
  sub?: string;
};

function SectionTitle({ children, sub }: SectionTitleProps) {
  return (
    <div className="mb-4">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 tracking-tight">{children}</h3>
  {sub && <p className="text-xs text-gray-900 dark:text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

type ChipProps = {
  color?: "emerald" | "red" | "blue" | "gray" | "violet" | "teal";
  children: ReactNode;
};

function Chip({ color = "emerald", children }: ChipProps) {
  const palette = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/60",
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800/60",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60",
    gray: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700",
    violet: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-800/60",
    teal: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-200 dark:border-teal-800/60",
  } as const;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${palette[color]}`}>{children}</span>
  );
}

type QuickActionsButtonProps = {
  router: ReturnType<typeof useRouter>;
};

// Quick Actions Button Component
function QuickActionsButton({ router }: QuickActionsButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions = [
    {
      title: "Send Message",
      route: "/send-message",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      color: "bg-teal-500 hover:bg-teal-600"
    },
    {
      title: "Templates",
      route: "/templates",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Contacts",
      route: "/contacts",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "bg-emerald-500 hover:bg-emerald-600"
    },
    {
      title: "Live Chat",
      route: "/chats",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Campaigns",
      route: "/campaigns",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
        </svg>
      ),
      color: "bg-red-500 hover:bg-red-600"
    },
    {
      title: "Automations",
      route: "/automations",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      title: "Broadcasts",
      route: "/broadcasts",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6" />
        </svg>
      ),
      color: "bg-pink-500 hover:bg-pink-600"
    },
    {
      title: "Analytics",
      route: "/analytics",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "bg-indigo-500 hover:bg-indigo-600"
    }
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.quick-actions-container')) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <div className="fixed bottom-6 right-6 z-50 quick-actions-container">
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 min-w-[300px] animate-in slide-in-from-bottom-5 duration-300">
          <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b">
            <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-purple-500 rounded-full flex items-center justify-center shadow ring-2 ring-white/70">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <div key={index} className="relative group">
                <button
                  onClick={() => {
                    router.push(action.route);
                    setIsExpanded(false);
                  }}
                  className={`w-full ${action.color} text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center gap-2 transform hover:scale-[1.03]`}
                >
                  {action.icon}
                  <span className="text-xs font-medium">{action.title}</span>
                </button>
                
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white text-slate-900 border border-slate-200 shadow-sm text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {action.title}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                </div>
              </div>
            ))}
          </div>
          </GlassCard>
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white rounded-full shadow-[0_10px_30px_rgba(99,102,241,0.35)] ring-2 ring-white/70 hover:shadow-[0_12px_38px_rgba(99,102,241,0.45)] transition-all duration-300 flex items-center justify-center transform ${isExpanded ? 'rotate-45 scale-110' : 'hover:scale-110'}`}
        title="Quick Actions"
      >
        {isExpanded ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { user, hasValidSubscription, isLoading } = useUser();
  const router = useRouter();
  
  // Force theme state to start light and sync properly
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState({
    whatsappProfile: null,
    messageUsage: null,
    businessVerification: null,
    phoneStatus: null,
    campaigns: null,
    broadcasts: null,
    chatContacts: null,
    recentLogs: null,
    metaPaymentMethods: null,
    stats: {
      messagesSent: 0,
      contacts: 0,
      templates: 0,
      automations: 0,
      activeCampaigns: 0,
      broadcasts: 0,
      chatConversations: 0
    },
    isLoading: true
  });

  // Separate balance state for the current logged-in user
  const [userBalance, setUserBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  // WhatsApp Profile editing state
  const [wpName, setWpName] = useState("");
  const [wpCategory, setWpCategory] = useState("");
  const [wpAbout, setWpAbout] = useState("");
  const [wpPhotoFile, setWpPhotoFile] = useState<File | null>(null);
  const [wpPhotoPreview, setWpPhotoPreview] = useState("");
  const [wpSaving, setWpSaving] = useState(false);
  const [wpMsg, setWpMsg] = useState<string | null>(null);

  // Fetch user balance specifically for the logged-in user
  const fetchUserBalance = async () => {
    const userId = (user as any)?.user_id || (user as any)?.id;
    if (!userId) {
      return;
    }
    
    try {
      setIsBalanceLoading(true);
      // Helper to normalize different response shapes
      const extract = (res: any): number => {
        if (res == null) return NaN;
        if (typeof res === 'number') return res;
        if (typeof res.balance === 'number') return res.balance;
        if (typeof res.new_balance === 'number') return res.new_balance;
        if (res.data) {
          if (typeof res.data.balance === 'number') return res.data.balance;
          if (typeof res.data.new_balance === 'number') return res.data.new_balance;
          if (res.data.wallet && typeof res.data.wallet.balance === 'number') return res.data.wallet.balance;
        }
        return NaN;
      };

      const tryEndpoints = async (): Promise<number> => {
        const endpoints = [
          `/user/balance/${userId}`,
          `/wallet/balance`,
          `/balance`,
          `/users/${userId}/balance`,
        ];
        for (const ep of endpoints) {
          try {
            const res = await apiService.getOptional(ep);
            if (res) {
              const value = extract(res);
              if (!Number.isNaN(value)) return value;
            }
          } catch {}
        }
        return typeof (user as any)?.wallet?.balance === 'number' ? (user as any).wallet.balance : 0;
      };

      const value = await tryEndpoints();
      setUserBalance(value);
    } catch (error) {
      // Fallback to user context balance if API fails
      setUserBalance(typeof (user as any)?.wallet?.balance === 'number' ? (user as any).wallet.balance : 0);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Fetch comprehensive dashboard data
  const fetchDashboardData = async () => {
    try {
      console.log('Dashboard: Fetching data...');
      setDashboardData(prev => ({ ...prev, isLoading: true }));
      
      const [
        profileResponse,
        usageResponse,
        verificationResponse,
        phoneStatusResponse,
        contactsResponse,
        templatesResponse,
        automationsResponse,
        campaignsResponse,
        campaignStatsResponse,
        broadcastsResponse,
        chatContactsResponse,
        logsResponse,
        metaPaymentResponse
      ] = await Promise.allSettled([
        apiService.getOptional('/business-profile'),
        apiService.getOptional('/message-usage'),
        apiService.getOptional('/business-verification-status'),
        apiService.getOptional('/phone-number-status'),
        apiService.getOptional('/contacts'),
        apiService.getOptional('/templates'),
        apiService.getOptional('/automations'),
        apiService.getOptional('/campaigns'),
        apiService.getOptional('/campaigns/stats'),
        apiService.getOptional('/broadcasts'),
        apiService.getOptional('/chat/contacts'),
        apiService.getOptional('/logs'),
        apiService.getOptional('/meta-payment-methods')
      ]);

      // Log which endpoints failed for debugging
      const endpoints = [
        'business-profile', 'message-usage', 'business-verification-status', 
        'phone-number-status', 'contacts', 'templates', 'automations', 
        'campaigns', 'campaigns/stats', 'broadcasts', 'chat/contacts', 
        'logs', 'meta-payment-methods'
      ];
      const responses = [
        profileResponse, usageResponse, verificationResponse, phoneStatusResponse,
        contactsResponse, templatesResponse, automationsResponse, campaignsResponse,
        campaignStatsResponse, broadcastsResponse, chatContactsResponse, logsResponse,
        metaPaymentResponse
      ];

      responses.forEach((response, index) => {
        if (response.status === 'rejected') {
          console.warn(`Dashboard: ${endpoints[index]} endpoint failed:`, response.reason);
        }
      });

      // Only update state for successful responses to avoid errors
      const safeSetData = (key: string, response: any) => {
        if (response.status === 'fulfilled' && response.value) {
          return response.value;
        }
        return null;
      };

      setDashboardData(prev => ({
        ...prev,
        whatsappProfile: safeSetData('business-profile', profileResponse),
        messageUsage: safeSetData('message-usage', usageResponse),
        businessVerification: safeSetData('business-verification-status', verificationResponse),
        phoneStatus: safeSetData('phone-number-status', phoneStatusResponse),
        campaigns: safeSetData('campaigns', campaignsResponse),
        broadcasts: safeSetData('broadcasts', broadcastsResponse),
        chatContacts: safeSetData('chat/contacts', chatContactsResponse),
        recentLogs: safeSetData('logs', logsResponse),
        metaPaymentMethods: safeSetData('meta-payment-methods', metaPaymentResponse),
        stats: {
          messagesSent: safeSetData('message-usage', usageResponse)?.messages_sent_today || 0,
          contacts: safeSetData('contacts', contactsResponse)?.contacts?.length || 0,
          templates: safeSetData('templates', templatesResponse)?.templates?.length || 0,
          automations: safeSetData('automations', automationsResponse)?.length || 0,
          activeCampaigns: safeSetData('campaigns', campaignsResponse)?.campaigns?.filter(c => c.status === 'active').length || 0,
          broadcasts: broadcastsResponse.status === 'fulfilled' ? (broadcastsResponse.value?.broadcasts?.length || 0) : 0,
          chatConversations: chatContactsResponse.status === 'fulfilled' ? (chatContactsResponse.value?.contacts?.length || 0) : 0
        },
        isLoading: false
      }));
      console.log('Dashboard: Data fetch completed');
    } catch (error) {
      console.error('Dashboard: Data fetch error:', error);
      setDashboardData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Sync profile form when profile data loads
  useEffect(() => {
    const p: any = dashboardData?.whatsappProfile || null;
    if (p) {
      setWpName(p.business_name || p.name || "");
      setWpCategory(p.category || "");
      setWpAbout(p.about || p.bio || "");
      setWpPhotoPreview(p.profile_picture_url || p.photo_url || "");
    }
  }, [dashboardData?.whatsappProfile]);

  const connectWhatsApp = async () => {
    try {
      setWpMsg(null);
      // Expect backend to return { url } for Meta connection flow
      const res: any = await apiService.post?.('/whatsapp/connect', {});
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      // Fallback route if backend returns success without URL
      if (res?.success) {
        router.push('/settings');
        return;
      }
      setWpMsg("Unable to start WhatsApp connection. Please try again.");
  } catch (e: any) {
      setWpMsg(e?.message || 'Failed to start connection.');
    }
  };

  const saveWhatsAppProfile = async () => {
    setWpSaving(true);
    setWpMsg(null);
    try {
      // Update name/category/about first
      const payload: any = { name: wpName, category: wpCategory, about: wpAbout };
      try {
        await (apiService.put?.('/business-profile/update', payload) || apiService.post?.('/business-profile/update', payload));
      } catch (err) {
        // Some backends might accept POST /business-profile
        await apiService.post('/business-profile', payload);
      }

      // Upload photo if provided
      if (wpPhotoFile) {
        const fd = new FormData();
        fd.append('photo', wpPhotoFile);
        // Rely on apiService to handle FormData without forcing JSON headers
        await (apiService.post?.('/business-profile/photo', fd) || apiService.put?.('/business-profile/photo', fd));
      }

      setWpMsg('Profile updated successfully.');
      await fetchDashboardData();
  } catch (e: any) {
      setWpMsg(e?.message || 'Failed to update profile.');
    } finally {
      setWpSaving(false);
    }
  };

  const onPhotoChange = (file: File | null) => {
    setWpPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setWpPhotoPreview(String(reader.result));
      reader.readAsDataURL(file);
    } else {
      setWpPhotoPreview("");
    }
  };

  useEffect(() => {
    // Temporarily always fetch data for testing
    console.log('Dashboard: Starting data fetch (bypass subscription check)...');
    fetchDashboardData();
    fetchUserBalance(); // Fetch balance for the logged-in user
  }, []);

  // Aggressive theme synchronization - force correct theme
  useEffect(() => {
    const initTheme = () => {
      try {
        // Get saved theme
        const savedTheme = localStorage.getItem('theme');
        
        // Determine correct theme
        const correctTheme = savedTheme === 'dark' ? 'dark' : 'light';
        
        // Force apply to HTML
        if (correctTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Update state
        setTheme(correctTheme);
      } catch (error) {
        setTheme('light');
      }
    };
    
    // Run immediately
    initTheme();
  }, []);

  // Listen for theme changes from other components
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      const newTheme = e?.detail?.theme;
      
      if (newTheme === 'light' || newTheme === 'dark') {
        setTheme(newTheme);
        
        // Force apply to HTML again
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  useEffect(() => {
    console.log('Dashboard: User loading state:', isLoading);
    console.log('Dashboard: Has valid subscription:', hasValidSubscription);
    console.log('Dashboard: User:', user ? 'Authenticated' : 'Not authenticated');
    
    if (!isLoading) {
      if (!hasValidSubscription) {
        console.log('Dashboard: Redirecting to select-plan');
        // Temporarily disable redirect for testing
        // router.push('/select-plan');
      }
    }
  }, [hasValidSubscription, isLoading, router]);

  // Temporarily disable subscription check for testing
  if (isLoading || dashboardData.isLoading) {
    return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2A8B8A] mx-auto"></div>
      <p className="text-gray-600 dark:text-slate-300 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Temporarily comment out subscription check
  /*
  if (!hasValidSubscription) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-10 w-[28rem] h-[28rem] bg-gradient-to-br from-teal-300/40 to-purple-300/30 rounded-full blur-3xl dark:opacity-40" />
          <div className="absolute -bottom-16 -right-10 w-[30rem] h-[30rem] bg-gradient-to-tl from-violet-300/40 to-rose-300/30 rounded-full blur-3xl dark:opacity-40" />
        </div>
        <GlassCard className="p-10 max-w-lg w-[92vw]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Subscription Required</h1>
            <p className="text-gray-600 dark:text-slate-300 mb-6">Please select a plan to access the dashboard.</p>
            <button
              onClick={() => router.push('/select-plan')}
              className="bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition"
            >
              Select Plan
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }
  */

  return (
  <div className="min-h-screen relative overflow-hidden !text-slate-900 dark:!text-slate-100" style={{ backgroundColor: '#F4F8FD' }}>
      {/* Background simplified: remove ambient blobs for a cleaner, focused layout */}
      <div className="relative p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
  {/* Header */}
  <GlassCard className="p-7">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-sm text-slate-900 dark:text-slate-300 mt-1">
          Manage WhatsApp automation, campaigns, and chats from one place.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => router.push('/send-message')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 shadow-lg"
          >
            <LuMessageSquare /> Send Message
          </button>
          <button
            onClick={() => router.push('/campaigns')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent text-gray-900 border border-gray-300 hover:bg-gray-50 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-800/40 transition-all duration-200"
          >
            <LuRocket /> Create Campaign
          </button>
        </div>
      </div>

      <div className="flex items-start gap-5">
        {/* Connection status */}
        <div className="min-w-[240px]">
          {dashboardData.whatsappProfile?.connected ? (
            <div>
              <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> WhatsApp Connected
              </div>
              <div className="mt-2 text-xs text-slate-900 dark:text-emerald-300 space-y-1">
                <div><span className="font-medium">Business:</span> {dashboardData.whatsappProfile.business_name || dashboardData.whatsappProfile.name || 'Business Account'}</div>
                {dashboardData.whatsappProfile.phone && (
                  <div><span className="font-medium">Phone:</span> {dashboardData.whatsappProfile.phone}</div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-2 !text-slate-900 dark:text-red-300 text-sm font-semibold">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> WhatsApp Not Connected
              </div>
              <div className="mt-2 text-xs !text-slate-900 dark:text-red-300 font-medium">Configure WhatsApp Business API to start messaging</div>
              <button onClick={connectWhatsApp} className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 text-xs shadow-lg">
                <LuLink2 /> Connect WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Plan and balance */}
        <div className="text-right">
          <div className="text-xs text-slate-900 dark:text-slate-400">Current Plan</div>
          <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full text-sm font-semibold bg-[#2A8B8A]/10 border border-[#2A8B8A]/30 text-[#2A8B8A] dark:bg-[#2A8B8A]/20 dark:border-[#2A8B8A]/40 dark:text-[#2A8B8A]">
            {user?.subscription?.plan_name || 'Free Trial'}
          </div>
          {!isBalanceLoading && (
            <div className="mt-2 text-sm text-gray-900 dark:text-slate-300">
              Balance: <span className="font-bold text-[#2A8B8A] dark:text-[#2A8B8A]">₹{userBalance.toFixed(2)}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                if (newTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                localStorage.setItem('theme', newTheme);
                setTheme(newTheme);
                window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
              }}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 hover:border-[#2A8B8A] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#2A8B8A] transition-all duration-200"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <LuSun className="text-amber-400" /> : <LuMoon className="text-slate-700" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  </GlassCard>

        {/* Low Balance Alert */}
        {!isBalanceLoading && userBalance < 50 && (
          <GlassCard className="p-6 border-red-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold">Low Balance Alert</h3>
                <p className="text-red-700 text-sm">Balance: ₹{userBalance.toFixed(2)}. Add funds to continue sending messages.</p>
              </div>
              <button
                onClick={() => router.push('/billing')}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-200"
              >
                Add Funds
              </button>
            </div>
          </GlassCard>
        )}

        {/* WhatsApp Profile Management */}
        <GlassCard className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 min-w-[280px]">
              <SectionTitle>{dashboardData.whatsappProfile?.connected ? 'WhatsApp Business Profile' : 'Connect WhatsApp Business'}</SectionTitle>
              {!dashboardData.whatsappProfile?.connected ? (
                <div>
                  <p className="text-sm text-gray-900 dark:text-slate-300 mb-4">Connect your WhatsApp Business account to manage your profile and send messages.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2 !bg-white !text-slate-900 dark:bg-slate-800/60 dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2">
                      <LuPhoneCall className="text-teal-600" />
                      <span>Verify phone</span>
                    </div>
                    <div className="flex items-center gap-2 !bg-white !text-slate-900 dark:bg-slate-800/60 dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2">
                      <LuLink2 className="text-purple-600" />
                      <span>Authorize Meta</span>
                    </div>
                    <div className="flex items-center gap-2 !bg-white !text-slate-900 dark:bg-slate-800/60 dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2">
                      <LuInfo className="text-indigo-600" />
                      <span>Grant permissions</span>
                    </div>
                  </div>
                  <button onClick={connectWhatsApp} className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-200">
                    Connect WhatsApp
                  </button>
                  {wpMsg && <p className="text-sm mt-3 text-red-600">{wpMsg}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white/80">
                        {wpPhotoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={wpPhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-400">
                            <LuImage className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-teal-700 dark:text-teal-300">
                      <LuUpload />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><LuUser /> Name</label>
                      <input value={wpName} onChange={(e) => setWpName(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] transition-all duration-200" placeholder="Business name" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><LuTag /> Category</label>
                      <select value={wpCategory} onChange={(e) => setWpCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] transition-all duration-200">
                        <option value="">Select category</option>
                        <option>Automotive</option>
                        <option>Beauty</option>
                        <option>Clothing & Apparel</option>
                        <option>Education</option>
                        <option>Entertainment</option>
                        <option>Finance</option>
                        <option>Food & Grocery</option>
                        <option>Home Services</option>
                        <option>Medical & Health</option>
                        <option>Nonprofit</option>
                        <option>Professional Services</option>
                        <option>Travel & Hospitality</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><LuInfo /> About/Bio</label>
                      <input value={wpAbout} onChange={(e) => setWpAbout(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Short bio" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button disabled={wpSaving} onClick={saveWhatsAppProfile} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg disabled:opacity-60 transition-all duration-200">
                      <LuSave /> {wpSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                    {wpMsg && <span className="text-sm text-gray-900 dark:text-slate-300">{wpMsg}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Getting Started checklist */}
        <GlassCard className="p-6">
          <SectionTitle>Getting Started</SectionTitle>
          <div className="flex items-center gap-6">
            {[
              { title: "WhatsApp Connected", completed: dashboardData.whatsappProfile?.connected === true },
              { title: "Templates Created", completed: dashboardData.stats.templates > 0 },
              { title: "Contacts Added", completed: dashboardData.stats.contacts > 0 },
              { title: "First Campaign", completed: dashboardData.stats.messagesSent > 0 }
            ].map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-inner ${
                  step.completed ? 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-300/60' : 'bg-gray-100 text-gray-400 ring-1 ring-gray-200'
                }`}>
                  {step.completed ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                <span className={`text-sm ${step.completed ? 'text-emerald-600' : 'text-gray-900 dark:text-slate-300'}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Essential Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Messages Today", value: dashboardData.stats.messagesSent, icon: <LuMessageSquare className="w-6 h-6 text-indigo-600" /> },
            { label: "Contacts", value: dashboardData.stats.contacts, icon: <LuUsers className="w-6 h-6 text-emerald-600" /> },
            { label: "Templates", value: dashboardData.stats.templates, icon: <LuFileText className="w-6 h-6 text-purple-600" /> },
            { label: "Automations", value: dashboardData.stats.automations, icon: <LuZap className="w-6 h-6 text-amber-500" /> },
            { label: "Campaigns", value: dashboardData.stats.activeCampaigns, icon: <LuRocket className="w-6 h-6 text-rose-600" /> },
            { label: "Live Chats", value: dashboardData.stats.chatConversations, icon: <LuMessageCircle className="w-6 h-6 text-[#2A8B8A]" /> }
          ].map((stat, index) => (
            <GlassCard key={index} className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full !bg-white !text-slate-900 border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
                  {stat.icon}
                </span>
              </div>
              <div className="text-2xl font-extrabold tracking-tight !text-slate-900 dark:text-slate-100">{stat.value.toLocaleString()}</div>
              <div className="text-xs !text-slate-900 dark:text-slate-400">{stat.label}</div>
            </GlassCard>
          ))}
        </div>

         {/* Message Usage and Balance */}
        {(() => {
          const showUsage = Boolean(dashboardData.messageUsage);
          const showBalance = !isBalanceLoading;
          if (!showUsage && !showBalance) return null;
          const gridCols = showUsage && showBalance ? 'lg:grid-cols-2' : 'lg:grid-cols-1';
          return (
          <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
            {/* Message Usage */}
            {showUsage && (
              <GlassCard className="p-6">
                <SectionTitle>Message Usage Today</SectionTitle>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-900 dark:text-slate-300">Messages Sent</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-slate-100">
                    {dashboardData.messageUsage.messages_sent_today || 0} / {(dashboardData.messageUsage.daily_limit || 1000).toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-gradient-to-r from-gray-200 to-gray-100 dark:from-slate-700 dark:to-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${Math.min(100, (dashboardData.messageUsage.percentage_used || 0))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-900 dark:text-slate-400">
                  <span>{dashboardData.messageUsage.remaining || 0} remaining</span>
                  <span>Resets at midnight</span>
                </div>
              </GlassCard>
            )}

            {/* Account Balance */}
            {showBalance && (
              <GlassCard className="p-6">
                <SectionTitle>Account Balance</SectionTitle>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">₹{userBalance.toFixed(2)}</div>
                  <div className="text-sm text-slate-900 dark:text-slate-300 mb-4">Available Balance</div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="!bg-white dark:bg-slate-800/60 rounded-xl p-2 border border-slate-200 dark:border-white/10">
                      <div className="text-slate-900 dark:text-slate-400">Cost/Message</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">₹1.70</div>
                    </div> 
                    <div className="!bg-white dark:bg-slate-800/60 rounded-xl p-2 border border-slate-200 dark:border-white/10">
                      <div className="text-slate-900 dark:text-slate-400">Messages Available</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{Math.floor(userBalance / 1.70)}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/billing')}
                    className="w-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-200"
                  >
                    Add Balance
                  </button>
                </div>
              </GlassCard>
            )}
          </div>
          );
        })()}

        {/* Main Content Area */}
        {(() => {
          const hasActiveCampaigns = Boolean(dashboardData.campaigns?.campaigns && dashboardData.campaigns.campaigns.length > 0);
          const hasRecentChats = Boolean(dashboardData.chatContacts?.contacts && dashboardData.chatContacts.contacts.length > 0);
          const hasLeftContent = hasActiveCampaigns || hasRecentChats;
          const gridCols = hasLeftContent ? 'xl:grid-cols-3' : 'xl:grid-cols-1';
          return (
        <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
          {/* Recent Activity */}
          {hasLeftContent && (
          <div className="xl:col-span-2 space-y-6">
            {/* Active Campaigns */}
            {hasActiveCampaigns && (
              <GlassCard className="p-6">
                <SectionTitle>Active Campaigns</SectionTitle>
                <div className="space-y-3">
      {dashboardData.campaigns.campaigns.filter(c => c.status === 'active').slice(0, 3).map((campaign, index) => (
    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <div>
              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{campaign.name}</div>
              <div className="text-xs text-slate-900 dark:text-slate-400">{campaign.recipients?.length || 0} recipients</div>
                        </div>
                      </div>
            <div className="text-sm font-medium text-slate-900 dark:text-slate-300">
                        {campaign.sent_count || 0}/{campaign.total_count || 0}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push('/campaigns')}
          className="w-full mt-4 text-[#2A8B8A] hover:text-[#238080] dark:text-[#2A8B8A] dark:hover:text-[#238080] text-sm font-medium text-center transition-colors duration-200"
                >
                  View All Campaigns →
                </button>
              </GlassCard>
            )}

            {/* Recent Chats */}
            {hasRecentChats && (
              <GlassCard className="p-6">
                <SectionTitle>Recent Chats</SectionTitle>
                <div className="space-y-3">
                  {dashboardData.chatContacts.contacts.slice(0, 5).map((contact, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 transition-all duration-200"
                      onClick={() => router.push(`/chats/${contact.phone}`)}
                    >
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {contact.name ? contact.name.charAt(0).toUpperCase() : contact.phone.slice(-2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {contact.name || contact.phone}
                        </div>
                        <div className="text-xs text-slate-900 dark:text-slate-400 truncate">
                          {contact.lastMessage || 'No messages'}
                        </div>
                      </div>
                      {contact.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {contact.unreadCount}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push('/chats')}
                  className="w-full mt-4 text-[#2A8B8A] hover:text-[#238080] dark:text-[#2A8B8A] dark:hover:text-[#238080] text-sm font-medium text-center transition-colors duration-200"
                >
                  View All Chats →
                </button>
              </GlassCard>
            )}
          </div>
          )}
          {/* Sidebar - Smart Alerts */}
          <div className="space-y-6">
            {/* Smart Alerts */}
            <GlassCard className="p-6">
              <SectionTitle>Smart Alerts</SectionTitle>
              <div className="space-y-4">
                {/* Low Balance Alert */}
                {!isBalanceLoading && userBalance < 100 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-red-800 dark:text-red-200">Low Balance</div>
                        <div className="text-sm text-red-700 dark:text-red-300">₹{userBalance.toFixed(2)} remaining</div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/billing')}
                      className="w-full mt-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-3 py-2 rounded-xl text-sm shadow-lg transition-all duration-200"
                    >
                      Add Funds
                    </button>
                  </div>
                )}
                
                {/* Payment Setup Alert */}
                {(!dashboardData.metaPaymentMethods?.payment_gateway?.enabled) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#2A8B8A] dark:text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold !text-slate-900 dark:text-[#2A8B8A]">Payment Setup</div>
                        <div className="text-sm !text-slate-900 dark:text-[#2A8B8A] font-medium">Add payment method for higher limits</div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/billing')}
                      className="w-full mt-3 bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-3 py-2 rounded-xl text-sm shadow-lg transition-all duration-200"
                    >
                      Setup Payment
                    </button>
                  </div>
                )}
                
                {/* Success State */}
                {!isBalanceLoading && userBalance >= 100 && 
                 dashboardData.metaPaymentMethods?.payment_gateway?.enabled && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-emerald-800 dark:text-emerald-200 flex items-center gap-2">All Systems Ready! <LuPartyPopper className="text-emerald-600 dark:text-emerald-300" /></div>
                        <div className="text-sm text-emerald-700 dark:text-emerald-300">Your account is fully configured</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
          );
        })()}

        {/* Expandable Quick Actions Button */}
        <QuickActionsButton router={router} />
      </div>
    </div>
  </div>
  );
}