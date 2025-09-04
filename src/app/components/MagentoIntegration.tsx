"use client";

import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface MagentoIntegrationProps {
  onStatusChange: (connected: boolean) => void;
  onDisconnectRequest: () => void;
  onSuccessMessage: (message: string) => void;
}

export default function MagentoIntegration({ 
  onStatusChange, 
  onDisconnectRequest, 
  onSuccessMessage 
}: MagentoIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState<{
    store_url?: string;
    connected_at?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState('');

  // Check initial connection status
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/connectors/magento/status');
      const connected = response.connected || false;
      
      setIsConnected(connected);
      if (connected) {
        setConnectionDetails({
          store_url: response.store_url,
          connected_at: response.connected_at
        });
      } else {
        setConnectionDetails(null);
      }
      
      onStatusChange(connected);
    } catch (error) {
      console.error('Failed to check Magento connection status:', error);
      setIsConnected(false);
      setConnectionDetails(null);
      onStatusChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!storeUrl.trim()) {
      setError('Please enter your Magento store URL');
      return;
    }

    // Validate store URL format
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(storeUrl)) {
      setError('Please enter a valid store URL (e.g., https://yourstore.com)');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting to connect to Magento store:', storeUrl);
      const response = await apiService.get(`/connectors/magento/connect?store_url=${encodeURIComponent(storeUrl)}`);
      console.log('Magento connect response:', response);
      
      if (response.authorization_url) {
        // Open OAuth URL in a new window
        const popup = window.open(
          response.authorization_url,
          'magento-oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Poll for completion
        const checkCompletion = setInterval(async () => {
          try {
            if (popup?.closed) {
              clearInterval(checkCompletion);
              // Check if connection was successful
              await checkConnectionStatus();
              return;
            }

            // Try to communicate with popup (will fail due to CORS if on different domain)
            try {
              if (popup?.location?.href && popup.location.href.includes('success')) {
                clearInterval(checkCompletion);
                popup.close();
                await checkConnectionStatus();
                onSuccessMessage('Magento store connected successfully!');
              }
            } catch (e) {
              // Expected CORS error, continue polling
            }
          } catch (error) {
            console.error('Error checking popup status:', error);
          }
        }, 1000);

        // Clean up after 5 minutes
        setTimeout(() => {
          clearInterval(checkCompletion);
          if (popup && !popup.closed) {
            popup.close();
          }
          setIsLoading(false);
        }, 300000);
      }
    } catch (error: any) {
      console.error('Failed to initiate Magento connection:', error);
      console.log('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method
      });
      
      let errorMessage = 'Failed to connect to Magento';
      
      if (error?.response?.status === 405) {
        errorMessage = 'Magento connection endpoint is not available. Please check if the backend service is running.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Magento integration is not configured on the server.';
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnectRequest();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && !isConnected) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ee672f] mx-auto mb-4"></div>
        <p className="text-gray-600">Checking Magento connection...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#ee672f] to-[#d45a26] rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">M</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isConnected ? 'Magento Connected' : 'Connect Magento'}
        </h2>
        <p className="text-gray-600">
          {isConnected 
            ? 'Your Magento store is connected and ready for automation'
            : 'Connect your Magento store to enable automated WhatsApp campaigns based on store events'
          }
        </p>
      </div>

      {/* Connection Status */}
      {isConnected && connectionDetails ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Store Connected</h3>
              <div className="space-y-2 text-sm text-green-700">
                {connectionDetails.store_url && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                    <span className="font-medium">{connectionDetails.store_url}</span>
                  </div>
                )}
                {connectionDetails.connected_at && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Connected on {formatDate(connectionDetails.connected_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Connection Form */
        <div className="space-y-6">
          {/* Features */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#ee672f] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Notifications</p>
                  <p className="text-sm text-gray-600">Automatic order confirmations and updates</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#ee672f] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Customer Sync</p>
                  <p className="text-sm text-gray-600">Sync customer data for personalized messaging</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#ee672f] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Inventory Alerts</p>
                  <p className="text-sm text-gray-600">Low stock and restock notifications</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#ee672f] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Real-time Webhooks</p>
                  <p className="text-sm text-gray-600">Instant event processing and automation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Connection Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Before you connect:</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <p>Make sure you have admin access to your Magento store</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <p>Ensure your Magento store is accessible via HTTPS</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <p>You'll be redirected to authorize StitchByte access to your store</p>
              </div>
            </div>
          </div>

          {/* Store URL Input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="storeUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Magento Store URL
              </label>
              <input
                type="url"
                id="storeUrl"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="https://yourstore.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee672f] focus:border-transparent transition-colors"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your complete Magento store URL including https://
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        {isConnected ? (
          <>
            <button
              onClick={() => checkConnectionStatus()}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Checking...' : 'Refresh Status'}
            </button>
            <button
              onClick={handleDisconnect}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Disconnect Store
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isLoading || !storeUrl.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#ee672f] to-[#d45a26] text-white rounded-xl font-semibold hover:from-[#d45a26] hover:to-[#bb4d1f] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Connect Magento Store
              </>
            )}
          </button>
        )}
      </div>

      {/* Security Note */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-100">
        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Your connection is secured with OAuth 2.0. StitchByte only accesses necessary store data.
      </div>
    </div>
  );
}
