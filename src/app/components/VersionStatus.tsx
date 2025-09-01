"use client";

import { useState, useEffect } from 'react';
import { MdWarning, MdCheckCircle, MdError, MdInfo } from 'react-icons/md';
import BACKEND_CONFIG, { VersionUtils } from '../config/backend';

interface VersionStatusProps {
  currentVersion?: string;
  showDetails?: boolean;
  className?: string;
}

export const VersionStatus: React.FC<VersionStatusProps> = ({ 
  currentVersion, 
  showDetails = false,
  className = ""
}) => {
  const [version, setVersion] = useState<string>(currentVersion || '');
  const [status, setStatus] = useState<'checking' | 'compatible' | 'warning' | 'error'>('checking');
  const [message, setMessage] = useState<string>('Checking version...');

  useEffect(() => {
    if (currentVersion) {
      checkVersionCompatibility(currentVersion);
    } else {
      fetchVersionFromBackend();
    }
  }, [currentVersion]);

  const fetchVersionFromBackend = async () => {
    try {
      const response = await fetch(`${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.HEALTH}`);
      if (response.ok) {
        const data = await response.json();
        const backendVersion = data.version || 'unknown';
        setVersion(backendVersion);
        checkVersionCompatibility(backendVersion);
      } else {
        throw new Error('Failed to fetch version');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Unable to check backend version');
      setVersion('unknown');
    }
  };

  const checkVersionCompatibility = (backendVersion: string) => {
    if (!backendVersion || backendVersion === 'unknown') {
      setStatus('error');
      setMessage('Backend version unavailable');
      return;
    }

    const isCompatible = VersionUtils.isCompatible(backendVersion);
    const isExpected = VersionUtils.isExpectedVersion(backendVersion);

    if (!isCompatible) {
      setStatus('error');
      setMessage(`Incompatible backend version. Minimum required: ${BACKEND_CONFIG.MIN_SUPPORTED_VERSION}`);
    } else if (!isExpected && BACKEND_CONFIG.VERSION_CHECK.WARN_ON_MISMATCH) {
      setStatus('warning');
      setMessage(`Backend version mismatch. Expected: ${BACKEND_CONFIG.EXPECTED_VERSION}, Current: ${backendVersion}`);
    } else {
      setStatus('compatible');
      setMessage(`Backend version ${backendVersion} is compatible`);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'compatible':
        return <MdCheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <MdWarning className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <MdError className="w-5 h-5 text-red-500" />;
      default:
        return <MdInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'compatible':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  if (!showDetails && status === 'compatible') {
    return null; // Don't show anything if everything is fine and details not requested
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <div className="flex-1">
        <div className="text-sm font-medium">{message}</div>
        {showDetails && (
          <div className="text-xs mt-1 space-y-1">
            <div>Current: {version}</div>
            <div>Expected: {BACKEND_CONFIG.EXPECTED_VERSION}</div>
            <div>Minimum: {BACKEND_CONFIG.MIN_SUPPORTED_VERSION}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for version checking
export const useVersionCompatibility = () => {
  const [version, setVersion] = useState<string>('');
  const [isCompatible, setIsCompatible] = useState<boolean>(true);
  const [isExpected, setIsExpected] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.HEALTH}`);
        if (response.ok) {
          const data = await response.json();
          const backendVersion = data.version || 'unknown';
          
          setVersion(backendVersion);
          setIsCompatible(VersionUtils.isCompatible(backendVersion));
          setIsExpected(VersionUtils.isExpectedVersion(backendVersion));
        }
      } catch (error) {
        console.warn('Version check failed:', error);
        setIsCompatible(false);
        setIsExpected(false);
      } finally {
        setLoading(false);
      }
    };

    checkVersion();
  }, []);

  return {
    version,
    isCompatible,
    isExpected,
    loading,
    expectedVersion: BACKEND_CONFIG.EXPECTED_VERSION,
    minVersion: BACKEND_CONFIG.MIN_SUPPORTED_VERSION
  };
};

export default VersionStatus;
