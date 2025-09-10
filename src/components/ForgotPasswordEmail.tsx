"use client";
import { useState } from 'react';
import Link from 'next/link';
import { MdEmail, MdArrowForward, MdArrowBack, MdSecurity, MdError } from 'react-icons/md';
import { apiService } from '../app/services/apiService';

interface ForgotPasswordEmailProps {
  onEmailSubmit: (email: string) => void;
}

const ForgotPasswordEmail: React.FC<ForgotPasswordEmailProps> = ({ onEmailSubmit }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiService.forgotPassword(email);
      
      // Success - move to next step
      onEmailSubmit(email);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
              <MdEmail className="w-16 h-16 md:w-20 md:h-20 text-[#2A8B8A]" />
              <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                Reset Password
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Enter your email address and we'll send you a verification code to reset your password
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MdEmail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] transition-colors"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start space-x-3 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                  <MdError className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{error}</p>
                    {error.includes('No account found') && (
                      <p className="text-xs text-red-500 mt-1">
                        Please check your email address or{' '}
                        <Link href="/auth/signup" className="underline hover:text-red-700">
                          create a new account
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A8B8A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Verification Code
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
                  <h3 className="text-sm font-medium text-blue-900 mb-1">Security Notice</h3>
                  <p className="text-xs text-blue-700">
                    We'll send a 6-digit verification code to your email. This code will expire in 15 minutes for your security.
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

export default ForgotPasswordEmail;
