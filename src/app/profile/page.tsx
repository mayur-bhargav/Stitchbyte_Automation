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
  MdVerified
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
  loginAlerts: boolean;
  sessionTimeout: number;
  allowMultipleSessions: boolean;
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useUser();
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
    phone: user?.phone || '',
    companyName: user?.companyName || '',
    companyAddress: user?.companyAddress || '',
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

  useEffect(() => {
    const loadProfileData = async () => {
      if (user) {
        try {
          // Try to load profile data from API (optional endpoint)
          const profileResponse = await apiService.getOptional('/profile');
          if (profileResponse?.success) {
            const profile = profileResponse.profile;
            setProfileData(prev => ({
              ...prev,
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
              timezone: 'UTC+5:30 (India Standard Time)', // Always India
              language: profile.language || 'English (US)'
            }));
            
            // Set notification settings
            if (profileResponse.notifications) {
              setNotificationSettings(profileResponse.notifications);
            }
            
            // Set security settings
            if (profileResponse.security) {
              setSecuritySettings(profileResponse.security);
            }
            
            // Set dark mode
            if (profile.darkMode !== undefined) {
              setDarkMode(profile.darkMode);
            }
          } else {
            // No profile data from API or API returned null, use user context
            setProfileData(prev => ({
              ...prev,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              phone: user.phone || '',
              companyName: user.companyName || '',
              companyAddress: user.companyAddress || '',
              role: user.role || ''
            }));
          }
        } catch (error) {
          // Profile endpoint doesn't exist or failed - use user context data instead
          console.log('Profile endpoint not available, using user context data');
          // Fall back to user context data
          setProfileData(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            companyName: user.companyName || '',
            companyAddress: user.companyAddress || '',
            role: user.role || ''
          }));
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
      // Update profile via API
      const response = await apiService.put('/profile', {
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
        timezone: 'UTC+5:30 (India Standard Time)', // Always India
        language: profileData.language
      });

      if (response.success) {
        // Update user context
        updateUser({
          ...user,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone,
          companyName: profileData.companyName,
          companyAddress: profileData.companyAddress,
          role: profileData.role
        });

        setIsEditing(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error('Failed to update profile');
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
      // Reload profile data from API
      const profileResponse = await apiService.getOptional('/profile');
      if (profileResponse?.success) {
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
          timezone: 'UTC+5:30 (India Standard Time)', // Always India
          language: profile.language || 'English (US)',
          profilePicture: ''
        });
      } else {
        // Fall back to user context
        setProfileData({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phone: user?.phone || '',
          companyName: user?.companyName || '',
          companyAddress: user?.companyAddress || '',
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
        phone: user?.phone || '',
        companyName: user?.companyName || '',
        companyAddress: user?.companyAddress || '',
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
      const response = await apiService.put('/profile/password', {
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
      const response = await apiService.put('/profile/notifications', notificationSettings);
      if (!response.success) {
        console.error('Failed to save notification settings');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const saveSecuritySettings = async () => {
    try {
      const response = await apiService.put('/profile/security', securitySettings);
      if (!response.success) {
        console.error('Failed to save security settings');
      }
    } catch (error) {
      console.error('Error saving security settings:', error);
    }
  };

  const saveUserPreferences = async () => {
    try {
      const response = await apiService.put('/profile/preferences', {
        darkMode,
        language: profileData.language,
        timezone: 'UTC+5:30 (India Standard Time)' // Always India
      });
      if (!response.success) {
        console.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
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
      const response = await apiService.delete('/profile', {
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profilePicture: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: MdPerson },
    { id: 'notifications', label: 'Notifications', icon: MdNotifications },
    { id: 'security', label: 'Security', icon: MdSecurity },
    { id: 'preferences', label: 'Preferences', icon: MdSettings }
  ];

  return (
    <div className="min-h-screen bg-[#F0F6FF] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <MdCheck className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Profile updated successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <MdClose className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2A8B8A] to-[#238080] flex items-center justify-center overflow-hidden shadow-lg">
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
                className="absolute -bottom-2 -right-2 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-full p-2 hover:bg-white transition-colors shadow-lg"
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
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#2A8B8A]/10 text-[#2A8B8A] text-sm rounded-full border border-[#2A8B8A]/20">
                  <MdBusiness className="w-4 h-4" />
                  {user?.companyName || 'No Company'}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100/80 backdrop-blur-sm text-gray-800 text-sm rounded-full border border-gray-200/50">
                  <MdAccountBox className="w-4 h-4" />
                  {user?.role || 'User'}
                </span>
                {user?.id && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100/80 backdrop-blur-sm text-green-800 text-sm rounded-full border border-green-200/50">
                    <MdVerified className="w-4 h-4" />
                    Verified Account
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/50">
          <div className="border-b border-gray-200/50">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-[#2A8B8A] text-[#2A8B8A]'
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
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100/80 backdrop-blur-sm rounded-lg hover:bg-gray-200/80 transition-colors disabled:opacity-50 border border-gray-200/50"
                      >
                        <MdCancel className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors disabled:opacity-50 shadow-lg"
                      >
                        <MdSave className="w-4 h-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors shadow-lg"
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
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent disabled:bg-gray-50/80 disabled:text-gray-500 bg-white/80 backdrop-blur-sm"
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
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent disabled:bg-gray-50/80 disabled:text-gray-500 bg-white/80 backdrop-blur-sm"
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
                      className="w-full pl-10 pr-3 py-2 border border-gray-300/50 rounded-lg bg-gray-50/80 backdrop-blur-sm text-gray-500"
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
                      className="w-full pl-10 pr-3 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent disabled:bg-gray-50/80 disabled:text-gray-500 bg-white/80 backdrop-blur-sm"
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
                      className="w-full pl-10 pr-3 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent disabled:bg-gray-50/80 disabled:text-gray-500 bg-white/80 backdrop-blur-sm"
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
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent disabled:bg-gray-50/80 disabled:text-gray-500 bg-white/80 backdrop-blur-sm"
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent disabled:bg-gray-50/80 disabled:text-gray-500 resize-none bg-white/80 backdrop-blur-sm"
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
                  className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent disabled:bg-gray-50/80 disabled:text-gray-500 resize-none bg-white/80 backdrop-blur-sm"
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
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent disabled:bg-gray-50/80 disabled:text-gray-500 bg-white/80 backdrop-blur-sm"
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
                    className="w-full px-3 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent disabled:bg-gray-50/80 disabled:text-gray-500 bg-white/80 backdrop-blur-sm"
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
                        
                        // Save to backend immediately
                        try {
                          await apiService.put('/profile/notifications', newSettings);
                        } catch (error) {
                          console.error('Error saving notification settings:', error);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-[#2A8B8A]' : 'bg-gray-300'
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
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50">
                <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent bg-white/80 backdrop-blur-sm"
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
                        className="w-full px-3 py-2 pr-10 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent bg-white/80 backdrop-blur-sm"
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
                        className="w-full px-3 py-2 pr-10 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent bg-white/80 backdrop-blur-sm"
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
                    className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                            try {
                              await apiService.put('/profile/security', newSettings);
                            } catch (error) {
                              console.error('Error saving security settings:', error);
                            }
                          }}
                          className="px-3 py-1 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent bg-white/80 backdrop-blur-sm"
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
                      <button
                        onClick={async () => {
                          const newSettings = {
                            ...securitySettings,
                            [key]: typeof value === 'boolean' ? !value : value
                          };
                          setSecuritySettings(newSettings);
                          
                          // Save to backend immediately
                          try {
                            await apiService.put('/profile/security', newSettings);
                          } catch (error) {
                            console.error('Error saving security settings:', error);
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? 'bg-[#2A8B8A]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
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
                      
                      // Save to backend immediately
                      try {
                        await apiService.put('/profile/preferences', {
                          darkMode: newDarkMode,
                          language: profileData.language,
                          timezone: 'UTC+5:30 (India Standard Time)'
                        });
                      } catch (error) {
                        console.error('Error saving preferences:', error);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      darkMode ? 'bg-[#2A8B8A]' : 'bg-gray-300'
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
                      
                      // Save to backend immediately
                      try {
                        await apiService.put('/profile/preferences', {
                          darkMode,
                          language: newLanguage,
                          timezone: 'UTC+5:30 (India Standard Time)'
                        });
                      } catch (error) {
                        console.error('Error saving preferences:', error);
                      }
                    }}
                    className="px-3 py-1 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent bg-white/80 backdrop-blur-sm"
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
                  <div className="px-3 py-1 bg-[#2A8B8A]/10 text-[#2A8B8A] rounded-lg text-sm font-medium border border-[#2A8B8A]/20">
                    UTC+5:30 (India Standard Time)
                  </div>
                </div>
              </div>

              {/* Account Management */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h3>
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-lg p-4 shadow-lg">
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
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg"
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
      </div>

      {/* Account Info Footer */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-6">
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
    </div>
  );
}
