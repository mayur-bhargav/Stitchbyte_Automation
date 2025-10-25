'use client';

import { useState } from 'react';
import { LuMail, LuLock, LuServer, LuCircleAlert, LuLoader } from 'react-icons/lu';
import { FaCheckCircle } from 'react-icons/fa';
import { apiService } from '../services/apiService';

interface EmailSetupProps {
  onSetupComplete: () => void;
}

export default function EmailSetup({ onSetupComplete }: EmailSetupProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    provider: 'smtp.gmail.com',
    port: 587,
    customProvider: ''
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verified' | 'failed'>('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerify = async () => {
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    if (formData.provider === 'custom' && !formData.customProvider) {
      setError('Please enter your custom SMTP server address');
      return;
    }

    setIsVerifying(true);
    setError('');
    setSuccess('');

    try {
      // Use custom provider if selected, otherwise use the selected provider
      const providerToUse = formData.provider === 'custom' ? formData.customProvider : formData.provider;
      
      const response = await apiService.post('/api/email/verify', {
        email: formData.email,
        password: formData.password,
        provider: providerToUse,
        port: formData.port
      });
      
      if (response.success) {
        setVerificationStatus('verified');
        setSuccess('Email credentials verified successfully!');
      } else {
        setVerificationStatus('failed');
        setError('Failed to verify credentials');
      }
    } catch (err: any) {
      setVerificationStatus('failed');
      setError(err.response?.data?.detail || 'Invalid email credentials. Please check your email and password.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (verificationStatus !== 'verified') {
      setError('Please verify your credentials first');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Use custom provider if selected, otherwise use the selected provider
      const providerToUse = formData.provider === 'custom' ? formData.customProvider : formData.provider;
      
      const response = await apiService.post('/api/email/save-credentials', {
        email: formData.email,
        password: formData.password,
        provider: providerToUse,
        port: formData.port
      });
      
      if (response.success) {
        setSuccess('Credentials saved successfully!');
        setTimeout(() => {
          onSetupComplete();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save credentials');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-200">
        {/* Header */}
        <div className="text-center mb-10" style={{ padding: '27px' }}>
          <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <LuMail size={48} className="text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            Email Credentials Setup
          </h2>
          <p className="text-gray-500 font-normal text-lg">
            Connect your email account to start sending campaigns
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-900 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <LuCircleAlert size={20} className="text-white" />
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-bold mb-2 text-gray-900 text-base">For Gmail users:</p>
              <p className="font-normal leading-relaxed">You'll need to use an "App Password" instead of your regular Gmail password. 
              <a 
                href="https://support.google.com/accounts/answer/185833" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-gray-900 ml-1 font-semibold transition-colors"
              >
                Learn how to create an app password →
              </a>
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-7">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase text-xs">
              Email Address
            </label>
            <div className="relative">
              <LuMail size={22} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@gmail.com"
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm"
                disabled={verificationStatus === 'verified'}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase text-xs">
              Password / App Password
            </label>
            <div className="relative">
              <LuLock size={22} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password or app password"
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm"
                disabled={verificationStatus === 'verified'}
              />
            </div>
          </div>

          {/* Provider Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase text-xs">
              SMTP Provider
            </label>
            <div className="relative">
              <LuServer size={22} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white appearance-none cursor-pointer transition-all shadow-sm"
                disabled={verificationStatus === 'verified'}
              >
                <option value="smtp.gmail.com">Gmail (smtp.gmail.com)</option>
                <option value="smtp.office365.com">Outlook (smtp.office365.com)</option>
                <option value="smtp.mail.yahoo.com">Yahoo (smtp.mail.yahoo.com)</option>
                <option value="smtp.zoho.com">Zoho (smtp.zoho.com)</option>
                <option value="custom">Custom SMTP Server</option>
              </select>
            </div>
          </div>

          {/* Custom SMTP Server Input - Only shown when Custom is selected */}
          {formData.provider === 'custom' && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase text-xs">
                Custom SMTP Server
              </label>
              <div className="relative">
                <LuServer size={22} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.provider === 'custom' ? formData.customProvider || '' : ''}
                  onChange={(e) => setFormData({ ...formData, customProvider: e.target.value })}
                  placeholder="e.g., smtp.yourdomain.com"
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm"
                  disabled={verificationStatus === 'verified'}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 ml-1">
                Enter your custom domain's SMTP server address
              </p>
            </div>
          )}

          {/* Port Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3 tracking-wide uppercase text-xs">
              Port
            </label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm"
              disabled={verificationStatus === 'verified'}
            />
            <p className="text-xs text-gray-500 mt-2 ml-1">
              Standard port is 587 for TLS/STARTTLS
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 text-red-800">
                <LuCircleAlert size={22} className="flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 text-green-800">
                <FaCheckCircle size={22} className="flex-shrink-0" />
                <span className="text-sm font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            {verificationStatus !== 'verified' ? (
              <button
                onClick={handleVerify}
                disabled={isVerifying || !formData.email || !formData.password}
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl font-bold hover:from-gray-800 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isVerifying ? (
                  <>
                    <LuLoader size={22} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <FaCheckCircle size={22} />
                    Verify Credentials
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl font-bold hover:from-gray-800 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                {isSaving ? (
                  <>
                    <LuLoader size={22} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheckCircle size={22} />
                    Save Credentials
                  </>
                )}
              </button>
            )}
          </div>

          {verificationStatus === 'verified' && (
            <p className="text-center text-sm text-gray-600 bg-gray-50 rounded-xl py-3 px-4">
              ✅ Credentials verified! Click "Save Credentials" to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
