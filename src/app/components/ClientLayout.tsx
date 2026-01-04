"use client";

import Link from "next/link";
import { useState, useEffect, useRef, ReactNode } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { BalanceProvider, useBalance } from "../contexts/BalanceContext";
import { useUser } from "../contexts/UserContext";
import { usePermissions } from "../contexts/PermissionContext";
import { useChatContext } from "../contexts/ChatContext";
import { useDashboard } from "../contexts/DashboardContext";
import { apiService } from "../services/apiService";
import AddBalanceModal from "./AddBalanceModal";
import { useThemeToggle, useThemeWatcher, getThemeColors } from "../hooks/useThemeToggle";
import {
  LuLayoutGrid,
  LuSend,
  LuRocket,
  LuFileText,
  LuUsers,
  LuWand,
  LuGitFork,
  LuPlay,
  LuChartBar,
  LuSettings,
  LuCreditCard,
  LuUser,
  LuLogOut,
  LuCircleAlert,
  LuMoon,
  LuSun,
  LuChevronUp,
  LuMessageSquare,
  LuPuzzle,
  LuMegaphone,
  LuWallet,
  LuPlus,
  LuClock,
  LuShield,
  LuMail,
  LuLink,
  LuMonitor,
  LuFilter,
  LuInstagram,
  LuBot,
  LuMessageCircle,
  LuImage,
  LuCalendar,
  LuZap,
  LuBell,
  LuBellRing,
  LuSearch,
  LuX,
  LuCheck,
  LuCircleCheck,
  LuInfo,
  LuCircle
} from "react-icons/lu";

// ============================================================================
// Super Admin Configuration
// ============================================================================
const SUPER_ADMIN_EMAILS = ["admin@stitchbyte.com", "info@stitchbyte.in", "mayurbhargava026@gmail.com"];

// ============================================================================
// Navigation Configuration (Defined outside the component for performance)
// ============================================================================

const navConfig = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <LuLayoutGrid size={20} />, permission: "view_dashboard" },
      { href: "/send-message", label: "Send Message", icon: <LuSend size={20} />, permission: "send_message" },
      { href: "/scheduled-messages", label: "Scheduled Messages", icon: <LuClock size={20} />, permission: "view_messages" },
      { href: "/campaigns", label: "Campaigns", icon: <LuRocket size={20} />, permission: "view_campaigns" },
      { href: "/templates", label: "Templates", icon: <LuFileText size={20} />, permission: "view_templates" },
      { href: "/contacts", label: "Contacts", icon: <LuUsers size={20} />, permission: "view_contacts" },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/instagram", label: "Instagram Hub", icon: <LuInstagram size={20} />, permission: "view_dashboard" },
      { href: "/whatsapp-link", label: "WhatsApp Link Generator", icon: <LuLink size={20} />, permission: "view_dashboard" },
      { href: "/whatsapp-widget", label: "Website Widget", icon: <LuMonitor size={20} />, permission: "view_dashboard" },
    ],
  },
  {
    title: "Automation",
    items: [
      { href: "/automations", label: "Automations", icon: <LuWand size={20} />, permission: "manage_integrations" },
      { href: "/workflows", label: "Workflows", icon: <LuGitFork size={20} />, permission: "manage_integrations" },
      { href: "/triggers", label: "Triggers", icon: <LuPlay size={20} />, permission: "manage_integrations", comingSoon: true },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/chats", label: "Live Chats", icon: <LuMessageSquare size={20} />, notificationKey: "unreadChats", permission: "view_messages" },
      { href: "/email-sender", label: "Email Sender", icon: <LuMail size={20} />, permission: "send_message" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/logs", label: "Message Logs", icon: <LuFileText size={20} />, permission: "view_messages" },
      { href: "/analytics", label: "Analytics", icon: <LuChartBar size={20} />, permission: "view_analytics" },
      { href: "/integrations-marketplace", label: "Integrations", icon: <LuPuzzle size={20} />, permission: "view_integrations" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/profile", label: "Profile", icon: <LuUser size={20} /> }, // Always accessible
      { href: "/settings", label: "Settings", icon: <LuSettings size={20} /> }, // Always accessible
      { href: "/billing", label: "Billing", icon: <LuCreditCard size={20} />, permission: "view_billing" },
    ]
  }
];

// ============================================================================
// Helper Components (Now included in the same file to avoid conflicts)
// ============================================================================

const NavItem = ({ href, icon, label, isActive, notificationCount, comingSoon, onComingSoonClick }: { 
  href: string, 
  icon: ReactNode, 
  label: string, 
  isActive: boolean, 
  notificationCount?: number,
  comingSoon?: boolean,
  onComingSoonClick?: () => void 
}) => {
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);

  if (comingSoon) {
    return (
      <button 
        onClick={onComingSoonClick}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium w-full text-left relative"
        style={{
          backgroundColor: colors.background,
          color: colors.textSecondary,
          opacity: 0.7
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.background;
        }}>
        {icon}
        <span className="flex-1">{label}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
          Soon
        </span>
      </button>
    );
  }

  return (
    <Link href={href} 
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium"
          style={{
            backgroundColor: isActive ? colors.active : colors.background,
            color: isActive ? '#ffffff' : colors.textSecondary
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = colors.hover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = colors.background;
            }
          }}>
      {icon}
      <span className="flex-1">{label}</span>
      {notificationCount && notificationCount > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}
    </Link>
  );
};

