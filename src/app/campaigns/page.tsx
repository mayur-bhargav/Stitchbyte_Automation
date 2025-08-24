"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useBalance, MESSAGE_COST, CAMPAIGN_STARTUP_FEE } from "../contexts/BalanceContext";
import { useUser } from "../contexts/UserContext";
import ProtectedRoute from "../components/ProtectedRoute";
import AddBalanceModal from "../components/AddBalanceModal";
import CreateCampaignModal from "./CreateCampaignModal";
import EditCampaignModal from "./EditCampaignModal";
import { PaymentService } from "../services/paymentService";

type Campaign = {
  _id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled' | 'failed' | 'partially_completed';
  template: string;
  recipients: number;
  contacts?: string[]; // Array of contact phone numbers
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
};

type CampaignStats = {
  total_campaigns: number;
  active_campaigns: number;
  total_messages_sent: number;
  total_recipients_reached: number;
  average_delivery_rate: number;
  average_read_rate: number;
  average_reply_rate: number;
  total_cost: number;
};

function Campaigns() {
  const { user } = useUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  
  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  
  // Add Balance Modal state
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [prefilledAmount, setPrefilledAmount] = useState<number | null>(null);
  
  // Confirmation modal state
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
  
  // Reboost Credit System State
  const [reboostCredits, setReboostCredits] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Reboost Packages matching billing page exactly
  const reboostPackages = [
    {
      id: 'basic',
      name: 'Basic',
      price: 199,
      credits: 50,
      description: 'Perfect for small campaigns',
      features: ['50 Reboost Credits', 'Basic Support', 'Standard Processing']
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 499,
      credits: 175, // 150 + 25 bonus
      description: 'Most popular for growing businesses',
      features: ['150 Reboost Credits + 25 Bonus', 'Priority Support', 'Fast Processing', 'Campaign Analytics'],
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 999,
      credits: 425, // 350 + 75 bonus
      description: 'Best value for large campaigns',
      features: ['350 Reboost Credits + 75 Bonus', '24/7 Premium Support', 'Instant Processing', 'Advanced Analytics', 'Dedicated Manager']
    }
  ];
  
  // Use global balance context
  const { balance: userBalance, addBalance: addBalanceContext, refreshBalance, updateBalance } = useBalance();

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

  // Reboost Credit Functions
  const loadReboostCredits = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/reboost-credits?companyId=${user.companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setReboostCredits(data.credits || 0);
    } catch (error) {
      console.error('Failed to load reboost credits:', error);
      // Mock data for testing
      setReboostCredits(25);
    }
  };

  const loadUserPlan = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/user-plan?companyId=${user.companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setCurrentPlan(data.planName || null);
    } catch (error) {
      console.error('Failed to load user plan:', error);
      // Mock data for testing
      setCurrentPlan('Standard');
    }
  };

  const handlePurchasePlan = async (plan: any, paymentMethod: 'razorpay' | 'stripe') => {
    if (!user) return;

    setLoadingPayment(true);
    
    try {
      const userDetails = {
        email: user.email,
        phone: user.phone,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
      };

      let result;
      
      if (paymentMethod === 'razorpay') {
        // Load Razorpay script first
        const scriptLoaded = await PaymentService.loadRazorpayScript();
        if (!scriptLoaded) {
          showToastNotification('Failed to load Razorpay. Please try again.', 'error');
          return;
        }
        
        result = await PaymentService.processRazorpayPayment(
          plan.price,
          plan.name,
          plan.credits,
          userDetails
        );
      } else {
        result = await PaymentService.processStripePayment(
          plan.price,
          plan.name,
          plan.credits,
          userDetails
        );
      }

      if (result.success) {
        showToastNotification(result.message, 'success');
        setShowPlanModal(false);
        loadReboostCredits(); // Refresh credits
        loadUserPlan(); // Refresh plan
      } else {
        showToastNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showToastNotification('Payment failed. Please try again.', 'error');
    } finally {
      setLoadingPayment(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCampaigns();
      loadStats();
      loadReboostCredits();
      loadUserPlan();
    }
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/campaigns?companyId=${user.companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      const campaignsData = data.campaigns || [];
      setCampaigns(campaignsData);
      
      // Check for campaigns that should be auto-completed
      await checkAndAutoCompleteCampaigns(campaignsData);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setCampaigns([]);
    }
    setLoading(false);
  };

  const checkAndAutoCompleteCampaigns = async (campaignsData: Campaign[]) => {
    const activeCampaigns = campaignsData.filter(campaign => campaign.status === 'active');
    
    for (const campaign of activeCampaigns) {
      const totalRecipients = campaign.contacts?.length || campaign.recipients || 0;
      const totalSent = campaign.sent || 0;
      
      // If all messages have been sent, mark as completed
      if (totalRecipients > 0 && totalSent >= totalRecipients) {
        try {
          const token = localStorage.getItem('token');
          await fetch(`http://localhost:8000/campaigns/${campaign._id}/complete`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
          });
          
          // Update the campaign in local state
          setCampaigns(prev => prev.map(c => 
            c._id === campaign._id 
              ? { ...c, status: 'completed', completed_at: new Date().toISOString() }
              : c
          ));
          
          showToastNotification(`Campaign "${campaign.name}" automatically completed!`, 'success');
        } catch (error) {
          console.error(`Failed to auto-complete campaign ${campaign._id}:`, error);
        }
      }
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/campaigns/stats?companyId=${user.companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCampaignCreated = () => {
    showToastNotification('Campaign created successfully!', 'success');
    loadCampaigns();
    loadStats();
  };

  const handleCampaignUpdated = () => {
    showToastNotification('Campaign updated successfully!', 'success');
    loadCampaigns();
    loadStats();
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setCampaignToEdit(campaign);
    setShowEditModal(true);
  };

  const handleLaunchCampaign = async (campaignId: string) => {
    // Find the campaign to check balance requirements
    const campaign = campaigns.find(c => c._id === campaignId);
    if (!campaign) {
      showToastNotification('Campaign not found', 'error');
      return;
    }

    // Calculate required balance (campaign startup fee + message costs)
    const campaignStartupFee = CAMPAIGN_STARTUP_FEE;
    const messageCosts = (campaign.contacts?.length || 0) * MESSAGE_COST;
    const totalCost = messageCosts + campaignStartupFee;
    
    // Check if the cost is less than campaign launch minimum cost
    const minimumLaunchCost = CAMPAIGN_STARTUP_FEE; // Minimum cost to launch any campaign
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
          setPrefilledAmount(Math.ceil(shortfall + 100));
          setShowAddBalanceModal(true);
        }
      );
      return;
    }

    showConfirmation(
      'Launch Campaign',
      `Are you sure you want to launch this campaign? Messages will be sent immediately. Total cost: ₹${totalCost.toFixed(2)} (₹${campaignStartupFee.toFixed(2)} startup fee + ₹${messageCosts.toFixed(2)} for ${campaign.contacts?.length || 0} messages)`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/launch`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ companyId: user?.companyId })
          });
          const data = await response.json();
          
          if (data.success) {
            showToastNotification(data.message || 'Campaign launched successfully!', 'success');
            // Instantly update balance from the response
            if (data.remaining_balance !== undefined) {
              updateBalance(data.remaining_balance);
            } else {
              // Fallback to refresh balance if not provided
              await refreshBalance();
            }
            // Reload data to reflect updated campaign status
            loadCampaigns();
            loadStats();
          } else {
            // Handle specific error cases
            if (data.error && data.error.includes('budget')) {
              showToastNotification(`Budget Error: ${data.error}`, 'error');
            } else if (data.error && data.error.includes('balance')) {
              showToastNotification(`Balance Error: ${data.error}`, 'error');
            } else {
              showToastNotification(data.error || 'Failed to launch campaign', 'error');
            }
          }
        } catch (error) {
          showToastNotification('Failed to launch campaign. Please try again.', 'error');
          console.error('Launch error:', error);
        }
      }
    );
  };

  const handleRebootCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c._id === campaignId);
    if (!campaign) {
      showToastNotification('Campaign not found', 'error');
      return;
    }

    // Calculate reboost credits needed (1 credit per message + 1 startup credit)
    const recipientCount = campaign.contacts?.length || campaign.recipients || 0;
    const creditsNeeded = recipientCount + 1;
    
    if (reboostCredits < creditsNeeded) {
      showToastNotification(`Insufficient reboost credits. You need ${creditsNeeded} credits but only have ${reboostCredits}.`, 'warning');
      setShowPlanModal(true);
      return;
    }

    showConfirmation(
      'Reboot Campaign',
      `Are you sure you want to reboot this campaign? This will use ${creditsNeeded} reboost credits (${recipientCount} message credits + 1 startup credit).`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/reboot`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();

          if (response.ok) {
            showToastNotification(data.message || 'Campaign rebooted successfully!', 'success');
            loadCampaigns();
            loadReboostCredits(); // Refresh credits after successful reboot
          } else {
            showToastNotification(data.error || 'Failed to reboot campaign', 'error');
          }
        } catch (error) {
          showToastNotification('Failed to reboot campaign. Please try again.', 'error');
          console.error('Reboot error:', error);
        }
      }
    );
  };

    const handleDeleteCampaign = async (campaignId: string) => {
    showConfirmation(
      'Delete Campaign',
      'Are you sure you want to delete this campaign? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:8000/campaigns/${campaignId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ companyId: user?.companyId })
          });
          const data = await response.json();
          
          if (data.success) {
            showToastNotification(data.message || 'Campaign deleted successfully', 'success');
            loadCampaigns();
            loadStats();
          } else {
            showToastNotification(data.error || 'Failed to delete campaign', 'error');
          }
        } catch (error) {
          showToastNotification('Failed to delete campaign. Please try again.', 'error');
          console.error('Delete error:', error);
        }
      }
    );
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus;
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.template.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
      case 'scheduled':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'partially_completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4a1 1 0 112 0v.01a1 1 0 11-2 0V14zm1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border border-gray-200 p-8 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black flex items-center justify-center rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">Campaigns</h1>
              <p className="text-gray-600">Manage your WhatsApp marketing campaigns</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#2A8B8A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#238080] transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Campaign
          </button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Wallet Balance Card */}
          <div className="border border-gray-200 p-6 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border border-[#2A8B8A] flex items-center justify-center rounded-lg">
                <svg className="w-6 h-6 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
                <p className="text-2xl font-bold text-black">₹{userBalance.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setPrefilledAmount(500);
                  setShowAddBalanceModal(true);
                }}
                className="w-full px-3 py-2 text-sm bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors"
              >
                Add ₹500
              </button>
            </div>
          </div>
          
          <div className="border border-gray-200 p-6 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border border-blue-600 flex items-center justify-center rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-black">{campaigns.length}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 p-6 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border border-green-600 flex items-center justify-center rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold text-black">{campaigns.reduce((total, campaign) => total + (campaign.sent || 0), 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 p-6 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border border-purple-600 flex items-center justify-center rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Recipients Reached</p>
                <p className="text-2xl font-bold text-black">{campaigns.reduce((total, campaign) => total + (campaign.delivered || 0), 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

      {/* Performance Metrics */}
      {stats && (
        <div className="border border-gray-200 p-8 rounded-xl">
          <h2 className="text-xl font-bold text-black mb-6">Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.average_delivery_rate || 0}%</div>
              <div className="text-sm font-medium text-gray-600">Average Delivery Rate</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.average_delivery_rate || 0}%` }}></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.average_read_rate || 0}%</div>
              <div className="text-sm font-medium text-gray-600">Average Read Rate</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${stats.average_read_rate || 0}%` }}></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{stats.average_reply_rate || 0}%</div>
              <div className="text-sm font-medium text-gray-600">Average Reply Rate</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${stats.average_reply_rate || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reboost Credits Section */}
      <div className="border border-gray-200 p-6 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Reboost Credits</h3>
              <p className="text-sm text-gray-600">Use credits to rerun your campaigns</p>
            </div>
          </div>
          <button
            onClick={() => setShowPlanModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            Purchase Credits
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Credits */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{reboostCredits}</div>
              <div className="text-sm font-medium text-gray-600">Available Credits</div>
            </div>
          </div>
          
          {/* Current Plan */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 mb-2">
                {currentPlan || 'No Plan'}
              </div>
              <div className="text-sm font-medium text-gray-600">Current Plan</div>
            </div>
          </div>
          
          {/* Credit Usage Info */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 mb-2">Credit Usage</div>
              <div className="text-xs text-gray-600">
                <div>1 credit per message</div>
                <div>+ 1 startup credit</div>
              </div>
            </div>
          </div>
        </div>
        
        {!currentPlan && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-yellow-800">
                No active plan. Purchase a reboost credit plan to rerun your campaigns.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="border border-gray-200 p-6 rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Filter by Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 bg-white text-black px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
              >
                <option value="all">All Campaigns</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
                <option value="failed">Failed</option>
                <option value="partially_completed">Partially Completed</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-black mb-2">Search Campaigns</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 bg-white text-black px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">Your Campaigns</h2>
          <p className="text-gray-600">Showing {filteredCampaigns.length} of {campaigns.length} campaigns</p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#2A8B8A] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-black mb-2">No campaigns found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedStatus !== 'all' 
                ? 'Try adjusting your filters or search terms.' 
                : 'Get started by creating your first campaign.'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#2A8B8A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#238080] transition-all duration-200"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign._id} className="p-8 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-black">{campaign.name}</h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)}
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === 'draft' && (() => {
                      const totalCost = ((campaign.contacts?.length || 0) * MESSAGE_COST) + CAMPAIGN_STARTUP_FEE;
                      return (
                        <button 
                          onClick={() => handleLaunchCampaign(campaign._id)}
                          disabled={userBalance < totalCost}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
                          title={userBalance < totalCost ? "Insufficient balance to launch campaign" : "Launch Campaign"}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      );
                    })()}
                    {(campaign.status === 'active' || campaign.status === 'completed' || campaign.status === 'partially_completed') && (
                      <button 
                        onClick={() => handleRebootCampaign(campaign._id)}
                        disabled={reboostCredits < ((campaign.contacts?.length || 0) + 1)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
                        title={reboostCredits < ((campaign.contacts?.length || 0) + 1) ? `Insufficient reboost credits. Need ${(campaign.contacts?.length || 0) + 1} credits.` : `Reboot Campaign (${(campaign.contacts?.length || 0) + 1} credits)`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditCampaign(campaign)}
                      className="p-2 text-gray-400 hover:text-[#2A8B8A] transition-colors"
                      title="Edit Campaign"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteCampaign(campaign._id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {campaign.description && (
                  <p className="text-gray-600 mb-4">{campaign.description}</p>
                )}

                {campaign.tags && campaign.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {campaign.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recipients</p>
                    <p className="text-lg font-semibold text-black">{(campaign.contacts?.length || campaign.recipients || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sent</p>
                    <p className="text-lg font-semibold text-black">{(campaign.sent || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Delivered</p>
                    <p className="text-lg font-semibold text-green-600">{(campaign.delivered || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Read</p>
                    <p className="text-lg font-semibold text-blue-600">{(campaign.read || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Replied</p>
                    <p className="text-lg font-semibold text-purple-600">{(campaign.replied || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cost</p>
                    <p className="text-lg font-semibold text-black">₹{campaign.total_cost?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                {/* Campaign Cost Information for Draft Campaigns */}
                {campaign.status === 'draft' && (() => {
                  const recipientCount = campaign.contacts?.length || 0;
                  const messageCosts = recipientCount * MESSAGE_COST;
                  const totalCost = messageCosts + CAMPAIGN_STARTUP_FEE;
                  
                  return (
                    <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Launch Cost Breakdown</h4>
                        <span className="text-lg font-bold text-blue-600">
                          ₹{totalCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Campaign startup fee:</span>
                          <span>₹{CAMPAIGN_STARTUP_FEE.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Messages ({recipientCount} × ₹{MESSAGE_COST.toFixed(2)}):</span>
                          <span>₹{messageCosts.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Messages ({recipientCount} × ₹{MESSAGE_COST.toFixed(2)}):</span>
                          <span>₹{messageCosts.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {userBalance < totalCost && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-red-800 font-medium">Insufficient Balance</p>
                              <p className="text-xs text-red-600">
                                Need ₹{(totalCost - userBalance).toFixed(2)} more
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setPrefilledAmount(Math.ceil(totalCost - userBalance + 100));
                                setShowAddBalanceModal(true);
                              }}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Add Balance
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>Template: {campaign.template}</span>
                    <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                    {campaign.scheduled_at && (
                      <span>Scheduled: {new Date(campaign.scheduled_at).toLocaleDateString()}</span>
                    )}
                    {campaign.completed_at && (
                      <span>Completed: {new Date(campaign.completed_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  <Link 
                    href={`/campaigns/${campaign._id}`}
                    className="text-[#2A8B8A] hover:text-[#238080] font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <CreateCampaignModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCampaignCreated={handleCampaignCreated}
        user={user}
      />

      {/* Edit Campaign Modal */}
      {campaignToEdit && (
        <EditCampaignModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setCampaignToEdit(null);
          }}
          onSuccess={handleCampaignUpdated}
          campaign={campaignToEdit}
          user={user}
        />
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
      
      {/* Add Balance Modal */}
      <AddBalanceModal 
        isOpen={showAddBalanceModal}
        onClose={() => {
          setShowAddBalanceModal(false);
          setPrefilledAmount(null);
        }}
        prefilledAmount={prefilledAmount}
        onSuccess={() => {
          setShowAddBalanceModal(false);
          setPrefilledAmount(null);
          showToastNotification('Balance added successfully!', 'success');
          refreshBalance(); // Refresh balance after successful addition
        }}
      />
      
      {/* Plan Selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Reboost Plan</h2>
                  <p className="text-gray-600 mt-1">Select a plan to purchase reboost credits</p>
                </div>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reboostPackages.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg ${
                      plan.popular 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        ₹{plan.price}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{plan.description}</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {plan.credits} Credits
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => handlePurchasePlan(plan, 'razorpay')}
                        disabled={loadingPayment}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                          plan.popular
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-900 hover:bg-gray-800 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                      >
                        {loadingPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <img src="https://razorpay.com/favicon.ico" alt="Razorpay" className="w-4 h-4" />
                            Pay with Razorpay
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handlePurchasePlan(plan, 'stripe')}
                        disabled={loadingPayment}
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loadingPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                            </svg>
                            Pay with Stripe
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap the component with ProtectedRoute for security
const ProtectedCampaignsPage = () => {
  return (
    <ProtectedRoute>
      <Campaigns />
    </ProtectedRoute>
  );
};

export default ProtectedCampaignsPage;
