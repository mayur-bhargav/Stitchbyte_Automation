"use client";
import { useState } from 'react';
import ForgotPasswordEmail from '../../../components/ForgotPasswordEmail';
import ForgotPasswordVerify from '../../../components/ForgotPasswordVerify';
import ForgotPasswordReset from '../../../components/ForgotPasswordReset';
import ForgotPasswordSuccess from '../../../components/ForgotPasswordSuccess';

/**
 * Complete Forgot Password Implementation
 * 
 * Backend Features Supported:
 * - Three-step flow: Email → 6-digit code → New password
 * - Strong password validation: 8+ chars, uppercase, lowercase, number, special char
 * - User existence check: "No account found with this email address" error handling
 * - Old password validation: Prevents setting the same password as current
 * - Security features: 15-minute code expiration, rate limiting
 * 
 * Frontend Features:
 * - Professional UI matching signin page design
 * - Real-time password strength validation
 * - Clear error messaging with helpful guidance
 * - Responsive design across all devices
 * - Proper apiService integration with localhost:8000
 * 
 * API Endpoints:
 * - POST /auth/forgot-password - Send reset code to email
 * - POST /auth/forgot-password/verify-code - Verify 6-digit code
 * - POST /auth/forgot-password/resend-code - Resend verification code (1min cooldown)
 * - POST /auth/forgot-password/reset - Set new password
 */

type ForgotPasswordStep = 'email' | 'verify' | 'reset' | 'success';

interface ForgotPasswordData {
  email: string;
  code: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>('email');
  const [data, setData] = useState<ForgotPasswordData>({
    email: '',
    code: ''
  });

  const handleEmailSubmit = (email: string) => {
    setData(prev => ({ ...prev, email }));
    setCurrentStep('verify');
  };

  const handleCodeVerified = (code: string) => {
    setData(prev => ({ ...prev, code }));
    setCurrentStep('reset');
  };

  const handlePasswordReset = () => {
    setCurrentStep('success');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'email':
        return <ForgotPasswordEmail onEmailSubmit={handleEmailSubmit} />;
      
      case 'verify':
        return (
          <ForgotPasswordVerify 
            email={data.email}
            onCodeVerified={handleCodeVerified}
          />
        );
      
      case 'reset':
        return (
          <ForgotPasswordReset 
            email={data.email}
            code={data.code}
            onComplete={handlePasswordReset}
          />
        );
      
      case 'success':
        return <ForgotPasswordSuccess />;
      
      default:
        return <ForgotPasswordEmail onEmailSubmit={handleEmailSubmit} />;
    }
  };

  return (
    <div>
      {renderStep()}
    </div>
  );
};

export default ForgotPasswordPage;
