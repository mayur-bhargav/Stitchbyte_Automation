"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/apiService';
import { useUser } from './UserContext';

interface BalanceContextType {
  balance: number;
  loading: boolean;
  currency: string;
  refreshBalance: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  addBalance: (amount: number, description?: string) => Promise<boolean>;
  deductBalance: (amount: number) => void;
  transactions: any[];
  loadTransactions: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

interface BalanceProviderProps {
  children: ReactNode;
}

export const BalanceProvider: React.FC<BalanceProviderProps> = ({ children }) => {
  const { user } = useUser(); // Get the current logged-in user
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [currency] = useState<string>('INR');
  const [transactions, setTransactions] = useState<any[]>([]);

  // Robust parser to support different backend response shapes
  const extractBalance = (res: any, fallback: number = 0): number => {
    // console.log('🔍 Extracting balance from response:', res);
    try {
      if (res == null) {
        // console.log('❌ Response is null/undefined, using fallback:', fallback);
        return fallback;
      }
      if (typeof res === 'number') {
        // console.log('✅ Response is direct number:', res);
        return res;
      }
      if (typeof res.balance === 'number') {
        // console.log('✅ Using res.balance:', res.balance);
        return res.balance;
      }
      if (typeof res.new_balance === 'number') {
        // console.log('✅ Using res.new_balance:', res.new_balance);
        return res.new_balance;
      }
      if (res.data) {
        // console.log('🔍 Checking res.data:', res.data);
        if (typeof res.data.balance === 'number') {
          // console.log('✅ Using res.data.balance:', res.data.balance);
          return res.data.balance;
        }
        if (res.data.wallet && typeof res.data.wallet.balance === 'number') {
          // console.log('✅ Using res.data.wallet.balance:', res.data.wallet.balance);
          return res.data.wallet.balance;
        }
        if (typeof res.data.new_balance === 'number') {
          // console.log('✅ Using res.data.new_balance:', res.data.new_balance);
          return res.data.new_balance;
        }
      }
      // console.log('❌ No balance found in response, using fallback:', fallback);
      return fallback;
    } catch (error) {
      console.error('❌ Error extracting balance:', error, 'using fallback:', fallback);
      return fallback;
    }
  };

  // Try multiple endpoints if primary fails
  const tryFetchBalance = async (userId: string) => {
    // console.log('🔍 Fetching balance for user:', userId);
    const fallbacks = [
      `/user/balance/${userId}`,
      `/wallet/balance`,
      `/balance`,
      `/users/${userId}/balance`,
    ];

    for (const endpoint of fallbacks) {
      try {
        // console.log('📡 Trying balance endpoint:', endpoint);
        const res: any = await apiService.getOptional(endpoint);
        // console.log('📥 Balance API response from', endpoint, ':', res);
        if (res) {
          const value = extractBalance(res, NaN);
          // console.log('💰 Extracted balance value:', value);
          if (!Number.isNaN(value)) {
            // console.log('✅ Using balance from', endpoint, ':', value);
            return value;
          }
        }
      } catch (e) {
        console.warn('❌ Balance endpoint failed:', endpoint, e);
        // continue to next fallback
      }
    }
    // As a last resort, use user context value
    const fallbackBalance = typeof user?.wallet?.balance === 'number' ? user!.wallet!.balance : 0;
    // console.log('🔄 Using fallback balance from user context:', fallbackBalance);
    return fallbackBalance;
  };

  const refreshBalance = async () => {
    const userId = (user as any)?.user_id || (user as any)?.id;
    // console.log('🔄 Refreshing balance for user:', userId);
    if (!userId) {
      console.warn('⚠️ No user ID available for balance refresh');
      return;
    }

    setLoading(true);
    try {
      const value = await tryFetchBalance(String(userId));
      // console.log('💰 Setting balance to:', value);
      setBalance(value);
    } catch (error) {
      console.error("❌ Error fetching balance:", error);
      // Fallback to user context wallet balance on error
      const fallbackBalance = user?.wallet?.balance || 0;
      // console.log('🔄 Using error fallback balance:', fallbackBalance);
      setBalance(fallbackBalance);
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
  };

  const addBalance = async (amount: number, description: string = "Balance added"): Promise<boolean> => {
    const userId = (user as any)?.user_id || (user as any)?.id;
    if (!userId) {
      console.warn('No user ID available for adding balance');
      return false;
    }

    try {
      const response = await apiService.post(`/user/add-balance/${userId}`, { 
        amount, 
        description 
      });
      
      if (response.success) {
        // Update local balance with the new balance from API
        setBalance(response.data?.new_balance || response.new_balance);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding balance:", error);
      return false;
    }
  };

  const deductBalance = (amount: number) => {
    setBalance(prev => Math.max(0, prev - amount));
  };

  const loadTransactions = async () => {
    // Check if user is logged in - we still need this for basic validation
    if (!user) {
      console.warn('No user available for loading transactions');
      return;
    }

    try {
      // Use the new endpoint that doesn't require user ID in URL
      // The JWT token will identify the user on the backend
      const response = await apiService.getOptional('/plans/user/transactions');
      // console.log('📊 Transactions API response:', response);
      
      if (response?.success && response.data) {
        setTransactions(response.data || []);
      } else if (response && Array.isArray(response)) {
        // Handle direct array response
        setTransactions(response);
      } else {
        setTransactions([]);
      }
    } catch (error: any) {
      let message = 'Failed to load transactions.';
      if (error.message?.includes('Not authorized')) {
        message = 'You are not authorized to view these transactions. Please log in again.';
      } else if (error.message?.includes('Failed to get subscription')) {
        message = 'No subscription found. Please select a plan.';
      }
      console.error("Error loading transactions:", error);
      setTransactions([]);
      // Removed alert to avoid annoying users, just log the error
    }
  };

  useEffect(() => {
    // Only fetch balance and transactions when user is available
    if (user) {
      refreshBalance();
      loadTransactions();
    }
  }, [user]); // Re-run when user changes

  const value: BalanceContextType = {
    balance,
    loading,
    currency,
    refreshBalance,
    updateBalance,
    addBalance,
    deductBalance,
    transactions,
    loadTransactions
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = (): BalanceContextType => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};

// Constants for pricing
export const MESSAGE_COST = 1.70; // ₹1.70 per message (Facebook's actual pricing)
export const CAMPAIGN_STARTUP_FEE = 1.0; // ₹1.00 campaign startup fee
export const CONVERSATION_COST = 0.85; // ₹0.85 per 24-hour conversation window
