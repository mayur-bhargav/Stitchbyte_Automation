"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BalanceProvider } from "../contexts/BalanceContext";
import { useUser } from "../contexts/UserContext";
import { apiService } from "../services/apiService";
import BalanceHeader from "./BalanceHeader";
import { 
  MdDashboard,
  MdSend,
  MdCampaign,
  MdDescription,
  MdContacts,
  MdAutoAwesome,
  MdAccountTree,
  MdPlayArrow,
  MdAnalytics,
  MdSettings,
  MdPayment,
  MdAccountBalance,
  MdPerson,
  MdLogout,
  MdHelp,
  MdDarkMode,
  MdKeyboardArrowDown,
  MdAdd,
  MdFlashOn,
  MdAccountBalanceWallet,
  MdExpandMore,
  MdCreditCard,
  MdGroup,
  MdChat
} from "react-icons/md";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [chatCount, setChatCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [previousUnreadCount, setPreviousUnreadCount] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useUser();

  // Check if current route is a public route (doesn't need sidebar)
  const isPublicRoute = pathname.startsWith('/auth') || 
                        pathname === '/' || 
                        pathname === '/landing' || 
                        pathname === '/select-plan' ||
                        pathname === '/about' ||
                        pathname === '/blog' ||
                        pathname === '/careers' ||
                        pathname === '/help' ||
                        pathname === '/api-docs' ||
                        pathname === '/integrations' ||
                        pathname === '/status' ||
                        pathname === '/security' ||
                        pathname === '/privacy' ||
                        pathname === '/terms';
  
  // Check if current route is a full-screen route (no sidebar)
  const isFullScreenRoute = pathname.startsWith('/automations/builder');

  // Ensure hydration is complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Sync darkMode state with global html class/localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(isDark);
    };
    sync();
    const onThemeChange = () => sync();
    window.addEventListener('themechange', onThemeChange as any);
    return () => window.removeEventListener('themechange', onThemeChange as any);
  }, []);

  // Fetch chat count and unread messages count
  const fetchChatCount = async () => {
    try {
      // Try to get token for authenticated request
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8000/chat/contacts', {
        headers
      });
      
      if (!response.ok) {
        // If authentication fails, set counts to 0
        setChatCount(0);
        setUnreadCount(0);
        return;
      }
      
      const data = await response.json();
      const validContacts = (data.contacts || [])
        .filter((contact: any) => contact.phone && contact.phone.trim() !== '');
      
      // Calculate total unread messages across all conversations
      const totalUnreadCount = validContacts.reduce((total: number, contact: any) => {
        return total + (contact.unread_count || 0);
      }, 0);
      
      setChatCount(validContacts.length);
      
      // Check if unread count increased (new message received)
      if (totalUnreadCount > previousUnreadCount && previousUnreadCount > 0) {
        playNotificationSound();
        showDesktopNotification(totalUnreadCount - previousUnreadCount);
      }
      
      setPreviousUnreadCount(totalUnreadCount);
      setUnreadCount(totalUnreadCount);
    } catch (error) {
      console.error('Error fetching chat count:', error);
      setChatCount(0);
      setUnreadCount(0);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.log('Could not play notification sound:', error);
      });
    }
  };

  // Show desktop notification
  const showDesktopNotification = (newMessageCount: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New WhatsApp Messages', {
        body: `You have ${newMessageCount} new message${newMessageCount > 1 ? 's' : ''}`,
        icon: '/favicon.ico',
        tag: 'chat-notification'
      });
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // Setup real-time polling for chat updates
  const setupRealTimeUpdates = () => {
    if (!user || !isAuthenticated) return;

    // Use more frequent polling for real-time feel (every 3 seconds)
    const interval = setInterval(() => {
      fetchChatCount();
    }, 3000);

    return () => clearInterval(interval);
  };

  // Fetch chat count on mount and when user changes
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchChatCount();
      requestNotificationPermission();
      
      // Setup real-time polling for updates
      const cleanup = setupRealTimeUpdates();
      
      return cleanup;
    }
  }, [user, isAuthenticated]);

  // Function to check if a route is active
  const isActiveRoute = (route: string) => {
    if (!isHydrated) return false; // Prevent hydration mismatch
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  };

  // Function to get page title based on current route
  const getPageTitle = () => {
    const routes: { [key: string]: string } = {
      '/': 'Dashboard',
      '/send-message': 'Send Message',
      '/chats': 'Live Chat',
      '/campaigns': 'Campaigns',
      '/templates': 'Templates',
      '/contacts': 'Contacts',
      '/automations': 'Automations',
      '/workflows': 'Workflows',
      '/triggers': 'Triggers',
      '/logs': 'Message Logs',
      '/analytics': 'Analytics',
      '/profile': 'Profile Settings',
      '/settings': 'Settings',
      '/billing': 'Billing'
    };
    return routes[pathname] || 'Dashboard';
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* For public routes (auth pages, landing), don't show sidebar */}
      {isPublicRoute || isFullScreenRoute ? (
        children
      ) : (
        <BalanceProvider>
          <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Sidebar */}
  <aside className="w-80 bg-white/80 backdrop-blur-sm flex flex-col border-r border-white/50 fixed left-0 top-0 h-full z-50 shadow-xl">
        {/* Logo Section */}
        <div className="p-8 border-b border-gray-200/50">
          <div className="flex items-center gap-3 mb-2">
            {/* Modern StitchByte Logo */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-gray-900">Stitch</span>
                <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">Byte</span>
              </span>
              <div className="flex items-center gap-1 -mt-1">
                <div className="h-0.5 w-4 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-full"></div>
                <div className="h-0.5 w-2 bg-gradient-to-r from-[#238080] to-[#1e6b6b] rounded-full"></div>
                <div className="h-0.5 w-1 bg-[#1e6b6b] rounded-full"></div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 font-medium">WhatsApp Automation Platform</p>
        </div>

        {/* Navigation */}
  <nav className="flex-1 px-6 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-1">
            {/* Main Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main</h3>
              <div className="space-y-1">
                <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/dashboard') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdDashboard className={`w-5 h-5 ${isActiveRoute('/dashboard') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Dashboard</span>
                </Link>
                
                <Link href="/send-message" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/send-message') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdSend className={`w-5 h-5 ${isActiveRoute('/send-message') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Send Message</span>
                </Link>
                
                <Link href="/campaigns" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/campaigns') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdCampaign className={`w-5 h-5 ${isActiveRoute('/campaigns') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Campaigns</span>
                </Link>
                
                <Link href="/templates" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/templates') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdDescription className={`w-5 h-5 ${isActiveRoute('/templates') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Templates</span>
                </Link>
                
                <Link href="/contacts" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/contacts') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdContacts className={`w-5 h-5 ${isActiveRoute('/contacts') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Contacts</span>
                </Link>
              </div>
            </div>

            {/* Automation Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Automation</h3>
              <div className="space-y-1">
                <Link href="/automations" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/automations') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdAutoAwesome className={`w-5 h-5 ${isActiveRoute('/automations') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Automations</span>
                </Link>
                
                <Link href="/workflows" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/workflows') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdAccountTree className={`w-5 h-5 ${isActiveRoute('/workflows') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Workflows</span>
                </Link>
                
                <Link href="/triggers" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/triggers') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdPlayArrow className={`w-5 h-5 ${isActiveRoute('/triggers') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Triggers</span>
                </Link>
              </div>
            </div>

            {/* Communication Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Communication</h3>
              <div className="space-y-1">
                <Link href="/chats" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/chats') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdChat className={`w-5 h-5 ${isActiveRoute('/chats') ? 'text-[#2A8B8A]' : ''}`} />
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-medium">Live Chats</span>
                    {unreadCount > 0 && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isActiveRoute('/chats')
                          ? 'bg-red-100 text-red-700'
                          : 'bg-red-500 text-white'
                      }`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
                
                <Link href="/broadcasts" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/broadcasts') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdCampaign className={`w-5 h-5 ${isActiveRoute('/broadcasts') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Broadcasts</span>
                </Link>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Analytics</h3>
              <div className="space-y-1">
                <Link href="/logs" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/logs') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdDescription className={`w-5 h-5 ${isActiveRoute('/logs') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Message Logs</span>
                </Link>
                
                <Link href="/analytics" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/analytics') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdAnalytics className={`w-5 h-5 ${isActiveRoute('/analytics') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Analytics</span>
                </Link>
              </div>
            </div>

            {/* Settings Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Settings</h3>
              <div className="space-y-1">
                <Link href="/profile" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/profile') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdPerson className={`w-5 h-5 ${isActiveRoute('/profile') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Profile</span>
                </Link>

                <Link href="/settings" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/settings') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdSettings className={`w-5 h-5 ${isActiveRoute('/settings') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Settings</span>
                </Link>
                
                <Link href="/billing" className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg ${
                  isActiveRoute('/billing') 
                    ? 'bg-[#2A8B8A]/10 text-[#2A8B8A] border-r-2 border-[#2A8B8A]' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                  <MdCreditCard className={`w-5 h-5 ${isActiveRoute('/billing') ? 'text-[#2A8B8A]' : ''}`} />
                  <span className="font-medium">Billing</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
  <main className="flex-1 ml-80 bg-transparent">
        {/* Header */}
  <header className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-8 py-4 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Modern Wallet */}
              <BalanceHeader />
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-[#2A8B8A]/10 rounded-xl transition-all duration-200"
                >
                  <div className="w-10 h-10 border-2 border-gray-300 rounded-xl flex items-center justify-center hover:border-[#2A8B8A] transition-all duration-200">
                    <MdPerson className="w-6 h-6 text-gray-600" />
                  </div>
                  <MdExpandMore className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl z-50">
                    <div className="p-4 border-b border-gray-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 border-2 border-[#2A8B8A]/30 rounded-xl flex items-center justify-center bg-[#2A8B8A]/5">
                          <MdPerson className="w-7 h-7 text-[#2A8B8A]" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest User' : 'Guest User'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {user ? user.email : 'Not signed in'}
                          </div>
                          {user && (
                            <div className="text-xs text-gray-500 mt-1">
                              {user.companyName || 'No Company'} • {user.role || 'User'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <Link href="/profile" className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#2A8B8A]/10 rounded-xl transition-all duration-200">
                        <MdPerson className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-900">Profile Settings</span>
                      </Link>
                      
                      <button 
                        onClick={() => {
                          // @ts-ignore
                          if (typeof window !== 'undefined' && window.__toggleTheme) {
                            // @ts-ignore
                            window.__toggleTheme();
                          } else {
                            const isDark = document.documentElement.classList.contains('dark');
                            const next = isDark ? 'light' : 'dark';
                            if (next === 'dark') document.documentElement.classList.add('dark');
                            else document.documentElement.classList.remove('dark');
                            try { localStorage.setItem('theme', next); } catch {}
                            window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#2A8B8A]/10 rounded-xl transition-all duration-200"
                      >
                        <MdDarkMode className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-900">Dark Mode</span>
                        <div className="ml-auto">
                          <div className={`w-8 h-4 rounded-full ${darkMode ? 'bg-[#2A8B8A]' : 'bg-gray-300'} relative transition-colors`}>
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                          </div>
                        </div>
                      </button>
                      
                      <Link href="/help" className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#2A8B8A]/10 rounded-xl transition-all duration-200">
                        <MdHelp className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-900">Help & Support</span>
                      </Link>
                      
                      {user && (
                        <>
                          <hr className="my-2 border-gray-200/50" />
                          
                          <div className="px-3 py-2">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              Account Details
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>User ID: {user.id?.split('_').pop() || user.id || 'N/A'}</div>
                              <div>Company ID: {user.companyId?.split('_').pop() || user.companyId || 'N/A'}</div>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <hr className="my-2 border-gray-200/50" />
                      
                      <button 
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 text-red-600 rounded-xl transition-all duration-200"
                      >
                        <MdLogout className="w-4 h-4" />
                        <span className="text-sm text-red-600">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
  <div className="p-8">
          {children}
        </div>
      </main>
    </div>
    </BalanceProvider>
      )}

      {/* Notification Sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMbBjiS1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMb" type="audio/wav" />
      </audio>
    </>
  );
}
