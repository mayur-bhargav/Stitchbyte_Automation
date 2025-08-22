"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useBalance, MESSAGE_COST } from "../../contexts/BalanceContext";
import { useTheme } from "../../contexts/ThemeContext";

type Campaign = {
  _id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled' | 'failed' | 'partially_completed';
  template: string;
  recipients: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  created_at: string;
  scheduled_at?: string;
  completed_at?: string;
  budget?: number;
  cost_per_message?: number;
  campaign_startup_fee?: number;
  total_cost?: number;
  description?: string;
  tags?: string[];
  contacts?: string[];
  media_url?: string;
  media_type?: 'image' | 'video' | 'document';
  template_variables?: Record<string, any>;
  launch_details?: {
    launched_at: string;
    launched_by: string;
    success_count: number;
    failure_count: number;
    errors?: string[];
  };
};

type CampaignActivity = {
  timestamp: string;
  action: string;
  details: string;
  status: 'success' | 'error' | 'info';
};

export default function CampaignDetails() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activities, setActivities] = useState<CampaignActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'recipients' | 'analytics' | 'activity'>('overview');
  
  // Toast and modal states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);

  const { balance: userBalance, addBalance: addBalanceContext } = useBalance();

  // Toast helper function
  const showToastNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  // Confirmation modal helper function
  const showConfirmation = (title: string, message: string, action: () => void) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: action
    });
  };

  useEffect(() => {
    if (campaignId) {
      loadCampaignDetails();
      loadCampaignActivity();
    }
  }, [campaignId]);

  const loadCampaignDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/campaigns/${campaignId}`);
      const data = await response.json();
      
      if (data.success) {
        setCampaign(data.campaign);
      } else {
        showToastNotification('Campaign not found', 'error');
        router.push('/campaigns');
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
      showToastNotification('Failed to load campaign details', 'error');
    }
    setLoading(false);
  };

  const loadCampaignActivity = async () => {
    try {
      const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/activity`);
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to load campaign activity:', error);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!campaign) return;

    const campaignStartupFee = 1.0;
    const messageCosts = campaign.recipients * MESSAGE_COST;
    const totalCost = messageCosts + campaignStartupFee;
    
    const minimumLaunchCost = 1.0;
    if (totalCost < minimumLaunchCost) {
      showToastNotification(`Campaign cost (₹${totalCost.toFixed(2)}) is less than minimum launch cost (₹${minimumLaunchCost.toFixed(2)})`, 'error');
      return;
    }
    
    if (userBalance < totalCost) {
      const shortfall = totalCost - userBalance;
      showConfirmation(
        'Insufficient Balance',
        `You need ₹${totalCost.toFixed(2)} but only have ₹${userBalance.toFixed(2)}. You need ₹${shortfall.toFixed(2)} more. Would you like to add balance now?`,
        async () => {
          await addBalanceContext(Math.ceil(shortfall + 100), "Balance added for campaign launch");
          showToastNotification('Balance added successfully! You can now try launching the campaign again.', 'success');
        }
      );
      return;
    }

    showConfirmation(
      'Launch Campaign',
      `Are you sure you want to launch this campaign? Messages will be sent immediately. Total cost: ₹${totalCost.toFixed(2)} (₹${campaignStartupFee.toFixed(2)} startup fee + ₹${messageCosts.toFixed(2)} for ${campaign.recipients} messages)`,
      async () => {
        try {
          const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/launch`, {
            method: 'POST'
          });
          const data = await response.json();
          
          if (data.success) {
            showToastNotification(data.message || 'Campaign launched successfully!', 'success');
            loadCampaignDetails();
            loadCampaignActivity();
          } else {
            showToastNotification(data.error || 'Failed to launch campaign', 'error');
          }
        } catch (error) {
          showToastNotification('Failed to launch campaign. Please try again.', 'error');
          console.error('Launch error:', error);
        }
      }
    );
  };

  const handlePauseCampaign = async () => {
    showConfirmation(
      'Pause Campaign',
      'Are you sure you want to pause this campaign? You can resume it later.',
      async () => {
        try {
          const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/pause`, {
            method: 'POST'
          });
          const data = await response.json();
          
          if (data.success) {
            showToastNotification('Campaign paused successfully', 'success');
            loadCampaignDetails();
            loadCampaignActivity();
          } else {
            showToastNotification(data.error || 'Failed to pause campaign', 'error');
          }
        } catch (error) {
          showToastNotification('Failed to pause campaign. Please try again.', 'error');
        }
      }
    );
  };

  const handleResumeCampaign = async () => {
    showConfirmation(
      'Resume Campaign',
      'Are you sure you want to resume this campaign?',
      async () => {
        try {
          const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/resume`, {
            method: 'POST'
          });
          const data = await response.json();
          
          if (data.success) {
            showToastNotification('Campaign resumed successfully', 'success');
            loadCampaignDetails();
            loadCampaignActivity();
          } else {
            showToastNotification(data.error || 'Failed to resume campaign', 'error');
          }
        } catch (error) {
          showToastNotification('Failed to resume campaign. Please try again.', 'error');
        }
      }
    );
  };

  const handleDeleteCampaign = async () => {
    showConfirmation(
      'Delete Campaign',
      'Are you sure you want to delete this campaign? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`http://localhost:8000/campaigns/${campaignId}`, {
            method: 'DELETE'
          });
          const data = await response.json();
          
          if (data.success) {
            showToastNotification('Campaign deleted successfully', 'success');
            router.push('/campaigns');
          } else {
            showToastNotification(data.error || 'Failed to delete campaign', 'error');
          }
        } catch (error) {
          showToastNotification('Failed to delete campaign. Please try again.', 'error');
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'scheduled': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'partially_completed': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'paused':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="space-y-8">
          <div className={`border p-8 rounded-lg ${
            isDarkMode ? 'border-gray-700 bg-black' : 'border-gray-200 bg-white'
          }`}>
            <div className="animate-pulse">
              <div className={`h-8 rounded w-1/4 mb-4 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              <div className={`h-4 rounded w-1/2 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className={`min-h-screen ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="space-y-8 p-8">
          <div className={`border p-8 rounded-lg text-center ${
            isDarkMode ? 'border-gray-700 bg-black' : 'border-gray-200 bg-white'
          }`}>
            <h1 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>Campaign Not Found</h1>
            <Link href="/campaigns" className={`hover:underline ${
              isDarkMode ? 'text-emerald-400' : 'text-[#2A8B8A]'
            }`}>
              ← Back to Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="p-8 space-y-8">
        {/* Page Header */}
        <div className={`border p-8 rounded-lg ${
          isDarkMode ? 'border-gray-700 bg-black' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/campaigns"
                className={`p-2 transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-400 hover:text-[#2A8B8A]'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className={`text-2xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>{campaign.name}</h1>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                    {getStatusIcon(campaign.status)}
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1).replace('_', ' ')}
                  </span>
                </div>
                <p className={`${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Campaign Details & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Theme toggle button */}
              <button
                onClick={toggleTheme}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  isDarkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            {campaign.status === 'draft' && (
              <button 
                onClick={handleLaunchCampaign}
                disabled={userBalance < ((campaign.recipients * MESSAGE_COST) + 1.0)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Launch Campaign
              </button>
            )}
            {campaign.status === 'active' && (
              <button 
                onClick={handlePauseCampaign}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pause
              </button>
            )}
            {campaign.status === 'paused' && (
              <button 
                onClick={handleResumeCampaign}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resume
              </button>
            )}
            {(campaign.status === 'draft' || campaign.status === 'paused') && (
              <button 
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            <button 
              onClick={handleDeleteCampaign}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} p-6 rounded-xl transition-colors`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border border-blue-600 flex items-center justify-center rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Recipients</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{campaign.recipients.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} p-6 rounded-xl transition-colors`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border border-green-600 flex items-center justify-center rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sent</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{campaign.sent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} p-6 rounded-xl transition-colors`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border border-blue-600 flex items-center justify-center rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Delivered</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{campaign.delivered.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} p-6 rounded-xl transition-colors`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border border-purple-600 flex items-center justify-center rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Read</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{campaign.read.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} p-6 rounded-xl transition-colors`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border border-orange-600 flex items-center justify-center rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Replied</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{campaign.replied.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} rounded-xl overflow-hidden transition-colors`}>
        <div className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <nav className="flex">
            {[
              { key: 'overview', label: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { key: 'recipients', label: 'Recipients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
              { key: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { key: 'activity', label: 'Activity', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#2A8B8A] text-[#2A8B8A]'
                    : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:border-gray-500' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Campaign Information */}
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'} mb-4`}>Campaign Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Template</label>
                      <p className={isDarkMode ? 'text-white' : 'text-black'}>{campaign.template}</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Created</label>
                      <p className={isDarkMode ? 'text-white' : 'text-black'}>{new Date(campaign.created_at).toLocaleString()}</p>
                    </div>
                    {campaign.scheduled_at && (
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Scheduled For</label>
                        <p className={isDarkMode ? 'text-white' : 'text-black'}>{new Date(campaign.scheduled_at).toLocaleString()}</p>
                      </div>
                    )}
                    {campaign.completed_at && (
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Completed</label>
                        <p className={isDarkMode ? 'text-white' : 'text-black'}>{new Date(campaign.completed_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Budget</label>
                      <p className={isDarkMode ? 'text-white' : 'text-black'}>₹{campaign.budget?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Total Cost</label>
                      <p className={isDarkMode ? 'text-white' : 'text-black'}>₹{campaign.total_cost?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Cost Per Message</label>
                      <p className={isDarkMode ? 'text-white' : 'text-black'}>₹{campaign.cost_per_message?.toFixed(2) || MESSAGE_COST.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {campaign.description && (
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'} mb-4`}>Description</h3>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{campaign.description}</p>
                </div>
              )}

              {/* Tags */}
              {campaign.tags && campaign.tags.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'} mb-4`}>Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {campaign.tags.map((tag, index) => (
                      <span key={index} className={`${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-full text-sm`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Preview */}
              {campaign.media_url && (
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'} mb-4`}>Media</h3>
                  <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} rounded-lg p-4 max-w-md transition-colors`}>
                    {campaign.media_type === 'image' && (
                      <img src={campaign.media_url} alt="Campaign media" className="w-full h-auto rounded-lg" />
                    )}
                    {campaign.media_type === 'video' && (
                      <video src={campaign.media_url} controls className="w-full h-auto rounded-lg" />
                    )}
                    {campaign.media_type === 'document' && (
                      <div className="flex items-center gap-3">
                        <svg className={`w-8 h-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Document</p>
                          <a href={campaign.media_url} target="_blank" rel="noopener noreferrer" className="text-[#2A8B8A] hover:underline text-sm">
                            View Document
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Launch Details */}
              {campaign.launch_details && (
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'} mb-4`}>Launch Details</h3>
                  <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} rounded-lg p-4 transition-colors`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Launched At</label>
                        <p className={isDarkMode ? 'text-white' : 'text-black'}>{new Date(campaign.launch_details.launched_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Success Count</label>
                        <p className="text-green-600 font-semibold">{campaign.launch_details.success_count}</p>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Failure Count</label>
                        <p className="text-red-600 font-semibold">{campaign.launch_details.failure_count}</p>
                      </div>
                    </div>
                    {campaign.launch_details.errors && campaign.launch_details.errors.length > 0 && (
                      <div className="mt-4">
                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Errors</label>
                        <div className={`${isDarkMode ? 'bg-red-900/50 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-3 transition-colors`}>
                          <ul className={`list-disc list-inside text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'} space-y-1`}>
                            {campaign.launch_details.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recipients' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>Recipients</h3>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total: {campaign.recipients}</span>
              </div>
              <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} rounded-lg p-4 transition-colors`}>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Recipient details will be displayed here when available.</p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'} mb-6`}>Performance Analytics</h3>
                
                {/* Delivery Rates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {campaign.recipients > 0 ? ((campaign.delivered / campaign.recipients) * 100).toFixed(1) : 0}%
                    </div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Delivery Rate</div>
                    <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 mt-3`}>
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${campaign.recipients > 0 ? ((campaign.delivered / campaign.recipients) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {campaign.delivered > 0 ? ((campaign.read / campaign.delivered) * 100).toFixed(1) : 0}%
                    </div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Read Rate</div>
                    <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 mt-3`}>
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${campaign.delivered > 0 ? ((campaign.read / campaign.delivered) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {campaign.read > 0 ? ((campaign.replied / campaign.read) * 100).toFixed(1) : 0}%
                    </div>
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Reply Rate</div>
                    <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2 mt-3`}>
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${campaign.read > 0 ? ((campaign.replied / campaign.read) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Cost Analysis */}
                <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} rounded-lg p-6 transition-colors`}>
                  <h4 className={`text-md font-semibold ${isDarkMode ? 'text-white' : 'text-black'} mb-4`}>Cost Analysis</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cost per Message</p>
                      <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{MESSAGE_COST.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Spent</p>
                      <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>₹{campaign.total_cost?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cost per Reply</p>
                      <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        ₹{campaign.replied > 0 ? ((campaign.total_cost || 0) / campaign.replied).toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Budget Utilization</p>
                      <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {campaign.budget ? (((campaign.total_cost || 0) / campaign.budget) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>Campaign Activity</h3>
              </div>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} rounded-lg p-4 transition-colors`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                          activity.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                        }`}>
                          {activity.status}
                        </span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'} mb-1`}>{activity.action}</h4>
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{activity.details}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`border ${isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} rounded-lg p-8 text-center transition-colors`}>
                  <svg className={`w-12 h-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>No activity recorded yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white'} rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-colors`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Edit Campaign</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Campaign Name</label>
                <input
                  type="text"
                  defaultValue={campaign.name}
                  className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] transition-colors`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Description</label>
                <textarea
                  defaultValue={campaign.description || ''}
                  rows={3}
                  className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] transition-colors`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Budget (₹)</label>
                <input
                  type="number"
                  defaultValue={campaign.budget || 0}
                  min="0"
                  step="0.01"
                  className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] transition-colors`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Tags (comma separated)</label>
                <input
                  type="text"
                  defaultValue={campaign.tags?.join(', ') || ''}
                  className={`w-full border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] transition-colors`}
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className={`px-4 py-2 border ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-lg transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Implement save functionality
                  setShowEditModal(false);
                  showToastNotification('Campaign updated successfully!', 'success');
                }}
                className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transition-opacity duration-300 ${
          toastType === 'success' ? 'bg-green-500' : 
          toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {toastMessage}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm?.();
                  setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
