'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LuLoader, LuMail } from 'react-icons/lu';
import EmailSetup from '../components/EmailSetup';
import EmailDashboard from '../components/EmailDashboard';
import { apiService } from '../services/apiService';

export default function EmailSenderPage() {
  const router = useRouter();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkEmailConfig();
  }, []);

  const checkEmailConfig = async () => {
    try {
      const response = await apiService.get('/api/email/config');
      if (response.configured && response.is_verified) {
        // Redirect to dashboard if already configured
        router.push('/email-sender/dashboard');
      } else {
        setIsConfigured(false);
      }
    } catch (error) {
      console.error('Failed to check email config:', error);
      setIsConfigured(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = () => {
    router.push('/email-sender/dashboard');
  };

  const handleDisconnect = () => {
    setIsConfigured(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-28 h-28 bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-pulse">
            <LuMail size={56} className="text-white" />
          </div>
          <LuLoader size={48} className="animate-spin text-gray-900 mx-auto mb-5" />
          <p className="text-gray-700 font-bold text-xl">Loading Email Campaign Studio...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we set things up</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isConfigured ? (
        <EmailDashboard onDisconnect={handleDisconnect} />
      ) : (
        <div className="p-10">
          <EmailSetup onSetupComplete={handleSetupComplete} />
        </div>
      )}
    </div>
  );
}
