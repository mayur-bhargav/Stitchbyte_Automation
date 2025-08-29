"use client";

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface WooCommerceStatus {
  connected: boolean;
  store_url?: string;
  connected_at?: string;
  webhook_id?: string;
  status: string;
}

interface WooCommerceIntegrationProps {
  onStatusChange?: (connected: boolean) => void;
  onDisconnectRequest?: () => void;
  onSuccessMessage?: (message: string) => void;
}

const WooCommerceIntegration: React.FC<WooCommerceIntegrationProps> = ({
  onStatusChange,
  onDisconnectRequest,
  onSuccessMessage
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<WooCommerceStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setError('');
      const response = await apiService.get('/connectors/woocommerce/status');
      const data: WooCommerceStatus = response;
      setStatus(data);
      setIsConnected(data.connected);
      onStatusChange?.(data.connected);
    } catch (error: any) {
      console.error('Status check failed:', error);
      setError('Failed to check connection status');
      setIsConnected(false);
    }
  };

  const connectWooCommerce = async () => {
    if (!storeUrl.trim()) {
      setError('Please enter your WooCommerce store URL');
      return;
    }

    // Validate store URL format
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(storeUrl)) {
      setError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.post('/connectors/woocommerce/connect', {
        store_url: storeUrl.trim()
      });

      if (response.auth_url) {
        // Store the store URL for later use
        localStorage.setItem('woocommerce_connecting_store', storeUrl.trim());
        // Open popup window for OAuth
        const popup = window.open(
          response.auth_url,
          'woocommerce_auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Listen for popup close
        if (popup) {
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              setTimeout(() => {
                checkStatus();
              }, 1000);
            }
          }, 1000);
        }
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      setError(error.response?.data?.detail || error.message || 'Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    // Use callback to request disconnect confirmation from parent
    if (onDisconnectRequest) {
      onDisconnectRequest();
    } else {
      // Fallback to confirm if no callback provided
      if (!confirm('Are you sure you want to disconnect your WooCommerce store? This will stop all order notifications.')) {
        return;
      }
      await performDisconnect();
    }
  };

  const performDisconnect = async () => {
    setLoading(true);
    setError('');

    try {
      await apiService.delete('/connectors/woocommerce/disconnect');
      setIsConnected(false);
      setStatus(null);
      setStoreUrl('');
      onStatusChange?.(false);
      if (onSuccessMessage) {
        onSuccessMessage('WooCommerce integration disconnected successfully');
      } else {
        alert('WooCommerce integration disconnected successfully');
      }
    } catch (error: any) {
      console.error('Disconnect failed:', error);
      setError('Failed to disconnect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.post('/connectors/woocommerce/test');
      if (onSuccessMessage) {
        onSuccessMessage('Connection test successful! Check the console for webhook details.');
      } else {
        alert('Connection test successful! Check the console for webhook details.');
      }
      console.log('WooCommerce test response:', response);
    } catch (error: any) {
      console.error('Test failed:', error);
      setError('Connection test failed. Please check your integration.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth callback when user returns from WooCommerce
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      // OAuth callback received - check status after a short delay
      setTimeout(() => {
        checkStatus();
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Remove stored store URL
        localStorage.removeItem('woocommerce_connecting_store');
      }, 1000);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="woocommerce-integration bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">WooCommerce Integration</h2>
            <p className="text-sm text-gray-600">Connect your WooCommerce store for automated order notifications</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div>
            <p className="text-gray-600 mb-4">
              Connect your WooCommerce store to automatically send WhatsApp notifications for new orders,
              order updates, and delivery confirmations.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WooCommerce Store URL
              </label>
              <input
                type="url"
                placeholder="https://yourstore.com"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your WooCommerce store URL (must include http:// or https://)
              </p>
            </div>

            <button
              onClick={connectWooCommerce}
              disabled={loading || !storeUrl.trim()}
              className="w-full bg-[#2A8B8A] text-white px-4 py-3 rounded-lg hover:bg-[#238080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connecting...
                </div>
              ) : (
                'Connect WooCommerce Store'
              )}
            </button>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• A popup window will open for WooCommerce authorization</li>
                <li>• Grant permissions for StitchByte to access your store</li>
                <li>• We'll automatically set up webhooks for order notifications</li>
                <li>• Start receiving WhatsApp messages for new orders immediately</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-green-800 font-medium">
                    Successfully connected to: <strong>{status?.store_url}</strong>
                  </p>
                  {status?.connected_at && (
                    <p className="text-sm text-green-600 mt-1">
                      Connected on: {new Date(status.connected_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                  {status?.webhook_id && (
                    <p className="text-sm text-green-600 mt-1">
                      Webhook ID: {status.webhook_id}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={testConnection}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                onClick={disconnect}
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Integration Active</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• New order notifications enabled</li>
                <li>• Order update alerts active</li>
                <li>• Delivery confirmation messages ready</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WooCommerceIntegration;
