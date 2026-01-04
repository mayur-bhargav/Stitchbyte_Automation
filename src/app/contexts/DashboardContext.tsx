"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, Dispatch, SetStateAction } from 'react';
import {
  Notification,
  loadNotifications,
  saveNotifications,
  addNotification as addNotif,
  markAsRead as markRead,
  markAllAsRead as markAllRead,
  clearNotification as clearNotif,
  getUnreadCount,
  createWelcomeNotification,
  createLowBalanceNotification,
  createZeroBalanceNotification,
  createWhatsAppNotConnectedNotification,
  createFailedMessagesNotification,
  createUnreadChatsNotification,
  createApiErrorNotification,
  createBalanceUsedNotification,
  createPlanExpiryNotification,
  hasSeenWelcome,
  markWelcomeSeen,
  shouldShowBalanceNotification,
  updateBalanceNotificationTime,
} from '../../services/notificationService';

interface DashboardContextType {
  showNotifications: boolean;
  setShowNotifications: Dispatch<SetStateAction<boolean>>;
  showSearchFilter: boolean;
  setShowSearchFilter: Dispatch<SetStateAction<boolean>>;
  notifications: Notification[];
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  unreadCount: number;
  setUnreadCount: Dispatch<SetStateAction<number>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  dateFilter: string;
  setDateFilter: Dispatch<SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: Dispatch<SetStateAction<string>>;
  // New notification functions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotificationById: (id: string) => void;
  // Convenience functions for common notifications
  showWelcomeNotification: (userName: string) => void;
  showLowBalanceNotification: (balance: number) => void;
  showZeroBalanceNotification: () => void;
  showWhatsAppNotConnectedNotification: () => void;
  showFailedMessagesNotification: (count: number) => void;
  showUnreadChatsNotification: (count: number) => void;
  showApiErrorNotification: (errorMessage: string) => void;
  showBalanceUsedNotification: (amountUsed: number, remaining: number) => void;
  showPlanExpiryNotification: (daysLeft: number) => void;
  checkAndShowBalanceNotification: (balance: number) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load notifications from localStorage on mount
  useEffect(() => {
    const loaded = loadNotifications();
    setNotifications(loaded);
    setUnreadCount(getUnreadCount(loaded));
  }, []);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    setNotifications(prev => {
      const updated = addNotif(prev, notification);
      setUnreadCount(getUnreadCount(updated));
      return updated;
    });
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = markRead(prev, id);
      setUnreadCount(getUnreadCount(updated));
      return updated;
    });
  }, []);

  // Mark all as read
  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = markAllRead(prev);
      setUnreadCount(0);
      return updated;
    });
  }, []);

  // Clear notification by id
  const clearNotificationById = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = clearNotif(prev, id);
      setUnreadCount(getUnreadCount(updated));
      return updated;
    });
  }, []);

  // Convenience functions for common notifications
  const showWelcomeNotification = useCallback((userName: string) => {
    if (!hasSeenWelcome()) {
      addNotification(createWelcomeNotification(userName));
      markWelcomeSeen();
    }
  }, [addNotification]);

  const showLowBalanceNotification = useCallback((balance: number) => {
    addNotification(createLowBalanceNotification(balance));
    updateBalanceNotificationTime(balance);
  }, [addNotification]);

  const showZeroBalanceNotification = useCallback(() => {
    addNotification(createZeroBalanceNotification());
    updateBalanceNotificationTime(0);
  }, [addNotification]);

  const showWhatsAppNotConnectedNotification = useCallback(() => {
    // Check if we already have this notification
    const hasExisting = notifications.some(n => 
      n.category === 'whatsapp' && n.title === 'WhatsApp Not Connected' && !n.read
    );
    if (!hasExisting) {
      addNotification(createWhatsAppNotConnectedNotification());
    }
  }, [addNotification, notifications]);

  const showFailedMessagesNotification = useCallback((count: number) => {
    if (count > 0) {
      addNotification(createFailedMessagesNotification(count));
    }
  }, [addNotification]);

  const showUnreadChatsNotification = useCallback((count: number) => {
    if (count > 0) {
      addNotification(createUnreadChatsNotification(count));
    }
  }, [addNotification]);

  const showApiErrorNotification = useCallback((errorMessage: string) => {
    addNotification(createApiErrorNotification(errorMessage));
  }, [addNotification]);

  const showBalanceUsedNotification = useCallback((amountUsed: number, remaining: number) => {
    addNotification(createBalanceUsedNotification(amountUsed, remaining));
  }, [addNotification]);

  const showPlanExpiryNotification = useCallback((daysLeft: number) => {
    if (daysLeft <= 7) {
      addNotification(createPlanExpiryNotification(daysLeft));
    }
  }, [addNotification]);

  // Check balance and show notification if needed
  const checkAndShowBalanceNotification = useCallback((balance: number) => {
    if (!shouldShowBalanceNotification(balance)) return;
    
    if (balance <= 0) {
      showZeroBalanceNotification();
    } else if (balance < 50) {
      showLowBalanceNotification(balance);
    } else if (balance < 100) {
      // Mild warning for balance below 100
      addNotification({
        type: 'info',
        title: 'Balance Running Low',
        message: `Your balance is ₹${balance.toFixed(2)}. Consider adding more funds.`,
        category: 'balance',
        actionUrl: '/billing',
        actionLabel: 'Add Balance',
      });
      updateBalanceNotificationTime(balance);
    }
  }, [showZeroBalanceNotification, showLowBalanceNotification, addNotification]);

  return (
    <DashboardContext.Provider
      value={{
        showNotifications,
        setShowNotifications,
        showSearchFilter,
        setShowSearchFilter,
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        searchQuery,
        setSearchQuery,
        dateFilter,
        setDateFilter,
        statusFilter,
        setStatusFilter,
        // New functions
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotificationById,
        showWelcomeNotification,
        showLowBalanceNotification,
        showZeroBalanceNotification,
        showWhatsAppNotConnectedNotification,
        showFailedMessagesNotification,
        showUnreadChatsNotification,
        showApiErrorNotification,
        showBalanceUsedNotification,
        showPlanExpiryNotification,
        checkAndShowBalanceNotification,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
