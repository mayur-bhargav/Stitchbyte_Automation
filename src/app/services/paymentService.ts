"use client";

// Payment service for handling Razorpay and Stripe integrations
export class PaymentService {
  private static razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  private static stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

  // Razorpay payment integration
  static async processRazorpayPayment(
    amount: number,
    planName: string,
    credits: number,
    userDetails: { email: string; phone?: string; name?: string }
  ): Promise<{ success: boolean; message: string; paymentId?: string }> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.Razorpay) {
        resolve({ success: false, message: 'Razorpay SDK not loaded' });
        return;
      }

      const options = {
        key: this.razorpayKeyId,
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'StitchByte',
        description: `Reboost Credits - ${planName} (${credits} credits)`,
        theme: {
          color: '#2A8B8A'
        },
        prefill: {
          email: userDetails.email,
          contact: userDetails.phone || '',
          name: userDetails.name || ''
        },
        handler: async (response: any) => {
          console.log('Razorpay Payment Success:', response);
          
          // Send payment data to backend
          try {
            const backendResponse = await this.sendPaymentToBackend({
              paymentMethod: 'razorpay',
              paymentId: response.razorpay_payment_id,
              amount,
              planName,
              credits,
              currency: 'INR'
            });

            if (backendResponse.success) {
              resolve({ 
                success: true, 
                message: `Payment successful! ${credits} reboost credits added to your account.`,
                paymentId: response.razorpay_payment_id 
              });
            } else {
              resolve({ 
                success: false, 
                message: 'Payment successful but failed to update credits. Please contact support.' 
              });
            }
          } catch (error) {
            console.error('Backend error:', error);
            resolve({ 
              success: false, 
              message: 'Payment successful but failed to update credits. Please contact support.' 
            });
          }
        },
        modal: {
          ondismiss: () => {
            resolve({ success: false, message: 'Payment cancelled by user' });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        resolve({ 
          success: false, 
          message: `Payment failed: ${response.error.description || 'Unknown error'}` 
        });
      });

      rzp.open();
    });
  }

  // Stripe payment integration
  static async processStripePayment(
    amount: number,
    planName: string,
    credits: number,
    userDetails: { email: string; name?: string }
  ): Promise<{ success: boolean; message: string; paymentId?: string }> {
    try {
      // Note: This is a simplified Stripe integration
      // In a real implementation, you would use Stripe Elements or Checkout
      console.log('Stripe payment integration would be implemented here');
      
      // For now, return a mock success response
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      // Send payment data to backend
      const backendResponse = await this.sendPaymentToBackend({
        paymentMethod: 'stripe',
        paymentId: `stripe_${Date.now()}`, // Mock payment ID
        amount,
        planName,
        credits,
        currency: 'INR'
      });

      if (backendResponse.success) {
        return { 
          success: true, 
          message: `Payment successful! ${credits} reboost credits added to your account.`,
          paymentId: `stripe_${Date.now()}`
        };
      } else {
        return { 
          success: false, 
          message: 'Payment successful but failed to update credits. Please contact support.' 
        };
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      return { 
        success: false, 
        message: 'Payment processing failed. Please try again.' 
      };
    }
  }

  // Send payment data to backend API
  private static async sendPaymentToBackend(paymentData: {
    paymentMethod: string;
    paymentId: string;
    amount: number;
    planName: string;
    credits: number;
    currency: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/payments/reboost-credits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message || 'Credits added successfully' };
      } else {
        return { success: false, message: data.error || 'Failed to process payment' };
      }
    } catch (error) {
      console.error('Backend API error:', error);
      return { success: false, message: 'Failed to communicate with server' };
    }
  }

  // Load Razorpay script dynamically
  static loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
}

// Extend Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}
