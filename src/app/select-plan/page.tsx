"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import { apiService } from "../services/apiService";

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
  const { user, isAuthenticated, isLoading, hasValidSubscription } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      fetchPlans();
      checkTrialEligibility();
    }
  }, [isAuthenticated, isLoading, router]);

  const checkTrialEligibility = async () => {
    try {
      const subscription = await apiService.getSubscription();
      // If user has an expired trial or active subscription, don't show trial option
      if (subscription.subscription) {
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
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      fetchPlans();
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchPlans = async () => {
    try {
      const response = await apiService.getPlans();
      // Filter out trial plans since trial is automatic on signup
      const nonTrialPlans = response.plans.filter(plan => plan.id !== 'trial');
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
      
      alert('Plan selected successfully! Your 14-day free trial has started.');
      router.push('/');
    } catch (error: any) {
      console.error('Error selecting plan:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to select plan';
      
      if (errorMessage.includes('expired')) {
        alert('Your trial period has expired. Please choose a paid plan to continue.');
      } else if (errorMessage.includes('active subscription')) {
        alert('You already have an active subscription. Visit billing to change your plan.');
        router.push('/billing');
      } else {
        alert(errorMessage);
      }
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handlePayNow = async (planId: string) => {
    if (processing) return;
    
    setProcessing(true);
    setSelectedPlan(planId);

    try {
      // Create payment order
      const orderResponse = await apiService.createPaymentOrder(planId);
      
      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => initiatePayment(orderResponse, planId);
        document.head.appendChild(script);
      } else {
        initiatePayment(orderResponse, planId);
      }
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      alert(error.response?.data?.detail || 'Failed to create payment order');
      setProcessing(false);
      setSelectedPlan(null);
    }
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
          // Verify payment
          const verifyResponse = await apiService.verifyPayment({
            plan_id: planId,
            payment_method: 'razorpay',
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });

          alert('Payment successful! Your subscription is now active.');
          router.push('/');
        } catch (error: any) {
          console.error('Error verifying payment:', error);
          alert('Payment verification failed. Please contact support.');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {showTrialOption 
              ? "Start with a 14-day free trial. No credit card required. Upgrade anytime."
              : "Select a plan to continue using StitchByte's powerful features."
            }
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:scale-105 ${
                plan.is_popular
                  ? 'border-[#2A8B8A] relative'
                  : 'border-gray-200 hover:border-[#2A8B8A]'
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-[#2A8B8A] mb-2">
                    ₹{plan.price.toLocaleString()}
                  </div>
                  <p className="text-gray-600">per month</p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
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
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {showTrialOption && (
                    <button
                      onClick={() => handlePlanSelect(plan.id)}
                      disabled={processing && selectedPlan === plan.id}
                      className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                        plan.is_popular
                          ? 'bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white hover:from-[#238080] hover:to-[#1e6b6b] shadow-lg hover:shadow-xl'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${
                        processing && selectedPlan === plan.id
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {processing && selectedPlan === plan.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </div>
                      ) : (
                        'Start 14-Day Free Trial'
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handlePayNow(plan.id)}
                    disabled={processing}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                      showTrialOption 
                        ? 'border-2 border-[#2A8B8A] text-[#2A8B8A] hover:bg-[#2A8B8A] hover:text-white'
                        : 'bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white hover:from-[#238080] hover:to-[#1e6b6b] shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {showTrialOption ? 'Pay Now & Skip Trial' : 'Select This Plan'}
                  </button>
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                  {showTrialOption 
                    ? "14-day free trial • No setup fees • Cancel anytime"
                    : "No setup fees • Cancel anytime • Instant activation"
                  }
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens after my free trial ends?
              </h3>
              <p className="text-gray-600">
                After your 14-day free trial, you'll need to choose a paid plan to continue using StitchByte. 
                Your account will be temporarily suspended until you select a plan.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change my plan later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time from your account settings. 
                Changes will be reflected in your next billing cycle.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is my payment information secure?
              </h3>
              <p className="text-gray-600">
                Absolutely! We use Razorpay for secure payment processing. We never store your card details 
                and all transactions are encrypted with bank-level security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
