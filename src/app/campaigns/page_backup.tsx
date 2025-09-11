"use client";
import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { useBalance, MESSAGE_COST, CAMPAIGN_STARTUP_FEE } from "../contexts/BalanceContext";
import { useUser } from "../contexts/UserContext";
import ProtectedRoute from "../components/ProtectedRoute";
import AddBalanceModal from "../components/AddBalanceModal";
import CreateCampaignModal from "./CreateCampaignModal";
import EditCampaignModal from "./EditCampaignModal";
import { PaymentService } from "../services/paymentService";
import {
  LuRocket,
  LuUsers,
  LuMessageSquare,
  LuWallet,
  LuPlus,
  LuPlay,
  LuPause,
  LuPencilLine,
  LuTrash2,
  LuZap,
  LuCalendar,
  LuClock,
  LuCircleCheck,
  LuCircleX,
  LuCircle,
  LuFilter,
  LuSearch,
  LuTrendingUp,
  LuActivity,
  LuTarget,
  LuDollarSign,
  LuRefreshCw,
  LuInfo,
  LuLoaderCircle
} from "react-icons/lu";

type Campaign = {
  _id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled' | 'failed' | 'partially_completed';
  template: string;
  recipients: number;
  contacts?: string[];
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

// ============================================================================
// UI Helper Components (Matching Dashboard Theme)
// ============================================================================

type CardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  description?: string;
  icon?: ReactNode;
  headerRight?: ReactNode;
};

