"use client";
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  // This layout is specifically for auth pages and should not include
  // any authentication redirects or protected route logic
  return (
    <div className="auth-layout">
      {children}
    </div>
  );
}
