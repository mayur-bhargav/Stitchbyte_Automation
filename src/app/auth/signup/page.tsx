"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../../contexts/UserContext";
import Toast from "../../components/Toast";
import { useToast, getErrorMessage } from "../../hooks/useToast";
import { apiService } from "../../services/apiService";
import { 
  MdEmail, 
  MdLock, 
  MdVisibility, 
  MdVisibilityOff, 
  MdPersonAdd,
  MdArrowBack,
  MdSecurity,
  MdCheckCircle,
  MdError,
  MdPerson,
  MdBusiness,
  MdPhone,
  MdCheck
} from "react-icons/md";

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companySize: '',
    industry: '',
    phone: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const router = useRouter();
  const { signup, refreshUser } = useUser();
  const { toast, showToast, hideToast, showSuccess, showError, showWarning } = useToast();

  const showToastNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    showToast(message, type);
  };

  const closeToast = () => {
    hideToast();
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.companySize) newErrors.companySize = 'Company size is required';
    if (!formData.industry) newErrors.industry = 'Industry is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step: number) => {
    const newErrors: any = {};
    
    if (step === 1) {
      // Personal Information
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    } else if (step === 2) {
      // Password Information
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    } else if (step === 3) {
      // Company Information
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.companySize) newErrors.companySize = 'Company size is required';
      if (!formData.industry) newErrors.industry = 'Industry is required';
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      showError(`Please complete all required fields in step ${currentStep}`);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Personal Information';
      case 2: return 'Secure Your Account';
      case 3: return 'Company Details';
      default: return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }
    
    await performSignup();
  };

  const performSignup = async (isRetry = false) => {
    setLoading(true);
    setIsRetrying(isRetry);
    
    if (isRetry) {
      setLoadingStep('Retrying account creation...');
    } else {
      setLoadingStep('Validating information...');
    }
    
    try {
      // Step 1: Validate form data
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingStep('Creating your account...');
      
      // Step 2: Create account
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoadingStep('Setting up your workspace...');
      
      // Step 3: Actually signup
      await signup({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        companySize: formData.companySize,
        industry: formData.industry,
        phone: formData.phone,
        agreeToTerms: formData.agreeToTerms
      });
      
      setLoadingStep('Setting up your 14-day free trial...');
      
      // Verify token is working before selecting trial plan
      const tokenIsValid = await apiService.verifyToken();
      if (!tokenIsValid) {
        console.error('Token verification failed after signup');
        showWarning('Account created successfully, but there was an issue setting up your trial. Please sign in to continue.');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
        return;
      }
      
      // Automatically select trial plan
      try {
        setLoadingStep('Activating your free trial...');
        await apiService.selectPlan('trial');
        
        // Refresh user data to include subscription
        setLoadingStep('Updating your profile...');
        await refreshUser();
        
        setLoadingStep('Finalizing setup...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showSuccess('🎉 Account created successfully! Your 14-day free trial has started. Welcome to StitchByte!');
      } catch (trialError) {
        console.error('Trial setup error:', trialError);
        showWarning('🎉 Account created successfully! Please complete your plan selection to continue. Welcome to StitchByte!');
      }
      
      // Reset retry count on success
      setRetryCount(0);
      
      // Redirect to dashboard - the SubscriptionGuard will handle routing if needed
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = getErrorMessage(error);
      
      // Check if this is a network error and offer retry
      const isNetworkError = error?.code === 'NETWORK_ERROR' || 
                            error?.name === 'NetworkError' ||
                            errorMessage.includes('network') ||
                            errorMessage.includes('connection');
      
      if (isNetworkError && retryCount < 2) {
        showWarning(
          `${errorMessage} Click the button to retry (${retryCount + 1}/3)`
        );
        setRetryCount(prev => prev + 1);
      } else {
        showError(errorMessage);
        setRetryCount(0);
      }
      
      setLoadingStep('');
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    performSignup(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mb-8">
              <MdPersonAdd className="w-20 h-20 text-[#2A8B8A] mx-auto mb-6" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                Create Your Account
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Start your 14-day free trial and transform your WhatsApp marketing today
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
            {/* Step Progress */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                    step === currentStep 
                      ? 'bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white shadow-lg' 
                      : step < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step < currentStep ? <MdCheck className="w-5 h-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-200 ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Current Step Title */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">{getStepTitle(currentStep)}</h3>
              <p className="text-gray-600 mt-2">Step {currentStep} of 3</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        First Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MdPerson className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                            errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#2A8B8A]'
                          }`}
                          placeholder="Enter your first name"
                          autoComplete="given-name"
                        />
                      </div>
                      {errors.firstName && (
                        <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                          <MdError className="w-4 h-4" />
                          {errors.firstName}
                        </div>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Last Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MdPerson className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                            errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#2A8B8A]'
                          }`}
                          placeholder="Enter your last name"
                          autoComplete="family-name"
                        />
                      </div>
                      {errors.lastName && (
                        <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                          <MdError className="w-4 h-4" />
                          {errors.lastName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Email Address *
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
                        placeholder="Enter your business email"
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

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MdPhone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                          errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#2A8B8A]'
                        }`}
                        placeholder="Enter your phone number"
                        autoComplete="tel"
                      />
                    </div>
                    {errors.phone && (
                      <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                        <MdError className="w-4 h-4" />
                        {errors.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Password */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Password *
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
                          placeholder="Create a strong password"
                          autoComplete="new-password"
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

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MdLock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                            errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#2A8B8A]'
                          }`}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <MdVisibilityOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <MdVisibility className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                          <MdError className="w-4 h-4" />
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li className="flex items-center gap-2">
                        <MdCheckCircle className={`w-4 h-4 ${formData.password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`} />
                        At least 8 characters long
                      </li>
                      <li className="flex items-center gap-2">
                        <MdCheckCircle className={`w-4 h-4 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`} />
                        Contains uppercase letter
                      </li>
                      <li className="flex items-center gap-2">
                        <MdCheckCircle className={`w-4 h-4 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`} />
                        Contains a number
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 3: Company Information */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Company Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MdBusiness className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 transition-all duration-200 text-gray-900 placeholder-gray-500 ${
                          errors.companyName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#2A8B8A]'
                        }`}
                        placeholder="Enter your company name"
                        autoComplete="organization"
                      />
                    </div>
                    {errors.companyName && (
                      <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                        <MdError className="w-4 h-4" />
                        {errors.companyName}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Size */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Company Size *
                      </label>
                      <select
                        name="companySize"
                        value={formData.companySize}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 transition-all duration-200 text-gray-900 ${
                          errors.companySize ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#2A8B8A]'
                        }`}
                      >
                        <option value="">Select company size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="500+">500+ employees</option>
                      </select>
                      {errors.companySize && (
                        <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                          <MdError className="w-4 h-4" />
                          {errors.companySize}
                        </div>
                      )}
                    </div>

                    {/* Industry */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Industry *
                      </label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2A8B8A]/20 transition-all duration-200 text-gray-900 ${
                          errors.industry ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-[#2A8B8A]'
                        }`}
                      >
                        <option value="">Select your industry</option>
                        <option value="ecommerce">E-commerce</option>
                        <option value="retail">Retail</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education</option>
                        <option value="finance">Finance</option>
                        <option value="real-estate">Real Estate</option>
                        <option value="consulting">Consulting</option>
                        <option value="technology">Technology</option>
                        <option value="marketing">Marketing & Advertising</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.industry && (
                        <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                          <MdError className="w-4 h-4" />
                          {errors.industry}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-1 w-5 h-5 text-[#2A8B8A] border-gray-300 rounded focus:ring-[#2A8B8A] focus:ring-2"
                    />
                    <label className="text-sm text-gray-700 leading-relaxed">
                      I agree to the{' '}
                      <Link href="/terms" className="text-[#2A8B8A] hover:text-[#238080] font-semibold">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-[#2A8B8A] hover:text-[#238080] font-semibold">
                        Privacy Policy
                      </Link>
                      . I also consent to receive important product updates and marketing communications.
                    </label>
                  </div>
                  {errors.agreeToTerms && (
                    <div className="flex items-center gap-2 text-red-500 text-sm">
                      <MdError className="w-4 h-4" />
                      {errors.agreeToTerms}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <MdArrowBack className="w-4 h-4" />
                    Previous
                  </button>
                )}
                
                <div className="flex-1"></div>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white rounded-xl font-semibold hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 flex items-center gap-2"
                  >
                    Next
                    <span className="text-lg">→</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white rounded-xl font-bold hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center gap-3"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {loadingStep || 'Creating your account...'}
                      </>
                    ) : (
                      <>
                        <MdPersonAdd className="w-5 h-5" />
                        Start My Free Trial
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Already have an account?</span>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center gap-2 text-[#2A8B8A] hover:text-[#238080] font-semibold transition-colors"
              >
                Sign in to your account
                <span className="text-lg">→</span>
              </Link>
            </div>
          </div>

          {/* Features Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MdCheckCircle className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">14-Day Free Trial</h4>
              <p className="text-sm text-gray-600">Full access to all features, no credit card required</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MdSecurity className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Enterprise Security</h4>
              <p className="text-sm text-gray-600">Bank-level encryption and data protection</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MdPersonAdd className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Expert Support</h4>
              <p className="text-sm text-gray-600">24/7 dedicated support to help you succeed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Component */}
      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={closeToast} 
      />
    </div>
  );
}
