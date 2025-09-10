"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MdLock, MdVisibility, MdVisibilityOff, MdCheck, MdClose, MdArrowForward, MdError, MdArrowBack, MdSecurity } from 'react-icons/md';
import { validatePassword, PASSWORD_REQUIREMENTS, PasswordValidationResult } from '../utils/passwordValidation';
import { apiService } from '../app/services/apiService';

interface ForgotPasswordResetProps {
  email: string;
  code: string;
  onComplete: () => void;
}

const ForgotPasswordReset: React.FC<ForgotPasswordResetProps> = ({ email, code, onComplete }) => {
  const [passwords, setPasswords] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new_password: false,
    confirm_password: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState<PasswordValidationResult>({
    isValid: false,
    score: 0,
    requirements: {}
  });

  useEffect(() => {
    if (passwords.new_password) {
      const result = validatePassword(passwords.new_password, passwords.confirm_password);
      setValidation(result);
    } else {
      setValidation({ isValid: false, score: 0, requirements: {} });
    }
  }, [passwords]);

  const handlePasswordChange = (field: 'new_password' | 'confirm_password', value: string) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user types
  };

  const togglePasswordVisibility = (field: 'new_password' | 'confirm_password') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.isValid) {
      setError('Please ensure all password requirements are met');
      return;
    }

    if (passwords.new_password !== passwords.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiService.resetPassword(
        email, 
        code, 
        passwords.new_password, 
        passwords.confirm_password
      );
      
      if (data.success) {
        onComplete();
      } else {
        setError(data.detail || 'Failed to reset password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (score: number): string => {
    if (score < 40) return 'bg-red-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number): string => {
    if (score < 40) return 'Weak';
    if (score < 70) return 'Medium';
    return 'Strong';
  };

  const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
    <div className={`flex items-center space-x-2 text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>
      {met ? (
        <MdCheck className="w-4 h-4 text-green-600" />
      ) : (
        <MdClose className="w-4 h-4 text-gray-400" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold">
                <span className="text-gray-900">Stitch</span>
                <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">Byte</span>
              </span>
            </Link>
            
            <Link 
              href="/auth/signin"
              className="flex items-center gap-2 text-gray-600 hover:text-[#2A8B8A] transition-colors"
            >
              <MdArrowBack className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-4">
              <MdLock className="w-16 h-16 md:w-20 md:h-20 text-[#2A8B8A]" />
              <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                New Password
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose a strong password for your account
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label htmlFor="new_password" className="block text-sm font-semibold text-gray-700 mb-3">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MdLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="new_password"
                    type={showPasswords.new_password ? 'text' : 'password'}
                    value={passwords.new_password}
                    onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                    className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] transition-colors"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new_password')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPasswords.new_password ? (
                      <MdVisibilityOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <MdVisibility className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwords.new_password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        validation.score < 40 ? 'text-red-600' : 
                        validation.score < 70 ? 'text-yellow-600' : 'text-[#2A8B8A]'
                      }`}>
                        {getStrengthText(validation.score)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validation.score)}`}
                        style={{ width: `${validation.score}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-semibold text-gray-700 mb-3">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MdLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirm_password"
                    type={showPasswords.confirm_password ? 'text' : 'password'}
                    value={passwords.confirm_password}
                    onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                    className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] transition-colors"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm_password')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPasswords.confirm_password ? (
                      <MdVisibilityOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <MdVisibility className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {passwords.new_password && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Password Requirements:</h4>
                  <div className="space-y-2">
                    {PASSWORD_REQUIREMENTS.map((req) => (
                      <RequirementItem 
                        key={req.id}
                        met={validation.requirements[req.id] || false} 
                        text={req.text} 
                      />
                    ))}
                    {passwords.confirm_password && (
                      <RequirementItem 
                        met={validation.requirements.match || false} 
                        text="Passwords match" 
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-start space-x-3 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                  <MdError className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{error}</p>
                    {(error.includes('same password') || error.includes('current password')) && (
                      <p className="text-xs text-red-500 mt-1">
                        For security reasons, your new password must be different from your current password.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !validation.isValid}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A8B8A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Password
                    <MdArrowForward className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <MdSecurity className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">Security Tip</h3>
              <p className="text-xs text-blue-700">
                Use a unique password that you don't use anywhere else. Consider using a password manager for better security.
              </p>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordReset;
