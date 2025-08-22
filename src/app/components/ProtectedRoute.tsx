"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user' | 'viewer';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useUser();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && isMounted) {
      if (!isAuthenticated) {
        // Redirect to signin if not authenticated
        router.push('/auth/signin');
        return;
      }

      if (requiredRole && user && user.role !== requiredRole) {
        // Check role hierarchy: admin > user > viewer
        const roleHierarchy = { admin: 3, user: 2, viewer: 1 };
        const userRoleLevel = roleHierarchy[user.role];
        const requiredRoleLevel = roleHierarchy[requiredRole];

        if (userRoleLevel < requiredRoleLevel) {
          // Redirect to unauthorized page or dashboard
          router.push('/dashboard?error=unauthorized');
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router, isMounted]);

  // Show loading spinner while checking authentication or during hydration
  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-black mb-2">Loading...</h2>
          <p className="text-gray-600">Verifying your session</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Show unauthorized message if role check fails
  if (requiredRole && user && user.role !== requiredRole) {
    const roleHierarchy = { admin: 3, user: 2, viewer: 1 };
    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-black mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don&apos;t have the required permissions to access this page. 
              This page requires <span className="font-semibold text-red-600">{requiredRole}</span> access, 
              but you have <span className="font-semibold text-blue-600">{user.role}</span> access.
            </p>
            <button
              onClick={() => router.back()}
              className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center mb-4 mx-auto">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-black mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing your dashboard</p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
}
