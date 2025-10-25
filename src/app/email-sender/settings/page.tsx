'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuMail, LuLock, LuServer, LuCircleAlert, LuLoader, LuCircleCheck, LuTrash2, LuPencil } from 'react-icons/lu';
import { apiService } from '../../services/apiService';

export default function EmailSettingsPage() {
  const router = useRouter();
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    provider: 'smtp.gmail.com',
    port: 587,
    customProvider: ''
  });

  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    message: string;
    type: 'error' | 'info' | 'success';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchEmailConfig();
  }, []);

  const fetchEmailConfig = async () => {
    try {
      const data = await apiService.get('/api/email/config');
      
      if (data.configured) {
        setEmailConfig(data);
        setFormData({
          email: data.email || '',
          password: '',
          provider: data.provider || 'smtp.gmail.com',
          port: data.port || 587,
          customProvider: ''
        });
      }
    } catch (error) {
      console.error('Error fetching email config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!formData.email || !formData.password) {
      setAlertModal({
        show: true,
        message: 'Please enter both email and password',
        type: 'error'
      });
      return;
    }

    setIsVerifying(true);

    try {
      const providerToUse = formData.provider === 'custom' ? formData.customProvider : formData.provider;
      
      const data = await apiService.post('/api/email/verify', {
        email: formData.email,
        password: formData.password,
        provider: providerToUse,
        port: formData.port
      });
      
      if (data.success) {
        setAlertModal({
          show: true,
          message: 'Email credentials verified successfully!',
          type: 'success'
        });
      } else {
        setAlertModal({
          show: true,
          message: 'Failed to verify credentials',
          type: 'error'
        });
      }
    } catch (error) {
      setAlertModal({
        show: true,
        message: 'Invalid email credentials. Please check your email and password.',
        type: 'error'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!formData.email || !formData.password) {
      setAlertModal({
        show: true,
        message: 'Please enter all required fields',
        type: 'error'
      });
      return;
    }

    setIsSaving(true);

    try {
      const providerToUse = formData.provider === 'custom' ? formData.customProvider : formData.provider;
      
      const data = await apiService.post('/api/email/save-credentials', {
        email: formData.email,
        password: formData.password,
        provider: providerToUse,
        port: formData.port
      });
      
      if (data.success) {
        setAlertModal({
          show: true,
          message: 'Credentials updated successfully!',
          type: 'success'
        });
        setIsEditing(false);
        fetchEmailConfig();
      } else {
        setAlertModal({
          show: true,
          message: 'Failed to save credentials',
          type: 'error'
        });
      }
    } catch (error) {
      setAlertModal({
        show: true,
        message: 'Failed to save credentials',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = () => {
    setConfirmModal({
      show: true,
      message: 'Are you sure you want to disconnect your email account? You will need to reconnect to send emails.',
      onConfirm: async () => {
        try {
          await apiService.delete('/api/email/config');
          
          setAlertModal({
            show: true,
            message: 'Email account disconnected successfully',
            type: 'info'
          });
          router.push('/email-sender');
        } catch (error) {
          setAlertModal({
            show: true,
            message: 'Failed to disconnect email account',
            type: 'error'
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LuLoader size={48} className="animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-transparent border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/email-sender/dashboard')}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/80 hover:bg-white backdrop-blur-md border border-gray-200 shadow-lg hover:shadow-xl text-gray-900 transition-all transform hover:-translate-y-0.5 duration-200"
            >
              <LuArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Email Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your email configuration and credentials</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {!emailConfig?.configured ? (
          <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-200 text-center">
            <LuCircleAlert size={64} className="text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Email Configured</h2>
            <p className="text-gray-600 mb-6">Please set up your email account first</p>
            <button
              onClick={() => router.push('/email-sender')}
              className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Setup Email
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Configuration */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">Current Configuration</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <LuPencil size={18} />
                    Edit
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Email Address</label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <LuMail size={20} className="text-gray-400" />
                      <span className="text-gray-900 font-medium">{emailConfig.email}</span>
                      {emailConfig.is_verified && (
                        <LuCircleCheck size={20} className="text-green-500 ml-auto" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">SMTP Provider</label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <LuServer size={20} className="text-gray-400" />
                      <span className="text-gray-900 font-medium">{emailConfig.provider}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Port</label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <span className="text-gray-900 font-medium">{emailConfig.port}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleDisconnect}
                      className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <LuTrash2 size={20} />
                      Disconnect Email Account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Email Address</label>
                    <div className="relative">
                      <LuMail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your.email@gmail.com"
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">New Password / App Password</label>
                    <div className="relative">
                      <LuLock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter new password"
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">Leave blank to keep current password</p>
                  </div>

                  {/* Provider Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">SMTP Provider</label>
                    <div className="relative">
                      <LuServer size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={formData.provider}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white appearance-none cursor-pointer transition-all shadow-sm"
                      >
                        <option value="smtp.gmail.com">Gmail (smtp.gmail.com)</option>
                        <option value="smtp.office365.com">Outlook (smtp.office365.com)</option>
                        <option value="smtp.mail.yahoo.com">Yahoo (smtp.mail.yahoo.com)</option>
                        <option value="smtp.zoho.com">Zoho (smtp.zoho.com)</option>
                        <option value="custom">Custom SMTP Server</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom SMTP Server Input */}
                  {formData.provider === 'custom' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Custom SMTP Server</label>
                      <div className="relative">
                        <LuServer size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.customProvider}
                          onChange={(e) => setFormData({ ...formData, customProvider: e.target.value })}
                          placeholder="e.g., smtp.yourdomain.com"
                          className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Port Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Port</label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                      className="w-full px-4 py-4 border border-gray-200 rounded-2xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          email: emailConfig.email || '',
                          password: '',
                          provider: emailConfig.provider || 'smtp.gmail.com',
                          port: emailConfig.port || 587,
                          customProvider: ''
                        });
                      }}
                      className="flex-1 px-8 py-4 bg-gray-200 text-gray-900 rounded-2xl font-bold hover:bg-gray-300 transition-all shadow-lg hover:shadow-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
                    >
                      {isVerifying ? (
                        <>
                          <LuLoader size={20} className="animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <LuCircleCheck size={20} />
                          Verify & Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-900 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <LuCircleAlert size={20} className="text-white" />
                </div>
                <div className="text-sm text-gray-700">
                  <p className="font-bold mb-2 text-gray-900 text-base">Security Note</p>
                  <p className="font-normal leading-relaxed">
                    For Gmail users, you'll need to use an "App Password" instead of your regular Gmail password.
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
          </div>
        )}
      </div>

      {/* Alert Modal */}
      {alertModal.show && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              {alertModal.type === 'error' && (
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <LuCircleAlert size={24} className="text-red-600" />
                </div>
              )}
              {alertModal.type === 'success' && (
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <LuCircleCheck size={24} className="text-green-600" />
                </div>
              )}
              {alertModal.type === 'info' && (
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <LuCircleAlert size={24} className="text-blue-600" />
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900">
                {alertModal.type === 'error' && 'Error'}
                {alertModal.type === 'success' && 'Success'}
                {alertModal.type === 'info' && 'Info'}
              </h3>
            </div>
            <p className="text-gray-700 mb-6">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ show: false, message: '', type: 'info' })}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <LuCircleAlert size={24} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Confirm Action</h3>
            </div>
            <p className="text-gray-700 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ show: false, message: '', onConfirm: () => {} })}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-xl font-bold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ show: false, message: '', onConfirm: () => {} });
                }}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
