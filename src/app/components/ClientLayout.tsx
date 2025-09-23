"use client";

import Link from "next/link";
import { useState, useEffect, useRef, ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BalanceProvider, useBalance } from "../contexts/BalanceContext";
import { useUser } from "../contexts/UserContext";
import { usePermissions } from "../contexts/PermissionContext";
import { useChatContext } from "../contexts/ChatContext";
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
  LuClock
} from "react-icons/lu";

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
    title: "Automation",
    items: [
      { href: "/automations", label: "Automations", icon: <LuWand size={20} />, permission: "manage_integrations" },
      { href: "/workflows", label: "Workflows", icon: <LuGitFork size={20} />, permission: "manage_integrations" },
      { href: "/triggers", label: "Triggers", icon: <LuPlay size={20} />, permission: "manage_integrations" },
    ],
  },
  {
    title: "Communication",
    items: [
      { href: "/chats", label: "Live Chats", icon: <LuMessageSquare size={20} />, notificationKey: "unreadChats", permission: "view_messages" },
      { href: "/broadcasts", label: "Broadcasts", icon: <LuMegaphone size={20} />, permission: "view_broadcasts" },
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

const NavItem = ({ href, icon, label, isActive, notificationCount }: { href: string, icon: ReactNode, label: string, isActive: boolean, notificationCount?: number }) => {
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);

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
// Main Layout Component
// ============================================================================
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useUser();
  const { permissions, hasPermission } = usePermissions();
  const { totalUnreadCount } = useChatContext();
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);

  const isPublicRoute = pathname === '/' || ['/auth', '/landing', '/select-plan', '/about', '/blog', '/careers', '/help', '/api-docs', '/status', '/security', '/privacy', '/terms'].some(p => pathname.startsWith(p)) || pathname === '/integrations';
  const isFullScreenRoute = pathname.startsWith('/automations/builder') || 
                            (pathname.startsWith('/automations') && searchParams?.get('mode') === 'builder');
  
  // Debug the user object for team member detection
  console.log('🔍 ClientLayout: User object for filtering:', {
    user: user,
    isTeamMember: user?.isTeamMember,
    role: user?.role,
    permissions: user?.permissions,
    isAuthenticated: isAuthenticated
  });
  
  // Filter navigation items based on permissions
  const filteredNavConfig = navConfig.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // If no permission is required, always show the item
      if (!item.permission) return true;
      
      // Debug all items for team members
      if (user?.isTeamMember === true) {
        console.log(`🔍 Team Member Filtering ${item.label}:`, {
          permission: item.permission,
          isTeamMember: user?.isTeamMember,
          hasPermission: hasPermission(item.permission),
          userPermissions: permissions
        });
      }
      
      // For team members, check if they have the required permission
      if (user?.isTeamMember === true) {
        console.log(`✅ Team member: showing ${item.label} = ${hasPermission(item.permission)}`);
        return hasPermission(item.permission);
      }
      
      // For main account users (or when isTeamMember is undefined/false), show all items
      console.log(`✅ Main user: showing ${item.label} = true`);
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
  const getPageTitle = () => {
      const allItems = navConfig.flatMap(g => g.items);
      const currentItem = allItems.find(item => pathname.startsWith(item.href));
      return currentItem?.label || 'Dashboard';
  };

  if (!isHydrated) {
    // Render a blank screen during hydration to prevent theme flash and layout shifts
    return <div className="min-h-screen bg-slate-100" />;
  }

  if (isPublicRoute || isFullScreenRoute) {
    return <>{children}</>;
  }

  return (
    <BalanceProvider>
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
                  src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=E0F2F1&color=00796B&size=128`} 
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
          <header className="backdrop-blur-md border-b px-8 py-6 sticky top-0 z-40 flex justify-between items-center"
                  style={{
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: darkMode ? '#475569' : '#e2e8f0'
                  }}>
             <h1 className="text-2xl font-bold" 
                 style={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
               {getPageTitle()}
             </h1>
             <BalanceHeader onTopUpClick={() => setShowAddBalanceModal(true)} />
          </header>
          <div className="p-8 min-h-screen" 
               style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
            {children}
          </div>
        </main>
      </div>

      <AddBalanceModal isOpen={showAddBalanceModal} onClose={() => setShowAddBalanceModal(false)} />
      <audio ref={audioRef} src="/notification.wav" preload="auto" />
    </BalanceProvider>
  );
}