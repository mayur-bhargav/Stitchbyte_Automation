"use client";

import React, { ReactNode } from 'react';
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../contexts/PermissionContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  fallbackPath?: string; // Where to redirect if access denied
  showFallback?: boolean; // If true, show fallback UI instead of redirecting
}

const UnauthorizedFallback: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={onGoBack}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Go Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallbackPath = '/dashboard',
  showFallback = true
}) => {
  const { user, isAuthenticated, isLoading: userLoading } = useUser();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading: permissionsLoading } = usePermissions();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for both user and permissions to load
    if (!userLoading && !permissionsLoading) {
      setIsChecking(false);
    }
  }, [userLoading, permissionsLoading]);

  // Show loading while checking authentication and permissions
  if (isChecking || userLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login (this should be handled by other guards, but just in case)
  if (!isAuthenticated || !user) {
    router.push('/auth/signin');
    return null;
  }

  // Main account users (non-team members) have access to everything
  if (!user.isTeamMember) {
    return <>{children}</>;
  }

  // Check permissions for team members
  let hasAccess = true;

  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(requiredPermissions);
    } else {
      hasAccess = hasAnyPermission(requiredPermissions);
    }
  }

  // If no access, handle based on showFallback setting
  if (!hasAccess) {
    if (showFallback) {
      return <UnauthorizedFallback onGoBack={() => router.push(fallbackPath)} />;
    } else {
      router.push(fallbackPath);
      return null;
    }
  }

  // User has access, render the protected content
  return <>{children}</>;
};

// Higher-order component version for easier use
export const withPermissionGuard = (
  Component: React.ComponentType<any>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) => {
  return function ProtectedComponent(props: any) {
    return (
      <PermissionGuard {...guardProps}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
};

export default PermissionGuard;