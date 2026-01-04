/**
 * Notification Service
 * Manages real-time notifications with localStorage persistence
 */

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  category: 'welcome' | 'balance' | 'message' | 'campaign' | 'error' | 'system' | 'whatsapp';
  persistent?: boolean; // If true, won't auto-clear
}

const STORAGE_KEY = 'stitchbyte_notifications';
const MAX_NOTIFICATIONS = 50;

// Helper to generate unique IDs
const generateId = () => `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Load notifications from localStorage
export const loadNotifications = (): Notification[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const notifications = JSON.parse(stored) as Notification[];
      // Remove notifications older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return notifications.filter(n => 
        n.persistent || new Date(n.timestamp) > sevenDaysAgo
      );
    }
  } catch (e) {
    console.error('Failed to load notifications:', e);
  }
  return [];
};

// Save notifications to localStorage
export const saveNotifications = (notifications: Notification[]) => {
  if (typeof window === 'undefined') return;
  try {
    // Keep only the most recent notifications
    const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
};

// Add a new notification
export const addNotification = (
  notifications: Notification[],
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
): Notification[] => {
  const newNotif: Notification = {
    ...notification,
    id: generateId(),
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  // Check if a similar notification already exists (within last 5 minutes)
  const fiveMinutesAgo = new Date();
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
  
  const isDuplicate = notifications.some(n => 
    n.category === notification.category && 
    n.title === notification.title &&
    new Date(n.timestamp) > fiveMinutesAgo
  );
  
  if (isDuplicate) {
    return notifications;
  }
  
  const updated = [newNotif, ...notifications].slice(0, MAX_NOTIFICATIONS);
  saveNotifications(updated);
  return updated;
};

// Mark notification as read
export const markAsRead = (notifications: Notification[], id: string): Notification[] => {
  const updated = notifications.map(n => 
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
  return updated;
};

// Mark all as read
export const markAllAsRead = (notifications: Notification[]): Notification[] => {
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
  return updated;
};

// Clear a notification
export const clearNotification = (notifications: Notification[], id: string): Notification[] => {
  const updated = notifications.filter(n => n.id !== id);
  saveNotifications(updated);
  return updated;
};

// Clear all notifications
export const clearAllNotifications = (): Notification[] => {
  saveNotifications([]);
  return [];
};

// Get unread count
export const getUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter(n => !n.read).length;
};

// ============================================================================
// Notification Generators - Create real notifications based on app state
// ============================================================================

// Welcome notification for new users
export const createWelcomeNotification = (userName: string): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'success',
  title: `Welcome to StitchByte, ${userName}! 🎉`,
  message: 'Your WhatsApp automation journey begins here. Connect your WhatsApp Business Account to get started.',
  category: 'welcome',
  actionUrl: '/settings',
  actionLabel: 'Connect WhatsApp',
  persistent: true,
});

// Low balance notification
export const createLowBalanceNotification = (balance: number): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'warning',
  title: 'Low Balance Alert ⚠️',
  message: `Your balance is ₹${balance.toFixed(2)}. Add funds to continue sending messages without interruption.`,
  category: 'balance',
  actionUrl: '/billing',
  actionLabel: 'Add Balance',
});

// Zero balance notification
export const createZeroBalanceNotification = (): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'error',
  title: 'Balance Depleted! 🚨',
  message: 'Your balance is ₹0. You cannot send messages until you add funds.',
  category: 'balance',
  actionUrl: '/billing',
  actionLabel: 'Add Balance Now',
  persistent: true,
});

// Balance used notification
export const createBalanceUsedNotification = (amountUsed: number, remaining: number): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'info',
  title: 'Balance Update 💰',
  message: `₹${amountUsed.toFixed(2)} used. Remaining balance: ₹${remaining.toFixed(2)}`,
  category: 'balance',
});

// WhatsApp not connected
export const createWhatsAppNotConnectedNotification = (): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'warning',
  title: 'WhatsApp Not Connected',
  message: 'Connect your WhatsApp Business Account to start sending messages and automations.',
  category: 'whatsapp',
  actionUrl: '/settings',
  actionLabel: 'Connect Now',
  persistent: true,
});

// WhatsApp connected successfully
export const createWhatsAppConnectedNotification = (phoneNumber: string): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'success',
  title: 'WhatsApp Connected! ✅',
  message: `Your WhatsApp Business Account (${phoneNumber}) is now connected and ready to use.`,
  category: 'whatsapp',
  actionUrl: '/dashboard',
  actionLabel: 'View Dashboard',
});

// Failed messages notification
export const createFailedMessagesNotification = (count: number): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'error',
  title: 'Message Delivery Failed',
  message: `${count} message${count > 1 ? 's' : ''} failed to deliver. Check logs for details.`,
  category: 'message',
  actionUrl: '/logs',
  actionLabel: 'View Logs',
});

// Campaign completed notification
export const createCampaignCompletedNotification = (campaignName: string, successCount: number, totalCount: number): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'success',
  title: 'Campaign Completed! 🚀',
  message: `"${campaignName}" finished. ${successCount}/${totalCount} messages delivered successfully.`,
  category: 'campaign',
  actionUrl: '/campaigns',
  actionLabel: 'View Campaign',
});

// New unread chats notification
export const createUnreadChatsNotification = (count: number): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'info',
  title: 'New Messages 💬',
  message: `You have ${count} unread conversation${count > 1 ? 's' : ''} waiting for your response.`,
  category: 'message',
  actionUrl: '/chats',
  actionLabel: 'View Chats',
});

// API Error notification
export const createApiErrorNotification = (errorMessage: string): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'error',
  title: 'Something went wrong',
  message: errorMessage || 'An unexpected error occurred. Please try again.',
  category: 'error',
});

// Plan expiry notification
export const createPlanExpiryNotification = (daysLeft: number): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'warning',
  title: daysLeft <= 1 ? 'Plan Expiring Today! ⚠️' : `Plan Expiring in ${daysLeft} Days`,
  message: daysLeft <= 1 
    ? 'Your subscription expires today. Renew now to avoid service interruption.'
    : `Your subscription will expire in ${daysLeft} days. Renew to continue enjoying all features.`,
  category: 'system',
  actionUrl: '/billing',
  actionLabel: 'Renew Plan',
  persistent: daysLeft <= 3,
});

// Template approved notification
export const createTemplateApprovedNotification = (templateName: string): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'success',
  title: 'Template Approved ✅',
  message: `Your template "${templateName}" has been approved by WhatsApp and is ready to use.`,
  category: 'system',
  actionUrl: '/templates',
  actionLabel: 'View Templates',
});

// Template rejected notification
export const createTemplateRejectedNotification = (templateName: string, reason?: string): Omit<Notification, 'id' | 'timestamp' | 'read'> => ({
  type: 'error',
  title: 'Template Rejected ❌',
  message: `Your template "${templateName}" was rejected.${reason ? ` Reason: ${reason}` : ' Please review and resubmit.'}`,
  category: 'system',
  actionUrl: '/templates',
  actionLabel: 'Edit Template',
});

// Check if user has seen welcome notification
export const hasSeenWelcome = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('stitchbyte_welcome_seen') === 'true';
};

// Mark welcome as seen
export const markWelcomeSeen = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('stitchbyte_welcome_seen', 'true');
  }
};

// Check last balance notification time to avoid spam
export const shouldShowBalanceNotification = (balance: number): boolean => {
  if (typeof window === 'undefined') return false;
  
  const lastNotifTime = localStorage.getItem('stitchbyte_last_balance_notif');
  const lastBalance = localStorage.getItem('stitchbyte_last_balance');
  
  if (!lastNotifTime) return true;
  
  const timeSinceLastNotif = Date.now() - parseInt(lastNotifTime);
  const hoursSinceLastNotif = timeSinceLastNotif / (1000 * 60 * 60);
  
  // Show notification if:
  // 1. Balance has changed significantly (dropped by more than 20%)
  // 2. Or it's been more than 6 hours since last notification
  if (lastBalance) {
    const prevBalance = parseFloat(lastBalance);
    if (balance < prevBalance * 0.8) return true;
  }
  
  return hoursSinceLastNotif > 6;
};

// Update last balance notification time
export const updateBalanceNotificationTime = (balance: number) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('stitchbyte_last_balance_notif', Date.now().toString());
    localStorage.setItem('stitchbyte_last_balance', balance.toString());
  }
};
