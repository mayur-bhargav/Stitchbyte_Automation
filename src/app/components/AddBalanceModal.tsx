"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBalance } from '../contexts/BalanceContext';
import { MdClose, MdCreditCard, MdPayment } from 'react-icons/md';
import Script from 'next/script';

type PaymentProvider = 'razorpay' | 'stripe';

interface AddBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBalanceModal({ isOpen, onClose }: AddBalanceModalProps) {
  const { addBalance } = useBalance();
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider>('razorpay');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const quickAddAmounts = [100, 500, 1000, 2000, 5000];

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
            await addBalance(amount, description);
            showToastNotification(`₹${amount} added successfully!`, 'success');
            onClose();
            setCustomAmount('');
          } else {
            showToastNotification('Payment verification failed', 'error');
          }
        } catch (error) {
          showToastNotification('Payment verification failed', 'error');
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
      // Create payment intent on backend
      const response = await fetch('/api/create-stripe-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount * 100,
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
          }
        }
      });

      if (error) {
        showToastNotification(`Payment failed: ${error.message}`, 'error');
        return false;
      } else if (paymentIntent.status === 'succeeded') {
        await addBalance(amount, description);
        showToastNotification(`₹${amount} added successfully!`, 'success');
        onClose();
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
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                    disabled={paymentProcessing}
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
                Your payment information is encrypted and secure. Minimum amount: ₹10
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
