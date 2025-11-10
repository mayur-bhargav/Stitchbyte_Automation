"use client";

import React, { useState, useEffect, ReactNode, useRef } from "react";
import { useBalance } from "../contexts/BalanceContext";
import { useUser } from "../contexts/UserContext";
import { useThemeWatcher, getThemeColors } from "../hooks/useThemeToggle";
import { apiService } from "../services/apiService";
import Script from "next/script";
import ProtectedRoute from "../components/ProtectedRoute"; // Assuming this component exists
import AddBalanceModal from "../components/AddBalanceModal"; // Assuming this component exists
import PermissionGuard from "../components/PermissionGuard";
import { useRouter } from "next/navigation";
import {
  LuCreditCard, LuWallet, LuX, LuPlus, LuShield, LuTrendingUp, LuCheck,
  LuClock, LuTriangleAlert, LuFilter, LuDownload, LuRefreshCw, LuZap, LuArrowRight,
  LuBanknote, LuFileText, LuBadgeCheck
} from 'react-icons/lu';

// Type Definitions
type Transaction = { id: string; type: 'credit' | 'debit'; amount: number; description: string; date: string; status: 'completed' | 'pending' | 'failed'; reference?: string; };
type PaymentMethod = { id: string; type: 'card' | 'upi' | 'netbanking' | 'wallet'; lastFour?: string; brand?: string; isDefault: boolean; };
type ReboostPackage = { id: string; name: string; price: number; credits: number; bonus?: number; popular?: boolean; };

