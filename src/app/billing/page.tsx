"use client";
import { useState, useEffect } from "react";
import { useBalance } from "../contexts/BalanceContext";
import { useUser } from "../contexts/UserContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Script from "next/script";
import { apiService } from "../services/apiService";
import { 
  MdCreditCard, 
  MdAccountBalanceWallet, 
  MdClose, 
  MdAdd, 
  MdShield, 
  MdTrendingUp, 
  MdSpeed, 
  MdCheckCircle, 
  MdAccessTime, 
  MdError,
  MdFilterList,
  MdFileDownload,
  MdRefresh,
  MdBolt,
  MdAutorenew,
  MdSecurity,
  MdPayment,
  MdAccountBalance,
  MdMonetizationOn,
  MdAttachMoney,
  MdTrendingDown,
  MdSchedule,
  MdLocalFireDepartment,
  MdLightbulb
} from 'react-icons/md';

type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
};

type PaymentProvider = 'razorpay' | 'stripe';

type PaymentMethod = {
  id: string;
  type: 'card' | 'upi' | 'netbanking' | 'wallet';
  lastFour?: string;
  brand?: string;
  upiId?: string;
  bankName?: string;
  walletName?: string;
  isDefault: boolean;
  provider: PaymentProvider;
};

type Plan = {
  id: string;
  name: string;
  price: number;
  messages: number;
  features: string[];
  popular?: boolean;
  discount?: number;
  reboostCredits?: number;
  autoReboost?: boolean;
  priority?: 'standard' | 'high' | 'premium';
};

type ReboostPackage = {
  id: string;
  name: string;
  price: number;
  credits: number;
  description: string;
  bonus?: number;
  popular?: boolean;
};