function Card({ children, className = "", onClick, title, description, icon, headerRight }: CardProps) {
  const baseClasses =
    "relative rounded-xl bg-white border border-slate-200 shadow-sm transition-all h-full";
  const clickableClasses = onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-px" : "";
  return (
    <div onClick={onClick} className={`${baseClasses} ${clickableClasses} ${className}`}>
      {(title || description || icon || headerRight) && (
        <div className="flex items-center justify-between border-b border-slate-200 p-5 mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-9 h-9 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 border border-slate-200">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-slate-800">{title}</h3>
              {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>
          {headerRight}
        </div>
      )}
      <div className={title || description || icon || headerRight ? "p-5 pt-0" : "p-5"}>
        {children}
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
};

function StatCard({ label, value, icon, trend, trendValue, onClick }: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-500';
  const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '';

  return (
    <Card className={`p-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-px' : ''}`} onClick={onClick}>
      <div className="flex items-start gap-4">
        <div className="text-[#2A8B8A] bg-[#2A8B8A]/10 p-2 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {trendValue && (
            <p className={`text-xs ${trendColor} flex items-center gap-1 mt-1`}>
              {trendIcon} {trendValue}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

type AlertProps = {
  type: 'info' | 'warning' | 'error' | 'success';
  message: ReactNode;
  onAction?: () => void;
  actionText?: string;
};

function Alert({ type, message, onAction, actionText }: AlertProps) {
  const styles = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: <LuInfo className="text-blue-500" /> },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: <LuLoaderCircle className="text-yellow-500" /> },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: <LuCircle className="text-red-500" /> },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: <LuCircleCheck className="text-emerald-500" /> },
  };
  const { bg, border, text, icon } = styles[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg ${bg} ${border} border`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className={`text-sm ${text}`}>{message}</p>
        {onAction && actionText && (
          <button onClick={onAction} className={`mt-2 text-xs font-semibold underline ${text}`}>
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Campaigns Component (Redesigned to match Dashboard theme)
// ============================================================================

function Campaigns() {
  const { user } = useUser();
  const { balance: userBalance, refreshBalance, updateBalance } = useBalance();
  
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

  // Reboost Packages
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
      credits: 175,
      description: 'Most popular for growing businesses',
      features: ['150 Reboost Credits + 25 Bonus', 'Priority Support', 'Fast Processing', 'Campaign Analytics'],
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 999,
      credits: 425,
      description: 'Best value for large campaigns',
      features: ['350 Reboost Credits + 75 Bonus', '24/7 Premium Support', 'Instant Processing', 'Advanced Analytics', 'Dedicated Manager']
    }
  ];

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

  // API Functions
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
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setCampaigns([]);
    }
    setLoading(false);
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
      setCurrentPlan('Standard');
    }
  };

  // Event Handlers
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
    const campaign = campaigns.find(c => c._id === campaignId);
    if (!campaign) {
      showToastNotification('Campaign not found', 'error');
      return;
    }

    const campaignStartupFee = CAMPAIGN_STARTUP_FEE;
    const messageCosts = (campaign.contacts?.length || 0) * MESSAGE_COST;
    const totalCost = messageCosts + campaignStartupFee;
    
    if (totalCost < CAMPAIGN_STARTUP_FEE) {
      showToastNotification(`Campaign cost (₹${totalCost.toFixed(2)}) is less than minimum launch cost (₹${CAMPAIGN_STARTUP_FEE.toFixed(2)})`, 'error');
      return;
    }
    
    if (userBalance < totalCost) {
      const shortfall = totalCost - userBalance;
      showConfirmation(
        'Insufficient Balance',
        `You need ₹${totalCost.toFixed(2)} but only have ₹${userBalance.toFixed(2)}. You need ₹${shortfall.toFixed(2)} more. Would you like to add balance now?`,
        () => {
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
            if (data.remaining_balance !== undefined) {
              updateBalance(data.remaining_balance);
            } else {
              await refreshBalance();
            }
            loadCampaigns();
            loadStats();
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

  const handleRebootCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c._id === campaignId);
    if (!campaign) {
      showToastNotification('Campaign not found', 'error');
      return;
    }

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
            loadReboostCredits();
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

  const handlePurchasePlan = async (plan: any, paymentMethod: 'razorpay' | 'stripe') => {
    if (!user) return;

    setLoadingPayment(true);
    
    try {
      const userDetails = {
        email: user.email,
        phone: (user as any).phone || '',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
      };

      let result;
      
      if (paymentMethod === 'razorpay') {
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
        loadReboostCredits();
        loadUserPlan();
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

  // Helper functions for status styling and icons
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'completed': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'paused': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'scheduled': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'draft': return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'failed': return 'text-red-700 bg-red-50 border-red-200';
      case 'partially_completed': return 'text-orange-700 bg-orange-50 border-orange-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <LuPlay size={12} />;
      case 'completed': return <LuCircleCheck size={12} />;
      case 'paused': return <LuPause size={12} />;
      case 'scheduled': return <LuClock size={12} />;
      case 'draft': return <LuCircle size={12} />;
      case 'failed': return <LuCircleX size={12} />;
      case 'partially_completed': return <LuLoaderCircle size={12} />;
      default: return <LuCircle size={12} />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = selectedStatus === 'all' || campaign.status === selectedStatus;
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.template.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    if (user) {
      loadCampaigns();
      loadStats();
      loadReboostCredits();
      loadUserPlan();
    }
  }, [user]);

  // Loading state matching dashboard design
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-[#2A8B8A] mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading Campaigns...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-[#2A8B8A] mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-800">
      <div className="flex">
        <main className="flex-1 p-6 md:p-8">
          <div className="w-full max-w-screen-2xl mx-auto space-y-8">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Campaign Management</h1>
                <p className="text-slate-600">Create, manage and track your WhatsApp marketing campaigns</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#2A8B8A] hover:bg-[#238080] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm"
              >
                <LuPlus size={20} />
                Create Campaign
              </button>
            </div>
            
            {/* Main Container */}
            <Card>
              {/* Campaign Overview Stats */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-[#2A8B8A] bg-[#2A8B8A]/10 p-2 rounded-lg flex items-center justify-center">
                        <LuRocket size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-500 mb-1">Total Campaigns</p>
                        <p className="text-2xl font-bold text-slate-800">{campaigns.length.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          {campaigns.filter(c => c.status === 'active').length} active
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-[#2A8B8A] bg-[#2A8B8A]/10 p-2 rounded-lg flex items-center justify-center">
                        <LuUsers size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-500 mb-1">Recipients Reached</p>
                        <p className="text-2xl font-bold text-slate-800">{campaigns.reduce((total, campaign) => total + (campaign.delivered || 0), 0).toLocaleString()}</p>
                        <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                          ▲ Total delivered
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-[#2A8B8A] bg-[#2A8B8A]/10 p-2 rounded-lg flex items-center justify-center">
                        <LuZap size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-500 mb-1">Reboost Credits</p>
                        <p className="text-2xl font-bold text-slate-800">{reboostCredits.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">{currentPlan || 'No Plan'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPlanModal(true)}
                      className="w-full bg-[#2A8B8A] hover:bg-[#238080] text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
                    >
                      Add Credits
                    </button>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-[#2A8B8A] bg-[#2A8B8A]/10 p-2 rounded-lg flex items-center justify-center">
                        <LuTarget size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-500 mb-1">Current Plan</p>
                        <p className="text-2xl font-bold text-slate-800">{currentPlan || 'No Plan'}</p>
                        <p className="text-xs text-slate-500 mt-1">Upgrade for more features</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPlanModal(true)}
                      className="w-full bg-[#2A8B8A] hover:bg-[#238080] text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
                    >
                      Select Plan
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="mb-8 pb-8 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Filter & Search</h2>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Search Campaigns</label>
                    <div className="relative">
                      <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search by name or template..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent bg-white text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="border border-slate-300 bg-white text-slate-800 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent min-w-[160px]"
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
              </div>

              {/* Campaigns List */}
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Your Campaigns</h2>
                <p className="text-slate-600 mb-6">Showing {filteredCampaigns.length} of {campaigns.length} campaigns</p>
                {filteredCampaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <LuRocket size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">
                      {searchTerm || selectedStatus !== 'all' 
                        ? 'No campaigns found' 
                        : 'No campaigns yet'
                      }
                    </h3>
                    <p className="text-slate-600 mb-6">
                      {searchTerm || selectedStatus !== 'all' 
                        ? 'Try adjusting your filters or search terms.' 
                        : 'Get started by creating your first campaign.'
                      }
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-[#2A8B8A] hover:bg-[#238080] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2"
                    >
                      <LuPlus size={16} />
                      Create Your First Campaign
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCampaigns.map((campaign) => (
                      <div key={campaign._id} className="bg-slate-50 border border-slate-200 rounded-lg p-6 hover:bg-slate-100 transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-lg font-semibold text-slate-800">{campaign.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {campaign.status === 'draft' && (() => {
                            const totalCost = ((campaign.contacts?.length || 0) * MESSAGE_COST) + CAMPAIGN_STARTUP_FEE;
                            return (
                              <button 
                                onClick={() => handleLaunchCampaign(campaign._id)}
                                disabled={userBalance < totalCost}
                                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-400"
                                title={userBalance < totalCost ? "Insufficient balance to launch campaign" : "Launch Campaign"}
                              >
                                <LuPlay size={16} />
                              </button>
                            );
                          })()}
                          
                          {(campaign.status === 'active' || campaign.status === 'completed' || campaign.status === 'partially_completed') && (
                            <button 
                              onClick={() => handleRebootCampaign(campaign._id)}
                              disabled={reboostCredits < ((campaign.contacts?.length || 0) + 1)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-400"
                              title={reboostCredits < ((campaign.contacts?.length || 0) + 1) ? `Insufficient reboost credits. Need ${(campaign.contacts?.length || 0) + 1} credits.` : `Reboot Campaign (${(campaign.contacts?.length || 0) + 1} credits)`}
                            >
                              <LuRefreshCw size={16} />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleEditCampaign(campaign)}
                            className="p-2 text-slate-400 hover:text-[#2A8B8A] hover:bg-[#2A8B8A]/10 rounded-lg transition-colors"
                            title="Edit Campaign"
                          >
                            <LuPencilLine size={16} />
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteCampaign(campaign._id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Campaign"
                          >
                            <LuTrash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Campaign Description */}
                      {campaign.description && (
                        <p className="text-slate-600 mb-4">{campaign.description}</p>
                      )}

                      {/* Campaign Tags */}
                      {campaign.tags && campaign.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {campaign.tags.map((tag, index) => (
                            <span key={index} className="bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Campaign Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recipients</p>
                          <p className="text-lg font-semibold text-slate-800">{(campaign.contacts?.length || campaign.recipients || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sent</p>
                          <p className="text-lg font-semibold text-slate-800">{(campaign.sent || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Delivered</p>
                          <p className="text-lg font-semibold text-emerald-600">{(campaign.delivered || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Read</p>
                          <p className="text-lg font-semibold text-blue-600">{(campaign.read || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Replied</p>
                          <p className="text-lg font-semibold text-purple-600">{(campaign.replied || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cost</p>
                          <p className="text-lg font-semibold text-slate-800">₹{campaign.total_cost?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>

                      {/* Campaign Cost Information for Draft Campaigns */}
                      {campaign.status === 'draft' && (() => {
                        const recipientCount = campaign.contacts?.length || 0;
                        const messageCosts = recipientCount * MESSAGE_COST;
                        const totalCost = messageCosts + CAMPAIGN_STARTUP_FEE;
                        
                        return (
                          <div className="mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-slate-700">Launch Cost Breakdown</h4>
                              <span className="text-lg font-bold text-blue-600">
                                ₹{totalCost.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 space-y-1">
                              <div className="flex justify-between">
                                <span>Campaign startup fee:</span>
                                <span>₹{CAMPAIGN_STARTUP_FEE.toFixed(2)}</span>
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
                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    Add Balance
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Campaign Footer */}
                      <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <LuCalendar size={14} />
                            Template: {campaign.template}
                          </span>
                          <span className="flex items-center gap-1">
                            <LuClock size={14} />
                            Created: {new Date(campaign.created_at).toLocaleDateString()}
                          </span>
                          {campaign.scheduled_at && (
                            <span className="flex items-center gap-1">
                              <LuCalendar size={14} />
                              Scheduled: {new Date(campaign.scheduled_at).toLocaleDateString()}
                            </span>
                          )}
                          {campaign.completed_at && (
                            <span className="flex items-center gap-1">
                              <LuCircleCheck size={14} />
                              Completed: {new Date(campaign.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <Link 
                          href={`/campaigns/${campaign._id}`}
                          className="text-[#2A8B8A] hover:text-[#238080] font-medium flex items-center gap-1 hover:underline"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>          </div>
        </main>
      </div>

      {/* Modals and Components */}
      <CreateCampaignModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCampaignCreated={handleCampaignCreated}
      />

      {campaignToEdit && (
        <EditCampaignModal 
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setCampaignToEdit(null);
          }}
          onSuccess={handleCampaignUpdated}
          campaign={campaignToEdit as any}
        />
      )}

      <AddBalanceModal 
        isOpen={showAddBalanceModal}
        onClose={() => {
          setShowAddBalanceModal(false);
          setPrefilledAmount(null);
          showToastNotification('Balance added successfully!', 'success');
          refreshBalance();
        }}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transition-opacity duration-300 ${
          toastType === 'success' ? 'bg-emerald-500' : 
          toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {toastMessage}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-slate-600 mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm?.();
                  setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Plan Selection Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Choose Your Reboost Plan</h2>
                  <p className="text-slate-600 mt-1">Select a plan to purchase reboost credits</p>
                </div>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LuCircleX size={20} />
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
                        : 'border-slate-200 hover:border-slate-300'
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
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-slate-900 mb-1">
                        ₹{plan.price}
                      </div>
                      <div className="text-sm text-slate-600 mb-2">{plan.description}</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {plan.credits} Credits
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <LuCircleCheck className="text-emerald-500" size={16} />
                          <span className="text-sm text-slate-700">{feature}</span>
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
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                      >
                        {loadingPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <LuDollarSign size={16} />
                            Pay with Razorpay
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handlePurchasePlan(plan, 'stripe')}
                        disabled={loadingPayment}
                        className="w-full py-3 px-4 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loadingPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <LuDollarSign size={16} />
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