// Reusable UI Components
const Card = ({ title, description, icon, children, headerRight, className = "" }: { title?: string, description?: string, icon?: ReactNode, children: ReactNode, headerRight?: ReactNode, className?: string }) => {
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  
  return (
    <div className={`rounded-xl shadow-sm ${className}`} 
         style={{ 
           backgroundColor: colors.background,
           borderColor: colors.border,
           borderWidth: '1px',
           borderStyle: 'solid'
         }}>
      {(title || description || icon || headerRight) && (
        <div className="flex items-start justify-between p-5"
             style={{ 
               borderBottomColor: colors.border,
               borderBottomWidth: '1px',
               borderBottomStyle: 'solid'
             }}>
          <div className="flex items-center gap-4">
            {icon && (
              <div className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center" 
                   style={{ 
                     backgroundColor: colors.backgroundSecondary,
                     color: colors.textMuted
                   }}>
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="text-base font-semibold" style={{ color: colors.text }}>{title}</h3>}
              {description && <p className="text-sm mt-0.5" style={{ color: colors.textMuted }}>{description}</p>}
            </div>
          </div>
          {headerRight}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string, value: string | number, icon: ReactNode }) => {
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  
  return (
    <div className="rounded-lg p-4" 
         style={{ 
           backgroundColor: colors.backgroundSecondary,
           borderColor: colors.borderLight,
           borderWidth: '1px',
           borderStyle: 'solid'
         }}>
      <div className="flex items-center gap-3">
        <div className="text-[#2A8B8A]">{icon}</div>
        <div>
          <p className="text-xs" style={{ color: colors.textMuted }}>{label}</p>
          <p className="text-xl font-bold" style={{ color: colors.text }}>{value}</p>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => {
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  
  return (
    <button 
      onClick={onClick} 
      className="px-4 py-2 text-sm font-semibold rounded-md transition-colors"
      style={{
        backgroundColor: isActive ? '#2A8B8A' : 'transparent',
        color: isActive ? '#ffffff' : colors.textSecondary
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = colors.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {label}
    </button>
  );
};

// Main Billing Page Component
export default function BillingPage() {
  const { user } = useUser();
  const { balance, transactions, loadTransactions } = useBalance();
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'reboost'>('overview');
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Format date as dd/mon/yyyy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fetch payment methods from backend
  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true);
    try {
      const response = await apiService.getPaymentMethods();
      if (response && Array.isArray(response)) {
        setPaymentMethods(response);
      } else if (response && typeof response === 'object' && 'data' in response) {
        const data = (response as any).data;
        if (Array.isArray(data)) {
          setPaymentMethods(data);
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Set empty array if error - don't show dummy data
      setPaymentMethods([]);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };
  
  // Calculate stats from real transactions
  const stats = React.useMemo(() => {
    const totalSpent = transactions
      .filter(t => t.type === 'debit' || t.type === 'deduction')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const messagesThisMonth = transactions
      .filter(t => {
        const transactionDate = new Date(t.created_at || t.date);
        return transactionDate >= thisMonth && (t.description || '').toLowerCase().includes('message');
      }).length;
    
    return {
      totalSpent: totalSpent,
      messagesThisMonth: messagesThisMonth,
      successRate: 99.2 // This would need to come from a different API
    };
  }, [transactions]);
  
  const reboostPackages: ReboostPackage[] = [
      { id: 'basic', name: 'Starter Pack', price: 199, credits: 500, bonus: 50 },
      { id: 'standard', name: 'Growth Pack', price: 499, credits: 1500, bonus: 200, popular: true },
      { id: 'pro', name: 'Pro Pack', price: 999, credits: 3500, bonus: 500 },
  ];

  const handleRefreshTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      // First try using the context
      await loadTransactions();
      
      // If context doesn't have transactions and we have a user, try direct API call
      if (transactions.length === 0 && user) {
        // console.log('🔄 Context has no transactions, trying direct API call...');
        const response = await apiService.getUserTransactions();
        // console.log('📊 Direct API response:', response);
        
        if (response?.success && response.data) {
          // console.log('✅ Got transactions from direct API:', response.data);
          // We can't set context transactions directly, but we can log them
          // The formatted transactions will pick up from context when it updates
        } else if (response && Array.isArray(response)) {
          // console.log('✅ Got transactions array from direct API:', response);
        }
      }
    } catch (err) {
      setError('Failed to load transactions. Please check your internet connection and try again.');
      console.error('Error refreshing transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format transaction data for display
  const formattedTransactions = React.useMemo(() => {
    return transactions.map(t => ({
      id: t.id || t.transaction_id || `${Date.now()}-${Math.random()}`,
      type: t.type === 'credit' || t.type === 'addition' ? 'credit' : 'debit',
      amount: Math.abs(t.amount || 0),
      description: t.description || t.note || 'Transaction',
      date: t.created_at || t.date || new Date().toISOString(),
      status: t.status || 'completed',
      reference: t.reference || t.transaction_id
    }));
  }, [transactions]);

  useEffect(() => {
    // This is where you would fetch initial data for the page,
    // like transactions, payment methods, and stats.
    // console.log('🔍 Billing page loading, current transactions:', transactions);
    // console.log('👤 Current user:', user);
    handleRefreshTransactions();
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    // console.log('📊 Transactions updated:', transactions);
    // console.log('📊 Formatted transactions:', formattedTransactions);
  }, [transactions, formattedTransactions]);

  return (
    <PermissionGuard requiredPermission="view_billing">
      <ProtectedRoute>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        
        <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: colors.text }}>Billing & Payments</h1>
            <p className="text-sm mt-1" style={{ color: colors.textMuted }}>Manage your subscription, balance, and payment methods.</p>
          </div>
          <button onClick={() => setShowAddBalanceModal(true)} className="btn-primary"><LuPlus size={16}/> Add Balance</button>
        </div>

        {/* User's Plan Information */}
        {user?.subscription && (
            <Card icon={<LuBadgeCheck size={20}/>} title="Current Subscription">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-2xl font-bold capitalize" style={{ color: colors.text }}>
                          {user.subscription.plan_id || user.subscription.plan_name} Plan
                        </p>
                        <p className="text-sm mt-2" style={{ color: colors.textMuted }}>
                           Your plan is currently <span className="font-semibold text-emerald-600">active</span>.
                           {user.subscription.end_date && ` Renews on ${formatDate(user.subscription.end_date)}.`}
                        </p>
                        {(user.subscription as any).billing_cycle && (
                          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                            Billing: <span className="font-semibold capitalize">{(user.subscription as any).billing_cycle}</span>
                          </p>
                        )}
                    </div>
                    <button 
                      onClick={() => router.push('/select-plan')}
                      className="btn-secondary text-sm whitespace-nowrap"
                    >
                      Manage Subscription
                    </button>
                </div>
            </Card>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-xl shadow-sm" 
                 style={{ 
                   backgroundColor: colors.background,
                   borderColor: colors.border,
                   borderWidth: '1px',
                   borderStyle: 'solid'
                 }}>
              <div className="p-3 sm:p-4" 
                   style={{ 
                     borderBottomColor: colors.border,
                     borderBottomWidth: '1px',
                     borderBottomStyle: 'solid'
                   }}>
                  <div className="flex items-center gap-2">
                      <TabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                      <TabButton label="Transactions" isActive={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
                      <TabButton label="Reboost Credits" isActive={activeTab === 'reboost'} onClick={() => setActiveTab('reboost')} />
                  </div>
              </div>
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard label="Total Spent" value={`₹${stats.totalSpent.toLocaleString()}`} icon={<LuBanknote size={24}/>} />
                      <StatCard label="Messages This Month" value={stats.messagesThisMonth.toLocaleString()} icon={<LuTrendingUp size={24}/>} />
                      <StatCard label="Message Success Rate" value={`${stats.successRate}%`} icon={<LuCheck size={24}/>} />
                  </div>
                )}
                {activeTab === 'transactions' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold" style={{ color: colors.text }}>
                          Transaction History
                        </h3>
                        {loading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2" 
                               style={{ borderColor: '#2A8B8A' }}></div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn-secondary text-xs"><LuFilter size={14}/> Filter</button>
                        <button className="btn-secondary text-xs"><LuDownload size={14}/> Export</button>
                        <button 
                          onClick={handleRefreshTransactions} 
                          disabled={loading}
                          className="btn-secondary text-xs"
                        >
                          <LuRefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh
                        </button>
                      </div>
                    </div>
                    
                    {error && (
                      <div className="mb-4 p-3 rounded-lg border"
                           style={{
                             backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                             color: darkMode ? '#f87171' : '#dc2626',
                             borderColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fecaca'
                           }}>
                        <p className="text-sm">{error}</p>
                      </div>
                    )}
                    
                    <ul className="space-y-3">
                        {formattedTransactions.length > 0 ? formattedTransactions.map(t => (
                            <li key={t.id} className="flex items-center justify-between p-3 rounded-lg" 
                                style={{ backgroundColor: colors.backgroundSecondary }}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : ''}`}
                                         style={t.type !== 'credit' ? { 
                                           backgroundColor: colors.backgroundTertiary,
                                           color: colors.textMuted
                                         } : {}}>
                                        {t.type === 'credit' ? <LuPlus size={18}/> : <LuArrowRight size={18}/>}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm" style={{ color: colors.text }}>{t.description}</p>
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs" style={{ color: colors.textMuted }}>
                                            {new Date(t.date).toLocaleString()}
                                          </p>
                                          {t.reference && (
                                            <span className="text-xs px-2 py-0.5 rounded-full"
                                                  style={{
                                                    backgroundColor: colors.backgroundTertiary,
                                                    color: colors.textMuted
                                                  }}>
                                              {t.reference}
                                            </span>
                                          )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-semibold ${t.type === 'credit' ? 'text-emerald-600' : ''}`}
                                     style={t.type !== 'credit' ? { color: colors.textSecondary } : {}}>
                                      {t.type === 'credit' ? '+' : '-'}₹{t.amount.toFixed(2)}
                                  </p>
                                  <p className="text-xs" style={{ color: colors.textMuted }}>
                                    {t.status}
                                  </p>
                                </div>
                            </li>
                        )) : (
                            <div className="text-center py-10">
                                <LuFileText size={40} className="mx-auto" style={{ color: colors.borderLight }}/>
                                <p className="mt-2 text-sm font-semibold" style={{ color: colors.textSecondary }}>
                                  {loading ? 'Loading transactions...' : 'No Transactions Yet'}
                                </p>
                                <p className="text-sm" style={{ color: colors.textMuted }}>
                                  {loading ? 'Please wait while we fetch your data.' : 'Your transaction history will appear here.'}
                                </p>
                            </div>
                        )}
                    </ul>
                  </div>
                )}
                {activeTab === 'reboost' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold" style={{ color: colors.text }}>Reboost Credit Packages</h3>
                            <p className="text-sm mt-1" style={{ color: colors.textMuted }}>Retry failed messages to maximize your campaign success.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {reboostPackages.map(pkg => (
                                <div key={pkg.id} 
                                     className="p-5 rounded-lg flex flex-col items-center text-center transition-all relative"
                                     style={{
                                       borderWidth: pkg.popular ? '2px' : '1px',
                                       borderStyle: 'solid',
                                       borderColor: pkg.popular ? '#2A8B8A' : colors.border
                                     }}>
                                    {pkg.popular && <span className="text-xs font-semibold bg-[#2A8B8A] text-white px-2 py-0.5 rounded-full absolute -top-2.5">POPULAR</span>}
                                    <p className="font-bold mt-4" style={{ color: colors.text }}>{pkg.name}</p>
                                    <p className="text-3xl font-bold my-2" style={{ color: colors.text }}>₹{pkg.price}</p>
                                    <p className="text-sm font-semibold" style={{ color: colors.textMuted }}>{pkg.credits.toLocaleString()} Credits</p>
                                    {pkg.bonus && <p className="text-xs text-emerald-600 font-semibold">+ {pkg.bonus.toLocaleString()} Bonus</p>}
                                    <button className="btn-secondary w-full mt-4 text-xs">Purchase</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1 space-y-6">
            <Card title="Current Balance" icon={<LuWallet size={20}/>}>
                <div className="text-center">
                    <p className="text-4xl font-bold" style={{ color: colors.text }}>₹{balance.toFixed(2)}</p>
                    <p className="text-sm mt-1" style={{ color: colors.textMuted }}>Ready to use for campaigns & messages.</p>
                </div>
                {balance < 100 && (
                     <div className="mt-4 flex items-start gap-3 p-3 text-sm rounded-lg border"
                          style={{
                            backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fef3c7',
                            color: darkMode ? '#fbbf24' : '#92400e',
                            borderColor: darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fde68a'
                          }}>
                        <LuTriangleAlert size={18} className="flex-shrink-0 mt-0.5"/>
                        <p>Your balance is low. Add funds to avoid service interruption.</p>
                    </div>
                )}
            </Card>
            <Card title="Payment Methods" icon={<LuCreditCard size={20}/>} headerRight={<button className="btn-secondary text-xs"><LuPlus size={14}/> Add New</button>}>
                {loadingPaymentMethods ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
                         style={{ borderColor: '#2A8B8A' }}></div>
                  </div>
                ) : (
                  <ul className="space-y-3">
                      {paymentMethods.length > 0 ? paymentMethods.map(p => (
                          <li key={p.id} className="flex items-center justify-between p-3 rounded-lg" 
                              style={{ backgroundColor: colors.backgroundSecondary }}>
                              <div className="flex items-center gap-3">
                                  <LuCreditCard size={20} style={{ color: colors.textMuted }}/>
                                  <div>
                                      {p.type === 'card' && p.brand && p.lastFour ? (
                                        <>
                                          <p className="font-semibold text-sm" style={{ color: colors.text }}>
                                            {p.brand} •••• {p.lastFour}
                                          </p>
                                          <p className="text-xs" style={{ color: colors.textMuted }}>
                                            Card
                                          </p>
                                        </>
                                      ) : p.type === 'upi' ? (
                                        <>
                                          <p className="font-semibold text-sm" style={{ color: colors.text }}>UPI</p>
                                          <p className="text-xs" style={{ color: colors.textMuted }}>Unified Payments Interface</p>
                                        </>
                                      ) : (
                                        <>
                                          <p className="font-semibold text-sm capitalize" style={{ color: colors.text }}>{p.type}</p>
                                          <p className="text-xs" style={{ color: colors.textMuted }}>Payment Method</p>
                                        </>
                                      )}
                                  </div>
                              </div>
                              {p.isDefault && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                      style={{
                                        backgroundColor: colors.backgroundTertiary,
                                        color: colors.textSecondary
                                      }}>
                                  Default
                                </span>
                              )}
                          </li>
                      )) : (
                          <div className="text-center py-8">
                            <LuCreditCard size={32} className="mx-auto mb-2" style={{ color: colors.borderLight }}/>
                            <p className="text-sm font-semibold" style={{ color: colors.textSecondary }}>No Payment Methods</p>
                            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                              Add a payment method for faster checkout
                            </p>
                          </div>
                      )}
                  </ul>
                )}
            </Card>
          </div>
        </div>
      </div>
      
      <AddBalanceModal isOpen={showAddBalanceModal} onClose={() => setShowAddBalanceModal(false)} />
      </ProtectedRoute>
    </PermissionGuard>
  );
}