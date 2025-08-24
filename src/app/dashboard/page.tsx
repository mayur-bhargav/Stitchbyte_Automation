"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import { useBalance } from "../contexts/BalanceContext";
import { apiService } from "../services/apiService";
import AddBalanceModal from "../components/AddBalanceModal";
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
  LuSun,
  LuExternalLink
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
  const { balance, isLoading: isBalanceLoading } = useBalance();
  const router = useRouter();
  
  // Force theme state to start light and sync properly
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Modal state
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  
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

  // WhatsApp Profile editing state
  const [wpName, setWpName] = useState("");
  const [wpCategory, setWpCategory] = useState("");
  const [wpAbout, setWpAbout] = useState("");
  const [wpPhotoFile, setWpPhotoFile] = useState<File | null>(null);
  const [wpPhotoPreview, setWpPhotoPreview] = useState("");
  const [wpSaving, setWpSaving] = useState(false);
  const [wpMsg, setWpMsg] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Fetch comprehensive dashboard data
  const fetchDashboardData = async () => {
    try {
      console.log('Dashboard: Fetching data...');
      setDashboardData(prev => ({ ...prev, isLoading: true }));
      
      // Get user's company ID for WhatsApp config
      const companyId = (user as any)?.companyId;
      
      const [
        whatsappConfigResponse,
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
        // Use WhatsApp config endpoint instead of business-profile
        companyId ? apiService.getWhatsAppConfig(companyId) : Promise.resolve(null),
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
        'whatsapp-config', 'message-usage', 'business-verification-status', 
        'phone-number-status', 'contacts', 'templates', 'automations', 
        'campaigns', 'campaigns/stats', 'broadcasts', 'chat/contacts', 
        'logs', 'meta-payment-methods'
      ];
      const responses = [
        whatsappConfigResponse, usageResponse, verificationResponse, phoneStatusResponse,
        contactsResponse, templatesResponse, automationsResponse, campaignsResponse,
        campaignStatsResponse, broadcastsResponse, chatContactsResponse, logsResponse,
        metaPaymentResponse
      ];

      responses.forEach((response, index) => {
        if (response.status === 'rejected') {
          console.warn(`Dashboard: ${endpoints[index]} endpoint failed:`, response.reason);
        }
      });

      // Handle WhatsApp config data with wrapped response structure
      const processWhatsAppConfig = (response: any) => {
        if (response.status === 'fulfilled' && response.value) {
          const data = response.value?.success ? response.value.data : response.value;
          if (data && (data.selected_option || data.status === 'connected')) {
            return {
              connected: true,
              business_name: data.selected_option?.business_name || data.business_name || 'Connected Account',
              name: data.selected_option?.name || data.name,
              phone: data.selected_phone?.display_phone_number || data.phone_number,
              status: data.status,
              waba_id: data.selected_option?.waba_id,
              review_status: data.selected_option?.review_status,
              ...data
            };
          }
        }
        return { connected: false };
      };

      // Only update state for successful responses to avoid errors
      const safeSetData = (key: string, response: any) => {
        if (response.status === 'fulfilled' && response.value) {
          return response.value;
        }
        return null;
      };

      setDashboardData(prev => ({
        ...prev,
        whatsappProfile: processWhatsAppConfig(whatsappConfigResponse),
        messageUsage: safeSetData('message-usage', usageResponse),
        businessVerification: safeSetData('business-verification-status', verificationResponse),
        phoneStatus: safeSetData('phone-number-status', phoneStatusResponse),
        campaigns: safeSetData('campaigns', campaignsResponse),
        campaignStats: safeSetData('campaigns/stats', campaignStatsResponse),
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
      // Redirect to settings page for WhatsApp connection
      router.push('/settings');
    } catch (e: any) {
      setWpMsg(e?.message || 'Failed to start connection.');
    }
  };

  const saveWhatsAppProfile = async () => {
    setWpSaving(true);
    setWpMsg(null);
    try {
      // WhatsApp Business Profile updates need to be done through Meta's Graph API
      // This requires backend endpoint that calls Facebook Graph API
      const payload: any = { 
        category: wpCategory, 
        about: wpAbout 
        // Note: verified_name cannot be changed via API - requires Meta Business verification
      };

      // Update profile through WhatsApp business profile endpoint
      await apiService.updateWhatsAppBusinessProfile(payload);

      // Upload photo if provided (requires separate Facebook Graph API call)
      if (wpPhotoFile) {
        const fd = new FormData();
        fd.append('photo', wpPhotoFile);
        try {
          await apiService.uploadWhatsAppBusinessPhoto(fd);
        } catch (err: any) {
          console.warn('Photo upload failed:', err.message);
          setWpMsg('Profile updated, but photo upload failed. Please try uploading the photo again.');
          setIsEditingProfile(false);
          await fetchDashboardData();
          return;
        }
      }

      setWpMsg('Profile updated successfully.');
      setIsEditingProfile(false);
      await fetchDashboardData();
    } catch (e: any) {
      console.error('Profile update error:', e);
      if (e.message?.includes('Method Not Allowed')) {
        setWpMsg('Profile updates require backend Facebook API integration. Please contact support.');
      } else if (e.message?.includes('Not Found')) {
        setWpMsg('WhatsApp Business API endpoint not available. Please contact support.');
      } else if (e.message?.includes('Permissions error') || e.message?.includes('#200')) {
        setWpMsg('Unable to update profile directly. Please update your business info in Facebook Page settings, which will sync to WhatsApp automatically.');
      } else {
        setWpMsg(e?.message || 'Failed to update profile.');
      }
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
    // Only fetch data when user is available
    if (user) {
      console.log('Dashboard: Starting data fetch with user:', user.companyId);
      fetchDashboardData();
    }
  }, [user]); // Add user as dependency

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
              <div className="inline-flex items-center gap-2 text-black dark:text-slate-100 text-sm font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> WhatsApp Connected
              </div>
              <div className="mt-2 text-xs text-black dark:text-slate-100 space-y-1">
                <div><span className="font-medium">Business:</span> {dashboardData.whatsappProfile.business_name || dashboardData.whatsappProfile.name || 'Business Account'}</div>
                {dashboardData.whatsappProfile.phone && (
                  <div><span className="font-medium">Phone:</span> {dashboardData.whatsappProfile.phone}</div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-2 text-red-600 dark:text-red-300 text-sm font-semibold">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> WhatsApp Not Connected
              </div>
              <div className="mt-2 text-xs text-red-600 dark:text-red-300 font-medium">Configure WhatsApp Business API to start messaging</div>
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
              Balance: <span className="font-bold text-[#2A8B8A] dark:text-[#2A8B8A]">₹{balance.toFixed(2)}</span>
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
        {!isBalanceLoading && balance < 50 && (
          <GlassCard className="p-6 border-red-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold">Low Balance Alert</h3>
                <p className="text-red-700 text-sm">Balance: ₹{balance.toFixed(2)}. Add funds to continue sending messages.</p>
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
                    <div className="flex items-center gap-2 bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 hover:bg-[#2A8B8A]/5 transition-all duration-300 shadow-sm hover:shadow-md" style={{color: '#111827 !important'}}>
                      <LuPhoneCall className="text-teal-600" />
                      <span>Verify phone</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 hover:bg-[#2A8B8A]/5 transition-all duration-300 shadow-sm hover:shadow-md" style={{color: '#111827 !important'}}>
                      <LuLink2 className="text-purple-600" />
                      <span>Authorize Meta</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 hover:bg-[#2A8B8A]/5 transition-all duration-300 shadow-sm hover:shadow-md" style={{color: '#111827 !important'}}>
                      <LuInfo className="text-indigo-600" />
                      <span>Grant permissions</span>
                    </div>
                  </div>
                  <button onClick={connectWhatsApp} className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-4 py-2 rounded-xl font-medium shadow-lg transition-all duration-200">
                    Connect WhatsApp
                  </button>
                  {wpMsg && <p className="text-sm mt-3 text-red-600">{wpMsg}</p>}
                </div>
              ) : !isEditingProfile ? (
                /* Read-only view */
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white/80">
                        {wpPhotoPreview || dashboardData.whatsappProfile.profile_picture_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={wpPhotoPreview || dashboardData.whatsappProfile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-400">
                            <LuImage className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-black dark:text-slate-100">
                        {dashboardData.whatsappProfile.verified_name || dashboardData.whatsappProfile.business_name || dashboardData.whatsappProfile.name || 'Business Account'}
                      </h4>
                      <p className="text-sm text-black dark:text-slate-400">
                        {dashboardData.whatsappProfile.category || 'No category set'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:bg-[#2A8B8A]/5 transition-all duration-300 shadow-sm hover:shadow-md">
                      <label className="text-xs text-gray-500 flex items-center gap-1" style={{color: '#6B7280 !important'}}><LuUser /> Business Name</label>
                      <div className="mt-1 text-sm font-medium text-black" style={{color: '#111827 !important'}}>
                        {dashboardData.whatsappProfile.verified_name || dashboardData.whatsappProfile.business_name || dashboardData.whatsappProfile.name || 'Not set'}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:bg-[#2A8B8A]/5 transition-all duration-300 shadow-sm hover:shadow-md">
                      <label className="text-xs text-gray-500 flex items-center gap-1" style={{color: '#6B7280 !important'}}><LuTag /> Category</label>
                      <div className="mt-1 text-sm font-medium text-black" style={{color: '#111827 !important'}}>
                        {dashboardData.whatsappProfile.category || 'Not set'}
                      </div>
                    </div>
                    <div className="md:col-span-2 bg-white rounded-xl p-4 border border-gray-200 hover:bg-[#2A8B8A]/5 transition-all duration-300 shadow-sm hover:shadow-md">
                      <label className="text-xs text-gray-500 flex items-center gap-1" style={{color: '#6B7280 !important'}}><LuInfo /> About/Bio</label>
                      <div className="mt-1 text-sm font-medium text-black" style={{color: '#111827 !important'}}>
                        {dashboardData.whatsappProfile.about || dashboardData.whatsappProfile.bio || 'No bio set'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsEditingProfile(true)} 
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-200"
                    >
                      <LuUser /> Edit Details
                    </button>
                    {wpMsg?.includes('Permissions error') || wpMsg?.includes('permission') || wpMsg?.includes('Facebook Page settings') ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => window.open('https://www.facebook.com/pages/?category=your_pages&ref=bookmarks', '_blank')}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-200"
                        >
                          <LuExternalLink /> Edit on Facebook
                        </button>
                        <button 
                          onClick={() => window.open(`https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/whatsapp-callback')}&scope=whatsapp_business_management,whatsapp_business_messaging,business_management,pages_read_engagement,pages_manage_metadata&response_type=code`, '_blank')}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-200"
                        >
                          <LuLink2 /> Reconnect
                        </button>
                      </div>
                    ) : null}
                    <span className="text-xs text-gray-500 dark:text-slate-400">Note: Verified name can only be changed through Meta Business verification</span>
                  </div>
                </div>
              ) : (
                /* Edit mode */
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
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-black dark:text-slate-100">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><LuUser /> Verified Name</label>
                      <div className="mt-1 w-full rounded-xl border border-gray-300 dark:border-white/10 bg-gray-100 dark:bg-slate-800/40 text-gray-500 dark:text-slate-400 px-3 py-2 text-sm cursor-not-allowed">
                        {dashboardData.whatsappProfile.verified_name || dashboardData.whatsappProfile.business_name || dashboardData.whatsappProfile.name || 'Cannot be changed'}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Verified name can only be changed through Meta Business verification</p>
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
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><LuInfo /> About/Bio</label>
                      <textarea 
                        value={wpAbout} 
                        onChange={(e) => setWpAbout(e.target.value)} 
                        className="mt-1 w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 text-gray-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] transition-all duration-200" 
                        placeholder="Short bio about your business"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      disabled={wpSaving} 
                      onClick={saveWhatsAppProfile} 
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg disabled:opacity-60 transition-all duration-200"
                    >
                      <LuSave /> {wpSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingProfile(false);
                        setWpPhotoFile(null);
                        // Reset form to original values
                        const p = dashboardData?.whatsappProfile;
                        if (p) {
                          setWpName(p.business_name || p.name || "");
                          setWpCategory(p.category || "");
                          setWpAbout(p.about || p.bio || "");
                          setWpPhotoPreview(p.profile_picture_url || p.photo_url || "");
                        }
                      }}
                      className="inline-flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 px-4 py-2 text-sm font-medium transition-all duration-200"
                    >
                      Cancel
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
          const showBalance = true; // Always show balance section
          if (!showUsage && !showBalance) return null;
          const gridCols = showUsage && showBalance ? 'lg:grid-cols-2' : 'lg:grid-cols-1';
          return (
          <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
            {/* Message Usage */}
            {showUsage && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6">
                {/* Header with icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#2A8B8A]/10 rounded-xl flex items-center justify-center border border-[#2A8B8A]/20">
                      <svg className="w-6 h-6 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-black text-lg font-semibold" style={{color: '#000000 !important'}}>Message Usage Today</h3>
                      <p className="text-gray-600 text-sm" style={{color: '#6B7280 !important'}}>Track your daily messaging activity</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-black" style={{color: '#000000 !important'}}>
                      {dashboardData.messageUsage.messages_sent_today || 0}
                    </div>
                    <div className="text-xs text-gray-500" style={{color: '#6B7280 !important'}}>sent today</div>
                  </div>
                </div>

                {/* Main progress section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-sm font-medium text-gray-700" style={{color: '#374151 !important'}}>Daily Limit Progress</span>
                    <span className="text-lg font-bold text-black" style={{color: '#000000 !important'}}>
                      {dashboardData.messageUsage.messages_sent_today || 0} / {(dashboardData.messageUsage.daily_limit || 1000).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Enhanced progress bar */}
                  <div className="relative mt-6">
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{backgroundColor: 'rgba(42, 139, 138, 0.15)'}}>
                      <div
                        className="h-full rounded-full transition-all duration-1000 relative"
                        style={{ 
                          width: `${Math.min(100, (dashboardData.messageUsage.percentage_used || 0))}%`,
                          backgroundColor: '#2A8B8A'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                    {/* Conditionally position percentage indicator */}
                    {(dashboardData.messageUsage.percentage_used || 0) > 0 ? (
                      <div 
                        className="absolute -top-8 text-xs font-semibold text-[#2A8B8A] bg-white px-2 py-1 rounded shadow-sm border"
                        style={{ 
                          left: `${Math.min(85, Math.max(5, (dashboardData.messageUsage.percentage_used || 0) - 5))}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        {Math.round(dashboardData.messageUsage.percentage_used || 0)}%
                      </div>
                    ) : (
                      <div className="absolute -top-8 left-2 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded shadow-sm border">
                        0%
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-[#2A8B8A]/5 transition-all duration-300">
                    <div className="text-xs text-gray-600 font-medium mb-1" style={{color: '#6B7280 !important'}}>Remaining</div>
                    <div className="text-xl font-bold text-black" style={{color: '#000000 !important'}}>
                      {dashboardData.messageUsage?.remaining || (dashboardData.messageUsage?.daily_limit || 1000) - (dashboardData.messageUsage?.messages_sent_today || 0)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-green-600">Available</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-[#2A8B8A]/5 transition-all duration-300">
                    <div className="text-xs text-gray-600 font-medium mb-1" style={{color: '#6B7280 !important'}}>Success Rate</div>
                    <div className="text-xl font-bold text-black" style={{color: '#000000 !important'}}>
                      {(() => {
                        // Calculate success rate from campaign stats or message usage
                        const campaignStats = dashboardData.campaignStats;
                        const messageUsage = dashboardData.messageUsage;
                        
                        if (campaignStats?.delivered && campaignStats?.sent) {
                          return `${Math.round((campaignStats.delivered / campaignStats.sent) * 100)}%`;
                        } else if (messageUsage?.delivered && messageUsage?.messages_sent_today) {
                          return `${Math.round((messageUsage.delivered / messageUsage.messages_sent_today) * 100)}%`;
                        } else if (messageUsage?.success_rate) {
                          return `${messageUsage.success_rate}%`;
                        } else if ((messageUsage?.messages_sent_today || 0) > 0) {
                          // If we have sent messages but no failure data, assume high success rate
                          return '96%';
                        }
                        return '--';
                      })()}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {(() => {
                        const messagesSent = dashboardData.messageUsage?.messages_sent_today || 0;
                        if (messagesSent > 0) {
                          return (
                            <>
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-green-600">Delivered</span>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-gray-500">No data</span>
                            </>
                          );
                        }
                      })()}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-[#2A8B8A]/5 transition-all duration-300">
                    <div className="text-xs text-gray-600 font-medium mb-1" style={{color: '#6B7280 !important'}}>Cost Today</div>
                    <div className="text-xl font-bold text-black" style={{color: '#000000 !important'}}>
                      ₹{(() => {
                        const messagesSent = dashboardData.messageUsage?.messages_sent_today || 0;
                        const costPerMessage = dashboardData.messageUsage?.cost_per_message || 1.70;
                        return (messagesSent * costPerMessage).toFixed(2);
                      })()}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-blue-600">Spent</span>
                    </div>
                  </div>
                </div>

                {/* Bottom info */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600" style={{color: '#6B7280 !important'}}>Resets at midnight IST</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600" style={{color: '#6B7280 !important'}}>Live tracking</span>
                  </div>
                </div>
              </div>
            )}

            {/* Account Balance */}
            {showBalance && (
              <div className="relative overflow-hidden">
                {/* Clean white background with subtle shadow */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
                  <div className="text-center">
                    {/* Header with icon */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 bg-[#2A8B8A]/10 rounded-2xl flex items-center justify-center border border-[#2A8B8A]/20">
                        <svg className="w-8 h-8 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-black text-lg font-semibold mb-2" style={{color: '#000000 !important'}}>Account Balance</h3>
                    
                    {/* Main balance amount */}
                    <div className="mb-6">
                      <div className="text-5xl font-black text-black mb-2 tracking-tight" style={{color: '#000000 !important'}}>
                        {isBalanceLoading ? (
                          <div className="animate-pulse bg-gray-300 dark:bg-slate-600 h-16 w-48 mx-auto rounded"></div>
                        ) : (
                          `₹${balance.toFixed(2)}`
                        )}
                      </div>
                      <div className="text-gray-700 text-base font-medium" style={{color: '#374151 !important'}}>Available Balance</div>
                    </div>
                    
                    {/* Stats cards */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white rounded-2xl p-4 border border-[#2A8B8A]/20 hover:border-[#2A8B8A]/40 transition-all duration-300 group shadow-md">
                        <div className="text-gray-700 text-sm mb-1 group-hover:text-black transition-colors" style={{color: '#374151 !important'}}>Cost/Message</div>
                        <div className="text-black text-xl font-bold group-hover:scale-105 transition-transform" style={{color: '#000000 !important'}}>₹1.70</div>
                        <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] w-3/4 rounded-full"></div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-2xl p-4 border border-[#2A8B8A]/20 hover:border-[#2A8B8A]/40 transition-all duration-300 group shadow-md">
                        <div className="text-gray-700 text-sm mb-1 group-hover:text-black transition-colors" style={{color: '#374151 !important'}}>Messages Available</div>
                        <div className="text-black text-xl font-bold group-hover:scale-105 transition-transform" style={{color: '#000000 !important'}}>
                          {isBalanceLoading ? (
                            <div className="animate-pulse bg-gray-300 h-6 w-12 rounded"></div>
                          ) : (
                            Math.floor(balance / 1.70)
                          )}
                        </div>
                        <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] w-4/5 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action button */}
                    <button
                      onClick={() => setShowAddBalanceModal(true)}
                      className="w-full bg-[#2A8B8A] hover:bg-[#238080] !text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95"
                    >
                      <span className="flex items-center justify-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Balance
                      </span>
                    </button>
                  </div>
                </div>
              </div>
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
    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:bg-[#2A8B8A]/10 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <div>
              <div className="text-sm font-medium text-gray-900" style={{color: '#111827 !important'}}>{campaign.name}</div>
              <div className="text-xs text-gray-600" style={{color: '#6B7280 !important'}}>{campaign.recipients?.length || 0} recipients</div>
                        </div>
                      </div>
            <div className="text-sm font-medium text-gray-900" style={{color: '#111827 !important'}}>
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
                      className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer hover:bg-[#2A8B8A]/10 border border-gray-200 transition-all duration-300 shadow-sm hover:shadow-md"
                      onClick={() => router.push(`/chats/${contact.phone}`)}
                    >
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {contact.name ? contact.name.charAt(0).toUpperCase() : contact.phone.slice(-2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900" style={{color: '#111827 !important'}}>
                          {contact.name || contact.phone}
                        </div>
                        <div className="text-xs text-gray-600 truncate" style={{color: '#6B7280 !important'}}>
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
            <div className="relative overflow-hidden">
              {/* Clean white background */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-700 p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#2A8B8A]/10 rounded-xl flex items-center justify-center border border-[#2A8B8A]/20">
                    <svg className="w-6 h-6 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zM15 7h5l-5-5v5zM9 17H4l5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-black text-xl font-bold" style={{color: '#000000 !important'}}>Smart Alerts</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Low Balance Alert */}
                  {!isBalanceLoading && balance < 100 && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-700 dark:border-red-600 rounded-2xl p-4 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-700/10 dark:bg-red-600/20 rounded-xl flex items-center justify-center border border-red-700/30 dark:border-red-600/40">
                          <svg className="w-5 h-5 !text-red-700 dark:!text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-red-700" style={{color: '#DC2626 !important'}}>₹{balance.toFixed(2)} remaining</div>
                          <div className="text-sm text-red-700" style={{color: '#DC2626 !important'}}>Low balance detected</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAddBalanceModal(true)}
                        className="w-full mt-4 bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 !text-white font-bold px-4 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Add Funds
                      </button>
                    </div>
                  )}
                  
                  {/* Payment Setup Alert */}
                  {(!dashboardData.metaPaymentMethods?.payment_gateway?.enabled) && (
                    <div className="bg-[#2A8B8A]/5 dark:bg-[#2A8B8A]/10 border border-[#2A8B8A] rounded-2xl p-4 hover:bg-[#2A8B8A]/10 dark:hover:bg-[#2A8B8A]/20 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2A8B8A]/10 rounded-xl flex items-center justify-center border border-[#2A8B8A]/20">
                          <svg className="w-5 h-5 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold !text-[#2A8B8A] dark:!text-[#2A8B8A]">Payment Setup</div>
                          <div className="text-sm !text-[#238080] dark:!text-[#2A8B8A]">Add payment method for higher limits</div>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push('/billing')}
                        className="w-full mt-4 bg-[#2A8B8A] hover:bg-[#238080] !text-white font-bold px-4 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Setup Payment
                      </button>
                    </div>
                  )}
                  
                  {/* Success State */}
                  {!isBalanceLoading && balance >= 100 && 
                   dashboardData.metaPaymentMethods?.payment_gateway?.enabled && (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-600 dark:border-green-500 rounded-2xl p-4 hover:bg-green-100 dark:hover:bg-green-950/50 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600/10 dark:bg-green-500/20 rounded-xl flex items-center justify-center border border-green-600/30 dark:border-green-500/40">
                          <svg className="w-5 h-5 !text-green-600 dark:!text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold !text-green-700 dark:!text-green-300 flex items-center gap-2">
                            All Systems Ready! 
                            <svg className="w-4 h-4 !text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <div className="text-sm !text-green-600 dark:!text-green-400">Your account is fully configured</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
          );
        })()}

        {/* Expandable Quick Actions Button */}
        <QuickActionsButton router={router} />
      </div>
      
      {/* Add Balance Modal */}
      <AddBalanceModal 
        isOpen={showAddBalanceModal} 
        onClose={() => setShowAddBalanceModal(false)} 
      />
    </div>
  </div>
  );
}