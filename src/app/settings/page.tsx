'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/apiService';
import {
  LuUsers,
  LuBuilding,
  LuLink,
  LuUnlink,
  LuRefreshCw,
  LuLogOut,
  LuTriangleAlert,
  LuCheck,
  LuLoader,
  LuX,
  LuPower,
} from 'react-icons/lu';

interface WhatsAppConnection {
  phoneNumber: string;
  displayName: string;
  status: string;
  accountId: string;
  wabaId: string;
  phoneNumberId: string;
}

// Hardcoded OAuth configuration - working setup with setup_type=seamless
const META_APP_ID = '1717883002200842';
const REDIRECT_URI = 'https://automationwhats.stitchbyte.in/api/auth/meta/callback';
const SCOPE = 'whatsapp_business_management,whatsapp_business_messaging,business_management';
const STATE = 'stitchbyte_csrf_token';

// Embedded Signup extras parameter
// This function creates the extras with user's phone number
const createEmbeddedSignupExtras = (userEmail: string, userPhone?: string) => {
  // Parse phone number for business.phone object
  let phoneCode = 91; // Default to India
  let phoneNumber = "";
  
  if (userPhone) {
    // Remove any + or spaces
    const cleanPhone = userPhone.replace(/[\s\-\+]/g, "");
    // CRITICAL: Phone number must include country code (e.g., 919119200819, not 9119200819)
    if (cleanPhone.startsWith("91")) {
      // Already has country code
      phoneNumber = cleanPhone;
    } else {
      // Add country code
      phoneNumber = `91${cleanPhone}`;
    }
  }
  
  // CRITICAL: Must have a phone number for WhatsApp Embedded Signup to work
  if (!phoneNumber) {
    console.warn(`⚠️ User ${userEmail} has no phone number, using default for WhatsApp signup`);
    phoneNumber = "919119200819"; // Default Indian number format with country code
  }
  
  return encodeURIComponent(JSON.stringify({
    sessionInfoVersion: "3",
    feature: "whatsapp_embedded_signup",
    features: [
      { name: "marketing_messages_lite" },
      { name: "will_be_partner_certified" }
    ],
    setup: {
      business: {
        isWebsiteRequired: false,
        name: "Stitchbyte",
        email: userEmail,
        phone: {
          code: phoneCode,
          number: phoneNumber  // MUST have a value - AiSensy always includes this
        },
        address: {
          streetAddress1: "",
          city: "",
          state: "",
          zipPostal: "",
          country: ""
        },
        timezone: "UTC+05:30"
      },
      phone: {
        displayName: "Stitchbyte",  // MUST have displayName - AiSensy uses business name
        category: "",
        description: ""
      }
    }
  }));
};

// ============================================================================
// Reusable UI Components
// ============================================================================

type SettingsCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
};

