"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook for managing dark/light theme toggle
 * Returns theme state and toggle function that can be used anywhere in the app
 */
export const useThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setIsHydrated(true);
    
    // Check current DOM state
    const htmlElement = document.documentElement;
    const currentlyDark = htmlElement.classList.contains('dark');
    
    // Update React state to match DOM
    setDarkMode(currentlyDark);
    
    // Also check localStorage and sync if needed
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' && !currentlyDark) {
      htmlElement.classList.add('dark');
      setDarkMode(true);
    } else if (savedTheme === 'light' && currentlyDark) {
      htmlElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, []);

  // Theme toggle function
  const toggleTheme = () => {
    const htmlElement = document.documentElement;
    const newDarkMode = !darkMode;
    
    // Update state immediately
    setDarkMode(newDarkMode);
    
    // Update DOM
    if (newDarkMode) {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Set specific theme
  const setTheme = (theme: 'light' | 'dark') => {
    const htmlElement = document.documentElement;
    
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    } else {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    }
  };

  // Get current theme as string
  const currentTheme = darkMode ? 'dark' : 'light';

  return {
    darkMode,
    isDarkMode: darkMode,
    isLightMode: !darkMode,
    currentTheme,
    isHydrated,
    toggleTheme,
    setTheme,
    setDarkMode: () => setTheme('dark'),
    setLightMode: () => setTheme('light')
  };
};

/**
 * Hook specifically for components that need to watch theme changes
 * Uses MutationObserver to detect DOM changes
 */
export const useThemeWatcher = () => {
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Initial check
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  return {
    darkMode,
    isDarkMode: darkMode,
    isLightMode: !darkMode,
    currentTheme: darkMode ? 'dark' : 'light'
  };
};

/**
 * Utility function to get theme-aware colors
 * Usage: getThemeColors(darkMode).background
 */
export const getThemeColors = (darkMode: boolean) => ({
  // Background colors
  background: darkMode ? '#0f172a' : '#ffffff',
  backgroundSecondary: darkMode ? '#1e293b' : '#f8fafc',
  backgroundTertiary: darkMode ? '#334155' : '#f1f5f9',
  
  // Text colors
  text: darkMode ? '#f1f5f9' : '#1e293b',
  textSecondary: darkMode ? '#cbd5e1' : '#475569',
  textMuted: darkMode ? '#94a3b8' : '#64748b',
  
  // Border colors
  border: darkMode ? '#475569' : '#e2e8f0',
  borderLight: darkMode ? '#374151' : '#f1f5f9',
  
  // Interactive colors
  hover: darkMode ? '#334155' : '#f1f5f9',
  active: '#2A8B8A', // Brand color stays same
  
  // Status colors
  success: darkMode ? '#10b981' : '#059669',
  error: darkMode ? '#ef4444' : '#dc2626',
  warning: darkMode ? '#f59e0b' : '#d97706',
  info: darkMode ? '#3b82f6' : '#2563eb'
});

export default useThemeToggle;
