"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "../contexts/UserContext";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

// Routes that don't require subscription
const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/select-plan',
  '/landing',
  '/about',
  '/blog',
  '/careers',
  '/help',
  '/api-docs',
  '/integrations',
  '/status',
  '/security',
  '/privacy',
  '/terms'
];

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { user, isLoading, isAuthenticated, hasValidSubscription, needsPlanSelection } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isLoading) return;

    // If not authenticated, redirect to signin (unless on public routes)
    if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
      router.push('/auth/signin');
      return;
    }

    // If authenticated but needs plan selection and not already on plan selection page
    if (needsPlanSelection && pathname !== '/select-plan') {
      router.push('/select-plan');
      return;
    }

    // Allow users to visit select-plan page anytime (for upgrades, plan changes, etc.)
    // Do NOT redirect users away from select-plan if they have a valid subscription
    // This allows them to upgrade, change billing cycles, or modify their plan
  }, [isClient, isLoading, isAuthenticated, hasValidSubscription, needsPlanSelection, pathname, router]);

  // Always render children immediately for public routes to prevent hydration mismatch
  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  // Wait for client-side hydration before showing loading/content for protected routes
  if (!isClient) {
    return <>{children}</>;
  }

  // Show loading spinner while checking auth/subscription for protected routes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A8B8A]"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show plan selection if user needs to select a plan
  if (needsPlanSelection && pathname !== '/select-plan') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A8B8A]"></div>
          <p className="text-gray-600">Redirecting to plan selection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
