"use client";

import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface ConnectionStatusProps {
  className?: string;
}

export default function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const healthy = await apiService.checkBackendHealth();
      setIsConnected(healthy);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null && !checking) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          checking 
            ? 'bg-yellow-500 animate-pulse' 
            : isConnected 
              ? 'bg-green-500' 
              : 'bg-red-500'
        }`}
      />
      <span className={`text-xs ${
        checking 
          ? 'text-yellow-600' 
          : isConnected 
            ? 'text-green-600' 
            : 'text-red-600'
      }`}>
        {checking 
          ? 'Checking...' 
          : isConnected 
            ? 'Connected' 
            : 'Backend Disconnected'
        }
      </span>
      {!isConnected && !checking && (
        <button 
          onClick={checkConnection}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
