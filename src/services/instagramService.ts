/**
 * Instagram API Service
 * Handles all Instagram Graph API calls
 */

import { buildApiUrl } from '@/config/server';

export const instagramService = {
  /**
   * Get all connected Instagram accounts
   */
  async getAccounts() {
    const token = localStorage.getItem('token');
    const response = await fetch(buildApiUrl('/api/v1/instagram/status'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Instagram account status');
    }

    const data = await response.json();
    return data.accounts || [];
  },

  /**
   * Get Instagram media feed for an account
   */
  async getMedia(accountId: string, limit: number = 25) {
    const token = localStorage.getItem('token');
    const response = await fetch(
      buildApiUrl(`/api/instagram/accounts/${accountId}/media?limit=${limit}`),
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Instagram media');
    }
    
    return response.json();
  },

  /**
   * Get Instagram insights for an account
   */
  async getInsights(
    accountId: string,
    metrics: string = 'impressions,reach,profile_views',
    period: string = 'day'
  ) {
    const token = localStorage.getItem('token');
    const response = await fetch(
      buildApiUrl(`/api/instagram/accounts/${accountId}/insights?metric=${metrics}&period=${period}`),
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch Instagram insights');
    }
    
    return response.json();
  },

  /**
   * Disconnect Instagram account
   */
  async disconnectAccount(accountId: string, instagramAccountId?: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(
      buildApiUrl('/api/v1/instagram/disconnect'),
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account_id: accountId,
          instagram_account_id: instagramAccountId
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to disconnect Instagram account');
    }

    return response.json();
  },

  /**
   * Get analytics data (mock for now, will use real data after app review)
   */
  async getAnalytics(accountId: string, days: number = 30) {
    const token = localStorage.getItem('token');
    const response = await fetch(
      buildApiUrl(`/api/instagram/analytics?account_id=${accountId}&days=${days}`),
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      // Return mock data if endpoint not available yet
      return {
        dm_responses: 0,
        comment_replies: 0,
        story_replies: 0,
        total_automations: 0,
        message: 'Automation features pending app review'
      };
    }
    
    return response.json();
  }
};

export default instagramService;
