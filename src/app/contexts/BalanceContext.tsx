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
    try {
      if (res == null) return fallback;
      if (typeof res === 'number') return res;
      if (typeof res.balance === 'number') return res.balance;
      if (typeof res.new_balance === 'number') return res.new_balance;
      if (res.data) {
        if (typeof res.data.balance === 'number') return res.data.balance;
        if (res.data.wallet && typeof res.data.wallet.balance === 'number') return res.data.wallet.balance;
        if (typeof res.data.new_balance === 'number') return res.data.new_balance;
      }
      return fallback;
    } catch {
      return fallback;
    }
  };

  // Try multiple endpoints if primary fails
  const tryFetchBalance = async (userId: string) => {
    const fallbacks = [
      `/user/balance/${userId}`,
      `/wallet/balance`,
      `/balance`,
      `/users/${userId}/balance`,
    ];

    for (const endpoint of fallbacks) {
      try {
        const res: any = await apiService.getOptional(endpoint);
        if (res) {
          const value = extractBalance(res, NaN);
          if (!Number.isNaN(value)) {
            return value;
          }
        }
      } catch (e) {
        // continue to next fallback
        // console.warn('Balance endpoint failed:', endpoint, e);
      }
    }
    // As a last resort, use user context value
    return typeof user?.wallet?.balance === 'number' ? user!.wallet!.balance : 0;
  };

  const refreshBalance = async () => {
    const userId = (user as any)?.user_id || (user as any)?.id;
    if (!userId) {
      console.warn('No user ID available for balance refresh');
      return;
    }

    setLoading(true);
    try {
      const value = await tryFetchBalance(String(userId));
      setBalance(value);
    } catch (error) {
      console.error("Error fetching balance:", error);
      // Fallback to user context wallet balance on error
      setBalance(user?.wallet?.balance || 0);
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = (newBalance: number) => {
    setBalance(newBalance);
  };

  const addBalance = async (amount: number, description: string = "Balance added"): Promise<boolean> => {
    const userId = user?.user_id || user?.id;
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
    const userId = user?.id;
    if (!userId) {
      console.warn('No user ID available for loading transactions');
      return;
    }

    try {
      const response = await apiService.getOptional(`/user/transactions/${userId}`);
      if (response?.success && response.data) {
        setTransactions(response.data || []);
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
      alert(message);
      console.error("Error loading transactions:", error);
      setTransactions([]);
    }
  };

  useEffect(() => {
    // Only fetch balance and transactions when user is available
    const userId = (user as any)?.user_id || (user as any)?.id;
    if (userId) {
      refreshBalance();
      loadTransactions();
    }
  }, [ (user as any)?.user_id, (user as any)?.id ]); // Re-run when user changes

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
export const CONVERSATION_COST = 0.85; // ₹0.85 per 24-hour conversation window
