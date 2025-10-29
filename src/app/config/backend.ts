import { SERVER_URL } from '@/config/server';

// Configuration constants for backend integration
export const BACKEND_CONFIG = {
  // Expected backend version for compatibility checks
  EXPECTED_VERSION: '2.5.2',
  
  // Previous version for migration/compatibility notes
  PREVIOUS_VERSION: '2.0.0',
  
  // API base URL
  BASE_URL: SERVER_URL,
  
  // Version compatibility settings
  VERSION_CHECK: {
    ENABLED: true,
    WARN_ON_MISMATCH: true,
    STRICT_MODE: false // Set to true to block on version mismatch
  },
  
  // Minimum supported backend version
  MIN_SUPPORTED_VERSION: '2.0.0',
  
  // API endpoints for version checking
  ENDPOINTS: {
    HEALTH: '/health',
    VERSION: '/version'
  }
} as const;

// Helper function to get the API base URL
export const getApiBaseUrl = (): string => {
  return BACKEND_CONFIG.BASE_URL;
};

// Version comparison utilities
export const VersionUtils = {
  // Parse semantic version string (e.g., "2.5.2" -> [2, 5, 2])
  parseVersion: (version: string): number[] => {
    return version.split('.').map(v => parseInt(v, 10));
  },
  
  // Compare two version strings
  // Returns: -1 (v1 < v2), 0 (v1 === v2), 1 (v1 > v2)
  compareVersions: (v1: string, v2: string): number => {
    const version1 = VersionUtils.parseVersion(v1);
    const version2 = VersionUtils.parseVersion(v2);
    
    for (let i = 0; i < Math.max(version1.length, version2.length); i++) {
      const num1 = version1[i] || 0;
      const num2 = version2[i] || 0;
      
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }
    
    return 0;
  },
  
  // Check if backend version is compatible
  isCompatible: (backendVersion: string): boolean => {
    const comparison = VersionUtils.compareVersions(
      backendVersion, 
      BACKEND_CONFIG.MIN_SUPPORTED_VERSION
    );
    return comparison >= 0; // Backend version >= minimum supported
  },
  
  // Check if backend version matches expected version
  isExpectedVersion: (backendVersion: string): boolean => {
    return VersionUtils.compareVersions(
      backendVersion, 
      BACKEND_CONFIG.EXPECTED_VERSION
    ) === 0;
  }
};

export default BACKEND_CONFIG;
