"use client";
import { useState } from 'react';
import ForgotPasswordEmail from '../../../components/ForgotPasswordEmail';
import ForgotPasswordVerify from '../../../components/ForgotPasswordVerify';
import ForgotPasswordReset from '../../../components/ForgotPasswordReset';
import ForgotPasswordSuccess from '../../../components/ForgotPasswordSuccess';

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