const BalanceHeader = ({ onTopUpClick }: { onTopUpClick: () => void }) => {
    const { balance } = useBalance();
    const { darkMode } = useThemeWatcher();
    const { hasPermission } = usePermissions();
    const colors = getThemeColors(darkMode);

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-lg border"
                 style={{
                   backgroundColor: colors.backgroundTertiary,
                   borderColor: colors.border,
                   color: colors.text
                 }}>
                <LuWallet size={18} className="text-[#2A8B8A]" />
                <span>₹{balance.toFixed(2)}</span>
            </div>
            {hasPermission('add_balance') && (
              <button
                onClick={onTopUpClick}
                className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold bg-[#2A8B8A] text-white rounded-lg shadow-sm hover:bg-[#238080] transition-colors"
              >
                  <LuPlus size={16} /> Top Up
              </button>
            )}
        </div>
    );
};


// ============================================================================
// Dropdown Components for Search and Notifications
// ============================================================================

const SearchFilterDropdown = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { searchQuery, setSearchQuery, dateFilter, setDateFilter, statusFilter, setStatusFilter } = useDashboard();
  const { darkMode } = useThemeWatcher();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const hasActiveFilters = searchQuery.trim() !== '' || dateFilter !== 'all' || statusFilter !== 'all';
  
  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setStatusFilter('all');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-[600px] rounded-xl border shadow-xl z-50"
      style={{
        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
        borderColor: darkMode ? '#475569' : '#e2e8f0'
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2"
              style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
            <LuFilter size={20} />
            Search & Filter
          </h3>
          <button
            onClick={onClose}
            className="hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded"
            style={{ color: darkMode ? '#94a3b8' : '#64748b' }}
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium mb-2"
                   style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
              Search
            </label>
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                        size={18}
                        style={{ color: darkMode ? '#64748b' : '#94a3b8' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns, contacts..."
                className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                style={{
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                  borderColor: darkMode ? '#475569' : '#cbd5e1',
                  color: darkMode ? '#f1f5f9' : '#1e293b',
                  border: '1px solid'
                }}
              />
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-2"
                   style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
              style={{
                backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                borderColor: darkMode ? '#475569' : '#cbd5e1',
                color: darkMode ? '#f1f5f9' : '#1e293b',
                border: '1px solid'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2"
                   style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
              style={{
                backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                borderColor: darkMode ? '#475569' : '#cbd5e1',
                color: darkMode ? '#f1f5f9' : '#1e293b',
                border: '1px solid'
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>

        {/* Active Filters & Clear */}
        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between pt-4 border-t"
               style={{ borderColor: darkMode ? '#475569' : '#e2e8f0' }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                Active filters:
              </span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2A8B8A]/10 text-[#2A8B8A] text-sm rounded-full">
                  Search: "{searchQuery.substring(0, 20)}{searchQuery.length > 20 ? '...' : ''}"
                  <button onClick={() => setSearchQuery('')} className="hover:bg-[#2A8B8A]/20 rounded-full p-0.5">
                    <LuX size={14} />
                  </button>
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2A8B8A]/10 text-[#2A8B8A] text-sm rounded-full">
                  Date: {dateFilter}
                  <button onClick={() => setDateFilter('all')} className="hover:bg-[#2A8B8A]/20 rounded-full p-0.5">
                    <LuX size={14} />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2A8B8A]/10 text-[#2A8B8A] text-sm rounded-full">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('all')} className="hover:bg-[#2A8B8A]/20 rounded-full p-0.5">
                    <LuX size={14} />
                  </button>
                </span>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-[#2A8B8A] hover:underline"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Notification Trigger Component - Must be inside BalanceProvider
// ============================================================================
const NotificationTrigger = () => {
  const { balance } = useBalance();
  const { 
    showWelcomeNotification, 
    checkAndShowBalanceNotification,
    showBalanceUsedNotification 
  } = useDashboard();
  const { user } = useUser();
  const prevBalanceRef = useRef<number | null>(null);
  const hasCheckedWelcomeRef = useRef(false);

  // Check for welcome notification on first load (only once per session)
  useEffect(() => {
    if (user && !hasCheckedWelcomeRef.current) {
      hasCheckedWelcomeRef.current = true;
      // Show welcome notification for the user
      showWelcomeNotification(user.name || user.email || 'User');
    }
  }, [user, showWelcomeNotification]);

  // Check balance and show appropriate notifications
  useEffect(() => {
    if (balance !== undefined && balance !== null) {
      // Check for low/zero balance
      checkAndShowBalanceNotification(balance);
      
      // Check if balance was used (decreased)
      if (prevBalanceRef.current !== null && prevBalanceRef.current > balance) {
        const amountUsed = prevBalanceRef.current - balance;
        showBalanceUsedNotification(amountUsed, balance);
      }
      
      prevBalanceRef.current = balance;
    }
  }, [balance, checkAndShowBalanceNotification, showBalanceUsedNotification]);

  return null; // This component only triggers notifications, no UI
};

const NotificationsDropdown = ({ 
  isOpen, 
  onClose, 
  notifications, 
  markAsRead, 
  markAllAsRead, 
  clearNotification,
  formatTimeAgo 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  notifications: any[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  formatTimeAgo: (date: string | Date) => string;
}) => {
  const { unreadCount } = useDashboard();
  const { darkMode } = useThemeWatcher();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle action click - supports both actionUrl (new) and action function (legacy)
  const handleAction = (notif: any) => {
    markAsRead(notif.id);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    } else if (notif.action && typeof notif.action === 'function') {
      notif.action();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-[450px] rounded-xl border shadow-xl overflow-hidden z-50"
      style={{
        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
        borderColor: darkMode ? '#475569' : '#e2e8f0'
      }}
    >
      <div className="flex items-center justify-between p-4 border-b"
           style={{
             backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
             borderColor: darkMode ? '#475569' : '#e2e8f0'
           }}>
        <h3 className="text-lg font-semibold flex items-center gap-2"
            style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
          <LuBell size={20} />
          Notifications
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm font-semibold text-[#2A8B8A] hover:underline flex items-center gap-1"
            >
              <LuCheck size={16} />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded"
            style={{ color: darkMode ? '#94a3b8' : '#64748b' }}
          >
            <LuX size={20} />
          </button>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <LuBell size={48} className="mx-auto mb-3"
                    style={{ color: darkMode ? '#475569' : '#cbd5e1' }} />
            <p className="font-medium" style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
              No notifications
            </p>
            <p className="text-sm" style={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: darkMode ? '#334155' : '#f1f5f9' }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition-all cursor-pointer group ${
                  !notif.read ? (darkMode ? 'bg-slate-800/50' : 'bg-blue-50/30') : ''
                }`}
                style={{
                  backgroundColor: !notif.read 
                    ? (darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(239, 246, 255, 0.3)') 
                    : undefined
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = !notif.read 
                    ? (darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(239, 246, 255, 0.3)') 
                    : '';
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    notif.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    notif.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {notif.type === 'success' && <LuCircleCheck size={20} />}
                    {notif.type === 'warning' && <LuInfo size={20} />}
                    {notif.type === 'error' && <LuCircle size={20} />}
                    {notif.type === 'info' && <LuBell size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold" 
                            style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                          {notif.title}
                        </h4>
                        <p className="text-sm mt-0.5" 
                           style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
                          {notif.message}
                        </p>
                        <p className="text-xs mt-1" 
                           style={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                          {formatTimeAgo(notif.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => clearNotification(notif.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        style={{
                          backgroundColor: 'transparent',
                          color: darkMode ? '#94a3b8' : '#64748b',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = darkMode ? '#475569' : '#e2e8f0';
                          e.currentTarget.style.color = darkMode ? '#f1f5f9' : '#1e293b';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = darkMode ? '#94a3b8' : '#64748b';
                        }}
                        tabIndex={-1}
                        aria-label="Clear notification"
                      >
                        <LuX size={16} />
                      </button>
                    </div>
                    {(notif.action || notif.actionUrl) && (
                      <button
                        onClick={() => handleAction(notif)}
                        className="mt-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors"
                        style={{
                          color: '#2A8B8A',
                          backgroundColor: darkMode ? 'rgba(42, 139, 138, 0.1)' : 'rgba(42, 139, 138, 0.08)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = darkMode ? 'rgba(42, 139, 138, 0.25)' : 'rgba(42, 139, 138, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = darkMode ? 'rgba(42, 139, 138, 0.1)' : 'rgba(42, 139, 138, 0.08)';
                        }}
                      >
                        {notif.actionLabel || 'Take Action'} →
                      </button>
                    )}
                  </div>
                  {!notif.read && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-xs hover:opacity-75"
                        title="Mark as read"
                      >
                        <div className="w-2 h-2 bg-[#2A8B8A] rounded-full"></div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// ============================================================================
// Main Layout Component
// ============================================================================
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [isStandalonePage, setIsStandalonePage] = useState(false);
  const [showComingSoonToast, setShowComingSoonToast] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useUser();
  const { permissions, hasPermission } = usePermissions();
  const { totalUnreadCount } = useChatContext();
  const { 
    showNotifications, setShowNotifications, 
    showSearchFilter, setShowSearchFilter, 
    unreadCount, searchQuery, dateFilter, statusFilter,
    notifications, setNotifications, setUnreadCount,
    markNotificationAsRead, markAllNotificationsAsRead, clearNotificationById,
    showWelcomeNotification, checkAndShowBalanceNotification
  } = useDashboard();
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  const router = useRouter();
  
  // Alias notification functions for component compatibility
  const markAllAsRead = markAllNotificationsAsRead;
  const clearNotification = clearNotificationById;

  const isPublicRoute = pathname === '/' || ['/auth', '/landing', '/select-plan', '/about', '/blog', '/careers', '/help', '/api-docs', '/status', '/security', '/privacy', '/terms'].some(p => pathname.startsWith(p)) || pathname === '/integrations';
  const isFullScreenRoute = pathname.startsWith('/automations/builder') || 
                            (pathname.startsWith('/automations') && searchParams?.get('mode') === 'builder');
  
  // Handle coming soon feature clicks
  const handleComingSoonClick = (featureName: string) => {
    setComingSoonFeature(featureName);
    setShowComingSoonToast(true);
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      setShowComingSoonToast(false);
    }, 4000);
  };
  
  // Check if this is a standalone page (like 404) on mount and on route changes
  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone = document.body.getAttribute('data-standalone-page') === 'true';
      setIsStandalonePage(isStandalone);
    };
    
    checkStandalone();
    
    // Set up a mutation observer to watch for changes
    const observer = new MutationObserver(checkStandalone);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-standalone-page'] });
    
    return () => observer.disconnect();
  }, [pathname]);
  
  // Filter navigation items based on permissions
  const filteredNavConfig = navConfig.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // If no permission is required, always show the item
      if (!item.permission) return true;
      
      // For team members, check if they have the required permission
      if (user?.isTeamMember === true) {
        return hasPermission(item.permission);
      }
      
      // For main account users (or when isTeamMember is undefined/false), show all items
      return true;
    })
  })).filter(group => group.items.length > 0); // Remove empty groups
  
  // Simple hydration check
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Play notification sound when unread count increases (with cooldown)
  const prevUnreadCountRef = useRef(totalUnreadCount);
  const lastSoundTimeRef = useRef(0);
  const SOUND_COOLDOWN = 2000; // 2 seconds cooldown between sounds

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastSound = now - lastSoundTimeRef.current;
    
    // Only play sound if:
    // 1. Count actually increased
    // 2. Previous count was not 0 (avoid playing on initial load)
    // 3. Enough time has passed since last sound (cooldown)
    if (totalUnreadCount > prevUnreadCountRef.current && 
        prevUnreadCountRef.current > 0 && 
        timeSinceLastSound > SOUND_COOLDOWN) {
      
      audioRef.current?.play().catch(() => {});
      lastSoundTimeRef.current = now;
    }
    
    prevUnreadCountRef.current = totalUnreadCount;
  }, [totalUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActiveRoute = (route: string) => isHydrated && pathname.startsWith(route);
  
  // Notification helper functions
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
  
  const getPageTitle = () => {
      const allItems = navConfig.flatMap(g => g.items);
      const currentItem = allItems.find(item => pathname.startsWith(item.href));
      return currentItem?.label || 'Dashboard';
  };

  if (!isHydrated) {
    // Render a blank screen during hydration to prevent theme flash and layout shifts
    return <div className="min-h-screen bg-slate-100" />;
  }

  // Skip layout for standalone pages (like 404), public routes, or full-screen routes
  if (isStandalonePage || isPublicRoute || isFullScreenRoute) {
    return <>{children}</>;
  }

  return (
    <BalanceProvider>
      {/* Notification trigger component - handles automatic notifications */}
      <NotificationTrigger />
      <div className="min-h-screen flex" style={{ backgroundColor: colors.background }}>
        <aside className="w-72 flex flex-col border-r fixed left-0 top-0 h-full z-50" 
               style={{ 
                 backgroundColor: colors.background,
                 borderColor: colors.border
               }}>
          <div className="p-6 border-b" 
               style={{ borderColor: colors.border }}>
             <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2A8B8A] rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-xl">S</span>
                </div>
                <div>
                    <span className="text-xl font-bold tracking-tight" 
                          style={{ color: colors.text }}>
                      StitchByte
                    </span>
                    <p className="text-xs -mt-1" 
                       style={{ color: colors.textMuted }}>
                      WhatsApp Automation
                    </p>
                </div>
             </Link>
          </div>
          <nav className="flex-1 px-4 py-4 overflow-y-auto scrollbar-hide" 
               style={{ 
                 backgroundColor: colors.background,
                 scrollbarWidth: 'none', /* Firefox */
                 msOverflowStyle: 'none'  /* Internet Explorer 10+ */
               }}>
             {filteredNavConfig.map((group) => (
               <div key={group.title} className="mb-2">
                 <h3 className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" 
                     style={{ color: colors.textMuted }}>
                   {group.title}
                 </h3>
                 <div className="space-y-1">
                   {group.items.map((item) => (
                     <NavItem 
                       key={item.href} 
                       href={item.href}
                       icon={item.icon}
                       label={item.label}
                       isActive={isActiveRoute(item.href)} 
                       notificationCount={'notificationKey' in item && item.notificationKey === 'unreadChats' ? totalUnreadCount : undefined}
                       comingSoon={('comingSoon' in item && item.comingSoon === true) ? true : false}
                       onComingSoonClick={() => handleComingSoonClick(item.label)}
                     />
                   ))}
                 </div>
               </div>
             ))}
          </nav>
          <div className="p-4 border-t relative" 
               style={{ borderColor: colors.border }} 
               ref={profileRef}>
            {isProfileMenuOpen && (
                 <div className="absolute bottom-4 left-full ml-2 w-60 z-50">
                     <div className="rounded-xl shadow-2xl border p-2"
                          style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border
                          }}>
                         <Link href="/profile" 
                               className="flex items-center gap-3 w-full text-left p-2 rounded-lg text-sm transition-colors"
                               style={{ color: colors.textSecondary }}
                               onMouseEnter={(e) => {
                                 e.currentTarget.style.backgroundColor = colors.hover;
                               }}
                               onMouseLeave={(e) => {
                                 e.currentTarget.style.backgroundColor = 'transparent';
                               }}>
                           <LuUser size={16}/> Profile
                         </Link>
                         <Link href="/settings" 
                               className="flex items-center gap-3 w-full text-left p-2 rounded-lg text-sm transition-colors"
                               style={{ color: colors.textSecondary }}
                               onMouseEnter={(e) => {
                                 e.currentTarget.style.backgroundColor = colors.hover;
                               }}
                               onMouseLeave={(e) => {
                                 e.currentTarget.style.backgroundColor = 'transparent';
                               }}>
                           <LuSettings size={16}/> Settings
                         </Link>
                         <div className="h-px my-1" 
                              style={{ backgroundColor: colors.border }}></div>
                         <Link href="/help" 
                               className="flex items-center gap-3 w-full text-left p-2 rounded-lg text-sm transition-colors"
                               style={{ color: colors.textSecondary }}
                               onMouseEnter={(e) => {
                                 e.currentTarget.style.backgroundColor = colors.hover;
                               }}
                               onMouseLeave={(e) => {
                                 e.currentTarget.style.backgroundColor = 'transparent';
                               }}>
                           <LuCircleAlert size={16}/> Help Center
                         </Link>
                         <button 
                           onClick={toggleTheme} 
                           className="flex items-center gap-3 w-full text-left p-2 rounded-lg text-sm transition-colors justify-between"
                           style={{ color: darkMode ? '#cbd5e1' : '#475569' }}
                           onMouseEnter={(e) => {
                             e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f1f5f9';
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.backgroundColor = 'transparent';
                           }}
                         >
                            <div className="flex items-center gap-3">
                              {darkMode ? <LuSun size={16}/> : <LuMoon size={16}/>} 
                              Theme
                            </div>
                            <span className="text-xs" 
                                  style={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                              {darkMode ? 'Light' : 'Dark'}
                            </span>
                         </button>
                         <div className="h-px my-1" 
                              style={{ backgroundColor: darkMode ? '#475569' : '#e2e8f0' }}></div>
                         <button onClick={logout} 
                                 className="flex items-center gap-3 w-full text-left p-2 rounded-lg text-sm transition-colors text-red-600"
                                 onMouseEnter={(e) => {
                                   e.currentTarget.style.backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2';
                                   e.currentTarget.style.color = '#dc2626';
                                 }}
                                 onMouseLeave={(e) => {
                                   e.currentTarget.style.backgroundColor = 'transparent';
                                   e.currentTarget.style.color = '#dc2626';
                                 }}>
                           <LuLogOut size={16}/> Logout
                         </button>
                     </div>
                 </div>
            )}
            <button onClick={() => setIsProfileMenuOpen(prev => !prev)} 
                    className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                <img 
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=E0F2F1&color=00796B&size=128`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 text-left">
                    <p className="text-sm font-semibold" 
                       style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                      {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
                    </p>
                    <p className="text-xs capitalize" 
                       style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                      {user?.role || 'User'}
                    </p>
                </div>
                <LuChevronUp size={16} 
                             className={`transition-transform ${isProfileMenuOpen ? 'rotate-180' : 'rotate-0'}`}
                             style={{ color: darkMode ? '#94a3b8' : '#64748b' }} />
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-72">
          <header className="backdrop-blur-md border-b px-8 py-6 sticky top-0 z-40 flex justify-between items-center relative"
                  style={{
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: darkMode ? '#475569' : '#e2e8f0',
                    padding: '27px'
                  }}>
             <h1 className="text-2xl font-bold" 
                 style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
               {getPageTitle()}
             </h1>
             
             <div className="flex items-center gap-4 relative">
               {/* Show Search only on dashboard */}
               {pathname === '/dashboard' && (
                 <div className="relative">
                   <button
                     onClick={() => {
                       setShowSearchFilter(!showSearchFilter);
                       setShowNotifications(false); // Close notifications when opening search
                     }}
                     className={`relative p-2.5 rounded-lg transition-all ${
                       (searchQuery.trim() !== '' || dateFilter !== 'all' || statusFilter !== 'all')
                         ? 'bg-[#2A8B8A] text-white shadow-md' 
                         : darkMode
                         ? 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600'
                         : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                     }`}
                     title="Search and Filter"
                   >
                     <LuSearch size={20} />
                     {(searchQuery.trim() !== '' || dateFilter !== 'all' || statusFilter !== 'all') && (
                       <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
                     )}
                   </button>
                   
                   {/* Search Filter Dropdown */}
                   <SearchFilterDropdown 
                     isOpen={showSearchFilter} 
                     onClose={() => setShowSearchFilter(false)} 
                   />
                 </div>
               )}

               {/* Notifications Button - Show on ALL pages */}
               <div className="relative">
                 <button
                   onClick={() => {
                     setShowNotifications(!showNotifications);
                     setShowSearchFilter(false); // Close search when opening notifications
                   }}
                   className={`relative p-2.5 rounded-lg transition-all ${
                     darkMode
                       ? 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600'
                       : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                   }`}
                   title="Notifications"
                 >
                   {unreadCount > 0 ? <LuBellRing size={20} className="text-[#2A8B8A]" /> : <LuBell size={20} />}
                   {unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px]">
                       {unreadCount > 9 ? '9+' : unreadCount}
                     </span>
                   )}
                 </button>
                 
                 {/* Notifications Dropdown */}
                 <NotificationsDropdown 
                   isOpen={showNotifications} 
                   onClose={() => setShowNotifications(false)}
                   notifications={notifications}
                   markAsRead={markNotificationAsRead}
                   markAllAsRead={markAllAsRead}
                   clearNotification={clearNotification}
                   formatTimeAgo={formatTimeAgo}
                 />
               </div>
               
               <BalanceHeader onTopUpClick={() => setShowAddBalanceModal(true)} />
             </div>
          </header>
          <div className="p-8 min-h-screen" 
               style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
            {children}
          </div>
        </main>
      </div>

      <AddBalanceModal isOpen={showAddBalanceModal} onClose={() => setShowAddBalanceModal(false)} />
      <audio ref={audioRef} src="/notification.wav" preload="auto" />
      
      {/* Coming Soon Toast Notification */}
      {showComingSoonToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <style jsx>{`
            .animate-fade-in {
              animation: fadeIn 0.3s ease-in-out;
            }
            
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateX(100%);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
          <div className="rounded-lg shadow-lg p-4 max-w-md bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 bg-blue-500">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-800">
                  Coming Soon!
                </p>
                <p className="text-sm mt-1 text-blue-600">
                  <span className="font-semibold">{comingSoonFeature}</span> feature is currently under development. We'll notify you when it's ready!
                </p>
              </div>
              <button
                onClick={() => setShowComingSoonToast(false)}
                className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </BalanceProvider>
  );
}