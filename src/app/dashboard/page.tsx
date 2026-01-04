"use client";
import { useState, useEffect, ReactNode, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import { useBalance } from "../contexts/BalanceContext";
import { usePermissions } from "../contexts/PermissionContext";
import { useDashboard } from "../contexts/DashboardContext";
import { apiService } from "../services/apiService";
import AddBalanceModal from "../components/AddBalanceModal";
import {
  LuMessageSquare,
  LuUsers,
  LuRocket,
  LuMessageCircle,
  LuSparkles,
  LuUser,
  LuLoaderCircle,
  LuWallet,
  LuLayoutGrid,
  LuActivity,
  LuTrendingUp,
  LuCircleCheck,
  LuCircle,
  LuFileText,
  LuZap,
  LuTag,
  LuPencilLine,
  LuSave,
  LuLink,
  LuPhone,
  LuInfo,
  LuCalendar,
  LuClock,
  LuBell,
  LuSearch,
  LuFilter,
  LuX,
  LuCheck,
  LuCreditCard
} from "react-icons/lu";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// ============================================================================
// UI Helper Components (Unchanged)
// ============================================================================

type CardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  description?: string;
  icon?: ReactNode;
  headerRight?: ReactNode;
};

function Card({ children, className = "", onClick, title, description, icon, headerRight }: CardProps) {
  const baseClasses =
    "relative rounded-xl bg-white border border-slate-200 shadow-sm transition-all h-full"; // Added h-full
  const clickableClasses = onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-px" : "";
  return (
    <div onClick={onClick} className={`${baseClasses} ${clickableClasses} ${className}`}>
      {(title || description || icon || headerRight) && (
        <div className="flex items-center justify-between border-b border-slate-200 p-5 mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-9 h-9 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 border border-slate-200">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-slate-800">{title}</h3>
              {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>
          {headerRight}
        </div>
      )}
      <div className={title || description || icon || headerRight ? "p-5 pt-0" : "p-5"}>
        {children}
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
};

function StatCard({ label, value, icon, trend, trendValue }: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500';
  const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '';

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className="text-[#2A8B8A] bg-[#2A8B8A]/10 p-2 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</p>
          {trendValue && (
            <p className={`text-xs ${trendColor} flex items-center gap-1 mt-1`}>
              {trendIcon} {trendValue}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

type AlertProps = {
  type: 'info' | 'warning' | 'error' | 'success';
  message: ReactNode;
  onAction?: () => void;
  actionText?: string;
};

function Alert({ type, message, onAction, actionText }: AlertProps) {
  const styles = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: <LuInfo className="text-blue-500" /> },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: <LuLoaderCircle className="text-yellow-500" /> },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: <LuCircle className="text-red-500" /> },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: <LuCircleCheck className="text-emerald-500" /> },
  };
  const { bg, border, text, icon } = styles[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg ${bg} ${border} border`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className={`text-sm ${text}`}>{message}</p>
        {onAction && actionText && (
          <button onClick={onAction} className={`mt-2 text-xs font-semibold underline ${text}`}>
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const { balance } = useBalance();
  const { hasPermission } = usePermissions();
  const { 
    showNotifications, setShowNotifications, 
    showSearchFilter, setShowSearchFilter,
    notifications, 
    unreadCount,
    searchQuery, setSearchQuery,
    dateFilter, setDateFilter,
    statusFilter, setStatusFilter,
    markNotificationAsRead: contextMarkAsRead,
    markAllNotificationsAsRead: contextMarkAllAsRead,
    clearNotificationById: contextClearNotification,
    showWhatsAppNotConnectedNotification,
    showFailedMessagesNotification,
    showUnreadChatsNotification,
    addNotification
  } = useDashboard();
  
  // Demo mode for screen recording (set to true when recording)
  const DEMO_MODE = false; // Set to true for Meta app review recording

  // MODAL & UI STATE
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // Default tab

  // DASHBOARD DATA STATE
  const [dashboardData, setDashboardData] = useState({
    whatsappProfile: null, messageUsage: null, businessVerification: null, phoneStatus: null,
    campaigns: null, campaignStats: null, broadcasts: null, chatContacts: null,
    recentLogs: null, metaPaymentMethods: null,
    stats: {
      messagesSent: 0, messagesSentYesterday: 0, contacts: 0, contactsLastWeek: 0, templates: 0, automations: 0,
      activeCampaigns: 0, totalCampaigns: 0, broadcasts: 0, chatConversations: 0, unreadChats: 0,
      successfulMessages: 0, failedMessages: 0, totalMessages: 0
    },
    isLoading: true,
    messageHistory: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Messages Sent',
          data: [0, 0, 0, 0, 0, 0, 0], // Start with all zeros
          borderColor: '#2A8B8A',
          backgroundColor: '#2A8B8A',
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#2A8B8A',
        },
      ],
    }
  });

  // WHATSAPP PROFILE EDITING STATE
  const [wpName, setWpName] = useState("");
  const [wpCategory, setWpCategory] = useState("");
  const [wpAbout, setWpAbout] = useState("");
  const [wpPhotoFile, setWpPhotoFile] = useState<File | null>(null);
  const [wpPhotoPreview, setWpPhotoPreview] = useState("");
  const [wpSaving, setWpSaving] = useState(false);
  const [wpMsg, setWpMsg] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const prevDataRef = useRef<{ whatsappConnected?: boolean; failedMessages?: number; unreadChats?: number }>({});

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Trigger real notifications based on dashboard data
  const triggerDataBasedNotifications = (data: any) => {
    // WhatsApp not connected - only show if status changed to disconnected
    const isConnected = (data.whatsappProfile as any)?.connected;
    if (isConnected === false && prevDataRef.current.whatsappConnected !== false) {
      showWhatsAppNotConnectedNotification();
    }
    prevDataRef.current.whatsappConnected = isConnected;

    // Failed messages notification - only if increased
    const failedMessages = data.stats?.failedMessages || 0;
    if (failedMessages > 0 && failedMessages > (prevDataRef.current.failedMessages || 0)) {
      showFailedMessagesNotification(failedMessages);
    }
    prevDataRef.current.failedMessages = failedMessages;

    // Unread chats notification - only if increased
    const unreadChats = data.stats?.unreadChats || 0;
    if (unreadChats > 0 && unreadChats > (prevDataRef.current.unreadChats || 0)) {
      showUnreadChatsNotification(unreadChats);
    }
    prevDataRef.current.unreadChats = unreadChats;

    // Campaign completion notifications
    if (data.campaigns?.campaigns) {
      const now = new Date();
      data.campaigns.campaigns.forEach((campaign: any) => {
        if (campaign.status === 'completed' && campaign.completed_at) {
          const completedDate = new Date(campaign.completed_at);
          const hoursSinceCompletion = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceCompletion < 24) {
            // Check if we already have this notification
            const existingNotif = notifications.find(n => n.id === `campaign-complete-${campaign.id}`);
            if (!existingNotif) {
              addNotification({
                type: 'success',
                title: 'Campaign Completed',
                message: `"${campaign.name}" finished sending to ${campaign.recipients?.length || 0} contacts.`,
                actionUrl: '/campaigns',
                actionLabel: 'View Campaigns',
                category: 'campaign'
              });
            }
          }
        }
      });
    }

    // No payment method notification
    if (!(data.metaPaymentMethods as any)?.payment_gateway?.enabled && hasPermission('view_billing')) {
      // Check if we already have an unread payment notification
      const existingPaymentNotif = notifications.find(n => n.category === 'billing' && !n.read);
      if (!existingPaymentNotif) {
        addNotification({
          type: 'warning',
          title: 'Payment Method Required',
          message: 'Add a payment method to ensure uninterrupted service.',
          actionUrl: '/billing',
          actionLabel: 'Add Payment',
          category: 'billing'
        });
      }
    }
  };

  // Use context functions for notification management
  const markNotificationAsRead = contextMarkAsRead;
  const markAllAsRead = contextMarkAllAsRead;
  const clearNotification = contextClearNotification;

  // Search and Filter Functions
  const applyFilters = (data: any) => {
    let filteredCampaigns = data.campaigns?.campaigns || [];
    let filteredChats = data.chatContacts?.contacts || [];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      filteredCampaigns = filteredCampaigns.filter((campaign: any) =>
        campaign.name?.toLowerCase().includes(query) ||
        campaign.description?.toLowerCase().includes(query)
      );

      filteredChats = filteredChats.filter((contact: any) =>
        contact.name?.toLowerCase().includes(query) ||
        contact.phone?.includes(query) ||
        contact.lastMessage?.toLowerCase().includes(query)
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filteredCampaigns = filteredCampaigns.filter((campaign: any) => {
        const campaignDate = new Date(campaign.created_at || campaign.scheduled_at);
        return campaignDate >= filterDate;
      });

      filteredChats = filteredChats.filter((contact: any) => {
        const chatDate = new Date(contact.lastMessageTime || contact.last_message_time);
        return chatDate >= filterDate;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredCampaigns = filteredCampaigns.filter((campaign: any) =>
        campaign.status === statusFilter
      );
    }

    return {
      campaigns: { campaigns: filteredCampaigns },
      chats: { contacts: filteredChats }
    };
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || dateFilter !== 'all' || statusFilter !== 'all';

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTimeAgo = (dateString: string | Date) => {
    if (!dateString) return 'No time';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid time';
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch {
      return 'Invalid time';
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${Math.round(change)}%`;
  };

  const getUnreadChatsCount = (chatContacts: any) => {
    if (!chatContacts?.contacts) return 0;
    
    const uniqueContacts = deduplicateContacts(chatContacts.contacts);
    return uniqueContacts.filter((contact: any) => contact.unreadCount > 0).length;
  };

  // Helper function to deduplicate contacts by phone number
  const deduplicateContacts = (contacts: any[]) => {
    return contacts.reduce((acc: any[], contact: any) => {
      const existingIndex = acc.findIndex(c => c.phone === contact.phone);
      if (existingIndex >= 0) {
        // Keep the contact with more recent message or higher unread count
        const existing = acc[existingIndex];
        const currentTime = contact.last_message_time ? new Date(contact.last_message_time) : new Date(0);
        const existingTime = existing.last_message_time ? new Date(existing.last_message_time) : new Date(0);
        const currentUnread = contact.unreadCount || 0;
        const existingUnread = existing.unreadCount || 0;
        
        if (currentTime > existingTime || (currentTime.getTime() === existingTime.getTime() && currentUnread > existingUnread)) {
          acc[existingIndex] = contact;
        }
      } else {
        acc.push(contact);
      }
      return acc;
    }, []);
  };

  // ============================================================================
  // ALL LOGIC FUNCTIONS (UNCHANGED)
  // ============================================================================

  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, isLoading: true }));
      const companyId = (user as any)?.companyId;
      
      const [
        whatsappConfigResponse, usageResponse, verificationResponse, phoneStatusResponse,
        contactsResponse, templatesResponse, automationsResponse, campaignsResponse,
        campaignStatsResponse, broadcastsResponse, chatContactsResponse, logsResponse,
        metaPaymentResponse
      ] = await Promise.allSettled([
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

      const processWhatsAppConfig = (response: any) => {
        if (response.status === 'fulfilled' && response.value) {
          const data = response.value?.success ? response.value.data : response.value;
          if (data && (data.selected_option || data.status === 'connected')) {
            return {
              connected: true,
              business_name: data.selected_option?.business_name || data.business_name || 'Connected Account',
              name: data.selected_option?.name || data.name,
              phone: data.selected_phone?.display_phone_number || data.phone_number,
              ...data
            };
          }
        }
        return { connected: false };
      };

      const safeSetData = (response: any) => {
        return response.status === 'fulfilled' && response.value ? response.value : null;
      };

      const messageUsageData = safeSetData(usageResponse);
      const contactsData = safeSetData(contactsResponse);
      const templatesData = safeSetData(templatesResponse);
      const automationsData = safeSetData(automationsResponse);
      const campaignsData = safeSetData(campaignsResponse);
      const broadcastsData = safeSetData(broadcastsResponse);
      const chatContactsData = safeSetData(chatContactsResponse);
      const logsData = safeSetData(logsResponse);

      // Calculate today's and yesterday's messages from logs
      const calculateMessagesFromLogs = (logs: any) => {
        if (!logs?.logs || !Array.isArray(logs.logs)) {
          return { todayMessages: 0, yesterdayMessages: 0 };
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Set to start of day for accurate comparison
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        let todayMessages = 0;
        let yesterdayMessages = 0;

        logs.logs.forEach((log: any) => {
          if (log.direction === 'outgoing' && log.success && log.sent_at) {
            const sentDate = new Date(log.sent_at);
            
            // Count today's messages
            if (sentDate >= todayStart && sentDate < tomorrowStart) {
              todayMessages++;
            }
            
            // Count yesterday's messages
            if (sentDate >= yesterdayStart && sentDate < todayStart) {
              yesterdayMessages++;
            }
          }
        });

        return { todayMessages, yesterdayMessages };
      };

      const { todayMessages, yesterdayMessages } = calculateMessagesFromLogs(logsData);

      // Process message history data from API
      const processMessageHistory = (data: any, logs: any) => {
        // First try to use the usage data if it has daily breakdown
        if (data?.daily_usage && Array.isArray(data.daily_usage)) {
          const last7Days = data.daily_usage.slice(-7);
          const labels = last7Days.map((day: any) => {
            const date = new Date(day.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          });
          const messageData = last7Days.map((day: any) => day.messages_sent || 0);
          
          return {
            labels,
            datasets: [
              {
                label: 'Messages Sent',
                data: messageData,
                borderColor: '#2A8B8A',
                backgroundColor: '#2A8B8A',
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#2A8B8A',
              },
            ],
          };
        }
        
        // Fallback: Calculate from logs data
        if (logs?.logs && Array.isArray(logs.logs)) {
          const last7Days: { date: Date; label: string; messages: number }[] = [];
          const today = new Date();
          
          // Generate last 7 days
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push({
              date: date,
              label: date.toLocaleDateString('en-US', { weekday: 'short' }),
              messages: 0
            });
          }
          
          // Count messages for each day
          logs.logs.forEach((log: any) => {
            if (log.direction === 'outgoing' && log.success && log.sent_at) {
              const sentDate = new Date(log.sent_at);
              const dayIndex = last7Days.findIndex(day => {
                const dayStart = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);
                return sentDate >= dayStart && sentDate < dayEnd;
              });
              
              if (dayIndex >= 0) {
                last7Days[dayIndex].messages++;
              }
            }
          });
          
          return {
            labels: last7Days.map(day => day.label),
            datasets: [
              {
                label: 'Messages Sent',
                data: last7Days.map(day => day.messages),
                borderColor: '#2A8B8A',
                backgroundColor: '#2A8B8A',
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#2A8B8A',
              },
            ],
          };
        }
        
        // Final fallback to show zero data
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Messages Sent',
              data: [0, 0, 0, 0, 0, 0, 0],
              borderColor: '#2A8B8A',
              backgroundColor: '#2A8B8A',
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#2A8B8A',
            },
          ],
        };
      };

      setDashboardData(prev => ({
        ...prev,
        whatsappProfile: processWhatsAppConfig(whatsappConfigResponse),
        messageUsage: messageUsageData,
        businessVerification: safeSetData(verificationResponse),
        phoneStatus: safeSetData(phoneStatusResponse),
        campaigns: campaignsData,
        campaignStats: safeSetData(campaignStatsResponse),
        broadcasts: broadcastsData,
        chatContacts: chatContactsData,
        recentLogs: safeSetData(logsResponse),
        metaPaymentMethods: safeSetData(metaPaymentResponse),
        messageHistory: processMessageHistory(messageUsageData, logsData),
        stats: {
          messagesSent: todayMessages, // Use calculated today's messages from logs
          messagesSentYesterday: yesterdayMessages, // Use calculated yesterday's messages from logs
          contacts: contactsData?.contacts?.length || 0,
          contactsLastWeek: contactsData?.contacts_last_week || 0,
          templates: templatesData?.templates?.length || 0,
          automations: automationsData?.length || 0,
          activeCampaigns: campaignsData?.campaigns?.filter((c: any) => c.status === 'active').length || 0,
          totalCampaigns: campaignsData?.campaigns?.length || 0,
          broadcasts: broadcastsData?.broadcasts?.length || 0,
          chatConversations: chatContactsData?.contacts ? deduplicateContacts(chatContactsData.contacts).length : 0,
          unreadChats: getUnreadChatsCount(chatContactsData),
          successfulMessages: messageUsageData?.data?.messages_delivered || messageUsageData?.successful_messages || 0,
          failedMessages: messageUsageData?.data?.messages_failed || messageUsageData?.failed_messages || 0,
          totalMessages: (messageUsageData?.data?.messages_sent || messageUsageData?.total_messages || 0)
        },
        isLoading: false
      }));

      // Generate notifications after data is processed
      const tempData = {
        whatsappProfile: processWhatsAppConfig(whatsappConfigResponse),
        metaPaymentMethods: safeSetData(metaPaymentResponse),
        campaigns: campaignsData,
        chatContacts: chatContactsData,
        stats: {
          failedMessages: messageUsageData?.data?.messages_failed || messageUsageData?.failed_messages || 0,
          unreadChats: getUnreadChatsCount(chatContactsData)
        }
      };
      // Trigger data-based notifications (uses the new notification system)
      triggerDataBasedNotifications(tempData);
    } catch (error) {
      setDashboardData(prev => ({ ...prev, isLoading: false }));
    }
  };

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
    // First try to disconnect any existing connection to ensure clean reconnection
    try {
      await apiService.deleteWhatsAppConfig();
    } catch (cleanupError) {
      console.warn('Cleanup warning (non-critical):', cleanupError);
    }
    
    // Clear permission error state
    setHasPermissionError(false);
    
    // Navigate to settings for reconnection
    router.push('/settings');
  };

  const saveWhatsAppProfile = async () => {
    setWpSaving(true);
    setWpMsg(null);
    try {
      await apiService.updateWhatsAppBusinessProfile({ category: wpCategory, about: wpAbout });
      if (wpPhotoFile) {
        const fd = new FormData();
        fd.append('photo', wpPhotoFile);
        await apiService.uploadWhatsAppBusinessPhoto(fd);
      }
      setWpMsg('Profile updated successfully.');
      setIsEditingProfile(false);
      setHasPermissionError(false);
    } catch (e: any) {
      console.error('WhatsApp profile update error:', e);
      
      // Handle specific error types
      if (e?.message?.includes('Permissions error') || e?.message?.includes('#200')) {
        setWpMsg('Insufficient permissions to update profile. Please reconnect your WhatsApp account with additional permissions.');
        setHasPermissionError(true);
      } else if (e?.message?.includes('rate limit') || e?.message?.includes('too many requests')) {
        setWpMsg('Too many requests. Please wait a moment and try again.');
        setHasPermissionError(false);
      } else if (e?.message?.includes('network') || e?.message?.includes('timeout')) {
        setWpMsg('Network error. Please check your connection and try again.');
        setHasPermissionError(false);
      } else {
        setWpMsg(e?.message || 'Failed to update profile. Please try again.');
        setHasPermissionError(false);
      }
    } finally {
      setWpSaving(false);
      await fetchDashboardData();
    }
  };

  const onPhotoChange = (file: File | null) => {
    setWpPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setWpPhotoPreview(String(reader.result));
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  // Subscription validation (currently disabled)
  const hasValidSubscription = true; // TODO: Implement subscription validation

  useEffect(() => {
    if (!dashboardData.isLoading && !hasValidSubscription) {
      // router.push('/select-plan'); // Re-enable for subscription enforcement
    }
  }, [hasValidSubscription, dashboardData.isLoading, router]);


  // ============================================================================
  // LOADING STATE - SKELETON LOADER
  // ============================================================================

  if (dashboardData.isLoading) {
    return (
      <div className="min-h-screen bg-transparent text-slate-800">
        <div className="flex">
          <main className="flex-1 p-6 md:p-8">
            <div className="w-full max-w-screen-2xl mx-auto space-y-8">
              
              {/* Skeleton Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative rounded-xl bg-white border border-slate-200 shadow-sm p-4 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-7 bg-slate-200 rounded w-16"></div>
                        <div className="h-3 bg-slate-200 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skeleton Main Content Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Skeleton Chart Card */}
                <div className="lg:col-span-8">
                  <div className="relative rounded-xl bg-white border border-slate-200 shadow-sm animate-pulse">
                    <div className="flex items-center justify-between border-b border-slate-200 p-5 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-40"></div>
                          <div className="h-3 bg-slate-200 rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 pt-0">
                      <div className="h-64 bg-slate-100 rounded-lg mb-6"></div>
                      <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-5">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="text-center space-y-2">
                            <div className="h-3 bg-slate-200 rounded w-20 mx-auto"></div>
                            <div className="h-5 bg-slate-200 rounded w-16 mx-auto"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skeleton Right Side Cards */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Skeleton Profile Card */}
                  <div className="relative rounded-xl bg-white border border-slate-200 shadow-sm animate-pulse">
                    <div className="flex items-center justify-between border-b border-slate-200 p-5 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-32"></div>
                          <div className="h-3 bg-slate-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="w-6 h-6 bg-slate-200 rounded"></div>
                    </div>
                    <div className="p-5 pt-0 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-slate-200 rounded w-32"></div>
                          <div className="h-4 bg-slate-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-full"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>

                  {/* Skeleton Alerts Card */}
                  <div className="relative rounded-xl bg-white border border-slate-200 shadow-sm animate-pulse">
                    <div className="flex items-center justify-between border-b border-slate-200 p-5 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-28"></div>
                          <div className="h-3 bg-slate-200 rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 pt-0 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-slate-100 rounded-lg p-4">
                          <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Skeleton Secondary Row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {[1, 2].map((cardNum) => (
                  <div key={cardNum} className="relative rounded-xl bg-white border border-slate-200 shadow-sm animate-pulse">
                    <div className="flex items-center justify-between border-b border-slate-200 p-5 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-32"></div>
                          <div className="h-3 bg-slate-200 rounded w-40"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                    </div>
                    <div className="p-5 pt-0">
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-slate-200 rounded-full"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-32"></div>
                                <div className="h-3 bg-slate-200 rounded w-24"></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-6 bg-slate-200 rounded-full w-16"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </main>
        </div>
      </div>
    );
  }

  // ============================================================================
  // REDESIGNED JSX & LAYOUT
  // ============================================================================

  // Get filtered data
  const filteredData = hasActiveFilters ? applyFilters(dashboardData) : { campaigns: dashboardData.campaigns, chats: dashboardData.chatContacts };

  return (
    <div className="min-h-screen bg-transparent text-slate-800">
      <div className="flex">
        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8">
          <div className="w-full max-w-screen-2xl mx-auto space-y-8">

            {/* Today's Snapshot Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Messages Today" 
                value={dashboardData.stats.messagesSent} 
                icon={<LuMessageSquare size={20} />} 
                trend={dashboardData.stats.messagesSent >= dashboardData.stats.messagesSentYesterday ? 'up' : 'down'} 
                trendValue={`${calculatePercentageChange(dashboardData.stats.messagesSent, dashboardData.stats.messagesSentYesterday)} vs yesterday`} 
              />
              <StatCard 
                label="Total Contacts" 
                value={dashboardData.stats.contacts} 
                icon={<LuUsers size={20} />} 
                trend={dashboardData.stats.contacts >= dashboardData.stats.contactsLastWeek ? 'up' : 'down'} 
                trendValue={`${calculatePercentageChange(dashboardData.stats.contacts, dashboardData.stats.contactsLastWeek)} this week`} 
              />
              <StatCard 
                label="Active Campaigns" 
                value={dashboardData.stats.activeCampaigns} 
                icon={<LuRocket size={20} />} 
                trend={dashboardData.stats.activeCampaigns > 0 ? 'up' : 'neutral'}
                trendValue={dashboardData.stats.totalCampaigns > 0 ? `${Math.round((dashboardData.stats.activeCampaigns / dashboardData.stats.totalCampaigns) * 100)}% of total` : undefined}
              />
              <StatCard 
                label="Unread Chats" 
                value={dashboardData.stats.unreadChats} 
                icon={<LuMessageCircle size={20} />} 
                trend={dashboardData.stats.unreadChats > 0 ? 'up' : 'neutral'} 
                trendValue={dashboardData.stats.chatConversations > 0 ? `${Math.round((dashboardData.stats.unreadChats / dashboardData.stats.chatConversations) * 100)}% of chats` : 'No unread chats'} 
              />
            </div>
            
            {/* Main Content Row: Chart and Profile/Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Side: Message Usage Overview + Account Overview */}
              <div className="lg:col-span-8" style={{ marginTop: '25px' }}>
                <Card title="Message Usage Overview" description="Weekly trend of messages sent" icon={<LuTrendingUp />}>
                  {dashboardData.stats.totalMessages === 0 ? (
                    <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                      <div className="text-center">
                        <LuMessageSquare size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-600 font-medium">No messages sent yet</p>
                        <p className="text-slate-500 text-sm">Your message activity will appear here</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64">
                      <Line
                        data={dashboardData.messageHistory}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: { display: false },
                          },
                          scales: {
                            x: {
                              grid: { display: false },
                              ticks: { color: '#64748b' },
                            },
                            y: {
                              grid: { color: '#e2e8f0' },
                              ticks: { color: '#64748b' },
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-3 text-center border-t border-slate-200 mt-6 pt-5">
                    <div>
                      <p className="text-sm text-slate-500">Total Sent</p>
                      <p className="font-semibold text-slate-800">
                        {dashboardData.stats.totalMessages.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Successful</p>
                      <p className="font-semibold text-emerald-600">
                        {dashboardData.stats.successfulMessages.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Failed</p>
                      <p className="font-semibold text-red-600">
                        {dashboardData.stats.failedMessages.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Account Overview Card - Below Message Usage with 25px gap */}
                <div style={{ marginTop: '25px' }}>
                  <Card title="Account Overview" description="Your subscription and balance details" icon={<LuWallet />}>
                  <div className="space-y-4">
                    {/* Balance Section */}
                    <div className="bg-gradient-to-br from-[#2A8B8A] to-[#238080] rounded-lg p-4 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm opacity-90">Current Balance</span>
                        <LuWallet size={20} className="opacity-75" />
                      </div>
                      <div className="text-3xl font-bold mb-1">₹{balance.toFixed(2)}</div>
                      {balance < 100 && (
                        <div className="text-xs opacity-90 mb-3">⚠️ Balance is running low</div>
                      )}
                      {hasPermission('add_balance') && (
                        <button
                          onClick={() => setShowAddBalanceModal(true)}
                          className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <LuWallet size={16} />
                          Add Funds
                        </button>
                      )}
                    </div>

                    {/* Subscription Plan */}
                    <div className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-700">Subscription Plan</h4>
                        <LuCreditCard size={18} className="text-slate-400" />
                      </div>
                      {user && (user as any).subscription ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Plan</span>
                            <span className="text-sm font-medium text-slate-800">
                              {(user as any).subscription.plan_name || 'Active'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">Status</span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              (user as any).subscription.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {(user as any).subscription.status === 'active' ? '✓ Active' : 'Inactive'}
                            </span>
                          </div>
                          {(user as any).subscription.end_date && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">Renewal</span>
                              <span className="text-sm font-medium text-slate-800">
                                {formatDate((user as any).subscription.end_date)}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => router.push('/billing')}
                            className="w-full mt-2 text-xs font-semibold text-[#2A8B8A] hover:text-[#238080] py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Manage Subscription →
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-sm text-slate-600 mb-3">No active subscription</p>
                          <button
                            onClick={() => router.push('/select-plan')}
                            className="text-xs font-semibold text-white bg-[#2A8B8A] hover:bg-[#238080] py-2 px-4 rounded-lg transition-colors"
                          >
                            Choose a Plan →
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <LuActivity size={18} className="text-slate-400" />
                        Quick Stats
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Templates</span>
                          <span className="text-sm font-bold text-slate-800">{dashboardData.stats.templates}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Automations</span>
                          <span className="text-sm font-bold text-slate-800">{dashboardData.stats.automations}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Total Campaigns</span>
                          <span className="text-sm font-bold text-slate-800">{dashboardData.stats.totalCampaigns}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Broadcasts</span>
                          <span className="text-sm font-bold text-slate-800">{dashboardData.stats.broadcasts}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                </div>
              </div>

              {/* Right Side: Profile and Alerts */}
              <div className="lg:col-span-4 space-y-8">
                {/* WhatsApp Profile Card */}
                <Card title="WhatsApp Profile" description="Manage your business details" icon={<LuUser />}
                  headerRight={
                    (dashboardData.whatsappProfile as any)?.connected && (
                      <div className="flex items-center gap-2">
                        {hasPermissionError && (
                          <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                            Meta App Issue
                          </span>
                        )}
                        <button 
                          onClick={() => {
                            if (hasPermissionError) {
                              // Show explanation instead of enabling edit
                              alert('Profile editing is currently disabled due to Meta App configuration issues. Check the troubleshooting section in Settings for details.');
                              return;
                            }
                            setIsEditingProfile(!isEditingProfile);
                          }} 
                          className={`text-slate-500 hover:text-[#2A8B8A] transition-colors ${hasPermissionError ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={hasPermissionError ? 'Profile editing disabled due to Meta App configuration issues' : 'Edit profile'}
                        >
                          {isEditingProfile ? <LuCircle size={20} /> : <LuPencilLine size={20} />}
                        </button>
                      </div>
                    )
                  }
                >
                  {!(dashboardData.whatsappProfile as any)?.connected ? (
                    <Alert type="error" message="Your WhatsApp Business Account is not connected." actionText="Connect Now" onAction={connectWhatsApp} />
                  ) : (
                    <div className="space-y-4">
                      {hasPermissionError && (
                        <div className="space-y-3">
                          <Alert 
                            type="warning" 
                            message="Profile update failed due to insufficient permissions. You need to disconnect and reconnect your WhatsApp account with additional permissions to manage business profiles." 
                            actionText="Force Reconnect" 
                            onAction={connectWhatsApp} 
                          />
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium mb-2">Troubleshooting Steps:</p>
                            <ol className="list-decimal list-inside space-y-1">
                              <li>Click "Force Reconnect" above to disconnect and reconnect</li>
                              <li>When redirected to Meta/Facebook, ensure you grant ALL requested permissions</li>
                              <li>If the issue persists, check browser console for detailed error logs</li>
                              <li>Contact support if problems continue after following these steps</li>
                            </ol>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        {wpPhotoPreview || (dashboardData.whatsappProfile as any)?.profile_picture_url ? (
                          <img
                            src={wpPhotoPreview || (dashboardData.whatsappProfile as any)?.profile_picture_url}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                            <LuUser size={24} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-lg font-semibold text-slate-800">{(dashboardData.whatsappProfile as any)?.business_name || 'Your Business'}</p>
                          <p className="text-sm text-slate-500">{(dashboardData.whatsappProfile as any)?.phone}</p>
                        </div>
                      </div>

                      {!isEditingProfile ? (
                        <div className="space-y-2 text-sm text-slate-600">
                          <p><strong>Category:</strong> {(dashboardData.whatsappProfile as any)?.category || 'N/A'}</p>
                          <p><strong>About:</strong> {(dashboardData.whatsappProfile as any)?.about || 'No bio set.'}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="wpCategory" className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                              id="wpCategory"
                              value={wpCategory}
                              onChange={(e) => setWpCategory(e.target.value)}
                              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-[#2A8B8A] focus:ring-[#2A8B8A] sm:text-sm"
                            >
                              <option value="">Select category</option>
                              <option>Automotive</option>
                              <option>Beauty</option>
                              <option>Education</option>
                              <option>Finance</option>
                              <option>Food & Beverage</option>
                              <option>Healthcare</option>
                              <option>Retail</option>
                              <option>Technology</option>
                              <option>Travel</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="wpAbout" className="block text-sm font-medium text-slate-700 mb-1">About/Bio</label>
                            <textarea
                              id="wpAbout"
                              value={wpAbout}
                              onChange={(e) => setWpAbout(e.target.value)}
                              rows={3}
                              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-[#2A8B8A] focus:ring-[#2A8B8A] sm:text-sm"
                              placeholder="Tell customers about your business..."
                            ></textarea>
                          </div>
                          <div>
                            <label htmlFor="wpPhoto" className="block text-sm font-medium text-slate-700 mb-1">Profile Photo</label>
                            <input
                              id="wpPhoto"
                              type="file"
                              accept="image/*"
                              onChange={(e) => onPhotoChange(e.target.files ? e.target.files[0] : null)}
                              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2A8B8A]/10 file:text-[#2A8B8A] hover:file:bg-[#2A8B8A]/20"
                            />
                          </div>
                          {wpMsg && (
                            <div className="space-y-2">
                              <p className={`text-xs text-center ${wpMsg.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>
                                {wpMsg}
                              </p>
                              {wpMsg.includes('Insufficient permissions') && (
                                <button
                                  onClick={() => router.push('/settings')}
                                  className="w-full text-xs text-[#2A8B8A] hover:text-[#238080] underline"
                                >
                                  Reconnect WhatsApp Account
                                </button>
                              )}
                            </div>
                          )}
                          <button
                            onClick={saveWhatsAppProfile}
                            disabled={wpSaving}
                            className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#2A8B8A] hover:bg-[#238080] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A8B8A]"
                          >
                            {wpSaving ? 'Saving...' : <><LuSave size={16} /> Save Changes</>}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Smart Alerts Card */}
                <Card title="Smart Alerts" description="Important notifications" icon={<LuSparkles />}>
                  <div className="space-y-4">
                    {balance < 100 ? (
                      <Alert
                        type="warning"
                        message={<span>Your account balance is low (₹{balance.toFixed(2)}).</span>}
                        actionText={hasPermission('add_balance') ? "Add Funds Now" : undefined}
                        onAction={hasPermission('add_balance') ? () => setShowAddBalanceModal(true) : undefined}
                      />
                    ) : (
                      <Alert type="success" message="Your account balance is healthy." />
                    )}

                    {!(dashboardData.metaPaymentMethods as any)?.payment_gateway?.enabled && hasPermission('view_billing') ? (
                      <Alert
                        type="warning"
                        message="No payment method on file. Set one up to ensure uninterrupted service."
                        actionText="Setup Payment Method"
                        onAction={() => router.push('/billing')}
                      />
                    ) : hasPermission('view_billing') ? (
                      <Alert type="info" message="Payment methods are configured. You're all set!" />
                    ) : null}

                    {!(dashboardData.whatsappProfile as any)?.connected && (
                      <Alert
                        type="error"
                        message="Your WhatsApp profile is not connected. This is required to send messages."
                        actionText="Connect WhatsApp"
                        onAction={connectWhatsApp}
                      />
                    )}
                  </div>
                </Card>

                {/* Recent Chats - Below Smart Alerts */}
                <Card title="Recent Chats" description={`Your latest conversations with contacts${dashboardData.stats.unreadChats > 0 ? ` (${dashboardData.stats.unreadChats} unread)` : ''}`} icon={<LuMessageCircle />}
                headerRight={
                  <button onClick={() => router.push('/chats')} className="text-sm font-semibold text-[#2A8B8A] hover:underline">
                    View All <span className="ml-1">→</span>
                  </button>
                }
              >
                {(filteredData.chats as any)?.contacts?.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {deduplicateContacts((filteredData.chats as any).contacts).slice(0, 5).map((contact: any, index: number) => (
                      <li key={`${contact.phone}-${index}`} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold">
                              {contact.name ? (
                                contact.name.charAt(0).toUpperCase()
                              ) : (
                                <LuUser size={16} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{contact.name || contact.phone}</p>
                              <p className="text-xs text-slate-500 truncate max-w-xs">{contact.lastMessage || 'No recent messages'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {contact.unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-500 rounded-full">{contact.unreadCount}</span>
                            )}
                            <LuClock size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-500">{formatTimeAgo(contact.lastMessageTime || contact.last_message_time)}</span>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <LuMessageCircle size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-slate-700">
                      {hasActiveFilters ? 'No chats match your filters' : 'No Recent Chats'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Your latest conversations will appear here.'}
                    </p>
                  </div>
                )}
              </Card>

              {/* Campaigns Card - Below Recent Chats */}
              <Card title="Active Campaigns" description={`${dashboardData.stats.activeCampaigns} active out of ${dashboardData.stats.totalCampaigns} total`} icon={<LuRocket />}
                headerRight={
                  <button onClick={() => router.push('/campaigns')} className="text-sm font-semibold text-[#2A8B8A] hover:underline">
                    View All <span className="ml-1">→</span>
                  </button>
                }
              >
                {(filteredData.campaigns as any)?.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {(filteredData.campaigns as any).slice(0, 10).map((campaign: any, index: number) => (
                      <li key={campaign.id || index} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-gradient-to-br from-[#2A8B8A] to-[#238080] text-white rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            <LuRocket size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{campaign.name}</p>
                            <p className="text-xs text-slate-500">
                              {campaign.status === 'active' ? '🟢 Active' : campaign.status === 'paused' ? '⏸️ Paused' : '⏹️ Stopped'}
                              {campaign.total_messages > 0 && ` • ${campaign.total_messages} messages`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {campaign.status === 'active' && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full">
                              Running
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <LuRocket size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-slate-700">
                      {hasActiveFilters ? 'No campaigns match your filters' : 'No Active Campaigns'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Create your first campaign to get started.'}
                    </p>
                  </div>
                )}
              </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Balance Modal (Unchanged) */}
      <AddBalanceModal
        isOpen={showAddBalanceModal}
        onClose={() => setShowAddBalanceModal(false)}
      />
    </div>
  );
}