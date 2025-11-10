"use client";

import { useState, useRef, useEffect, ReactNode, useMemo } from "react";
import { useUser } from "../contexts/UserContext";
import { useThemeToggle, useThemeWatcher, getThemeColors } from "../hooks/useThemeToggle";
import { apiService } from "../services/apiService";
import {
  LuUser,
  LuPencil,
  LuSave,
  LuX,
  LuCamera,
  LuBuilding,
  LuMail,
  LuPhone,
  LuMapPin,
  LuGlobe,
  LuBell,
  LuShield,
  LuKeyRound,
  LuTrash2,
  LuEye,
  LuEyeOff,
  LuCheck,
  LuInfo,
  LuTriangleAlert,
  LuSettings,
  LuMoon,
  LuSun,
  LuClock,
  LuCalendarDays,
  LuBadgeCheck,
  LuLoader,
  LuCopy,
  LuDownload,
  LuRefreshCw,
  LuSmartphone,
  LuAtSign,
  LuUsers,
  LuClipboardList,
} from "react-icons/lu";
import TeamManagement from "../components/TeamManagement";
import ApprovalDashboard from "../components/ApprovalDashboard";

// ============================================================================
// Interfaces (Unchanged)
// ============================================================================

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  companyAddress?: string;
  role?: string;
  timezone?: string;
  language?: string;
  profilePicture?: string;
  bio?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  marketingEmails: boolean;
  campaignUpdates: boolean;
  chatNotifications: boolean;
  fcmToken?: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorType?: 'authenticator' | 'email';
  loginAlerts: boolean;
  sessionTimeout: number;
  allowMultipleSessions: boolean;
}

// ============================================================================
// Reusable UI Components
// ============================================================================

const SettingsPanel = ({ title, description, children, footer }: { title: string, description: string, children: ReactNode, footer?: ReactNode }) => {
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  
  return (
    <div className="border rounded-xl shadow-sm bg-transparent" style={{ borderColor: colors.border }}>
      <div className="p-6 border-b bg-transparent" style={{ borderColor: colors.border }}>
        <h2 className="text-lg font-semibold" style={{ color: colors.text }}>{title}</h2>
        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{description}</p>
      </div>
      <div className="p-6 space-y-6 bg-transparent">{children}</div>
      {footer && <div className="p-4 border-t rounded-b-xl flex justify-end bg-transparent" style={{ borderColor: colors.border }}>{footer}</div>}
    </div>
  );
};

const InputGroup = ({ label, id, icon, children }: { label: string, id: string, icon: ReactNode, children: ReactNode }) => {
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: colors.text }}>{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: colors.textMuted }}>
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
};

