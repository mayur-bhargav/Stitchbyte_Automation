"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/apiService';

interface User {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: 'owner' | 'admin' | 'user' | 'viewer' | 'manager' | 'team_lead' | 'senior' | 'employee' | 'intern' | 'bde' | 'digital_marketer';
  subscription?: {
    plan_id: string;
    plan_name: string;
    status: string;
    end_date: string;
    trial_end_date?: string;
    expires_at?: string;
    auto_renew: boolean;
  };
  wallet?: {
    balance: number;
    reboostCredits: number;
    currency: string;
  };
  // Team member specific fields
  isTeamMember?: boolean;
  permissions?: string[];
  department?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasValidSubscription: boolean;
  needsPlanSelection: boolean;
  backupCodeUsed: boolean;
  login: (email: string, password: string, twoFactorCode?: string, codeType?: string) => Promise<any>;
  signup: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    companyName: string;
    companySize: string;
    industry: string;
    phone: string;
    agreeToTerms: boolean;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateWallet: (walletUpdates: Partial<User['wallet']>) => void;
  checkSubscription: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearBackupCodeFlag: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Always start with true to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);
  const [backupCodeUsed, setBackupCodeUsed] = useState(false);

  useEffect(() => {
    // Mark as client-side to prevent hydration mismatches
    setIsClient(true);
    
    // Check for existing user session on app load
    const checkAuthStatus = async () => {
      try {

        const token = localStorage.getItem('token');
        
        if (token) {
          const userData = await apiService.getCurrentUser();
          if (userData) {
            setUser(userData);
            
            // If user data doesn't include subscription, try to fetch it separately
            if (!userData.subscription) {
              try {
                const subscriptionData = await apiService.getSubscription();
                if (subscriptionData && (subscriptionData as any).subscription) {
                  setUser(prev => prev ? { ...prev, subscription: (subscriptionData as any).subscription } : userData);
                }
              } catch (subError) {
              }
            }
          } else {
            localStorage.removeItem('token');
          }
        } else {
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      } finally {

        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const checkSubscription = async () => {
    try {
      const subscriptionData = await apiService.getSubscription();
      if (user && subscriptionData && (subscriptionData as any).subscription) {
        setUser({
          ...user,
          subscription: (subscriptionData as any).subscription
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      if (userData) {
        setUser(userData);
        
        // Also check subscription status separately if user data doesn't include it
        if (!userData.subscription) {
          try {
            const subscriptionData = await apiService.getSubscription();
            if (subscriptionData && (subscriptionData as any).subscription) {
              setUser(prev => prev ? { ...prev, subscription: (subscriptionData as any).subscription } : null);
            }
          } catch (subError) {
          }
        }
      } else {
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const login = async (email: string, password: string, twoFactorCode?: string, codeType?: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.signin(email, password, twoFactorCode, codeType);
      
      // If 2FA is required, return the response without setting user
      if (response && response.requires2FA && !twoFactorCode) {
        return response;
      }
      
      // Normal login or successful 2FA verification
      if (response && response.user) {
        setUser(response.user);
        
        // Set backup code flag if backup code was used
        if (codeType === 'backup' && twoFactorCode) {
          setBackupCodeUsed(true);
        }
        
        // Immediately fetch subscription data after login to ensure proper redirect
        try {
          const subscriptionData = await apiService.getSubscription();
          if (subscriptionData && (subscriptionData as any).subscription) {
            setUser(prev => prev ? { ...prev, subscription: (subscriptionData as any).subscription } : null);
          } else {
          }
        } catch (subError) {
        }
        
        return response;
      } else {
        throw new Error('Failed to get user data');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    companyName: string;
    companySize: string;
    industry: string;
    phone: string;
    agreeToTerms: boolean;
  }) => {
    try {
      setIsLoading(true);
      await apiService.signup(data);
      await login(data.email, data.password);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  };

  const updateWallet = (walletUpdates: Partial<User['wallet']>) => {
    if (user && user.wallet) {
      const updatedWallet = { ...user.wallet, ...walletUpdates };
      const updatedUser = { ...user, wallet: updatedWallet };
      setUser(updatedUser);
    }
  };

  const isAuthenticated = !!user;
  
  // Check if user has a valid subscription
  // Enhanced: Check all possible end fields for all plan types
  const now = new Date();
  let hasValidSubscription = false;
  if (user?.subscription) {
    const sub = user.subscription;
    const status = sub.status;
    const isTrial = status === 'trial' || sub.plan_id === 'trial' || sub.plan_name === 'trial';
    // Use whichever end date is present
    const endDate = sub.end_date || sub.trial_end_date || sub.expires_at;
    if (isTrial) {
      // Trial is valid if not expired
      hasValidSubscription = !!(status === 'trial' && endDate && new Date(endDate) > now);
    } else {
      // Paid plan is valid if status is active/premium/basic and not expired
      hasValidSubscription = !!(['active', 'premium', 'basic'].includes(status) && endDate && new Date(endDate) > now);
    }
  }
  // Needs plan selection if not valid or explicitly expired
  const needsPlanSelection = isAuthenticated && (!hasValidSubscription || user?.subscription?.status === 'expired');

  // Debug logging for subscription status
  if (isAuthenticated) {
    // console.log('UserContext Debug:', {
    //   hasSubscription: !!user?.subscription,
    //   subscriptionStatus: user?.subscription?.status,
    //   subscriptionEndDate: user?.subscription?.end_date,
    //   hasValidSubscription,
    //   needsPlanSelection
    // });
  }

  const clearBackupCodeFlag = () => {
    setBackupCodeUsed(false);
  };

  const value: UserContextType = {
    user,
    isLoading,
    isAuthenticated,
    hasValidSubscription,
    needsPlanSelection,
    backupCodeUsed,
    login,
    signup,
    logout,
    updateUser,
    updateWallet,
    checkSubscription,
    refreshUser,
    clearBackupCodeFlag,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
