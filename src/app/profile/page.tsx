"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { apiService } from "../services/apiService";
import { 
  MdPerson, 
  MdEdit, 
  MdSave, 
  MdCancel, 
  MdPhotoCamera,
  MdBusiness,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdLanguage,
  MdNotifications,
  MdSecurity,
  MdVpnKey,
  MdDelete,
  MdVisibility,
  MdVisibilityOff,
  MdCheck,
  MdClose,
  MdInfo,
  MdWarning,
  MdAccountBox,
  MdSettings,
  MdDarkMode,
  MdLightMode,
  MdAccessTime,
  MdCalendarToday,
  MdVerified,
  MdError
} from "react-icons/md";

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
  smsNotifications: boolean;
  desktopNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  campaignUpdates: boolean;
  chatNotifications: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorType?: 'authenticator' | 'email';
  loginAlerts: boolean;
  sessionTimeout: number;
  allowMultipleSessions: boolean;
}

export default function ProfilePage() {
  const { user, updateUser, logout, backupCodeUsed, clearBackupCodeFlag } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '', // Not available in User context
    companyName: user?.companyName || '',
    companyAddress: '', // Not available in User context
    role: user?.role || '',
    timezone: 'UTC+5:30 (India Standard Time)', // Always India
    language: 'English (US)',
    profilePicture: '',
    bio: '',
    website: '',
    linkedin: '',
    twitter: ''
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    desktopNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    campaignUpdates: true,
    chatNotifications: true
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30,
    allowMultipleSessions: true
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Theme preference
  const [darkMode, setDarkMode] = useState(false);

  // 2FA Configuration
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
  const [backupCodesSeen, setBackupCodesSeen] = useState(false);
  
  // Confirmation modal states
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [showRegenerateCodesModal, setShowRegenerateCodesModal] = useState(false);

  // Check if backup code was used and show reset authenticator modal
  useEffect(() => {
    if (backupCodeUsed) {
      setShowResetAuthenticatorModal(true);
    }
  }, [backupCodeUsed]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (user) {
        try {
          // Load profile data from API using correct endpoint
          const profileResponse = await apiService.get('/profile/auth/me');
          if (profileResponse.success && profileResponse.profile) {
            const profile = profileResponse.profile;
            setProfileData({
              firstName: profile.firstName || user.firstName || '',
              lastName: profile.lastName || user.lastName || '',
              email: profile.email || user.email || '',
              phone: profile.phone || '',
              companyName: profile.companyName || user.companyName || '',
              companyAddress: profile.companyAddress || '',
              role: profile.role || user.role || '',
              bio: profile.bio || '',
              website: profile.website || '',
              linkedin: profile.linkedin || '',
              twitter: profile.twitter || '',
              timezone: profile.timezone || 'UTC+5:30 (India Standard Time)',
              language: profile.language || 'English (US)',
              profilePicture: profile.profilePicture || ''
            });
          } else {
            // Fall back to user context if API fails
            setProfileData({
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              phone: '',
              companyName: user.companyName || '',
              companyAddress: '',
              role: user.role || '',
              bio: '',
              website: '',
              linkedin: '',
              twitter: '',
              timezone: 'UTC+5:30 (India Standard Time)',
              language: 'English (US)',
              profilePicture: ''
            });
          }
          
          // Load notification settings
          try {
            const notifResponse = await apiService.get('/profile/notifications');
            if (notifResponse.success) {
              setNotificationSettings(notifResponse.settings);
            }
          } catch (error) {
            console.log('Using default notification settings');
          }
          
          // Load security settings
          try {
            const securityResponse = await apiService.get('/profile/security');
            if (securityResponse.success) {
              setSecuritySettings(securityResponse.settings);
            }
          } catch (error) {
            console.log('Using default security settings');
          }
          
          // Load preferences
          try {
            const prefsResponse = await apiService.get('/profile/preferences');
            if (prefsResponse.success) {
              setDarkMode(prefsResponse.preferences.darkMode || false);
              setProfileData(prev => ({
                ...prev,
                language: prefsResponse.preferences.language || 'English (US)'
              }));
            }
          } catch (error) {
            console.log('Using default preferences');
          }
          
        } catch (error) {
          console.error('Error loading profile data:', error);
          // Fall back to user context on error
          setProfileData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: '',
            companyName: user.companyName || '',
            companyAddress: '',
            role: user.role || '',
            bio: '',
            website: '',
            linkedin: '',
            twitter: '',
            timezone: 'UTC+5:30 (India Standard Time)',
            language: 'English (US)',
            profilePicture: ''
          });
        }
      }
    };
    
    loadProfileData();
  }, [user]);

  const handleSave = async () => {
    if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Update profile via API using correct endpoint
      const response = await apiService.put('/profile/auth/me', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        companyName: profileData.companyName,
        companyAddress: profileData.companyAddress,
        role: profileData.role,
        bio: profileData.bio,
        website: profileData.website,
        linkedin: profileData.linkedin,
        twitter: profileData.twitter,
        timezone: profileData.timezone,
        language: profileData.language
      });

      if (response.success) {
        // Update user context
        updateUser({
          ...user,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          companyName: profileData.companyName,
          role: profileData.role as 'owner' | 'admin' | 'user' | 'viewer'
        });

        setIsEditing(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError(error?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      // Reload profile data from API using correct endpoint
      const profileResponse = await apiService.get('/profile/auth/me');
      if (profileResponse.success && profileResponse.profile) {
        const profile = profileResponse.profile;
        setProfileData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          companyName: profile.companyName || '',
          companyAddress: profile.companyAddress || '',
          role: profile.role || '',
          bio: profile.bio || '',
          website: profile.website || '',
          linkedin: profile.linkedin || '',
          twitter: profile.twitter || '',
          timezone: profile.timezone || 'UTC+5:30 (India Standard Time)',
          language: profile.language || 'English (US)',
          profilePicture: profile.profilePicture || ''
        });
      } else {
        // Fall back to user context
        setProfileData({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phone: '',
          companyName: user?.companyName || '',
          companyAddress: '',
          role: user?.role || '',
          timezone: 'UTC+5:30 (India Standard Time)',
          language: 'English (US)',
          profilePicture: '',
          bio: '',
          website: '',
          linkedin: '',
          twitter: ''
        });
      }
    } catch (error) {
      // Fall back to user context on error
      setProfileData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: '',
        companyName: user?.companyName || '',
        companyAddress: '',
        role: user?.role || '',
        timezone: 'UTC+5:30 (India Standard Time)',
        language: 'English (US)',
        profilePicture: '',
        bio: '',
        website: '',
        linkedin: '',
        twitter: ''
      });
    }
    
    setIsEditing(false);
    setError('');
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use correct password change endpoint
      const response = await apiService.put('/profile/auth/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      setError(error?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      const response = await apiService.put('/profile/auth/me/notifications', notificationSettings);
      if (!response.success) {
        console.error('Failed to save notification settings');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const saveSecuritySettings = async () => {
    try {
      const response = await apiService.put('/profile/auth/me/security', securitySettings);
      if (!response.success) {
        console.error('Failed to save security settings');
      }
    } catch (error) {
      console.error('Error saving security settings:', error);
    }
  };

  const saveUserPreferences = async () => {
    try {
      const response = await apiService.put('/profile/auth/me/preferences', {
        darkMode,
        language: profileData.language,
        timezone: profileData.timezone || 'UTC+5:30 (India Standard Time)'
      });
      if (!response.success) {
        console.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // 2FA Setup Functions
  const setup2FA = async (type: 'authenticator' | 'email') => {
    setTwoFactorType(type);
    setShow2FAModal(true);
    setIs2FASetupComplete(false);
    setVerificationCode('');
    setEmailOtp('');

    try {
      if (type === 'authenticator') {
        // Generate QR code for authenticator app
        const response = await apiService.post('/profile/auth/me/2fa/setup-authenticator');
        if (response.success) {
          setQrCodeUrl(response.qrCode);
          setBackupCodes(response.backupCodes || []);
        }
      } else if (type === 'email') {
        // Send OTP to user's email
        const response = await apiService.post('/profile/auth/me/2fa/setup-email');
        if (response.success) {
          console.log('OTP sent to email');
        }
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setError('Failed to setup 2FA. Please try again.');
    }
  };

  const verify2FASetup = async () => {
    setIsVerifyingOtp(true);
    setError('');

    try {
      const code = twoFactorType === 'authenticator' ? verificationCode : emailOtp;
      const response = await apiService.post('/profile/auth/me/2fa/verify-setup', {
        type: twoFactorType,
        code: code
      });

      if (response.success) {
        setIs2FASetupComplete(true);
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
        
        // Save to backend
        await apiService.put('/profile/auth/me/security', {
          ...securitySettings,
          twoFactorEnabled: true,
          twoFactorType: twoFactorType
        });
        
        setShowSuccess(true);
        setTimeout(() => {
          setShow2FAModal(false);
          setShowSuccess(false);
        }, 2000);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error: any) {
      console.error('Error verifying 2FA setup:', error);
      setError(error?.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const disable2FA = async () => {
    try {
      const response = await apiService.delete('/profile/auth/me/2fa');
      if (response.success) {
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
        
        // Save to backend
        await apiService.put('/profile/auth/me/security', {
          ...securitySettings,
          twoFactorEnabled: false
        });
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setShowDisable2FAModal(false);
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      setError('Failed to disable 2FA. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetAuthenticator = async () => {
    try {
      // First disable existing 2FA
      const response = await apiService.delete('/profile/auth/me/2fa');
      if (response.success) {
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
        
        // Reset all 2FA-related state
        setQrCodeUrl('');
        setBackupCodes([]);
        setVerificationCode('');
        setIs2FASetupComplete(false);
        
        // Clear backup code flag
        clearBackupCodeFlag();
        
        // Close reset modal and open setup modal
        setShowResetAuthenticatorModal(false);
        setTwoFactorType('authenticator');
        setShow2FAModal(true);
        
        // Automatically start the setup process to generate new QR code
        await setup2FA('authenticator');
      }
    } catch (error: any) {
      console.error('Error resetting authenticator:', error);
      setError(error?.message || 'Failed to disable 2FA. Please try again.');
    }
  };

  const regenerateBackupCodes = async () => {
    try {
      const response = await apiService.post('/profile/auth/me/2fa/regenerate-codes');
      if (response.success) {
        setBackupCodes(response.backupCodes || []);
        setShowBackupCodesModal(true);
        setBackupCodesSeen(false); // Reset seen status for new codes
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setShowRegenerateCodesModal(false);
      }
    } catch (error: any) {
      console.error('Error regenerating backup codes:', error);
      setError(error?.message || 'Failed to regenerate backup codes. Please try again.');
    }
  };

  const showBackupCodes = async () => {
    try {
      const response = await apiService.get('/profile/auth/me/2fa/backup-codes');
      if (response.success) {
        setBackupCodes(response.backupCodes || []);
        setShowBackupCodesModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching backup codes:', error);
      setError(error?.message || 'Failed to fetch backup codes. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    const password = prompt('Please enter your password to confirm account deletion:');
    if (!password) return;
    
    const confirmation = prompt('Please type "delete my account" to confirm:');
    if (!confirmation) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await apiService.delete('/profile/auth/me', {
        password,
        confirmation
      });
      
      if (response.success) {
        alert('Account deleted successfully. You will be logged out.');
        // Logout user
        logout();
        window.location.href = '/auth/signin';
      } else {
        throw new Error(response.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Account deletion error:', error);
      setError(error?.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);  // Changed from 'profile_picture' to 'file'

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

      // Upload to backend using direct fetch to match your format
      const response = await fetch(`${apiService.baseURL}/profile/auth/me/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Removed Content-Type header - let browser set it automatically for FormData
        },
        body: formData
      });

      console.log('Upload response status:', response.status);

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to get error details
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use text
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      if (result.success && result.profilePicture) {
        // Update profile data with new image URL
        setProfileData(prev => ({
          ...prev,
          profilePicture: result.profilePicture
        }));

        // Update profile data state only since profilePicture is not part of User interface
        setProfileData(prev => ({
          ...prev,
          profilePicture: result.profilePicture
        }));

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error(result.message || 'Upload succeeded but no image URL returned');
      }
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      setError(error?.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: MdPerson },
    { id: 'notifications', label: 'Notifications', icon: MdNotifications },
    { id: 'security', label: 'Security', icon: MdSecurity },
    { id: 'preferences', label: 'Preferences', icon: MdSettings }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <MdCheck className="w-5 h-5 text-green-600" />
          <span className="text-green-800">Profile updated successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <MdClose className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#258484] from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
              {profileData.profilePicture ? (
                <img
                  src={profileData.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <MdPerson className="w-12 h-12 text-white" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-white border-2 border-gray-300 rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <MdPhotoCamera className="w-4 h-4 text-gray-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User Profile' : 'User Profile'}
            </h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                <MdBusiness className="w-4 h-4" />
                {user?.companyName || 'No Company'}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                <MdAccountBox className="w-4 h-4" />
                {user?.role || 'User'}
              </span>
              {user?.id && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  <MdVerified className="w-4 h-4" />
                  Verified Account
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        <MdCancel className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <MdSave className="w-4 h-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MdEdit className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter your last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <div className="relative">
                    <MdBusiness className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={profileData.companyName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, companyName: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Your company name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={profileData.role}
                    onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Your role/position"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                <div className="relative">
                  <MdLocationOn className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    value={profileData.companyAddress}
                    onChange={(e) => setProfileData(prev => ({ ...prev, companyAddress: e.target.value }))}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                    placeholder="Company address..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData(prev => ({ ...prev, linkedin: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
              
              <div className="space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <h3 className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {key === 'emailNotifications' && 'Receive notifications via email'}
                        {key === 'smsNotifications' && 'Receive notifications via SMS'}
                        {key === 'desktopNotifications' && 'Show desktop notifications in browser'}
                        {key === 'marketingEmails' && 'Receive marketing and promotional emails'}
                        {key === 'securityAlerts' && 'Receive security-related alerts'}
                        {key === 'campaignUpdates' && 'Get updates about your campaigns'}
                        {key === 'chatNotifications' && 'Receive notifications for new messages'}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const newSettings = {
                          ...notificationSettings,
                          [key]: !value
                        };
                        setNotificationSettings(newSettings);
                        
                        // Save to backend immediately using correct endpoint
                        try {
                          await apiService.put('/profile/auth/me/notifications', newSettings);
                        } catch (error) {
                          console.error('Error saving notification settings:', error);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
              
              {/* Change Password */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>

              {/* Security Settings */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Security Options</h3>
                {Object.entries(securitySettings).map(([key, value]) => {
                  if (key === 'sessionTimeout') {
                    return (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100">
                        <div>
                          <h4 className="font-medium text-gray-900">Session Timeout</h4>
                          <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
                        </div>
                        <select
                          value={value}
                          onChange={async (e) => {
                            const newSettings = {
                              ...securitySettings,
                              [key]: parseInt(e.target.value)
                            };
                            setSecuritySettings(newSettings);
                            
                            // Save to backend immediately
                            // Save to backend using correct endpoint
                            try {
                              await apiService.put('/profile/auth/me/security', newSettings);
                            } catch (error) {
                              console.error('Error saving security settings:', error);
                            }
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={480}>8 hours</option>
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {key === 'twoFactorEnabled' && 'Add an extra layer of security to your account'}
                          {key === 'loginAlerts' && 'Get notified when someone logs into your account'}
                          {key === 'allowMultipleSessions' && 'Allow multiple devices to be logged in simultaneously'}
                        </p>
                      </div>
                      
                      {key === 'twoFactorEnabled' ? (
                        <div className="flex items-center gap-3">
                          {value ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-600 font-medium">Enabled</span>
                              <button
                                onClick={() => setShowDisable2FAModal(true)}
                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              >
                                Disable
                              </button>
                              {securitySettings.twoFactorType === 'authenticator' && (
                                <button
                                  onClick={showBackupCodes}
                                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Backup Codes
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setup2FA('authenticator')}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                              >
                                Authenticator App
                              </button>
                              <button
                                onClick={() => setup2FA('email')}
                                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              >
                                Email OTP
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            const newSettings = {
                              ...securitySettings,
                              [key]: typeof value === 'boolean' ? !value : value
                            };
                            setSecuritySettings(newSettings);
                            
                            // Save to backend immediately using correct endpoint
                            try {
                              await apiService.put('/profile/auth/me/security', newSettings);
                            } catch (error) {
                              console.error('Error saving security settings:', error);
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">App Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <MdDarkMode className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Dark Mode</h3>
                      <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const newDarkMode = !darkMode;
                      setDarkMode(newDarkMode);
                      
                      // Save to backend immediately using correct endpoint
                      try {
                        await apiService.put('/profile/auth/me/preferences', {
                          darkMode: newDarkMode,
                          language: profileData.language,
                          timezone: profileData.timezone || 'UTC+5:30 (India Standard Time)'
                        });
                      } catch (error) {
                        console.error('Error saving preferences:', error);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <MdLanguage className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Language</h3>
                      <p className="text-sm text-gray-500">Choose your preferred language</p>
                    </div>
                  </div>
                  <select
                    value={profileData.language}
                    onChange={async (e) => {
                      const newLanguage = e.target.value;
                      setProfileData(prev => ({ ...prev, language: newLanguage }));
                      
                      // Save to backend immediately using correct endpoint
                      try {
                        await apiService.put('/profile/auth/me/preferences', {
                          darkMode,
                          language: newLanguage,
                          timezone: profileData.timezone || 'UTC+5:30 (India Standard Time)'
                        });
                      } catch (error) {
                        console.error('Error saving preferences:', error);
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="German">Deutsch</option>
                    <option value="Portuguese">Português</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <MdAccessTime className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Timezone</h3>
                      <p className="text-sm text-gray-500">Set to India Standard Time (IST)</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    UTC+5:30 (India Standard Time)
                  </div>
                </div>
              </div>

              {/* Account Management */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MdWarning className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">Danger Zone</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <MdDelete className="w-4 h-4" />
                        {isLoading ? 'Deleting...' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Info Footer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Account Information</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MdCalendarToday className="w-4 h-4" />
                Member since: {new Date().getFullYear()}
              </div>
              <div className="flex items-center gap-1">
                <MdPerson className="w-4 h-4" />
                User ID: {user?.id?.split('_').pop() || user?.id || 'N/A'}
              </div>
              <div className="flex items-center gap-1">
                <MdBusiness className="w-4 h-4" />
                Company ID: {user?.companyId?.split('_').pop() || user?.companyId || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Setup Two-Factor Authentication
                </h2>
                <button
                  onClick={() => setShow2FAModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              {!is2FASetupComplete ? (
                <div className="space-y-6">
                  {twoFactorType === 'authenticator' ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-medium text-gray-900 mb-2">
                          Scan QR Code with your Authenticator App
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Use Google Authenticator, Authy, or any TOTP-compatible app
                        </p>
                        {qrCodeUrl ? (
                          <div className="flex justify-center mb-4">
                            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                          </div>
                        ) : (
                          <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-gray-500">Loading QR Code...</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter 6-digit code from your app
                        </label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                          maxLength={6}
                        />
                      </div>

                      {backupCodes.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-medium text-yellow-800 mb-2">Backup Codes</h4>
                          <p className="text-sm text-yellow-700 mb-3">
                            Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {backupCodes.map((code, index) => (
                              <div key={index} className="bg-white p-2 rounded border text-sm font-mono text-center">
                                {code}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-medium text-gray-900 mb-2">
                          Email OTP Verification
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          We've sent a 6-digit code to your email address: {user?.email}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter 6-digit code from your email
                        </label>
                        <input
                          type="text"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                          maxLength={6}
                        />
                      </div>
                      
                      <button
                        onClick={() => setup2FA('email')}
                        className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Resend Code
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShow2FAModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={verify2FASetup}
                      disabled={isVerifyingOtp || (twoFactorType === 'authenticator' ? verificationCode.length !== 6 : emailOtp.length !== 6)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifyingOtp ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <MdCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">
                    Two-Factor Authentication Enabled!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your account is now protected with {twoFactorType === 'authenticator' ? 'authenticator app' : 'email OTP'} verification.
                  </p>
                  <button
                    onClick={() => setShow2FAModal(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <MdWarning className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodesModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Backup Codes
                </h2>
                <button
                  onClick={() => setShowBackupCodesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MdWarning className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-medium text-yellow-800">Important</h3>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Save these codes in a safe place. Each code can only be used once and will give you access to your account if you lose your authenticator device.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Your Backup Codes:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-gray-100 p-3 rounded border text-sm font-mono text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const codesText = backupCodes.join('\n');
                      navigator.clipboard.writeText(codesText);
                      setShowSuccess(true);
                      setTimeout(() => setShowSuccess(false), 2000);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Copy Codes
                  </button>
                  <button
                    onClick={() => {
                      const codesText = backupCodes.join('\n');
                      const blob = new Blob([codesText], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'stitchbyte-backup-codes.txt';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      setBackupCodesSeen(true);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download
                  </button>
                  {!backupCodesSeen && (
                    <button
                      onClick={() => setShowRegenerateCodesModal(true)}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Regenerate
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowBackupCodesModal(false);
                      setBackupCodesSeen(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Authenticator Modal */}
      {showResetAuthenticatorModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center mb-6">
              <MdWarning className="text-yellow-500 text-3xl mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Reset Authenticator App</h3>
            </div>
            
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <MdInfo className="text-yellow-600 text-xl mr-3 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 font-medium mb-2">Backup Code Used</p>
                    <p className="text-yellow-700 text-sm">
                      You've successfully logged in using a backup code. This suggests you may have lost access to your authenticator app.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                For better security, we recommend setting up your authenticator app again. This will:
              </p>
              
              <ul className="text-gray-600 text-sm space-y-2 mb-4">
                <li className="flex items-center">
                  <MdCheck className="text-green-500 mr-2" />
                  Generate a new QR code for your authenticator app
                </li>
                <li className="flex items-center">
                  <MdCheck className="text-green-500 mr-2" />
                  Create fresh backup codes
                </li>
                <li className="flex items-center">
                  <MdCheck className="text-green-500 mr-2" />
                  Ensure your account remains secure
                </li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={resetAuthenticator}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <MdSecurity className="mr-2" />
                Setup New Authenticator
              </button>
              <button
                onClick={() => {
                  setShowResetAuthenticatorModal(false);
                  clearBackupCodeFlag();
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable 2FA Confirmation Modal */}
      {showDisable2FAModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center mb-6">
              <MdWarning className="text-red-500 text-3xl mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Disable Two-Factor Authentication</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to disable two-factor authentication? This action will:
              </p>
              
              <ul className="text-gray-600 text-sm space-y-2 mb-4 ml-4">
                <li className="flex items-center">
                  <MdError className="text-red-500 mr-2 text-sm" />
                  Make your account less secure
                </li>
                <li className="flex items-center">
                  <MdError className="text-red-500 mr-2 text-sm" />
                  Remove all backup codes
                </li>
                <li className="flex items-center">
                  <MdError className="text-red-500 mr-2 text-sm" />
                  Disable authenticator app protection
                </li>
              </ul>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-medium">
                  ⚠️ Your account will only be protected by your password after this change.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDisable2FAModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={disable2FA}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Disable 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Confirmation Modal */}
      {showRegenerateCodesModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center mb-6">
              <MdWarning className="text-yellow-500 text-3xl mr-3" />
              <h3 className="text-xl font-bold text-gray-900">Regenerate Backup Codes</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to regenerate your backup codes? This action will:
              </p>
              
              <ul className="text-gray-600 text-sm space-y-2 mb-4 ml-4">
                <li className="flex items-center">
                  <MdWarning className="text-yellow-500 mr-2 text-sm" />
                  Invalidate all existing backup codes
                </li>
                <li className="flex items-center">
                  <MdInfo className="text-blue-500 mr-2 text-sm" />
                  Generate 8 new backup codes
                </li>
                <li className="flex items-center">
                  <MdInfo className="text-blue-500 mr-2 text-sm" />
                  Require you to save the new codes
                </li>
              </ul>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm font-medium">
                  💡 Make sure to download and save your new backup codes securely.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRegenerateCodesModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={regenerateBackupCodes}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Yes, Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
