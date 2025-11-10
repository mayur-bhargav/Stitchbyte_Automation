"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import { apiService } from "../services/apiService";
import PermissionGuard from "../components/PermissionGuard";

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  features: string[];
  message_credits: number;
  max_contacts: number;
  max_broadcasts: number;
  max_automations: number;
  is_popular: boolean;
}

interface PaymentData {
  order_id: string;
  amount: number;
  currency: string;
  plan_name: string;
  key: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SelectPlanPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showTrialOption, setShowTrialOption] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'confirm' | 'alert';
  }>({
    title: '',
    message: '',
    type: 'alert'
  });
  const { user, isAuthenticated, isLoading, hasValidSubscription } = useUser();
  const router = useRouter();

  const calculatePrice = (basePrice: number, cycle: 'monthly' | 'yearly') => {
    if (cycle === 'yearly') {
      const yearlyPrice = basePrice * 12 * 0.8; // 20% discount
      return yearlyPrice;
    }
    return basePrice;
  };

  const showConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({
      title,
      message,
      onConfirm,
      confirmText: 'Continue',
      cancelText: 'Cancel',
      type: 'confirm'
    });
    setShowModal(true);
  };

  const showAlertModal = (title: string, message: string) => {
    setModalConfig({
      title,
      message,
      confirmText: 'OK',
      type: 'alert'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalConfig({
      title: '',
      message: '',
      type: 'alert'
    });
  };

  const handleModalConfirm = () => {
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
    closeModal();
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      fetchPlans();
      fetchCurrentSubscription();
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await apiService.getSubscription();
      if ((response as any).subscription) {
        setCurrentSubscription((response as any).subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const checkTrialEligibility = async () => {
    // Temporarily disabled - not checking current subscription
    /*
    try {
      const subscription = await apiService.getSubscription();
      // If user has an expired trial or active subscription, don't show trial option
      if ((subscription as any).subscription) {
        setShowTrialOption(false);
      }
    } catch (error: any) {
      let message = 'You are eligible for a free trial.';
      if (error.message?.includes('Not authorized')) {
        message = 'You are not authorized. Please log in again.';
        alert(message);
        // Optionally redirect to login
        return;
      } else if (error.message?.includes('Failed to get subscription')) {
        message = 'No subscription found. You are eligible for a free trial.';
      }
      alert(message);
      setShowTrialOption(true);
    }
    */
  };

  const fetchPlans = async () => {
    try {
      const response = await apiService.getPlans();
      // Filter out trial plans since trial is automatic on signup
      const nonTrialPlans = (response as any).plans.filter((plan: any) => plan.id !== 'trial');
      setPlans(nonTrialPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (planId: string) => {
    if (processing) return;
    
    setProcessing(true);
    setSelectedPlan(planId);

    try {
      const response = await apiService.selectPlan(planId);
      
      showAlertModal('Success', 'Plan selected successfully! Your 14-day free trial has started.');
      setTimeout(() => router.push('/'), 2000);
    } catch (error: any) {
      console.error('Error selecting plan:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to select plan';
      
      if (errorMessage.includes('expired')) {
        showAlertModal('Trial Expired', 'Your trial period has expired. Please choose a paid plan to continue.');
      } else if (errorMessage.includes('active subscription')) {
        showAlertModal('Active Subscription', 'You already have an active subscription. Visit billing to change your plan.');
        setTimeout(() => router.push('/billing'), 2000);
      } else {
        showAlertModal('Error', errorMessage);
      }
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handlePayNow = async (planId: string) => {
    if (processing) return;
    
    const proceedWithPayment = () => {
      setProcessing(true);
      setSelectedPlan(planId);

      // Create payment order
      (async () => {
        try {
          const orderResponse = await apiService.createPaymentOrder(planId, billingCycle);
          
          // Load Razorpay script if not loaded
          if (!window.Razorpay) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => initiatePayment(orderResponse as PaymentData, planId);
            document.head.appendChild(script);
          } else {
            initiatePayment(orderResponse as PaymentData, planId);
          }
        } catch (error: any) {
          console.error('Error creating payment order:', error);
          showAlertModal('Payment Error', error.response?.data?.detail || 'Failed to create payment order');
          setProcessing(false);
          setSelectedPlan(null);
        }
      })();
    };
    
    // Check if user is trying to buy the exact same plan with same billing cycle
    if (currentSubscription && 
        currentSubscription.plan_id === planId && 
        currentSubscription.billing_cycle === billingCycle) {
      showConfirmModal(
        'Renew Plan',
        `You already have the ${planId} plan on a ${billingCycle} billing cycle. Your current subscription is active until ${new Date(currentSubscription.end_date).toLocaleDateString()}.\n\nDo you want to extend/renew this plan?`,
        proceedWithPayment
      );
      return;
    } else if (currentSubscription && currentSubscription.plan_id === planId) {
      // Same plan but different billing cycle
      showConfirmModal(
        'Switch Billing Cycle',
        `You're switching from ${currentSubscription.billing_cycle} to ${billingCycle} billing for the ${planId} plan.\n\nDo you want to continue?`,
        proceedWithPayment
      );
      return;
    } else if (currentSubscription) {
      // Different plan - upgrade/downgrade
      showConfirmModal(
        'Change Plan',
        `You're changing from ${currentSubscription.plan_id} (${currentSubscription.billing_cycle}) to ${planId} (${billingCycle}).\n\nDo you want to continue with this change?`,
        proceedWithPayment
      );
      return;
    }
    
    // No current subscription, proceed directly
    proceedWithPayment();
  };

  const initiatePayment = (orderData: PaymentData, planId: string) => {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'StitchByte',
      description: `Subscription for ${orderData.plan_name}`,
      order_id: orderData.order_id,
      handler: async (response: any) => {
        try {
          // Verify payment with billing cycle information
          const verifyResponse = await apiService.verifyPayment({
            plan_id: planId,
            payment_method: 'razorpay',
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            billing_cycle: billingCycle
          });

          showAlertModal('Payment Successful', 'Your subscription is now active!');
          setTimeout(() => router.push('/'), 2000);
        } catch (error: any) {
          console.error('Error verifying payment:', error);
          showAlertModal('Payment Verification Failed', 'Please contact support for assistance.');
        } finally {
          setProcessing(false);
          setSelectedPlan(null);
        }
      },
      prefill: {
        name: user ? `${user.firstName} ${user.lastName}` : '',
        email: user?.email || '',
      },
      theme: {
        color: '#2A8B8A'
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
          setSelectedPlan(null);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2A8B8A]"></div>
      </div>
    );
  }

  return (
    <PermissionGuard requiredPermission="manage_billing">
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Select the plan that fits your business needs. Scale as you grow, cancel anytime.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="inline-flex items-center bg-gray-200 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-black text-white shadow-lg'
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-3 rounded-full font-medium transition-all duration-300 ${
                  billingCycle === 'yearly'
                    ? 'bg-black text-white shadow-lg'
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                Yearly
              </button>
            </div>
            <span className="inline-flex items-center gap-2 bg-[#2A8B8A] text-white px-4 py-2 rounded-full text-sm font-semibold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              Save 20% annually
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const basePrice = calculatePrice(plan.price, billingCycle);
            const monthlyEquivalent = billingCycle === 'yearly' ? basePrice / 12 : basePrice;
            const isCurrentPlan = currentSubscription && currentSubscription.plan_id === plan.id;
            const isExactSamePlan = isCurrentPlan && currentSubscription.billing_cycle === billingCycle;
            
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl shadow-2xl border transition-all duration-300 ${
                  plan.is_popular
                    ? 'border-[#2A8B8A] border-2 relative'
                    : 'border-gray-200'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#2A8B8A] text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-black mb-4">{plan.name}</h3>
                    
                    {billingCycle === 'yearly' && (
                      <div className="mb-2">
                        <span className="text-gray-500 line-through text-lg">
                          ₹{(plan.price * 12).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">₹</span>
                      <span className="text-5xl font-bold text-black">
                        {Math.floor(monthlyEquivalent).toLocaleString()}
                      </span>
                      <span className="text-gray-600 text-sm">
                        {billingCycle === 'monthly' ? '/month' : '/month'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      {billingCycle === 'yearly' 
                        ? `₹${Math.floor(basePrice).toLocaleString()} billed annually`
                        : 'Billed monthly'
                      }
                    </p>
                    
                    <p className="text-xs text-gray-500 mb-4">
                      (including GST)
                    </p>

                    {/* Action Button - Moved here */}
                    <button
                      onClick={() => handlePayNow(plan.id)}
                      disabled={processing}
                      className={`w-full py-4 px-6 rounded-full font-semibold transition-all duration-200 ${
                        isExactSamePlan
                          ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl'
                          : isCurrentPlan
                          ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                          : plan.is_popular
                          ? 'bg-[#2A8B8A] text-white hover:bg-[#238080] shadow-lg hover:shadow-xl'
                          : 'bg-white border-2 border-gray-300 text-black hover:border-[#2A8B8A] hover:text-[#2A8B8A]'
                      }`}
                    >
                      {isExactSamePlan 
                        ? 'Renew Plan'
                        : isCurrentPlan
                        ? `Switch to ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`
                        : plan.is_popular 
                        ? 'Get Plus' 
                        : 'Get ' + plan.name
                      }
                    </button>
                  </div>

                {/* Features */}
                <div className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#2A8B8A] mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-800">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="max-w-3xl mx-auto mt-16 text-center border-t border-gray-200 pt-8">
          <p className="text-gray-600 mb-2">
            Need help choosing a plan? <a href="/support" className="text-[#2A8B8A] hover:underline">Contact our support team</a>
          </p>
          <p className="text-sm text-gray-500">
            © 2025 StitchByte. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-[slideIn_0.3s_ease-out]">
            <h3 className="text-2xl font-bold text-black mb-4">{modalConfig.title}</h3>
            <p className="text-gray-700 mb-6 whitespace-pre-line">{modalConfig.message}</p>
            <div className="flex gap-3 justify-end">
              {modalConfig.type === 'confirm' && (
                <button
                  onClick={closeModal}
                  className="px-6 py-3 rounded-full font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  {modalConfig.cancelText || 'Cancel'}
                </button>
              )}
              <button
                onClick={handleModalConfirm}
                className="px-6 py-3 rounded-full font-semibold bg-[#2A8B8A] text-white hover:bg-[#238080] shadow-lg hover:shadow-xl transition-all"
              >
                {modalConfig.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </PermissionGuard>
  );
}
