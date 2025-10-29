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
import { buildApiUrl } from '@/config/server';

const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

interface WhatsAppConnection {
  phoneNumber: string;
  displayName: string;
  status: string;
  accountId: string;
  wabaId: string;
  phoneNumberId: string;
  phoneVerified?: boolean;
  phoneVerificationStatus?: string;
  verificationDetails?: {
    verified_name?: string;
    display_phone_number?: string;
    name_status?: string;
    quality_rating?: string;
  };
}

// Hardcoded OAuth configuration - EXACT working setup with setup_type=seamless
const META_APP_ID = '1717883002200842';
// USE FRONTEND CALLBACK PAGE - This allows us to capture WABA data from sessionStorage
const REDIRECT_URI = process.env.NEXT_PUBLIC_META_REDIRECT_URI ?? 'https://automationwhats.stitchbyte.in/auth/meta-callback';
const CONFIG_ID = '829144999529928'; // Mandatory config_id for Embedded Signup
const STATE = 'stitchbyte_csrf_token';

// Embedded Signup extras parameter - SIMPLIFIED version that actually works
// Using app_only_install for direct app installation
const createEmbeddedSignupExtras = () => {
  return encodeURIComponent(JSON.stringify({
    sessionInfoVersion: "3",
    version: "v3",
    features: [
      { name: "app_only_install" }
    ]
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
  const [verifying, setVerifying] = useState(false);

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
        
        debugLog('📊 Config data:', config.data);
        debugLog('🔐 Phone verified:', config.data.phone_verified);
        debugLog('📋 Verification status:', config.data.phone_verification_status);
        
        setConnection({
          phoneNumber: phone?.display_phone_number || 'N/A',
          displayName: phone?.verified_name || option.business_name || 'N/A',
          status: option.review_status || 'Unknown',
          accountId: option.account_id || 'N/A',
          wabaId: option.waba_id || 'N/A',
          phoneNumberId: phone?.id || 'N/A',
          phoneVerified: config.data.phone_verified === true,
          phoneVerificationStatus: config.data.phone_verification_status || 'pending',
          verificationDetails: config.data.verification_details || {}
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
          debugLog('🚀 Launching Meta OAuth with Embedded Signup (POPUP MODE)');
        
        // Check if Facebook SDK is loaded
        if (typeof window.FB === 'undefined') {
          setError('Facebook SDK not loaded. Please refresh the page.');
          setLoading(false);
          return;
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

        // Use FB.login() in POPUP mode - this is what captures WABA data!
        window.FB.login((response: any) => {
          debugLog('🔔 FB.login() callback fired');
          debugLog('📦 Response:', response);
          
          if (response.authResponse) {
            const code = response.authResponse.code;
            debugLog('✅ Authorization code:', code);
            
            // Check if we have WABA data in sessionStorage (captured via postMessage)
            const wabaId = sessionStorage.getItem('waba_id');
            const phoneNumberId = sessionStorage.getItem('phone_number_id');
            const businessId = sessionStorage.getItem('business_id');
            
            debugLog('📋 Captured WABA data:', { wabaId, phoneNumberId, businessId });
            
            if (wabaId && phoneNumberId) {
              // Send to exchange-code endpoint with WABA data
              debugLog('✅ WABA data found - calling exchange-code endpoint');
              const exchangeUrl = buildApiUrl(
                `/api/auth/meta/exchange-code?code=${encodeURIComponent(code)}&waba_id=${encodeURIComponent(wabaId)}&phone_number_id=${encodeURIComponent(phoneNumberId)}${businessId ? `&business_id=${encodeURIComponent(businessId)}` : ''}&state=${encodedState}`
              );
              window.location.href = exchangeUrl;
            } else {
              // Fallback to regular callback endpoint
              debugLog('⚠️  No WABA data - falling back to regular callback');
              const callbackUrl = buildApiUrl(`/api/auth/meta/callback?code=${encodeURIComponent(code)}&state=${encodedState}`);
              window.location.href = callbackUrl;
            }
            
            // Clear sessionStorage
            sessionStorage.removeItem('waba_id');
            sessionStorage.removeItem('phone_number_id');
            sessionStorage.removeItem('business_id');
          } else {
            debugLog('❌ No authResponse - login failed or cancelled');
            setError('WhatsApp connection cancelled or failed.');
            setLoading(false);
          }
        }, {
          config_id: CONFIG_ID,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            "version": "v3",
            "setup": {
              "business": {
                "id": null,
                "name": null,
                "email": null,
                "phone": {"code": null, "number": null},
                "website": null,
                "address": {
                  "streetAddress1": null,
                  "streetAddress2": null,
                  "city": null,
                  "state": null,
                  "zipPostal": null,
                  "country": null
                },
                "timezone": null
              },
              "phone": {
                "displayName": null,
                "category": null,
                "description": null
              },
              "preVerifiedPhone": {"ids": null},
              "solutionID": null,
              "whatsAppBusinessAccount": {"ids": null}
            }
          }
        });

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

  const handleVerifyPhone = async () => {
    if (!user) return;
    
    setVerifying(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch(buildApiUrl('/api/whatsapp/verify-phone'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.verified) {
        setSuccess(data.message || "Phone number verified successfully! You can now send messages and create templates.");
        // Refresh connection to get updated status
        await fetchConnection(true);
      } else if (data.success && data.status === 'pending') {
        setError(data.message || "Phone registered but verification is still pending. Please try again in a few minutes.");
      } else {
        setError(data.detail || data.message || "Phone verification failed. Please try again.");
      }
    } catch (error: any) {
      console.error('Error verifying phone:', error);
      setError("Failed to verify phone number. Please try again.");
    } finally {
      setVerifying(false);
      setTimeout(() => { setSuccess(""); setError(""); }, 6000);
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
                        <InfoRow label="Verification Status" value={
                            connection.phoneVerified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                                    <LuCheck size={12} /> Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                                    <LuTriangleAlert size={12} /> Pending Verification
                                </span>
                            )
                        } />
                    </div>

                    {/* Verification Warning Banner */}
                    {!connection.phoneVerified && connection.phoneVerificationStatus !== 'verified' && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <LuTriangleAlert className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-yellow-800">Phone Verification Required</h4>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        You must verify your phone number before you can send messages or create templates. 
                                        Click the button below to complete verification.
                                    </p>
                                    <button 
                                        onClick={handleVerifyPhone} 
                                        disabled={verifying || loading}
                                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2A8B8A] hover:bg-[#238080] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {verifying ? (
                                            <>
                                                <LuLoader className="animate-spin" size={16} />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <LuCheck size={16} />
                                                Verify Phone Number
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
