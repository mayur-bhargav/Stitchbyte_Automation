"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../../contexts/UserContext";
import { apiService } from "../../services/apiService";
import { 
  MdEmail, 
  MdLock, 
  MdVisibility, 
  MdVisibilityOff, 
  MdLogin,
  MdArrowBack,
  MdSecurity,
  MdCheckCircle,
  MdError,
  MdInfo
} from "react-icons/md";

export default function SignIn() {
  const { login, isAuthenticated } = useUser();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState<'authenticator' | 'email' | 'both'>('authenticator');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'authenticator' | 'email'>('authenticator');

  const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await login(formData.email, formData.password);
      
      // Check if 2FA is required
      if (response && response.requires2FA) {
        console.log('2FA required. Response:', response);
        setRequires2FA(true);
        setTwoFactorType(response.twoFactorType || 'authenticator');
        setPendingLoginData(response);
        
        // Handle different 2FA configurations
        if (response.twoFactorType === 'email') {
          // User has only email OTP - auto send and show email verification
          console.log('Email 2FA detected, setting method to email and sending OTP');
          setSelectedMethod('email');
          await handleResendCode();
          showToastNotification('OTP sent to your email. Please enter the code.', 'success');
        } else if (response.twoFactorType === 'authenticator') {
          // User has only authenticator - show authenticator verification
          console.log('Authenticator 2FA detected');
          setSelectedMethod('authenticator');
          showToastNotification('Please enter your authenticator code', 'success');
        } else if (response.twoFactorType === 'both') {
          // User has both methods - show selection with authenticator as default
          console.log('Dual 2FA detected');
          setSelectedMethod('authenticator');
          showToastNotification('Please enter your authenticator code or choose email OTP', 'success');
        } else {
          // Fallback to authenticator
          console.log('Unknown 2FA type, defaulting to authenticator');
          setSelectedMethod('authenticator');
          showToastNotification('Please enter your 2FA verification code', 'success');
        }
      } else {
        // Normal login success - use window.location for full page refresh to ensure SubscriptionGuard runs
        showToastNotification(`Welcome back!`, 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (error) {
      console.error('Signin error:', error);
      showToastNotification('Invalid credentials. Please try again.', 'error');
    }
    setLoading(false);
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = showBackupCode ? backupCode : verificationCode;
    const codeType = showBackupCode ? 'backup' : selectedMethod;
    
    if (showBackupCode) {
      // Backup codes are typically 5-10 characters with dashes
      if (!backupCode || backupCode.length < 5) {
        showToastNotification('Please enter a valid backup code', 'error');
        return;
      }
    } else {
      // Regular 2FA codes are 6 digits
      if (!verificationCode || verificationCode.length !== 6) {
        showToastNotification('Please enter a valid 6-digit code', 'error');
        return;
      }
    }
    
    setLoading(true);
    try {
      // Complete login with 2FA code or backup code
      const response = await login(formData.email, formData.password, code, codeType);
      
      showToastNotification(`Welcome back! ${showBackupCode ? 'Backup code' : '2FA'} verification successful.`, 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error: any) {
      console.error('2FA verification error:', error);
      if (error.message?.includes('Invalid') || error.message?.includes('expired')) {
        showToastNotification(`Invalid or expired ${showBackupCode ? 'backup code' : 'verification code'}. Please try again.`, 'error');
      } else {
        showToastNotification(`${showBackupCode ? 'Backup code' : '2FA'} verification failed. Please try again.`, 'error');
      }
    }
    setLoading(false);
  };

  const handleResendCode = async () => {
    console.log('handleResendCode called. twoFactorType:', twoFactorType, 'selectedMethod:', selectedMethod);
    
    // Only allow resending for email OTP users
    if (twoFactorType !== 'email' && !(twoFactorType === 'both' && selectedMethod === 'email')) {
      console.log('Resend not allowed for this 2FA configuration');
      return;
    }
    
    console.log('Attempting to resend email OTP to:', formData.email);
    setResendLoading(true);
    try {
      // Use apiService to resend email OTP
      await apiService.resend2FACode(formData.email);
      console.log('OTP resend successful');
      showToastNotification('New verification code sent to your email', 'success');
    } catch (error: any) {
      console.error('Resend code error:', error);
      showToastNotification(error.message || 'Failed to resend code. Please try again.', 'error');
    }
    setResendLoading(false);
  };

  const switchTo2FAMethod = async (method: 'authenticator' | 'email') => {
    setSelectedMethod(method);
    setVerificationCode('');
    
    // If switching to email, automatically send OTP
    if (method === 'email') {
      await handleResendCode();
    }
  };

  const goBackToLogin = () => {
    setRequires2FA(false);
    setVerificationCode('');
    setBackupCode('');
    setShowBackupCode(false);
    setPendingLoginData(null);
  };

  const toggleBackupCode = () => {
    setShowBackupCode(!showBackupCode);
    setVerificationCode('');
    setBackupCode('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
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
              <MdLogin className="w-16 h-16 md:w-20 md:h-20 text-[#2A8B8A]" />
              <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                Welcome Back
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Sign in to your StitchByte account to continue your WhatsApp automation journey
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
            {!requires2FA ? (
              /* Login Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MdEmail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                        errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#2A8B8A]'
                      }`}
                      placeholder="Enter your email address"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                      <MdError className="w-4 h-4" />
                      {errors.email}
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MdLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                        errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#2A8B8A]'
                      }`}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showPassword ? (
                        <MdVisibilityOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <MdVisibility className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                      <MdError className="w-4 h-4" />
                      {errors.password}
                    </div>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#2A8B8A] border-gray-300 rounded focus:ring-[#2A8B8A] focus:ring-2"
                    />
                    <label className="ml-3 text-sm font-medium text-gray-700">
                      Remember me for 30 days
                    </label>
                  </div>
                  
                  <button 
                    type="button"
                    className="text-sm font-semibold text-[#2A8B8A] hover:text-[#238080] transition-colors bg-transparent border-none cursor-pointer"
                    onClick={() => {
                      // Force navigation without any React Router interference
                      window.location.replace('/auth/forgot-password');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing you in...
                    </>
                  ) : (
                    <>
                      <MdLogin className="w-5 h-5" />
                      Sign In to Dashboard
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* 2FA Verification Form */
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={goBackToLogin}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <MdArrowBack className="w-4 h-4" />
                  Back to login
                </button>

                {/* 2FA Header */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-full flex items-center justify-center mx-auto mb-4">
                    <MdSecurity className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {showBackupCode ? 'Use Backup Code' : 'Two-Factor Authentication'}
                  </h3>
                  <p className="text-gray-600">
                    {showBackupCode 
                      ? 'Enter one of your backup codes'
                      : twoFactorType === 'email'
                        ? `Enter the 6-digit code sent to ${formData.email}`
                        : twoFactorType === 'authenticator'
                          ? 'Enter the 6-digit code from your authenticator app'
                          : twoFactorType === 'both'
                            ? `Enter the 6-digit code from your ${selectedMethod === 'authenticator' ? 'authenticator app' : 'email'}`
                            : 'Enter your verification code'
                    }
                  </p>
                </div>

                {/* Method Selection for dual 2FA */}
                {twoFactorType === 'both' && !showBackupCode && (
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-4">
                    <button
                      type="button"
                      onClick={() => switchTo2FAMethod('authenticator')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        selectedMethod === 'authenticator'
                          ? 'bg-white text-[#2A8B8A] shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Authenticator App
                    </button>
                    <button
                      type="button"
                      onClick={() => switchTo2FAMethod('email')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        selectedMethod === 'email'
                          ? 'bg-white text-[#2A8B8A] shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Email OTP
                    </button>
                  </div>
                )}

                {/* 2FA Form */}
                <form onSubmit={handle2FASubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      {showBackupCode ? 'Backup Code' : 'Verification Code'}
                    </label>
                    {showBackupCode ? (
                      <input
                        type="text"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 12))}
                        className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] transition-all duration-200 text-center text-lg tracking-wider font-mono"
                        placeholder="12345-67890"
                        maxLength={12}
                        autoComplete="one-time-code"
                      />
                    ) : (
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] transition-all duration-200 text-center text-2xl tracking-widest font-mono"
                        placeholder="000000"
                        maxLength={6}
                        autoComplete="one-time-code"
                      />
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || (showBackupCode ? backupCode.length < 5 : verificationCode.length !== 6)}
                    className="w-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <MdCheckCircle className="w-5 h-5" />
                        Verify & Continue
                      </>
                    )}
                  </button>

                  {/* Alternative options */}
                  <div className="space-y-3">
                    {/* Try another way button - only for authenticator users (backup codes) or dual users */}
                    {(twoFactorType === 'authenticator' || (twoFactorType === 'both' && selectedMethod === 'authenticator')) && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={toggleBackupCode}
                          className="text-sm text-[#2A8B8A] hover:text-[#238080] font-semibold transition-colors"
                        >
                          {showBackupCode ? 'Use authenticator code instead' : 'Try another way'}
                        </button>
                      </div>
                    )}

                    {/* Resend Code (for email OTP and not backup mode) */}
                    {(twoFactorType === 'email' || (twoFactorType === 'both' && selectedMethod === 'email')) && !showBackupCode && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={resendLoading}
                          className="text-sm text-[#2A8B8A] hover:text-[#238080] font-semibold transition-colors disabled:opacity-50"
                        >
                          {resendLoading ? 'Sending...' : 'Resend code'}
                        </button>
                      </div>
                    )}
                  </div>
                </form>

                {/* Backup code info */}
                {showBackupCode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MdInfo className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">About Backup Codes</h4>
                        <p className="text-sm text-blue-700">
                          Backup codes are single-use codes that you saved when setting up two-factor authentication. 
                          Each code can only be used once. After using this code, make sure to generate new backup codes 
                          in your security settings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Divider and links - only show for login form */}
            {!requires2FA && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">New to StitchByte?</span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Start your WhatsApp automation journey today
                  </p>
                  <Link 
                    href="/auth/signup" 
                    className="inline-flex items-center gap-2 text-[#2A8B8A] hover:text-[#238080] font-semibold transition-colors"
                  >
                    Create free account
                    <span className="text-lg">→</span>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <MdSecurity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Enterprise-Grade Security</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your data is protected with end-to-end encryption, multi-tenant isolation, and SOC 2 compliance. 
                  Collaborate securely while maintaining complete data privacy.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <MdCheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-500">256-bit SSL encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg text-white transition-all duration-300 transform ${
            toastType === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : 'bg-gradient-to-r from-red-500 to-red-600'
          }`}>
            {toastType === 'success' ? (
              <MdCheckCircle className="w-5 h-5" />
            ) : (
              <MdError className="w-5 h-5" />
            )}
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
