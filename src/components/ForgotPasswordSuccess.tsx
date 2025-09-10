"use client";
import Link from 'next/link';
import { MdCheckCircle, MdLogin, MdArrowBack, MdSecurity } from 'react-icons/md';

const ForgotPasswordSuccess: React.FC = () => {
  const handleSignIn = () => {
    window.location.href = '/auth/signin';
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
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-[#2A8B8A] transition-colors"
            >
              <MdArrowBack className="w-4 h-4" />
              Back to Home
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
              <MdCheckCircle className="w-16 h-16 md:w-20 md:h-20 text-[#2A8B8A]" />
              <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                Success!
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
          </div>

          {/* Success Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50 text-center">
            {/* Sign In Button */}
            <button
              onClick={handleSignIn}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A8B8A] transition-all duration-200 shadow-lg mb-6"
            >
              <MdLogin className="w-4 h-4 mr-2" />
              Sign In Now
            </button>

            {/* Security Notice */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start space-x-3">
                <MdSecurity className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-green-900 mb-1">Security Update Complete</h3>
                  <p className="text-xs text-green-700">
                    Your password has been securely updated. For your protection, you've been signed out of all devices.
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

export default ForgotPasswordSuccess;