function SettingsCard({ title, description, icon, children }: SettingsCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-start gap-4 p-5 border-b border-slate-200">
        <div className="w-10 h-10 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

type InfoRowProps = {
  label: string;
  value: ReactNode;
  isMono?: boolean;
};

function InfoRow({ label, value, isMono = false }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-sm text-slate-700 font-medium ${isMono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText: string;
    icon: ReactNode;
    isLoading: boolean;
    variant?: 'danger' | 'primary';
};

function ConfirmationModal({ isOpen, onClose, onConfirm, title, description, confirmText, icon, isLoading, variant = 'primary' }: ModalProps) {
    if (!isOpen) return null;

    const confirmButtonStyles = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        primary: 'bg-[#2A8B8A] hover:bg-[#238080] focus:ring-[#2A8B8A]',
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl transform transition-all">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            {description}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg transition flex items-center justify-center ${confirmButtonStyles[variant]}`}
                        disabled={isLoading}
                    >
                        {isLoading ? <LuLoader className="animate-spin" /> : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
export default function SettingsPage() {
  const { user, logout } = useUser();
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);

  const handleSignOut = () => {
    logout();
  };

  const fetchConnection = async (isRefresh = false) => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");
      if (isRefresh) setSuccess("");

      const config = await apiService.getWhatsAppConfig(user.companyId);

      if (config?.data?.selected_option) {
        const option = config.data.selected_option;
        const phone = config.data.selected_phone;
        setConnection({
          phoneNumber: phone?.display_phone_number || 'N/A',
          displayName: phone?.verified_name || option.business_name || 'N/A',
          status: option.review_status || 'Unknown',
          accountId: option.account_id || 'N/A',
          wabaId: option.waba_id || 'N/A',
          phoneNumberId: phone?.id || 'N/A',
        });
        if (isRefresh) {
            setSuccess("Configuration refreshed successfully.");
        }
      } else {
        setConnection(null);
        if (isRefresh) {
            setError("No active WhatsApp configuration found.");
        }
      }

    } catch (error: any) {
      console.error('Error fetching/refreshing config:', error);
      setError("Failed to fetch or refresh configuration.");
      setConnection(null);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess("");
        setError("");
      }, 4000);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConnection();
    }
  }, [user]);

  const handleConnect = async (isReconnect = false) => {
    if (!user) return;
    if(isReconnect) setShowReconnectModal(false);

    setLoading(true);
    setError("");

    try {
        // Cleanup old config if reconnecting
        if (isReconnect) {
            try {
                await apiService.deleteWhatsAppConfig();
            } catch (cleanupError) {
                console.warn('Cleanup warning (non-critical):', cleanupError);
            }
        }
        
        // Create state with user info
        const stateData = { 
          csrf: STATE, 
          userId: user.id, 
          companyId: user.companyId, 
          email: user.email, 
          reconnect: isReconnect 
        };
        const encodedState = btoa(JSON.stringify(stateData));
        
        // Create extras with business and phone setup
        const embeddedExtras = createEmbeddedSignupExtras(user.email, undefined);
        
        // Hardcoded working OAuth URL with setup_type=seamless
        const metaLoginUrl = 
          `https://www.facebook.com/v19.0/dialog/oauth?` +
          `client_id=${META_APP_ID}&` +
          `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
          `scope=${SCOPE}&` +
          `response_type=code&` +
          `state=${encodedState}&` +
          `display=popup&` +
          `setup_type=seamless&` +
          `extras=${embeddedExtras}`;
        
        window.location.href = metaLoginUrl;

    } catch (error) {
      console.error('Error initiating Meta OAuth:', error);
      setError('Failed to initiate WhatsApp connection. Please try again.');
      setLoading(false);
    }
  };
  
  const confirmDisconnect = async () => {
    setShowDisconnectModal(false);
    try {
      setLoading(true);
      setError("");
      await apiService.deleteWhatsAppConfig();
      setConnection(null);
      setSuccess("WhatsApp account disconnected successfully.");
    } catch (error) {
      console.error('Error disconnecting WhatsApp account:', error);
      setError("Failed to disconnect WhatsApp account.");
    } finally {
      setLoading(false);
      setTimeout(() => { setSuccess(""); setError(""); }, 4000);
    }
  };

  if (!user || loading && !connection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
            <LuLoader className="w-12 h-12 mx-auto animate-spin text-[#2A8B8A]" />
            <p className="text-slate-500 mt-4">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your account and integration settings.</p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-red-600 transition"
          >
            <LuLogOut size={16} /> Sign Out
          </button>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1 space-y-8">
            <SettingsCard title="User Profile" description="Your personal information" icon={<LuUsers size={20} />}>
              <div className="space-y-1">
                <InfoRow label="Full Name" value={`${user.firstName} ${user.lastName}`} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Role" value={<span className="capitalize">{user.role}</span>} />
                <InfoRow label="User ID" value={user.id} isMono />
              </div>
            </SettingsCard>

            <SettingsCard title="Company Details" description="Your organization's information" icon={<LuBuilding size={20} />}>
                <div className="space-y-1">
                    <InfoRow label="Company Name" value={user.companyName} />
                    <InfoRow label="Company ID" value={user.companyId} isMono />
                    {user.subscription && (
                        <>
                            <InfoRow label="Plan" value={user.subscription.plan_name} />
                            <InfoRow label="Plan Status" value={
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                                user.subscription.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {user.subscription.status}
                                </span>
                            } />
                            <InfoRow label="Renews On" value={new Date(user.subscription.end_date).toLocaleDateString()} />
                        </>
                    )}
                </div>
            </SettingsCard>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            <SettingsCard title="WhatsApp Integration" description="Connect your WhatsApp Business account" icon={<LuPower size={20} />}>
              {connection ? (
                // CONNECTED STATE
                <div className="space-y-6">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <LuCheck className="text-emerald-500" size={20} />
                        <p className="text-sm font-semibold text-emerald-800">Successfully connected to WhatsApp Business</p>
                    </div>
                    
                    <div className="space-y-1">
                        <InfoRow label="Display Name" value={connection.displayName} />
                        <InfoRow label="Phone Number" value={connection.phoneNumber} isMono />
                        <InfoRow label="Connection Status" value={<span className="font-semibold capitalize text-emerald-700">{connection.status}</span>} />
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-400 mb-2 font-semibold uppercase">Manage Connection</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button onClick={() => fetchConnection(true)} disabled={loading} className="btn-secondary">
                                <LuRefreshCw size={16} className={loading ? 'animate-spin' : ''}/> Refresh
                            </button>
                            <button onClick={() => setShowReconnectModal(true)} disabled={loading} className="btn-secondary">
                                <LuLink size={16}/> Reconnect
                            </button>
                            <button onClick={() => setShowDisconnectModal(true)} disabled={loading} className="btn-danger">
                                <LuUnlink size={16}/> Disconnect
                            </button>
                        </div>
                    </div>
                </div>
              ) : (
                // DISCONNECTED STATE
                <div className="text-center py-8 px-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-md">
                        <LuUnlink size={32} className="text-slate-400"/>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-800 mt-4">No Account Connected</h4>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        Integrate your WhatsApp Business account to unlock messaging capabilities, campaigns, and more.
                    </p>
                    <button onClick={() => handleConnect(false)} disabled={loading} className="btn-primary mt-6">
                        {loading ? <LuLoader className="animate-spin" /> : 'Connect with Meta'}
                    </button>
                </div>
              )}

              {/* Success & Error Banners */}
              {success && <div className="feedback-banner success mt-4">{success}</div>}
              {error && <div className="feedback-banner error mt-4">{error}</div>}
            </SettingsCard>
          </div>
        </div>
      </div>
        
      {/* Modals */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={confirmDisconnect}
        title="Disconnect WhatsApp Account"
        description="Are you sure? This will remove all connection data. You'll need to reconnect to use WhatsApp features again."
        confirmText="Yes, Disconnect"
        icon={<LuTriangleAlert className="text-red-500" size={24}/>}
        isLoading={loading}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showReconnectModal}
        onClose={() => setShowReconnectModal(false)}
        onConfirm={() => handleConnect(true)}
        title="Reconnect WhatsApp Account"
        description="This will start the reconnection process. You'll be redirected to Meta to authorize the connection."
        confirmText="Continue to Reconnect"
        icon={<LuRefreshCw className="text-[#2A8B8A]" size={24}/>}
        isLoading={loading}
        variant="primary"
      />
    </div>
  );
}
