'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/apiService';
import {
  LuUsers,
  LuBuilding,
  LuLink,
  LuUnlink,
  LuRefreshCw,
  LuTriangleAlert,
  LuCheck,
  LuLoader,
  LuX,
  LuPower,
  LuShield,
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
const REDIRECT_URI = process.env.NEXT_PUBLIC_META_REDIRECT_URI ?? 'https://automationwhats.stitchbyte.in/api/auth/meta/callback';
const CONFIG_ID = '829144999529928'; // Mandatory config_id for Embedded Signup
const STATE = 'stitchbyte_csrf_token';

// Embedded Signup extras parameter - Using marketing_messages_lite for automatic Cloud API registration
// This feature automatically registers the phone number with Cloud API (no PIN required!)
const createEmbeddedSignupExtras = () => {
  return encodeURIComponent(JSON.stringify({
    sessionInfoVersion: "3",
    version: "v3",
    features: [
      { name: "marketing_messages_lite" }
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
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [businessMetaUrl, setBusinessMetaUrl] = useState<string | null>(null);

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

  // Handle URL parameters from backend redirects
  useEffect(() => {
    if (!searchParams) return;

    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    const successParam = searchParams.get('success');

    if (errorParam) {
      setError(messageParam || 'An error occurred during WhatsApp connection.');
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else if (successParam) {
      setSuccess("WhatsApp connected successfully!");
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const handleConnect = async (isReconnect = false) => {
    if (!user) return;
    if (isReconnect) setShowReconnectModal(false);

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

      // Use FB.login() in POPUP mode - Following Meta's exact Embedded Signup documentation
      // https://developers.facebook.com/docs/whatsapp/embedded-signup
      window.FB.login((response: any) => {
        debugLog('🔔 FB.login() callback fired');
        debugLog('📦 SDK Response:', JSON.stringify(response, null, 2));

        if (response.authResponse) {
          const code = response.authResponse.code;
          debugLog('✅ Authorization code received:', code?.substring(0, 20) + '...');

          // Check if we have WABA data in sessionStorage (captured via postMessage from Embedded Signup)
          const wabaId = sessionStorage.getItem('waba_id');
          const phoneNumberId = sessionStorage.getItem('phone_number_id');
          const embeddedSignupError = sessionStorage.getItem('embedded_signup_error');
          const embeddedSignupCancelled = sessionStorage.getItem('embedded_signup_cancelled');

          debugLog('📋 Captured WABA data:', { wabaId, phoneNumberId });

          // Check for errors or cancellation from Embedded Signup
          if (embeddedSignupError) {
            debugLog('🚨 Embedded Signup error:', embeddedSignupError);
            setError(`WhatsApp setup error: ${embeddedSignupError}`);
            setLoading(false);
            sessionStorage.removeItem('embedded_signup_error');
            return;
          }

          if (embeddedSignupCancelled) {
            debugLog('❌ User cancelled at step:', embeddedSignupCancelled);
            setError('WhatsApp setup was cancelled.');
            setLoading(false);
            sessionStorage.removeItem('embedded_signup_cancelled');
            return;
          }

          // Build the exchange URL with WABA data
          let exchangeUrl = buildApiUrl(`/api/auth/meta/exchange-code?code=${encodeURIComponent(code)}&state=${encodedState}`);
          
          if (wabaId) {
            exchangeUrl += `&waba_id=${encodeURIComponent(wabaId)}`;
          }
          if (phoneNumberId) {
            exchangeUrl += `&phone_number_id=${encodeURIComponent(phoneNumberId)}`;
          }

          debugLog('🔗 Redirecting to:', exchangeUrl);
          
          // Clear sessionStorage before redirect
          sessionStorage.removeItem('waba_id');
          sessionStorage.removeItem('phone_number_id');
          sessionStorage.removeItem('embedded_signup_data');
          
          window.location.href = exchangeUrl;
        } else {
          debugLog('❌ No authResponse - login failed or cancelled');
          debugLog('📦 Full response:', response);
          setError('WhatsApp connection cancelled or failed. Please try again.');
          setLoading(false);
        }
      }, {
        config_id: CONFIG_ID,  // '829144999529928' - Your Embedded Signup config
        response_type: 'code', // Must be 'code' for System User access token
        override_default_response_type: true,
        extras: { "version": "v3" }  // Simplified extras per Meta documentation
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

  const handleVerifyPhone = async (pinValue?: string) => {
    if (!user) return;

    try {
      setVerifying(true);
      setError("");
      setSuccess("");

      // Build request payload
      const payload: { pin?: string } = {};
      if (pinValue) {
        payload.pin = pinValue;
      }

      // Call backend verification API
      const response = await fetch(buildApiUrl('/whatsapp/verify-phone'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        const errorDetail = data.detail || data;

        // Check for PIN required
        if (errorDetail.error === 'PIN_REQUIRED') {
          setShowPinModal(true);
          setVerifying(false);
          return;
        }

        // Check for business action required
        if (errorDetail.error === 'BUSINESS_ACTION_REQUIRED') {
          setBusinessMetaUrl(errorDetail.meta_url || 'https://business.facebook.com/settings/whatsapp-business-accounts');
          setShowBusinessModal(true);
          setVerifying(false);
          return;
        }

        // Generic error
        setError(errorDetail.message || "Phone verification failed");
        setVerifying(false);
        return;
      }

      // Success!
      if (data.success) {
        setShowPinModal(false);
        setPin('');
        setSuccess(data.message || "Phone verified successfully!");
        await fetchConnection(true);
      } else {
        setError(data.message || "Verification failed");
      }

    } catch (error: any) {
      console.error('Error verifying phone:', error);
      setError("Failed to verify phone. Check console for details.");
    } finally {
      setVerifying(false);
      setTimeout(() => { setSuccess(""); setError(""); }, 10000);
    }
  };

  const handlePinSubmit = () => {
    console.log('📌 PIN submit clicked. PIN length:', pin.length);
    if (pin && pin.length === 6) {
      console.log('✅ PIN valid, calling handleVerifyPhone');
      handleVerifyPhone(pin);
    } else {
      console.log('❌ Invalid PIN length');
      setError("Please enter a valid 6-digit PIN");
    }
  };

  const handleBusinessCompleted = async () => {
    // User clicked "I've completed" after visiting Meta Business Manager
    console.log('🔁 User confirmed they completed business action; re-checking verification status');
    try {
      setVerifying(true);
      setError("");
      const resp = await fetch(buildApiUrl('/whatsapp/verification-status'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const resData = await resp.json();
      console.log('📥 Verification-status response:', resData);
      if (resData.success && resData.status === 'verified') {
        setShowBusinessModal(false);
        setBusinessMetaUrl(null);
        setSuccess(resData.message || 'Verification completed.');
        await fetchConnection(true);
      } else {
        setError(resData.message || 'Not verified yet. Please follow the instructions on Meta and try again.');
      }
    } catch (err) {
      console.error('Error re-checking verification status:', err);
      setError('Failed to re-check verification status. Please try again.');
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
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your WhatsApp integration settings.</p>
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
                    <InfoRow label="Plan Status" value={
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${user.subscription.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
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
          <div className="lg:col-span-2 space-y-8">
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
                    <InfoRow label="WABA ID" value={connection.wabaId} isMono />
                    <InfoRow label="Phone Number ID" value={connection.phoneNumberId} isMono />
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-400 mb-2 font-semibold uppercase">Manage Connection</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button onClick={() => fetchConnection(true)} disabled={loading} className="btn-secondary">
                        <LuRefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                      </button>
                      <button onClick={() => setShowReconnectModal(true)} disabled={loading} className="btn-secondary">
                        <LuLink size={16} /> Reconnect
                      </button>
                      <button onClick={() => setShowDisconnectModal(true)} disabled={loading} className="btn-danger">
                        <LuUnlink size={16} /> Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // DISCONNECTED STATE
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-md">
                    <LuUnlink size={32} className="text-slate-400" />
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
        title="⚠️ Permanently Disconnect WhatsApp"
        description="WARNING: This action will permanently deregister your phone number from WhatsApp Cloud API. Your phone number will no longer be usable with Cloud API until re-registered. All connection data will be removed. This action cannot be undone easily."
        confirmText="Yes, Permanently Disconnect"
        icon={<LuTriangleAlert className="text-red-500" size={24} />}
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
        icon={<LuRefreshCw className="text-[#2A8B8A]" size={24} />}
        isLoading={loading}
        variant="primary"
      />

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <LuShield className="text-yellow-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Two-Step Verification Required</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your WhatsApp Business Account has two-step verification enabled.
                  Please enter your 6-digit PIN to complete verification.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                6-Digit PIN
              </label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-center text-2xl tracking-widest"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Find your PIN in WhatsApp Business Manager → Account Settings → Two-step verification
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPin("");
                  setVerifying(false);
                }}
                disabled={verifying}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={verifying || pin.length !== 6}
                className="flex-1 px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <LuLoader className="animate-spin" size={16} />
                    Verifying...
                  </span>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Business Action Modal */}
      {showBusinessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <LuTriangleAlert className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">System User Permissions Required</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Meta rejected the registration because the System User doesn't have the required permissions.
                  Follow these steps to grant full access:
                </p>
              </div>
            </div>

            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Step-by-Step Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Open <a href={businessMetaUrl || "https://business.facebook.com/settings/whatsapp-business-accounts"} target="_blank" rel="noreferrer" className="underline font-semibold">Business Settings → WhatsApp Accounts</a></li>
                <li>Click on your WhatsApp account (<strong>StitchByte</strong>)</li>
                <li>Go to the <strong>"System users"</strong> tab</li>
                <li>Find the System User used for your API connection</li>
                <li>Click on it and ensure it has <strong>"Full control"</strong> permission</li>
                <li>If missing: Click <strong>"Add People"</strong> → Select your System User → Grant <strong>"Full control"</strong></li>
                <li><strong>Important:</strong> If you just updated permissions, generate a <strong>new access token</strong> and reconnect</li>
              </ol>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Direct Link:</strong>
              </p>
              {businessMetaUrl ? (
                <a href={businessMetaUrl} target="_blank" rel="noreferrer" className="text-[#2A8B8A] underline break-words text-sm">
                  {businessMetaUrl}
                </a>
              ) : (
                <a href="https://business.facebook.com/settings/whatsapp-business-accounts" target="_blank" rel="noreferrer" className="text-[#2A8B8A] underline text-sm">
                  https://business.facebook.com/settings/whatsapp-business-accounts
                </a>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowBusinessModal(false); setBusinessMetaUrl(null); }}
                disabled={verifying}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Close
              </button>
              <button
                onClick={handleBusinessCompleted}
                disabled={verifying}
                className="flex-1 px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <LuLoader className="animate-spin" size={16} />
                    Checking...
                  </span>
                ) : (
                  "✓ I've completed these steps"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
