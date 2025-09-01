// Updated AddBalanceModal that passes amount to payment verification
"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBalance } from '../contexts/BalanceContext';
import { MdClose, MdCreditCard, MdPayment } from 'react-icons/md';
import Script from 'next/script';
import { apiService } from '../services/apiService';

type PaymentProvider = 'razorpay' | 'stripe';

interface AddBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBalanceModal({ isOpen, onClose }: AddBalanceModalProps) {
  const { addBalance, refreshBalance } = useBalance();
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider>('razorpay');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const quickAddAmounts = [100, 500, 1000, 2000, 5000];

  // Debug: Check authentication status when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 AddBalanceModal opened - checking authentication...');
      console.log('🔑 Token from localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      // Test API connectivity
      apiService.verifyToken().then(isValid => {
        console.log('✅ Token verification result:', isValid);
        if (!isValid) {
          showToastNotification('Authentication expired. Please refresh the page and try again.', 'error');
        }
      }).catch(err => {
        console.warn('⚠️ Token verification failed:', err);
      });
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !paymentProcessing) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, paymentProcessing]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !paymentProcessing) {
      onClose();
    }
  };

  // Toast helper function
  const showToastNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

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
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_BGfDTAhNk0ZQ3X',
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      name: 'StitchByte',
      description: description,
      image: '/logo.png',
      handler: async (response: any) => {
        try {
          // Verify payment on backend using apiService with amount
          const verifyResponse = await apiService.verifyPayment({
            plan_id: 'balance_topup',
            payment_method: 'razorpay',
            amount: amount,  // Pass the actual amount
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });

          console.log('💳 Payment verification response:', verifyResponse);

          if (verifyResponse && (verifyResponse as any).success) {
            // Refresh balance from server instead of local update
            await refreshBalance();
            showToastNotification(`₹${amount} added successfully! New balance: ₹${(verifyResponse as any).new_balance || 'updated'}`, 'success');
            onClose();
            setCustomAmount('');
          } else {
            const errorMsg = (verifyResponse as any)?.message || 'Payment verification failed';
            console.error('❌ Payment verification failed:', errorMsg);
            showToastNotification(errorMsg, 'error');
          }
        } catch (error) {
          console.error('💳 Payment verification error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
          showToastNotification(`Payment verification failed: ${errorMessage}`, 'error');
        }
      },
      prefill: {
        name: 'User Name',
        email: 'user@example.com',
        contact: '9999999999'
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
      // Verify payment on backend using apiService with amount
      const verifyResponse = await apiService.verifyPayment({
        plan_id: 'balance_topup',
        payment_method: 'stripe',
        amount: amount,  // Pass the actual amount
        stripe_payment_id: `stripe_${Date.now()}_${amount}` // Mock payment ID
      });

      if (verifyResponse && (verifyResponse as any).success) {
        // Refresh balance from server instead of local update
        await refreshBalance();
        showToastNotification(`₹${amount} added successfully! New balance: ₹${(verifyResponse as any).new_balance}`, 'success');
        onClose();
        setCustomAmount('');
        return true;
      } else {
        showToastNotification((verifyResponse as any)?.message || 'Payment verification failed', 'error');
        return false;
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
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
    
    if (amount > 50000) {
      showToastNotification('Maximum top-up amount is ₹50,000', 'error');
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

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* External Scripts */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload" 
      />
      <Script 
        src="https://js.stripe.com/v3/" 
        strategy="lazyOnload" 
      />
      
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: '0px',
          left: '0px',
          right: '0px',
          bottom: '0px',
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          margin: '0',
          padding: '16px'
        }}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative transform transition-all duration-200"
          style={{
            maxWidth: '28rem',
            width: '100%',
            maxHeight: '90vh',
            margin: 'auto'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold" style={{ color: '#000000' }}>Add Balance</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={paymentProcessing}
              style={{ color: '#000000' }}
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Payment Provider Selection */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: '#000000' }}>
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedPaymentProvider('razorpay')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPaymentProvider === 'razorpay'
                      ? 'border-[#2A8B8A] bg-[#2A8B8A]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={paymentProcessing}
                >
                  <MdCreditCard className="w-6 h-6 mx-auto mb-1" style={{ color: '#000000' }} />
                  <div className="text-sm font-medium" style={{ color: '#000000' }}>Razorpay</div>
                </button>
                <button
                  onClick={() => setSelectedPaymentProvider('stripe')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPaymentProvider === 'stripe'
                      ? 'border-[#2A8B8A] bg-[#2A8B8A]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={paymentProcessing}
                >
                  <MdPayment className="w-6 h-6 mx-auto mb-1" style={{ color: '#000000' }} />
                  <div className="text-sm font-medium" style={{ color: '#000000' }}>Stripe</div>
                </button>
              </div>
            </div>

            {/* Quick Add Amounts */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: '#000000' }}>
                Quick Add
              </label>
              <div className="grid grid-cols-3 gap-2">
                {quickAddAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAdd(amount)}
                    disabled={paymentProcessing}
                    className="p-3 text-center border border-gray-200 rounded-lg hover:border-[#2A8B8A] hover:bg-[#2A8B8A]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-semibold" style={{ color: '#000000' }}>₹{amount}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: '#000000' }}>
                Custom Amount
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Enter amount (₹10 - ₹50,000)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                    disabled={paymentProcessing}
                    min="10"
                    max="50000"
                    style={{ color: '#000000' }}
                  />
                </div>
                <button
                  onClick={handleCustomAdd}
                  disabled={paymentProcessing || !customAmount}
                  className="px-6 py-3 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paymentProcessing ? 'Processing...' : 'Add'}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm" style={{ color: '#1E40AF' }}>
                <strong>Secure payments powered by {selectedPaymentProvider === 'razorpay' ? 'Razorpay' : 'Stripe'}</strong>
              </p>
              <p className="text-xs mt-1" style={{ color: '#2563EB' }}>
                Your payment information is encrypted and secure. Amount range: ₹10 - ₹50,000
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          toastType === 'success' ? 'bg-green-500' : 
          toastType === 'error' ? 'bg-red-500' : 'bg-yellow-500'
        } text-white`}
        style={{
          position: 'fixed',
          zIndex: 999999,
          top: '16px',
          right: '16px'
        }}>
          {toastMessage}
        </div>
      )}
    </>,
    document.body
  );
}