export default function Billing() {
  const { user, updateWallet } = useUser();
  const { balance: userBalance, addBalance: addBalanceContext, refreshBalance, transactions, loadTransactions } = useBalance();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'payment-methods' | 'reboost'>('overview');
  const [loading, setLoading] = useState(false);
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider>('razorpay');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showReboostModal, setShowReboostModal] = useState(false);
  const [reboostCredits, setReboostCredits] = useState(0);
  const [autoReboost, setAutoReboost] = useState(false);
  const [selectedReboostPackage, setSelectedReboostPackage] = useState<string | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [paymentMethodProvider, setPaymentMethodProvider] = useState<'razorpay' | 'stripe'>('razorpay');
  
  // Transaction filter states
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [localTransactions, setLocalTransactions] = useState<any[]>([]);
  
  // Real data states
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    messagesThisMonth: 0,
    successRate: 0,
    avgResponseTime: 0,
    reboostsUsed: 0,
    reboostSuccessRate: 0
  });
  
  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  // Real data fetching functions
  const loadStats = async () => {
    try {
      // Load billing stats from analytics or dashboard endpoints
      const response = await apiService.getOptional('/analytics/billing-stats');
      if (response?.success) {
        setStats({
          totalSpent: response.data?.totalSpent || 0,
          messagesThisMonth: response.data?.messagesThisMonth || 0,
          successRate: response.data?.successRate || 98.5,
          avgResponseTime: response.data?.avgResponseTime || 2.3,
          reboostsUsed: response.data?.reboostsUsed || 0,
          reboostSuccessRate: response.data?.reboostSuccessRate || 94.8
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await apiService.getOptional('/payment-methods');
      if (response?.success) {
        setPaymentMethods(response.data || []);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadReboostCredits = async () => {
    try {
      const userId = (user as any)?.user_id || (user as any)?.id;
      if (userId) {
        const response = await apiService.getOptional(`/user/reboost-credits/${userId}`);
        if (response?.success) {
          setReboostCredits(response.data?.credits || 0);
          setAutoReboost(response.data?.autoReboost || false);
        }
      }
    } catch (error) {
      console.error('Error loading reboost credits:', error);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    loadStats();
    loadPaymentMethods();
    loadReboostCredits();
    loadTransactions();
    loadTransactionsFromAPI();
  }, [user]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterMenu) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFilterMenu]);

  const reboostPackages: ReboostPackage[] = [
    {
      id: 'basic',
      name: 'Basic Reboost',
      price: 199,
      credits: 50,
      description: 'Perfect for small campaigns'
    },
    {
      id: 'standard',
      name: 'Standard Reboost',
      price: 499,
      credits: 150,
      bonus: 25,
      description: 'Most popular choice',
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium Reboost',
      price: 999,
      credits: 350,
      bonus: 75,
      description: 'Best value for large campaigns'
    }
  ];

  // Toast helper function
  const showToastNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  // Download Invoice function
  const handleDownloadInvoice = async () => {
    try {
      const response = await apiService.get('/billing/invoice/current-month', {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${new Date().getFullYear()}-${new Date().getMonth() + 1}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToastNotification('Invoice downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToastNotification('Failed to download invoice', 'error');
    }
  };

  // Auto Top-up function
  const handleAutoTopup = () => {
    setShowAddBalance(true);
    // Auto top-up with ₹1000 as shown in the UI
    setCustomAmount('1000');
  };

  // Add Payment Method function
  const handleAddPaymentMethod = () => {
    setShowPaymentMethodModal(true);
  };

  const handleSavePaymentMethod = async () => {
    try {
      setPaymentProcessing(true);
      
      if (paymentMethodProvider === 'razorpay') {
        // Initialize Razorpay for adding payment method
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: 100, // ₹1 for card verification
          currency: 'INR',
          name: 'Stitchbyte',
          description: 'Add Payment Method',
          method: {
            card: true,
            netbanking: true,
            wallet: true,
            upi: true
          },
          handler: async (response: any) => {
            try {
              const result = await apiService.post('/payment-methods', {
                provider: 'razorpay',
                paymentMethodId: response.razorpay_payment_id,
                type: 'card' // This would be determined by the actual method used
              });
              
              if (result.success) {
                showToastNotification('Payment method added successfully', 'success');
                loadPaymentMethods();
                setShowPaymentMethodModal(false);
              }
            } catch (error) {
              showToastNotification('Failed to save payment method', 'error');
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || ''
          }
        };
        
        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        // Stripe implementation
        showToastNotification('Stripe integration coming soon', 'warning');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      showToastNotification('Failed to add payment method', 'error');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // New Transaction API functions
  const loadTransactionsFromAPI = async () => {
    try {
      const response = await apiService.get('/plans/transactions');
      if (response.success) {
        setLocalTransactions(response.data || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      showToastNotification('Failed to load transactions', 'error');
    }
  };

  const handleTransactionFilter = (filterType: 'all' | 'credit' | 'debit') => {
    setTransactionFilter(filterType);
    setShowFilterMenu(false);
  };

  const handleExportTransactions = async () => {
    try {
      const response = await apiService.get('/plans/transactions', {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      showToastNotification('Transactions exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting transactions:', error);
      showToastNotification('Failed to export transactions', 'error');
    }
  };

  // Filter transactions based on selected filter
  const filteredTransactions = transactionFilter === 'all' 
    ? (localTransactions.length > 0 ? localTransactions : transactions)
    : (localTransactions.length > 0 ? localTransactions : transactions).filter((t: any) => t.type === transactionFilter);

  const quickAddAmounts = [100, 500, 1000, 2000, 5000];

  // Razorpay Integration
  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const processRazorpayPayment = async (amount: number, description: string) => {
    const isRazorpayLoaded = await initializeRazorpay();
    
    if (!isRazorpayLoaded) {
      showToastNotification('Razorpay SDK failed to load', 'error');
      return false;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_BGfDTAhNk0ZQ3X', // Razorpay key ID
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      name: 'StitchByte',
      description: description,
      image: '/logo.png', // Add your logo
      handler: async (response: any) => {
        try {
          // Verify payment on backend
          const verifyResponse = await fetch('/api/verify-razorpay-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount
            })
          });

          if (verifyResponse.ok) {
            await addBalanceContext(amount, description);
            showToastNotification(`₹${amount} added successfully via Razorpay!`, 'success');
            setShowAddBalance(false);
            setCustomAmount('');
          } else {
            showToastNotification('Payment verification failed', 'error');
          }
        } catch (error) {
          showToastNotification('Payment verification failed', 'error');
        }
      },
      prefill: {
        name: 'User Name', // Get from user context
        email: 'user@example.com', // Get from user context
        contact: '9999999999' // Get from user context
      },
      theme: {
        color: '#2A8B8A'
      },
      modal: {
        ondismiss: () => {
          showToastNotification('Payment cancelled', 'warning');
        }
      }
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
    return true;
  };

  // Stripe Integration
  const processStripePayment = async (amount: number, description: string) => {
    try {
      // Create payment intent on backend
      const response = await fetch('/api/create-stripe-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100, // Stripe expects amount in cents
          currency: 'inr',
          description: description
        })
      });

      const { client_secret } = await response.json();

      // Load Stripe.js
      const stripe = await (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: {
            // This would normally be a Stripe Elements card element
            // For demo purposes, we'll use a test card
          }
        }
      });

      if (error) {
        showToastNotification(`Payment failed: ${error.message}`, 'error');
        return false;
      } else if (paymentIntent.status === 'succeeded') {
        await addBalanceContext(amount, description);
        showToastNotification(`₹${amount} added successfully via Stripe!`, 'success');
        setShowAddBalance(false);
        setCustomAmount('');
        return true;
      }
    } catch (error) {
      showToastNotification('Stripe payment failed', 'error');
      return false;
    }
  };

  const handleQuickAdd = async (amount: number) => {
    setPaymentProcessing(true);
    try {
      const description = `Quick top-up of ₹${amount}`;
      
      if (selectedPaymentProvider === 'razorpay') {
        await processRazorpayPayment(amount, description);
      } else {
        await processStripePayment(amount, description);
      }
    } catch (error) {
      showToastNotification('Payment failed. Please try again.', 'error');
    }
    setPaymentProcessing(false);
  };

  const handleCustomAdd = async () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      showToastNotification('Please enter a valid amount', 'error');
      return;
    }
    
    if (amount < 10) {
      showToastNotification('Minimum top-up amount is ₹10', 'error');
      return;
    }
    
    setPaymentProcessing(true);
    try {
      const description = `Custom top-up of ₹${amount}`;
      
      if (selectedPaymentProvider === 'razorpay') {
        await processRazorpayPayment(amount, description);
      } else {
        await processStripePayment(amount, description);
      }
    } catch (error) {
      showToastNotification('Payment failed. Please try again.', 'error');
    }
    setPaymentProcessing(false);
  };

  const handlePlanPurchase = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setSelectedPlan(planId);
    setPaymentProcessing(true);
    
    try {
      const finalPrice = plan.discount ? plan.price * (1 - plan.discount / 100) : plan.price;
      const description = `${plan.name} Plan Subscription`;
      
      if (selectedPaymentProvider === 'razorpay') {
        await processRazorpayPayment(finalPrice, description);
      } else {
        await processStripePayment(finalPrice, description);
      }
      
      // Add plan benefits to account (this would be handled by backend)
      showToastNotification(`${plan.name} plan activated successfully!`, 'success');
    } catch (error) {
      showToastNotification('Plan purchase failed. Please try again.', 'error');
    }
    
    setPaymentProcessing(false);
    setSelectedPlan(null);
  };

  const handleReboostPackagePurchase = async (packageId: string) => {
    const pkg = reboostPackages.find(p => p.id === packageId);
    if (!pkg) return;

    setSelectedReboostPackage(packageId);
    setPaymentProcessing(true);
    
    try {
      const description = `${pkg.name} Package`;
      
      if (selectedPaymentProvider === 'razorpay') {
        await processRazorpayPayment(pkg.price, description);
      } else {
        await processStripePayment(pkg.price, description);
      }
      
      // Add reboost credits to account
      const totalCredits = pkg.credits + (pkg.bonus || 0);
      setReboostCredits(prev => prev + totalCredits);
      showToastNotification(`${totalCredits} reboost credits added successfully!`, 'success');
      setShowReboostModal(false);
    } catch (error) {
      showToastNotification('Reboost package purchase failed. Please try again.', 'error');
    }
    
    setPaymentProcessing(false);
    setSelectedReboostPackage(null);
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (type === 'credit') {
      return (
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <MdAdd className="w-5 h-5 text-green-600" />
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <MdTrendingDown className="w-5 h-5 text-red-600" />
        </div>
      );
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <MdCreditCard className="w-6 h-6" />;
      case 'upi':
        return <MdPayment className="w-6 h-6" />;
      case 'netbanking':
        return <MdAccountBalance className="w-6 h-6" />;
      case 'wallet':
        return <MdAccountBalanceWallet className="w-6 h-6" />;
      default:
        return <MdPayment className="w-6 h-6" />;
    }
  };
  //       return (
  //         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  //         </svg>
  //       );
  //     default:
  //       return null;
  //   }
  // };

  return (
    <ProtectedRoute>
      {/* External Scripts */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload" 
      />
      <Script 
        src="https://js.stripe.com/v3/" 
        strategy="lazyOnload" 
      />
      
      <div className="min-h-screen bg-[#F0F6FF] p-6">
        <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border border-white/50 p-8 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b] flex items-center justify-center rounded-xl shadow-lg">
              <MdCreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                Billing & Payments
              </h1>
              <p className="text-gray-600">Manage your wallet, transactions, and reboost features</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowReboostModal(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MdBolt className="w-5 h-5" />
              Buy Reboost Credits
            </button>
            <button
              onClick={() => setShowAddBalance(true)}
              className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <MdAdd className="w-5 h-5" />
              Add Balance
            </button>
          </div>
        </div>
      </div>

      {/* Company Information Card */}
      {user && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MdAccountBalance className="w-6 h-6 text-[#2A8B8A]" />
              Account Information
            </h2>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'admin' ? 'bg-purple-100/80 backdrop-blur-sm text-purple-800' :
                user.role === 'user' ? 'bg-[#2A8B8A]/10 text-[#2A8B8A]' :
                'bg-gray-100/80 backdrop-blur-sm text-gray-800'
              }`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Company</label>
              <p className="text-lg font-semibold text-gray-900">{user.companyName}</p>
              <p className="text-sm text-gray-600">ID: {user.companyId?.split('_').pop() || user.companyId}</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Account Owner</label>
              <p className="text-lg font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">User ID</label>
              <p className="text-lg font-semibold text-gray-900">{user.id?.split('_').pop() || user.id}</p>
              <p className="text-sm text-gray-600">Multi-tenant secure environment</p>
            </div>
          </div>
          
          {user.subscription && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl border border-green-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Subscription Status</h3>
                  <p className="text-sm text-gray-600">
                    Plan: <span className="font-medium text-green-600">
                      {user.subscription?.plan_name ? 
                        user.subscription.plan_name.charAt(0).toUpperCase() + user.subscription.plan_name.slice(1) : 
                        'No Plan'
                      }
                    </span>
                    {user.subscription.trial_end_date && (
                      <span className="ml-2">
                        • Trial ends: {new Date(user.subscription.trial_end_date).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.subscription.status === 'active' ? 'bg-green-100/80 backdrop-blur-sm text-green-800' :
                  user.subscription.status === 'trial' ? 'bg-blue-100/80 backdrop-blur-sm text-blue-800' :
                  'bg-red-100/80 backdrop-blur-sm text-red-800'
                }`}>
                  {user.subscription.status.charAt(0).toUpperCase() + user.subscription.status.slice(1)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Wallet Balance Card */}
      <div className="bg-gradient-to-br from-[#2A8B8A] via-[#238080] to-[#1e6b6b] rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-white/80 text-sm font-medium">Available Balance</p>
            <p className="text-5xl font-bold mt-2 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
              ₹{userBalance.toFixed(2)}
            </p>
            <p className="text-white/80 text-sm mt-2">Ready to use for campaigns</p>
            
            {/* Reboost Credits Display */}
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 inline-flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-white font-semibold">{reboostCredits} Reboost Credits</span>
              {autoReboost && (
                <span className="bg-green-400 text-green-900 px-2 py-1 rounded-full text-xs font-bold">
                  AUTO
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <button
              onClick={() => setAutoReboost(!autoReboost)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                autoReboost 
                  ? 'bg-green-400 text-green-900' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Auto-Reboost {autoReboost ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors">
            <p className="text-white/80 text-xs uppercase tracking-wide">This Month</p>
            <p className="text-2xl font-semibold">₹{transactions.filter(t => t.type === 'debit' && new Date(t.date).getMonth() === new Date().getMonth()).reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</p>
            <p className="text-white/80 text-xs">Spent on campaigns</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors">
            <p className="text-white/80 text-xs uppercase tracking-wide">Total Added</p>
            <p className="text-2xl font-semibold">₹{transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</p>
            <p className="text-white/80 text-xs">Lifetime top-ups</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors">
            <p className="text-white/80 text-xs uppercase tracking-wide">Reboosts Used</p>
            <p className="text-2xl font-semibold">{stats.reboostsUsed}</p>
            <p className="text-white/80 text-xs">This month</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors">
            <p className="text-white/80 text-xs uppercase tracking-wide">Success Rate</p>
            <p className="text-2xl font-semibold">{stats.reboostSuccessRate.toFixed(1)}%</p>
            <p className="text-white/80 text-xs">Reboost performance</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border border-white/50 rounded-xl overflow-hidden shadow-lg bg-white/80 backdrop-blur-sm">
        <div className="flex bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm">
          {[
            { id: 'overview', label: 'Overview', icon: <MdTrendingUp className="w-5 h-5" /> },
            { id: 'transactions', label: 'Transactions', icon: <MdCreditCard className="w-5 h-5" /> },
            { id: 'reboost', label: 'Reboost Hub', icon: <MdBolt className="w-5 h-5" /> },
            { id: 'payment-methods', label: 'Payment Methods', icon: <MdPayment className="w-5 h-5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white/90 backdrop-blur-sm text-[#2A8B8A] border-b-2 border-[#2A8B8A] shadow-sm transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 p-6 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2A8B8A] rounded-lg flex items-center justify-center">
                      <MdMonetizationOn className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-black">₹{stats.totalSpent.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 p-6 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <MdCheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold text-black">{stats.successRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50/80 backdrop-blur-sm border border-purple-200/50 p-6 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <MdTrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Messages This Month</p>
                      <p className="text-2xl font-bold text-black">{stats.messagesThisMonth}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50/80 backdrop-blur-sm border border-orange-200/50 p-6 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                      <MdSpeed className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
                      <p className="text-2xl font-bold text-black">{stats.avgResponseTime}s</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setShowAddBalance(true)}
                    className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-4 rounded-lg hover:shadow-md transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2A8B8A] rounded-lg flex items-center justify-center">
                        <MdAdd className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-black">Add ₹1000</p>
                        <p className="text-sm text-gray-600">Quick top-up</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={handleDownloadInvoice}
                    className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-4 rounded-lg hover:shadow-md transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <MdFileDownload className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-black">Download Invoice</p>
                        <p className="text-sm text-gray-600">Current month</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={handleAutoTopup}
                    className="bg-white/80 backdrop-blur-sm border border-gray-200/50 p-4 rounded-lg hover:shadow-md transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                        <MdAutorenew className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-black">Auto Top-up</p>
                        <p className="text-sm text-gray-600">Set up automation</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Recent Transactions</h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className="px-4 py-2 border border-gray-300/50 rounded-lg text-sm text-gray-700 hover:bg-gray-50/80 flex items-center gap-2 backdrop-blur-sm"
                    >
                      <MdFilterList className="w-4 h-4" />
                      Filter ({transactionFilter})
                    </button>
                    
                    {showFilterMenu && (
                      <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                        <button
                          onClick={() => handleTransactionFilter('all')}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${transactionFilter === 'all' ? 'bg-blue-50 text-blue-600' : ''}`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => handleTransactionFilter('credit')}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${transactionFilter === 'credit' ? 'bg-blue-50 text-blue-600' : ''}`}
                        >
                          Credits
                        </button>
                        <button
                          onClick={() => handleTransactionFilter('debit')}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${transactionFilter === 'debit' ? 'bg-blue-50 text-blue-600' : ''}`}
                        >
                          Debits
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleExportTransactions}
                    className="px-4 py-2 border border-gray-300/50 rounded-lg text-sm text-gray-700 hover:bg-gray-50/80 flex items-center gap-2 backdrop-blur-sm"
                  >
                    <MdFileDownload className="w-4 h-4" />
                    Export
                  </button>
                  <button 
                    onClick={() => {
                      loadTransactions();
                      loadTransactionsFromAPI();
                    }}
                    className="px-4 py-2 border border-gray-300/50 rounded-lg text-sm text-gray-700 hover:bg-gray-50/80 flex items-center gap-2 backdrop-blur-sm"
                  >
                    <MdRefresh className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg p-4 hover:shadow-md transition-all duration-200 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getTransactionIcon(transaction.type, transaction.status)}
                        <div>
                          <p className="font-medium text-black">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.created_at || transaction.date).toLocaleDateString()} • {transaction.reference_id || transaction.reference || transaction.id}
                          </p>
                          {transaction.balance_before !== undefined && (
                            <p className="text-xs text-gray-500">
                              Balance: ₹{transaction.balance_before} → ₹{transaction.balance_after}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' ? 'bg-green-100/80 backdrop-blur-sm text-green-800' :
                          transaction.status === 'pending' ? 'bg-yellow-100/80 backdrop-blur-sm text-yellow-800' :
                          'bg-red-100/80 backdrop-blur-sm text-red-800'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MdCreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions found</p>
                    <p className="text-sm">Transactions will appear here once you start using the service</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reboost Hub Tab */}
          {activeTab === 'reboost' && (
            <div className="space-y-8">
              {/* Reboost Overview */}
              <div className="bg-gradient-to-r from-orange-50/80 to-red-50/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-8 shadow-lg">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
                    <MdBolt className="w-8 h-8 text-orange-600" />
                    Reboost Hub
                  </h3>
                  <p className="text-gray-600 mt-2">Maximize your campaign reach with intelligent reboost features</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <MdBolt className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-black">Available Credits</h4>
                        <p className="text-2xl font-bold text-orange-600">{reboostCredits}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Use credits to reboost failed or incomplete campaigns</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <MdCheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-black">Success Rate</h4>
                        <p className="text-2xl font-bold text-green-600">{stats.reboostSuccessRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Average reboost campaign success rate</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <MdSchedule className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-black">Auto-Reboost</h4>
                        <p className={`text-2xl font-bold ${autoReboost ? 'text-green-600' : 'text-gray-400'}`}>
                          {autoReboost ? 'ON' : 'OFF'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAutoReboost(!autoReboost)}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                        autoReboost 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {autoReboost ? 'Disable' : 'Enable'} Auto-Reboost
                    </button>
                  </div>
                </div>
              </div>

              {/* Reboost Packages */}
              <div>
                <h3 className="text-2xl font-bold text-black mb-6">Reboost Credit Packages</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {reboostPackages.map((pkg) => (
                    <div key={pkg.id} className={`bg-white border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                      pkg.popular ? 'border-orange-400 shadow-lg ring-4 ring-orange-400/20' : 'border-gray-200'
                    }`}>
                      {pkg.popular && (
                        <div className="text-center mb-4">
                          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center justify-center gap-1">
                            <MdLocalFireDepartment className="w-4 h-4" /> Most Popular
                          </span>
                        </div>
                      )}
                      
                      <div className="text-center mb-6">
                        <h4 className="text-xl font-bold text-black">{pkg.name}</h4>
                        <div className="mt-3">
                          <span className="text-3xl font-bold text-black">₹{pkg.price}</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-2">{pkg.description}</p>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between bg-orange-50 rounded-lg p-3">
                          <span className="text-sm font-medium text-gray-700">Base Credits</span>
                          <span className="font-bold text-orange-600">{pkg.credits}</span>
                        </div>
                        
                        {pkg.bonus && (
                          <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                            <span className="text-sm font-medium text-gray-700">Bonus Credits</span>
                            <span className="font-bold text-green-600">+{pkg.bonus}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border-t-2 border-gray-200">
                          <span className="text-sm font-bold text-gray-900">Total Credits</span>
                          <span className="text-lg font-bold text-black">{pkg.credits + (pkg.bonus || 0)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleReboostPackagePurchase(pkg.id)}
                        disabled={paymentProcessing}
                        className={`w-full py-3 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                          pkg.popular
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl'
                            : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300'
                        }`}
                      >
                        {selectedReboostPackage === pkg.id && paymentProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <MdBolt className="w-4 h-4" />
                            Buy Package
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reboost Tips */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                  <MdLightbulb className="w-6 h-6 text-yellow-500" />
                  Pro Reboost Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-black">Target Undelivered First</h4>
                      <p className="text-sm text-gray-600">Reboost undelivered messages for highest conversion rates</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-black">Use Auto-Reboost</h4>
                      <p className="text-sm text-gray-600">Enable automatic reboosts for failed campaigns</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-purple-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-black">Wait 24 Hours</h4>
                      <p className="text-sm text-gray-600">Best results when rebooting after 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-orange-600 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-black">Monitor Performance</h4>
                      <p className="text-sm text-gray-600">Track reboost success rates and optimize timing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payment-methods' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Payment Methods</h3>
                <button 
                  onClick={handleAddPaymentMethod}
                  className="bg-[#2A8B8A] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#238080] transition-colors"
                >
                  Add New Method
                </button>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getPaymentMethodIcon(method.type)}
                        </div>
                        <div>
                          {method.type === 'card' && (
                            <div>
                              <p className="font-medium text-black">{method.brand} •••• {method.lastFour}</p>
                              <p className="text-sm text-gray-600">Expires 12/27 • via {method.provider.charAt(0).toUpperCase() + method.provider.slice(1)}</p>
                            </div>
                          )}
                          {method.type === 'upi' && (
                            <div>
                              <p className="font-medium text-black">UPI ID</p>
                              <p className="text-sm text-gray-600">{method.upiId} • via {method.provider.charAt(0).toUpperCase() + method.provider.slice(1)}</p>
                            </div>
                          )}
                          {method.type === 'wallet' && (
                            <div>
                              <p className="font-medium text-black">{method.walletName}</p>
                              <p className="text-sm text-gray-600">Digital Wallet • via {method.provider.charAt(0).toUpperCase() + method.provider.slice(1)}</p>
                            </div>
                          )}
                          {method.type === 'netbanking' && (
                            <div>
                              <p className="font-medium text-black">{method.bankName}</p>
                              <p className="text-sm text-gray-600">Net Banking • via {method.provider.charAt(0).toUpperCase() + method.provider.slice(1)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Default
                          </span>
                        )}
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${
                          method.provider === 'razorpay' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          <span className={`text-xs font-bold ${
                            method.provider === 'razorpay' ? 'text-blue-600' : 'text-purple-600'
                          }`}>
                            {method.provider === 'razorpay' ? 'R' : 'S'}
                          </span>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reboost Credits Purchase Modal */}
      {showReboostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Buy Reboost Credits
                </h3>
                <p className="text-gray-600 mt-1">Choose the perfect package for your campaign needs</p>
              </div>
              <button
                onClick={() => setShowReboostModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Payment Provider Selection */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedPaymentProvider('razorpay')}
                    className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                      selectedPaymentProvider === 'razorpay'
                        ? 'border-[#2A8B8A] bg-[#2A8B8A]/5'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-sm font-bold">R</span>
                      </div>
                      <span className="text-sm font-medium text-black">Razorpay</span>
                      <span className="text-xs text-gray-500">UPI, Cards, Wallets</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedPaymentProvider('stripe')}
                    className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                      selectedPaymentProvider === 'stripe'
                        ? 'border-[#2A8B8A] bg-[#2A8B8A]/5'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-sm font-bold">S</span>
                      </div>
                      <span className="text-sm font-medium text-black">Stripe</span>
                      <span className="text-xs text-gray-500">International Cards</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Reboost Packages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reboostPackages.map((pkg) => (
                  <div key={pkg.id} className={`border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg cursor-pointer backdrop-blur-sm shadow-lg ${
                    pkg.popular 
                      ? 'border-orange-400/50 bg-gradient-to-br from-orange-50/80 to-red-50/80 shadow-xl' 
                      : 'border-gray-200/50 hover:border-gray-300/50 bg-white/80'
                  }`}>
                    {pkg.popular && (
                      <div className="text-center mb-3">
                        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          🔥 BEST VALUE
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-bold text-black">{pkg.name}</h4>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-black">₹{pkg.price}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{pkg.description}</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between bg-orange-50 rounded-lg p-2">
                        <span className="text-xs font-medium text-gray-700">Base Credits</span>
                        <span className="font-bold text-orange-600">{pkg.credits}</span>
                      </div>
                      
                      {pkg.bonus && (
                        <div className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                          <span className="text-xs font-medium text-gray-700">Bonus</span>
                          <span className="font-bold text-green-600">+{pkg.bonus}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2 border-t border-gray-200">
                        <span className="text-xs font-bold text-gray-900">Total</span>
                        <span className="font-bold text-black">{pkg.credits + (pkg.bonus || 0)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReboostPackagePurchase(pkg.id)}
                      disabled={paymentProcessing}
                      className={`w-full py-3 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm ${
                        pkg.popular
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300'
                      }`}
                    >
                      {selectedReboostPackage === pkg.id && paymentProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Buy Now
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Benefits Section */}
              <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-6 shadow-lg">
                <h4 className="font-bold text-black mb-3">✨ Why Use Reboost Credits?</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Recover failed campaigns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Target undelivered messages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Increase campaign reach</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Maximize ROI</span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Secure Payment</span>
                </div>
                <p className="text-xs text-gray-600">
                  Your payment information is encrypted and secure. Credits are added instantly after successful payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Balance Modal */}
      {showAddBalance && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-lg border border-white/50 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent flex items-center gap-2">
                <svg className="w-6 h-6 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Balance
              </h3>
              <button
                onClick={() => setShowAddBalance(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100/50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Payment Provider Selection */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedPaymentProvider('razorpay')}
                    className={`p-4 border-2 rounded-xl text-center transition-all duration-200 hover:scale-105 backdrop-blur-sm shadow-lg ${
                      selectedPaymentProvider === 'razorpay'
                        ? 'border-[#2A8B8A]/50 bg-[#2A8B8A]/5 shadow-xl'
                        : 'border-gray-300/50 hover:border-gray-400/50 bg-white/80'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">R</span>
                      </div>
                      <span className="text-sm font-medium text-black">Razorpay</span>
                      <span className="text-xs text-gray-500">UPI, Cards, Wallets</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedPaymentProvider('stripe')}
                    className={`p-4 border-2 rounded-xl text-center transition-all duration-200 hover:scale-105 backdrop-blur-sm shadow-lg ${
                      selectedPaymentProvider === 'stripe'
                        ? 'border-[#2A8B8A]/50 bg-[#2A8B8A]/5 shadow-xl'
                        : 'border-gray-300/50 hover:border-gray-400/50 bg-white/80'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">S</span>
                      </div>
                      <span className="text-sm font-medium text-black">Stripe</span>
                      <span className="text-xs text-gray-500">International Cards</span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Quick amounts</p>
                <div className="grid grid-cols-3 gap-3">
                  {quickAddAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAdd(amount)}
                      disabled={paymentProcessing}
                      className="p-4 border-2 border-gray-300 rounded-xl text-center hover:border-[#2A8B8A] hover:bg-[#2A8B8A]/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 group"
                    >
                      <span className="font-bold text-black text-lg group-hover:text-[#2A8B8A]">₹{amount}</span>
                      {paymentProcessing && (
                        <div className="mt-2">
                          <div className="w-4 h-4 border-2 border-[#2A8B8A] border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <span className="text-sm text-gray-500 font-medium">or</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Custom amount</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Enter amount (min ₹10)"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] transition-all duration-200"
                      min="10"
                    />
                  </div>
                  <button
                    onClick={handleCustomAdd}
                    disabled={paymentProcessing || !customAmount}
                    className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-8 py-3 rounded-xl font-bold hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {paymentProcessing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Payment Security Notice */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-bold text-gray-900">🔒 100% Secure Payment</span>
                </div>
                <p className="text-xs text-gray-600">
                  Your payment information is encrypted with bank-level security. Funds are added instantly after successful payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Add Payment Method</h2>
              <button 
                onClick={() => setShowPaymentMethodModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MdClose className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Choose Payment Provider</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethodProvider('razorpay')}
                    className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                      paymentMethodProvider === 'razorpay'
                        ? 'border-[#2A8B8A] bg-[#2A8B8A]/5 text-[#2A8B8A]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">R</span>
                    </div>
                    <p className="font-medium text-black">Razorpay</p>
                    <p className="text-xs text-gray-600">Cards, UPI, Wallets</p>
                  </button>

                  <button
                    onClick={() => setPaymentMethodProvider('stripe')}
                    className={`p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                      paymentMethodProvider === 'stripe'
                        ? 'border-[#2A8B8A] bg-[#2A8B8A]/5 text-[#2A8B8A]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-lg">S</span>
                    </div>
                    <p className="font-medium text-black">Stripe</p>
                    <p className="text-xs text-gray-600">International Cards</p>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MdSecurity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Secure Payment</p>
                    <p className="text-xs text-blue-700">
                      We'll charge ₹1 to verify your payment method. This amount will be refunded immediately.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentMethodModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePaymentMethod}
                  disabled={paymentProcessing}
                  className="flex-1 py-3 px-4 bg-[#2A8B8A] text-white rounded-xl font-medium hover:bg-[#238080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {paymentProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Payment Method'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white transition-opacity duration-300 ${
          toastType === 'success' ? 'bg-green-500' : 
          toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {toastMessage}
        </div>
      )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