const ToggleSwitch = ({ enabled, onChange, label, description }: { enabled: boolean, onChange: () => void, label: string, description: string }) => {
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: colors.border }}>
      <div>
        <h3 className="font-medium" style={{ color: colors.text }}>{label}</h3>
        <p className="text-sm" style={{ color: colors.textMuted }}>{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0`}
        style={{ backgroundColor: enabled ? '#2A8B8A' : (darkMode ? '#475569' : '#cbd5e1') }}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
};

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: ReactNode }) => {
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 hover:opacity-70 text-gray-500 hover:text-gray-700">
          <LuX size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};


// ============================================================================
// Main Profile Page Component
// ============================================================================

export default function ProfilePage() {
  // All state and logic hooks remain exactly the same
  const { user, updateUser, logout, backupCodeUsed, clearBackupCodeFlag } = useUser();
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [showSuccess, setShowSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: '', companyName: user?.companyName || '', companyAddress: '', role: user?.role || '', timezone: 'UTC+5:30 (India Standard Time)', language: 'English (US)', profilePicture: '', bio: '', website: '', linkedin: '', twitter: ''
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true, desktopNotifications: true, marketingEmails: false, campaignUpdates: true, chatNotifications: true
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false, loginAlerts: true, sessionTimeout: 30, allowMultipleSessions: true
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [showResetAuthenticatorModal, setShowResetAuthenticatorModal] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState<'authenticator' | 'email'>('authenticator');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FASetupComplete, setIs2FASetupComplete] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [showRegenerateCodesModal, setShowRegenerateCodesModal] = useState(false);
  const [showNotificationPermissionModal, setShowNotificationPermissionModal] = useState(false);
  const [pendingNotificationToggle, setPendingNotificationToggle] = useState<{key: string, value: boolean} | null>(null);
  const [notificationPermissionError, setNotificationPermissionError] = useState<string>('');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);
  const [testNotificationStatus, setTestNotificationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // All backend functions are unchanged
  useEffect(() => {
    const loadProfileData = async () => {
        setIsLoading(true);
        if (user) {
            try {
                // Safely make API calls - some endpoints might not exist for team members
                const profileCall = async () => {
                    try {
                        return await apiService.get('/profile/auth/me');
                    } catch (error) {
                        console.warn('Profile endpoint not available:', error);
                        return { success: false, error: 'Profile endpoint not available' };
                    }
                };
                
                const notifCall = async () => {
                    try {
                        return await apiService.get('/profile/notifications');
                    } catch (error) {
                        console.warn('Notifications endpoint not available:', error);
                        return { success: false, error: 'Notifications endpoint not available' };
                    }
                };
                
                const securityCall = async () => {
                    try {
                        return await apiService.get('/profile/security');
                    } catch (error) {
                        console.warn('Security endpoint not available:', error);
                        return { success: false, error: 'Security endpoint not available' };
                    }
                };
                
                const prefsCall = async () => {
                    try {
                        return await apiService.get('/profile/preferences');
                    } catch (error) {
                        console.warn('Preferences endpoint not available:', error);
                        return { success: false, error: 'Preferences endpoint not available' };
                    }
                };

                const [profileRes, notifRes, securityRes, prefsRes] = await Promise.allSettled([
                    profileCall(),
                    notifCall(),
                    securityCall(),
                    prefsCall(),
                ]);

                if (profileRes.status === 'fulfilled' && profileRes.value.success && profileRes.value.profile) {
                    const p = profileRes.value.profile;
                    setProfileData({
                        firstName: p.firstName || user.firstName || '', lastName: p.lastName || user.lastName || '',
                        email: p.email || user.email || '', phone: p.phone || '',
                        companyName: p.companyName || user.companyName || '', companyAddress: p.companyAddress || '',
                        role: p.role || user.role || '', bio: p.bio || '', website: p.website || '',
                        linkedin: p.linkedin || '', twitter: p.twitter || '', timezone: p.timezone || 'UTC+5:30 (India Standard Time)',
                        language: p.language || 'English (US)', profilePicture: p.profilePicture || ''
                    });
                    // Update user context with profile picture if available
                    if (p.profilePicture && p.profilePicture !== user.profilePicture) {
                        updateUser({
                            ...user,
                            profilePicture: p.profilePicture
                        });
                    }
                } else {
                    // Fallback to user context data
                    setProfileData(prev => ({ 
                        ...prev, 
                        firstName: user.firstName, 
                        lastName: user.lastName, 
                        email: user.email, 
                        companyName: user.companyName, 
                        role: user.role 
                    }));
                }

                // Handle settings - use defaults if endpoints aren't available
                if (notifRes.status === 'fulfilled' && notifRes.value.success && notifRes.value.settings) {
                    setNotificationSettings(notifRes.value.settings);
                }
                
                if (securityRes.status === 'fulfilled' && securityRes.value.success && securityRes.value.settings) {
                    setSecuritySettings(securityRes.value.settings);
                }
                
                if (prefsRes.status === 'fulfilled' && prefsRes.value.success && prefsRes.value.preferences) {
                    setProfileData(prev => ({ 
                        ...prev, 
                        language: prefsRes.value.preferences.language || 'English (US)' 
                    }));
                }
            } catch (error) {
                console.error('Error loading profile data:', error);
                setError("Could not load your profile data. Please refresh.");
            }
        }
        setIsLoading(false);
    };
    loadProfileData();
}, [user]);

  useEffect(() => {
    if (backupCodeUsed) {
      setShowResetAuthenticatorModal(true);
    }
  }, [backupCodeUsed]);
  
  const handleSave = async () => {
    if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await apiService.put('/profile/auth/me', {
        firstName: profileData.firstName, lastName: profileData.lastName, phone: profileData.phone, companyName: profileData.companyName,
        companyAddress: profileData.companyAddress, role: profileData.role, bio: profileData.bio, website: profileData.website,
        linkedin: profileData.linkedin, twitter: profileData.twitter, timezone: profileData.timezone, language: profileData.language
      });
      if (response.success) {
        updateUser({
          ...user, firstName: profileData.firstName, lastName: profileData.lastName,
          companyName: profileData.companyName, role: profileData.role as any
        });
        setIsEditing(false);
        setShowSuccess('Profile updated successfully!');
        setTimeout(() => setShowSuccess(''), 3000);
      } else { throw new Error(response.message || 'Failed to update profile'); }
    } catch (error: any) {
      setError(error?.message || 'Failed to update profile. Please try again.');
    } finally { setIsLoading(false); }
  };

  const handleCancel = () => {
      // Revert to original user context data (or re-fetch)
      setProfileData({
        firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '', phone: profileData.phone, // keep loaded phone
        companyName: user?.companyName || '', companyAddress: profileData.companyAddress, role: user?.role || '',
        timezone: profileData.timezone, language: profileData.language, profilePicture: profileData.profilePicture,
        bio: profileData.bio, website: profileData.website, linkedin: profileData.linkedin, twitter: profileData.twitter,
      });
      setIsEditing(false);
      setError('');
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) { setError('New passwords do not match'); return; }
    if (passwordData.newPassword.length < 8) { setError('Password must be at least 8 characters long'); return; }
    setIsLoading(true); setError('');
    try {
      const response = await apiService.put('/profile/auth/me/password', {
        currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword
      });
      if (response.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowSuccess('Password changed successfully!');
        setTimeout(() => setShowSuccess(''), 3000);
      } else { throw new Error(response.message || 'Failed to change password'); }
    } catch (error: any) {
      setError(error?.message || 'Failed to change password. Please try again.');
    } finally { setIsLoading(false); }
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image size must be less than 5MB'); return; }
    setIsLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(`${apiService.baseURL}/profile/auth/me/profile-picture`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
      });
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try { const errorData = await response.json(); errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch { const errorText = await response.text(); if (errorText) errorMessage = errorText; }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      if (result.success && result.profilePicture) {
        setProfileData(prev => ({ ...prev, profilePicture: result.profilePicture }));
        // Update user context so sidebar shows the new profile picture
        updateUser({
          ...user,
          profilePicture: result.profilePicture
        });
        setShowSuccess('Profile picture updated!');
        setTimeout(() => setShowSuccess(''), 3000);
      } else { throw new Error(result.message || 'Upload succeeded but no image URL returned'); }
    } catch (error: any) {
      setError(error?.message || 'Failed to upload profile picture.');
    } finally { setIsLoading(false); }
  };

    const handleSettingToggle = async (key: keyof NotificationSettings | keyof SecuritySettings, value: any, type: 'notifications' | 'security') => {
        let newSettings: any;
        let endpoint = '';

        if (type === 'notifications') {
            // Handle FCM token for Desktop and Chat notifications
            if ((key === 'desktopNotifications' || key === 'chatNotifications') && value === true) {
                // Check permission status immediately
                if (typeof window !== 'undefined' && 'Notification' in window) {
                    const currentPermission = Notification.permission;
                    
                    if (currentPermission === 'denied') {
                        // Show modal in error state immediately
                        setPendingNotificationToggle({ key: key as string, value });
                        setNotificationPermissionError('Notifications are blocked in your browser. Please enable them in your browser settings and try again.');
                        setShowNotificationPermissionModal(true);
                        return;
                    }
                }
                
                // Show modal first to explain what will happen
                setPendingNotificationToggle({ key: key as string, value });
                setNotificationPermissionError(''); // Clear any previous errors
                setShowNotificationPermissionModal(true);
                return; // Don't proceed yet, wait for user confirmation
            } else if ((key === 'desktopNotifications' || key === 'chatNotifications') && value === false) {
                // When turning off, keep the token but mark as disabled
                newSettings = { ...notificationSettings, [key]: value };
                setNotificationSettings(newSettings);
            } else {
                newSettings = { ...notificationSettings, [key]: value };
                setNotificationSettings(newSettings);
            }
            endpoint = '/profile/auth/me/notifications';
        } else if (type === 'security') {
            newSettings = { ...securitySettings, [key]: value };
            setSecuritySettings(newSettings);
            endpoint = '/profile/auth/me/security';
        }

        try { 
            await apiService.put(endpoint, newSettings); 
        } catch (error) { 
            console.error(`Error saving ${type} settings:`, error); 
        }
    };

    // Function to handle notification permission approval
    const handleApproveNotificationPermission = async () => {
        if (!pendingNotificationToggle) return;
        
        const { key, value } = pendingNotificationToggle;
        let newSettings: any;

        setIsRequestingPermission(true);
        setNotificationPermissionError('');

        try {
            // Check if notifications are supported
            if (!("Notification" in window)) {
                setNotificationPermissionError('Your browser does not support notifications. Please try a different browser.');
                setIsRequestingPermission(false);
                return;
            }

            // Check current permission state
            const currentPermission = Notification.permission;
            
            if (currentPermission === 'denied') {
                setNotificationPermissionError('Notifications are blocked in your browser. Please enable them in your browser settings and try again.');
                setIsRequestingPermission(false);
                return;
            }

            // Request notification permission
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                // Get FCM token
                const fcmToken = await requestFCMToken();
                
                if (fcmToken) {
                    newSettings = { ...notificationSettings, [key]: value, fcmToken };
                    setNotificationSettings(newSettings);
                    
                    // Save to backend
                    try { 
                        await apiService.put('/profile/auth/me/notifications', newSettings); 
                        // Success - close modal
                        setShowNotificationPermissionModal(false);
                        setPendingNotificationToggle(null);
                        setNotificationPermissionError('');
                    } catch (error) { 
                        console.error('Error saving notification settings:', error);
                        setNotificationPermissionError('Settings saved locally but failed to sync with server.');
                    }
                } else {
                    setNotificationPermissionError('Failed to get notification token. Please try again or check your browser settings.');
                }
            } else if (permission === 'denied') {
                setNotificationPermissionError('You denied notification permissions. Please enable them in your browser settings to receive notifications.');
            } else {
                setNotificationPermissionError('Notification permission was not granted. Please try again.');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            setNotificationPermissionError('An error occurred while requesting notification permission. Please try again.');
        } finally {
            setIsRequestingPermission(false);
        }
    };

    // Function to handle notification permission denial
    const handleDenyNotificationPermission = () => {
        setShowNotificationPermissionModal(false);
        setPendingNotificationToggle(null);
        setNotificationPermissionError('');
    };

    // Function to send test notification
    const sendTestNotification = async () => {
        setIsSendingTestNotification(true);
        setTestNotificationStatus('idle');

        try {
            // Check if notifications are supported and permitted
            if (!("Notification" in window)) {
                setTestNotificationStatus('error');
                alert('Your browser does not support notifications.');
                setIsSendingTestNotification(false);
                return;
            }

            if (Notification.permission !== 'granted') {
                setTestNotificationStatus('error');
                alert('Notification permission not granted. Please enable notifications first.');
                setIsSendingTestNotification(false);
                return;
            }

            // Send a browser notification immediately
            const notification = new Notification('Test Notification from Stitchbyte', {
                body: 'This is a test notification. If you can see this, notifications are working correctly!',
                icon: '/favicon.ico', // You can change this to your app icon
                badge: '/favicon.ico',
                tag: 'test-notification',
                requireInteraction: false,
            });

            // Optional: Handle notification click
            notification.onclick = function(event) {
                event.preventDefault();
                window.focus();
                notification.close();
            };

            // Auto close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            setTestNotificationStatus('success');
            
            // Also try to send via backend FCM if we can get a fresh token
            try {
                console.log('🔄 Getting fresh FCM token for backend notification...');
                const freshToken = await requestFCMToken();
                
                if (freshToken) {
                    console.log('✅ Fresh FCM token obtained, sending to backend...');
                    await apiService.post('/profile/notifications/test', {
                        fcmToken: freshToken,
                        message: 'Test notification from Stitchbyte Automation'
                    });
                    console.log('✅ Backend FCM notification sent successfully');
                } else {
                    console.warn('⚠️ Could not get FCM token. Browser notification worked, but backend FCM notification skipped.');
                    console.info('💡 Tip: Make sure notifications are enabled and service worker is registered.');
                }
            } catch (backendError: any) {
                // This is optional - browser notification already worked
                console.warn('⚠️ Backend notification failed, but browser notification worked:', backendError);
            }

            // Reset status after 3 seconds
            setTimeout(() => {
                setTestNotificationStatus('idle');
            }, 3000);

        } catch (error) {
            console.error('Error sending test notification:', error);
            setTestNotificationStatus('error');
            alert('Failed to send test notification. Please try again.');
        } finally {
            setIsSendingTestNotification(false);
        }
    };

    // Function to request FCM token
    const requestFCMToken = async (): Promise<string | null> => {
        try {
            // Import Firebase configuration dynamically
            const { requestFCMToken: getFirebaseToken } = await import('@/config/firebase');
            
            console.log('🔄 Attempting to get real FCM token from Firebase...');
            
            // Get real FCM token from Firebase
            const token = await getFirebaseToken();
            
            if (token) {
                console.log('✅ Real FCM Token obtained from Firebase:', token.substring(0, 30) + '...');
                return token;
            } else {
                console.error('❌ Could not get FCM token from Firebase - token was null/undefined');
                console.error('Check: 1) Notification permission granted? 2) Service worker registered? 3) Firebase config correct?');
                return null; // Don't use mock token - return null to prevent sending invalid token
            }
        } catch (error) {
            console.error('❌ Error getting FCM token:', error);
            return null; // Don't use mock token - return null to prevent sending invalid token
        }
    };

    const handleThemeToggle = () => {
        // Use the hook's toggle function
        toggleTheme();
        
        // Save to backend
        const savePreferences = async () => {
            try {
                await apiService.put('/profile/auth/me/preferences', { 
                    darkMode: !darkMode, // Toggle the current state
                    language: profileData.language 
                });
            } catch (error) {
                console.error('Error saving theme preference:', error);
            }
        };
        savePreferences();
    };

    const handleLanguageChange = async (language: string) => {
        setProfileData(prev => ({ ...prev, language }));
        try {
            await apiService.put('/profile/auth/me/preferences', { 
                darkMode: darkMode, 
                language 
            });
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    };
  
    // All 2FA functions are also unchanged in their logic
    const setup2FA = async (type: 'authenticator' | 'email') => {
        setTwoFactorType(type); setShow2FAModal(true); setIs2FASetupComplete(false); setVerificationCode(''); setEmailOtp('');
        try {
            if (type === 'authenticator') {
                const response = await apiService.post('/profile/auth/me/2fa/setup-authenticator');
                if (response.success) { setQrCodeUrl(response.qrCode); setBackupCodes(response.backupCodes || []); }
            } else if (type === 'email') {
                await apiService.post('/profile/auth/me/2fa/setup-email');
            }
        } catch (error) { setError('Failed to setup 2FA. Please try again.'); }
    };

    const verify2FASetup = async () => {
        setIsVerifyingOtp(true); setError('');
        try {
            const code = twoFactorType === 'authenticator' ? verificationCode : emailOtp;
            const response = await apiService.post('/profile/auth/me/2fa/verify-setup', { type: twoFactorType, code: code });
            if (response.success) {
                setIs2FASetupComplete(true);
                const newSecuritySettings = { ...securitySettings, twoFactorEnabled: true, twoFactorType: twoFactorType };
                setSecuritySettings(newSecuritySettings);
                await apiService.put('/profile/auth/me/security', newSecuritySettings);
                setShowSuccess('2FA Enabled Successfully!');
                setTimeout(() => { setShow2FAModal(false); setShowSuccess(''); }, 2000);
            } else { setError('Invalid verification code. Please try again.'); }
        } catch (error: any) { setError(error?.message || 'Failed to verify code.');
        } finally { setIsVerifyingOtp(false); }
    };

    const disable2FA = async () => {
        try {
            const response = await apiService.delete('/profile/auth/me/2fa');
            if (response.success) {
                const newSecuritySettings = { ...securitySettings, twoFactorEnabled: false };
                setSecuritySettings(newSecuritySettings);
                await apiService.put('/profile/auth/me/security', newSecuritySettings);
                setShowSuccess('2FA has been disabled.');
                setTimeout(() => setShowSuccess(''), 3000);
                setShowDisable2FAModal(false);
            }
        } catch (error: any) { setError('Failed to disable 2FA. Please try again.'); }
    };

    const resetAuthenticator = async () => {
        try {
            const response = await apiService.delete('/profile/auth/me/2fa');
            if (response.success) {
                setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
                setQrCodeUrl(''); setBackupCodes([]); setVerificationCode(''); setIs2FASetupComplete(false);
                clearBackupCodeFlag();
                setShowResetAuthenticatorModal(false);
                setTwoFactorType('authenticator');
                setShow2FAModal(true);
                await setup2FA('authenticator');
            }
        } catch (error: any) { setError(error?.message || 'Failed to disable 2FA.'); }
    };

    const regenerateBackupCodes = async () => {
        try {
            const response = await apiService.post('/profile/auth/me/2fa/regenerate-codes');
            if (response.success) {
                setBackupCodes(response.backupCodes || []);
                setShowBackupCodesModal(true);
                setShowSuccess('New backup codes generated.');
                setTimeout(() => setShowSuccess(''), 3000);
                setShowRegenerateCodesModal(false);
            }
        } catch (error: any) { setError(error?.message || 'Failed to regenerate backup codes.'); }
    };

    const showBackupCodes = async () => {
        try {
            const response = await apiService.get('/profile/auth/me/2fa/backup-codes');
            if (response.success) {
                setBackupCodes(response.backupCodes || []);
                setShowBackupCodesModal(true);
            }
        } catch (error: any) { setError(error?.message || 'Failed to fetch backup codes.'); }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) { return; }
        const password = prompt('Please enter your password to confirm account deletion:');
        if (!password) return;
        const confirmation = prompt('Please type "delete my account" to confirm:');
        if (confirmation !== "delete my account") { alert("Confirmation text did not match."); return; }
        setIsLoading(true); setError('');
        try {
            const response = await apiService.delete('/profile/auth/me', { password, confirmation });
            if (response.success) {
                alert('Account deleted successfully. You will be logged out.');
                logout();
                window.location.href = '/auth/signin';
            } else { throw new Error(response.message || 'Failed to delete account'); }
        } catch (error: any) { setError(error?.message || 'Failed to delete account.');
        } finally { setIsLoading(false); }
    };

  // Helper function to check if user has permission
  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // Owners have all permissions
    if (user.role === 'owner') return true;
    
    // Admins have all permissions except delete team member
    if (user.role === 'admin') return true;
    
    // For other roles, check if user has the specific permission
    return user.permissions?.includes(permission) || false;
  };

  // Memoize tabs and filter based on permissions
  const visibleTabs = useMemo(() => {
    const tabs = [
      { id: 'general', label: 'General', icon: <LuUser size={18} /> },
      { id: 'team', label: 'Team', icon: <LuUsers size={18} />, permission: 'view_team' },
      { id: 'approvals', label: 'Approvals', icon: <LuClipboardList size={18} />, permission: 'approve_campaign' },
      { id: 'security', label: 'Security', icon: <LuShield size={18} /> },
      { id: 'notifications', label: 'Notifications', icon: <LuBell size={18} /> },
      { id: 'preferences', label: 'Preferences', icon: <LuSettings size={18} /> },
    ];
    
    return tabs.filter(tab => !tab.permission || hasPermission(tab.permission));
  }, [user]);

  // Redirect to a valid tab if current tab is not accessible
  useEffect(() => {
    if (user && visibleTabs.length > 0) {
      const isCurrentTabVisible = visibleTabs.some(tab => tab.id === activeTab);
      if (!isCurrentTabVisible) {
        setActiveTab(visibleTabs[0].id); // Redirect to first available tab
      }
    }
  }, [user, activeTab, visibleTabs]);

  if (isLoading && !profileData.firstName) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><LuLoader className="w-12 h-12 animate-spin text-[#2A8B8A]" /></div>;
  }
  
  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-colors`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Sticky Header for alerts */}
        <div className="sticky top-4 z-40 space-y-2">
            {showSuccess && (
              <div className="border rounded-lg p-3 flex items-center gap-3 shadow-lg animate-fade-in-down bg-transparent"
                   style={{ 
                     borderColor: darkMode ? '#166534' : '#bbf7d0',
                     color: darkMode ? '#34d399' : '#166534'
                   }}>
                <LuCheck size={20} />{showSuccess}
              </div>
            )}
            {error && (
              <div className="border rounded-lg p-3 flex items-center gap-3 shadow-lg animate-fade-in-down bg-transparent"
                   style={{ 
                     borderColor: darkMode ? '#dc2626' : '#fecaca',
                     color: darkMode ? '#f87171' : '#dc2626'
                   }}>
                <LuTriangleAlert size={20} />{error}
              </div>
            )}
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Left Column: Profile Card & Navigation */}
            <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
                <div className="border rounded-xl shadow-sm text-center p-6 bg-transparent"
                     style={{ borderColor: colors.border }}>
                    <div className="relative w-24 h-24 mx-auto group">
                        <img
                            src={profileData.profilePicture || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=2A8B8A&color=fff&size=128`}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover shadow-md"
                            style={{ border: `4px solid ${colors.border}` }}
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <LuCamera size={24} className="text-white" />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>
                    <h1 className="text-xl font-semibold mt-4" style={{ color: colors.text }}>{`${profileData.firstName} ${profileData.lastName}`}</h1>
                    <p className="text-sm" style={{ color: colors.textMuted }}>{profileData.email}</p>
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 text-xs font-semibold rounded-full"
                          style={{ 
                            backgroundColor: darkMode ? '#064e3b' : '#dcfce7', 
                            color: darkMode ? '#34d399' : '#166534' 
                          }}>
                        <LuBadgeCheck size={14} /> Verified Account
                    </span>
                </div>
                <nav className="border rounded-xl shadow-sm p-3 space-y-1 bg-transparent"
                     style={{ borderColor: colors.border }}>
                    {visibleTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg text-left transition-colors ${
                                activeTab === tab.id ? 'bg-[#2A8B8A]/10 text-[#2A8B8A]' : ''
                            }`}
                            style={{ 
                              color: activeTab === tab.id ? '#2A8B8A' : colors.textSecondary,
                              backgroundColor: activeTab === tab.id ? '#2A8B8A15' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              if (activeTab !== tab.id) {
                                e.currentTarget.style.backgroundColor = colors.hover;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (activeTab !== tab.id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Right Column: Content Panels */}
            <div className="lg:col-span-3">
            {activeTab === 'general' && (
                <SettingsPanel title="Personal Information" description="Update your personal details and contact information."
                    footer={ isEditing ? (
                        <div className="flex gap-3">
                            <button onClick={handleCancel} disabled={isLoading} className="btn-secondary"><LuX size={16} /> Cancel</button>
                            <button onClick={handleSave} disabled={isLoading} className="btn-primary">
                                {isLoading ? <LuLoader className="animate-spin" /> : <LuSave size={16} />} Save Changes
                            </button>
                        </div>
                    ) : ( <button onClick={() => setIsEditing(true)} className="btn-primary"><LuPencil size={16} /> Edit Profile</button>)
                }>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="First Name" id="firstName" icon={<LuUser size={16}/>}>
                            <input type="text" id="firstName" value={profileData.firstName} onChange={(e) => setProfileData(p=>({...p, firstName: e.target.value}))} disabled={!isEditing} className="input-field" />
                        </InputGroup>
                        <InputGroup label="Last Name" id="lastName" icon={<LuUser size={16}/>}>
                            <input type="text" id="lastName" value={profileData.lastName} onChange={(e) => setProfileData(p=>({...p, lastName: e.target.value}))} disabled={!isEditing} className="input-field" />
                        </InputGroup>
                        <InputGroup label="Email Address" id="email" icon={<LuMail size={16}/>}>
                            <input type="email" id="email" value={profileData.email} disabled className="input-field" />
                        </InputGroup>
                        <InputGroup label="Phone Number" id="phone" icon={<LuPhone size={16}/>}>
                            <input type="tel" id="phone" value={profileData.phone} onChange={(e) => setProfileData(p=>({...p, phone: e.target.value}))} disabled={!isEditing} className="input-field" />
                        </InputGroup>
                    </div>
                     <InputGroup label="Bio" id="bio" icon={<LuInfo size={16}/>}>
                        <textarea id="bio" value={profileData.bio} rows={4} onChange={(e) => setProfileData(p=>({...p, bio: e.target.value}))} disabled={!isEditing} className="input-field resize-none" placeholder="Tell us about yourself..."/>
                    </InputGroup>
                </SettingsPanel>
            )}

            {activeTab === 'team' && (
                <div className="border rounded-xl shadow-sm bg-transparent p-6" style={{ borderColor: colors.border }}>
                    <TeamManagement colors={colors} />
                </div>
            )}

            {activeTab === 'approvals' && (
                <div className="border rounded-xl shadow-sm bg-transparent p-6" style={{ borderColor: colors.border }}>
                    <ApprovalDashboard colors={colors} />
                </div>
            )}

            {activeTab === 'security' && (
                <SettingsPanel title="Security" description="Manage your password, two-factor authentication, and session settings.">
                    {/* Change Password */}
                    <div className="p-4 border rounded-lg bg-transparent" style={{ borderColor: colors.border }}>
                        <h3 className="font-semibold mb-4" style={{ color: colors.text }}>Change Password</h3>
                        <div className="space-y-4">
                            <InputGroup label="Current Password" id="currentPassword" icon={<LuKeyRound size={16}/>}><input type="password" id="currentPassword" value={passwordData.currentPassword} onChange={e => setPasswordData(p=>({...p, currentPassword: e.target.value}))} className="input-field"/></InputGroup>
                            <InputGroup label="New Password" id="newPassword" icon={<LuKeyRound size={16}/>}><input type="password" id="newPassword" value={passwordData.newPassword} onChange={e => setPasswordData(p=>({...p, newPassword: e.target.value}))} className="input-field"/></InputGroup>
                            <InputGroup label="Confirm New Password" id="confirmPassword" icon={<LuKeyRound size={16}/>}><input type="password" id="confirmPassword" value={passwordData.confirmPassword} onChange={e => setPasswordData(p=>({...p, confirmPassword: e.target.value}))} className="input-field"/></InputGroup>
                            <button onClick={handlePasswordChange} disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword} className="btn-primary">
                                {isLoading ? <LuLoader className="animate-spin"/> : 'Update Password'}
                            </button>
                        </div>
                    </div>
                     {/* 2FA */}
                    <div className="p-4 border rounded-lg bg-transparent" style={{ borderColor: colors.border }}>
                         <h3 className="font-semibold mb-2" style={{ color: colors.text }}>Two-Factor Authentication (2FA)</h3>
                         <p className="text-sm mb-4" style={{ color: colors.textMuted }}>Add an extra layer of security to your account during login.</p>
                         {securitySettings.twoFactorEnabled ? (
                             <div className="bg-emerald-50 p-4 rounded-lg flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <LuShield size={20} className="text-emerald-600"/>
                                     <div>
                                         <p className="font-semibold text-emerald-800">2FA is Enabled</p>
                                         <p className="text-sm text-emerald-700">Method: {securitySettings.twoFactorType === 'authenticator' ? 'Authenticator App' : 'Email OTP'}</p>
                                     </div>
                                 </div>
                                 <div className="flex gap-2">
                                     <button onClick={showBackupCodes} className="btn-secondary text-xs">Backup Codes</button>
                                     <button onClick={() => setShowDisable2FAModal(true)} className="btn-danger text-xs">Disable</button>
                                 </div>
                             </div>
                         ) : (
                             <div className="p-4 rounded-lg bg-transparent" style={{ border: `1px solid ${colors.border}` }}>
                                 <p className="font-semibold" style={{ color: colors.text }}>2FA is Disabled</p>
                                 <p className="text-sm mb-4" style={{ color: colors.textMuted }}>Your account is only protected by your password. Select a method to enable 2FA.</p>
                                 <div className="flex gap-3">
                                     <button onClick={() => setup2FA('authenticator')} className="btn-secondary flex-1"><LuSmartphone size={16}/> Authenticator App</button>
                                     <button onClick={() => setup2FA('email')} className="btn-secondary flex-1"><LuAtSign size={16}/> Email OTP</button>
                                 </div>
                             </div>
                         )}
                    </div>
                     {/* Additional Security Settings */}
                    <div className="p-4 border rounded-lg bg-transparent" style={{ borderColor: colors.border }}>
                        <h3 className="font-semibold mb-1" style={{ color: colors.text }}>Session Management</h3>
                        <ToggleSwitch enabled={securitySettings.loginAlerts} onChange={() => handleSettingToggle('loginAlerts', !securitySettings.loginAlerts, 'security')} label="Login Alerts" description="Get notified when a login occurs from a new device."/>
                        <ToggleSwitch enabled={securitySettings.allowMultipleSessions} onChange={() => handleSettingToggle('allowMultipleSessions', !securitySettings.allowMultipleSessions, 'security')} label="Allow Multiple Sessions" description="Permit being logged in on multiple devices at once."/>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <h3 className="font-medium" style={{ color: colors.text }}>Session Timeout</h3>
                                <p className="text-sm" style={{ color: colors.textMuted }}>Automatically log out after a period of inactivity.</p>
                            </div>
                            <select value={securitySettings.sessionTimeout} onChange={(e) => handleSettingToggle('sessionTimeout', parseInt(e.target.value), 'security')} className="input-field !pl-3 !w-auto">
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={60}>1 hour</option>
                                <option value={120}>2 hours</option>
                                <option value={480}>8 hours</option>
                            </select>
                        </div>
                    </div>
                </SettingsPanel>
            )}

            {activeTab === 'notifications' && (
                <SettingsPanel title="Notifications" description="Choose how you want to be notified about activities.">
                    <ToggleSwitch 
                        enabled={notificationSettings.emailNotifications} 
                        onChange={() => handleSettingToggle('emailNotifications', !notificationSettings.emailNotifications, 'notifications')}
                        label="Email Notifications"
                        description="Master control for all email notifications. If disabled, no emails will be sent (marketing, login alerts, campaigns, etc.)"
                    />
                    <ToggleSwitch 
                        enabled={notificationSettings.desktopNotifications} 
                        onChange={() => handleSettingToggle('desktopNotifications', !notificationSettings.desktopNotifications, 'notifications')}
                        label="Desktop Notifications"
                        description="Receive push notifications for login activities and important events. Requires browser permission and FCM token."
                    />
                    <ToggleSwitch 
                        enabled={notificationSettings.marketingEmails} 
                        onChange={() => handleSettingToggle('marketingEmails', !notificationSettings.marketingEmails, 'notifications')}
                        label="Marketing Emails"
                        description="Receive promotional emails and product updates. Only works if Email Notifications is enabled."
                    />
                    <ToggleSwitch 
                        enabled={notificationSettings.campaignUpdates} 
                        onChange={() => handleSettingToggle('campaignUpdates', !notificationSettings.campaignUpdates, 'notifications')}
                        label="Campaign Updates"
                        description="Get notified about campaign status, performance reports, and completion. Only works if Email Notifications is enabled."
                    />
                    <ToggleSwitch 
                        enabled={notificationSettings.chatNotifications} 
                        onChange={() => handleSettingToggle('chatNotifications', !notificationSettings.chatNotifications, 'notifications')}
                        label="Chat Notifications"
                        description="Receive push notifications when you get new messages in live chats. Requires browser permission and FCM token."
                    />
                    
                    {/* FCM Token Info */}
                    {(notificationSettings.desktopNotifications || notificationSettings.chatNotifications) && notificationSettings.fcmToken && (
                        <div className="mt-4 p-4 border rounded-lg bg-transparent" style={{ borderColor: colors.border }}>
                            <div className="flex items-start gap-3">
                                <LuBell size={20} style={{ color: '#2A8B8A' }} className="flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm" style={{ color: colors.text }}>Push Notifications Enabled</h4>
                                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                        Your device is registered to receive push notifications. If you stop receiving notifications, try toggling the setting off and on again.
                                    </p>
                                    <div className="mt-3">
                                        <button 
                                            onClick={sendTestNotification}
                                            disabled={isSendingTestNotification}
                                            className="btn-secondary text-xs flex items-center gap-2"
                                            style={{
                                                opacity: isSendingTestNotification ? 0.6 : 1,
                                                cursor: isSendingTestNotification ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {isSendingTestNotification ? (
                                                <>
                                                    <LuLoader className="animate-spin" size={14}/>
                                                    Sending...
                                                </>
                                            ) : testNotificationStatus === 'success' ? (
                                                <>
                                                    <LuCheck size={14}/>
                                                    Notification Sent!
                                                </>
                                            ) : testNotificationStatus === 'error' ? (
                                                <>
                                                    <LuTriangleAlert size={14}/>
                                                    Failed - Try Again
                                                </>
                                            ) : (
                                                <>
                                                    <LuBell size={14}/>
                                                    Send Test Notification
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Warning when email notifications is off */}
                    {!notificationSettings.emailNotifications && (
                        <div className="mt-4 p-4 border rounded-lg bg-transparent" style={{ 
                            borderColor: darkMode ? '#dc2626' : '#fca5a5',
                        }}>
                            <div className="flex items-start gap-3">
                                <LuTriangleAlert size={20} style={{ color: darkMode ? '#f87171' : '#dc2626' }} className="flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm" style={{ color: darkMode ? '#f87171' : '#dc2626' }}>Email Notifications Disabled</h4>
                                    <p className="text-xs mt-1" style={{ color: darkMode ? '#fca5a5' : '#b91c1c' }}>
                                        You won't receive any emails including security alerts, campaign updates, or marketing emails until you re-enable this setting.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </SettingsPanel>
            )}
            
            {activeTab === 'preferences' && (
                <SettingsPanel title="Preferences" description="Customize your experience across the application.">
                    <ToggleSwitch enabled={darkMode} onChange={handleThemeToggle} label="Dark Mode" description="Switch between light and dark themes"/>
                    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: colors.border }}>
                        <div>
                            <h3 className="font-medium" style={{ color: colors.text }}>Language</h3>
                            <p className="text-sm" style={{ color: colors.textMuted }}>Choose your preferred language</p>
                        </div>
                        <select value={profileData.language} onChange={(e) => handleLanguageChange(e.target.value)} className="input-field !pl-3 !w-auto">
                            <option>English (US)</option><option>English (UK)</option><option>Español</option>
                        </select>
                    </div>
                     <div className="mt-8 pt-6 border-t bg-transparent" style={{ borderColor: darkMode ? '#991b1b' : '#fca5a5' }}>
                        <h3 className="text-lg font-semibold" style={{ color: darkMode ? '#f87171' : '#dc2626' }}>Danger Zone</h3>
                         <div className="mt-4 flex items-center justify-between p-4 rounded-lg border bg-transparent" 
                              style={{ 
                                borderColor: darkMode ? '#991b1b' : '#fecaca'
                              }}>
                             <div>
                                <p className="font-semibold" style={{ color: darkMode ? '#f87171' : '#dc2626' }}>Delete Your Account</p>
                                <p className="text-sm" style={{ color: darkMode ? '#fca5a5' : '#b91c1c' }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
                             </div>
                             <button onClick={handleDeleteAccount} className="btn-danger flex-shrink-0">
                                 <LuTrash2 size={16}/> Delete Account
                             </button>
                         </div>
                     </div>
                </SettingsPanel>
            )}

            </div>
        </div>
      </div>
      
      {/* All Modals */}
      <Modal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)}>
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>Setup Two-Factor Authentication</h2>
            {!is2FASetupComplete ? (
                <div className="space-y-4">
                    {twoFactorType === 'authenticator' && (
                        <>
                            <p className="text-sm text-center text-slate-600 dark:text-slate-400">Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</p>
                            <div className="flex justify-center p-2 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-lg">{qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code"/> : <LuLoader className="w-48 h-48 animate-spin"/>}</div>
                            <InputGroup label="Enter 6-digit code" id="2fa-code" icon={<LuKeyRound size={16}/>}><input type="text" id="2fa-code" value={verificationCode} onChange={e=>setVerificationCode(e.target.value)} maxLength={6} className="input-field text-center tracking-widest"/></InputGroup>
                        </>
                    )}
                     {twoFactorType === 'email' && (
                        <>
                            <p className="text-sm text-center text-slate-600 dark:text-slate-400">We've sent a 6-digit code to <strong>{user?.email}</strong>. Please enter it below.</p>
                            <InputGroup label="Enter 6-digit code" id="email-otp" icon={<LuMail size={16}/>}><input type="text" id="email-otp" value={emailOtp} onChange={e=>setEmailOtp(e.target.value)} maxLength={6} className="input-field text-center tracking-widest"/></InputGroup>
                        </>
                    )}
                    <button onClick={verify2FASetup} disabled={isVerifyingOtp} className="btn-primary w-full">{isVerifyingOtp ? <LuLoader className="animate-spin"/> : 'Verify & Enable'}</button>
                </div>
            ) : (
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><LuCheck className="w-8 h-8 text-emerald-600"/></div>
                    <h3 className="text-lg font-semibold text-slate-800 ">2FA Enabled!</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Your account is now protected. Don't forget to save your backup codes.</p>
                    <button onClick={() => {setShow2FAModal(false); showBackupCodes();}} className="btn-primary mt-4">View Backup Codes</button>
                </div>
            )}
        </div>
      </Modal>

      <Modal isOpen={showBackupCodesModal} onClose={() => setShowBackupCodesModal(false)}>
          <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-800  mb-2">Your Backup Codes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Store these codes in a safe place. They can be used to access your account if you lose your device.</p>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border dark:border-slate-600">
                  {backupCodes.map(code => <p key={code} className="font-mono text-center bg-white dark:bg-slate-800 p-2 border dark:border-slate-600 rounded">{code}</p>)}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={() => navigator.clipboard.writeText(backupCodes.join('\n'))} className="btn-secondary"><LuCopy size={16}/> Copy Codes</button>
                  <button onClick={() => setShowRegenerateCodesModal(true)} className="btn-secondary"><LuRefreshCw size={16}/> Regenerate</button>
              </div>
              <button onClick={() => setShowBackupCodesModal(false)} className="btn-primary w-full mt-3">Done</button>
          </div>
      </Modal>

      <Modal isOpen={showDisable2FAModal || showRegenerateCodesModal || showResetAuthenticatorModal} onClose={() => {setShowDisable2FAModal(false); setShowRegenerateCodesModal(false); setShowResetAuthenticatorModal(false);}}>
            <div className="p-6 text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    showDisable2FAModal ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                    <LuTriangleAlert size={32} className={showDisable2FAModal ? 'text-red-500' : 'text-amber-500'}/>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 ">
                    {showDisable2FAModal && "Disable 2FA?"}
                    {showRegenerateCodesModal && "Regenerate Codes?"}
                    {showResetAuthenticatorModal && "Reset Authenticator?"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {showDisable2FAModal && "Disabling 2FA will reduce your account's security. This action is not recommended."}
                    {showRegenerateCodesModal && "Your old backup codes will no longer work. You must save the new codes."}
                    {showResetAuthenticatorModal && "You logged in with a backup code. For security, you should reset your authenticator app."}
                </p>
                 <div className="flex gap-3 mt-6">
                    <button onClick={() => {setShowDisable2FAModal(false); setShowRegenerateCodesModal(false); setShowResetAuthenticatorModal(false);}} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={() => {
                        if (showDisable2FAModal) disable2FA();
                        if (showRegenerateCodesModal) regenerateBackupCodes();
                        if (showResetAuthenticatorModal) resetAuthenticator();
                    }} className={`${showDisable2FAModal ? 'btn-danger' : 'btn-primary'} flex-1`}>
                        {showDisable2FAModal && "Yes, Disable"}
                        {showRegenerateCodesModal && "Yes, Regenerate"}
                        {showResetAuthenticatorModal && "Reset Now"}
                    </button>
                 </div>
            </div>
      </Modal>

      {/* Notification Permission Modal */}
      <Modal isOpen={showNotificationPermissionModal} onClose={handleDenyNotificationPermission}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
            notificationPermissionError ? 'bg-red-100 dark:bg-red-900/30' : 'bg-teal-100 dark:bg-teal-900/30'
          }`}>
            {notificationPermissionError ? (
              <LuTriangleAlert size={32} className="text-red-600 dark:text-red-400"/>
            ) : (
              <LuBell size={32} className="text-teal-600 dark:text-teal-400"/>
            )}
          </div>
          <h2 className="text-xl font-semibold text-slate-800  mb-2">
            {notificationPermissionError ? 'Permission Error' : 'Enable Notifications'}
          </h2>
          
          {notificationPermissionError ? (
            <>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3 text-left">
                  <LuTriangleAlert size={20} className="text-red-600 flex-shrink-0 mt-0.5"/>
                  <div className="text-sm text-red-700 ">
                    <p className="font-medium mb-1">Unable to Enable Notifications</p>
                    <p>{notificationPermissionError}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4 text-left">
                <p className="font-medium text-black dark:text-white mb-2 text-sm">How to fix this:</p>
                <div className="space-y-3 text-sm text-black dark:text-slate-300">
                  <div>
                    <p className="font-medium text-black dark:text-white mb-1">Option 1: Via Address Bar (Quickest)</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 text-black dark:text-slate-300">
                      <li>Look for the lock icon <LuShield className="inline" size={14}/> or site info icon in your browser's address bar</li>
                      <li>Click on it to open the permissions menu</li>
                      <li>Find "Notifications" in the list</li>
                      <li>Change it from "Block" to "Allow"</li>
                      <li>Close this modal and try again (no refresh needed)</li>
                    </ol>
                  </div>
                  <div className="border-t dark:border-slate-600 pt-3">
                    <p className="font-medium text-black dark:text-white mb-1">Option 2: Via Browser Settings</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 text-black dark:text-slate-300">
                      <li>Open your browser settings</li>
                      <li>Search for "notifications" or "site settings"</li>
                      <li>Find this website in the blocked list</li>
                      <li>Change permission to "Allow"</li>
                      <li>Return here and try again</li>
                    </ol>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2 mt-2">
                    <div className="flex items-start gap-2">
                      <LuInfo size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"/>
                      <p className="text-xs text-amber-900 dark:text-amber-300">
                        <strong>Note:</strong> Once you've changed the permission, you don't need to refresh the page. Just close this modal and toggle the notification setting again.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleDenyNotificationPermission} 
                className="btn-primary w-full"
              >
                I've Updated the Settings - Close
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                To receive {pendingNotificationToggle?.key === 'desktopNotifications' ? 'desktop' : 'chat'} notifications, 
                you need to allow notifications in your browser.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3 text-left">
                  <LuInfo size={20} className=" mt-0.5"/>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-medium mb-1">What happens next?</p>
                    <p>Your browser will ask for permission to show notifications. Click "Allow" to enable notifications for this site.</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleDenyNotificationPermission} 
                  className="btn-secondary flex-1"
                  disabled={isRequestingPermission}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApproveNotificationPermission} 
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={isRequestingPermission}
                >
                  {isRequestingPermission ? (
                    <>
                      <LuLoader className="animate-spin" size={16}/>
                      Processing...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

    </div>
  );
}