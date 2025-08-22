"use client";
import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, 'info');
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

// Helper function to get user-friendly error messages
export const getErrorMessage = (error: any): string => {
  // Handle different error types
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.detail) {
    return error.detail;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  // Handle network errors
  if (error?.code === 'NETWORK_ERROR' || error?.name === 'NetworkError') {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  // Handle validation errors
  if (error?.status === 400) {
    return 'Please check your information and try again.';
  }
  
  if (error?.status === 401) {
    return 'Invalid credentials. Please check your email and password.';
  }
  
  if (error?.status === 403) {
    return 'Access denied. Please contact support if this persists.';
  }
  
  if (error?.status === 404) {
    return 'Resource not found. Please try again.';
  }
  
  if (error?.status === 409) {
    return 'An account with this email already exists. Please try signing in instead.';
  }
  
  if (error?.status === 422) {
    return 'Please check all required fields and try again.';
  }
  
  if (error?.status === 429) {
    return 'Too many requests. Please wait a moment before trying again.';
  }
  
  if (error?.status >= 500) {
    return 'Server error. Please try again in a few moments.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};
