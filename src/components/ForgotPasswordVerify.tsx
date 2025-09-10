"use client";
import { useState, useEffect, useRef } from 'react';
import { MdSecurity, MdArrowForward, MdError, MdRefresh, MdArrowBack, MdCheckCircle } from 'react-icons/md';
import Link from 'next/link';
import { apiService } from '../app/services/apiService';

interface ForgotPasswordVerifyProps {
  email: string;
  onCodeVerified: (code: string) => void;
}

const ForgotPasswordVerify: React.FC<ForgotPasswordVerifyProps> = ({ email, onCodeVerified }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // 1 minute cooldown
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Resend cooldown timer
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      setError(''); // Clear error when user types

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiService.verifyForgotPasswordCode(email, codeString);
      
      if (data.success) {
        onCodeVerified(codeString);
      } else {
        setError(data.detail || 'Invalid verification code. Please try again.');
        // Clear the code inputs
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
      // Clear the code inputs on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiService.resendForgotPasswordCode(email);
      
      if (data.success) {
        setResendCooldown(60); // Set 1-minute cooldown
        setCode(['', '', '', '', '', '']); // Clear code inputs
        setError('');
        setSuccess('New verification code sent to your email!');
        inputRefs.current[0]?.focus();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

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
              <MdSecurity className="w-16 h-16 md:w-20 md:h-20 text-[#2A8B8A]" />
              <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                Verify Email
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              We sent a 6-digit verification code to{' '}
              <span className="font-medium text-[#2A8B8A]">{email}</span>
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Enter Verification Code
                  </label>
                  {/* Resend Text */}
                  {resendCooldown > 0 ? (
                    <span className="text-sm text-gray-500">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendLoading}
                      className="text-sm text-[#2A8B8A] hover:text-[#238080] disabled:opacity-50 transition-colors underline"
                    >
                      {resendLoading ? 'Sending...' : 'Resend Code'}
                    </button>
                  )}
                </div>
                <div className="flex justify-center space-x-3">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] transition-colors"
                      maxLength={1}
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>

              {/* Success Display */}
              {success && (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  <MdCheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <MdError className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || code.join('').length !== 6}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A8B8A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Code
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
                  <h3 className="text-sm font-medium text-blue-900 mb-1">Security Note</h3>
                  <p className="text-xs text-blue-700">
                    For your security, this verification code will expire in 15 minutes. 
                    Never share this code with anyone.
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

export default ForgotPasswordVerify;
