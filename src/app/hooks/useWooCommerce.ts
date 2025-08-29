"use client";

import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface WooCommerceSettings {
  connected: boolean;
  status: string;
  store_url?: string;
  connected_at?: string;
  webhook_id?: string;
}

export const useWooCommerce = () => {
  const [status, setStatus] = useState<WooCommerceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/connectors/woocommerce/status');
      setStatus(response);
    } catch (error) {
      console.error('Failed to fetch WooCommerce status:', error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const connect = async (storeUrl: string) => {
    const response = await apiService.post('/connectors/woocommerce/connect', {
      store_url: storeUrl
    });

    // Open OAuth popup
    const popup = window.open(
      response.auth_url,
      'woocommerce_auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    return new Promise((resolve) => {
      if (popup) {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            fetchStatus(); // Refresh status
            resolve(true);
          }
        }, 1000);
      } else {
        resolve(false);
      }
    });
  };

  const disconnect = async () => {
    await apiService.delete('/connectors/woocommerce/disconnect');
    await fetchStatus();
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    status,
    loading,
    connect,
    disconnect,
    refresh: fetchStatus
  };
};
