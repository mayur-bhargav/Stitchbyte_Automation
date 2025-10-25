"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function RateLimitError() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F6FF] via-white to-[#E8F5F5] flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200 shadow-2xl p-8 md:p-12 text-center max-w-lg mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
          <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1-1.964-1-2.732 0L4.082 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Too Many Requests
        </h1>

        {/* Message */}
        <p className="text-gray-600 text-lg mb-6 leading-relaxed">
          Your IP has been temporarily blocked due to too many requests. This is a security measure to protect our servers.
        </p>

        {/* Details */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8 text-left">
          <h3 className="font-semibold text-orange-900 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            What happened?
          </h3>
          <p className="text-orange-800 text-sm">
            Our rate limiting system detected too many requests from your IP address within a short time period.
          </p>
        </div>

        {/* Wait time */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <p className="text-blue-900 font-medium mb-1">⏱️ Please wait</p>
          <p className="text-blue-700 text-sm">
            The block will be automatically lifted in <strong>5 minutes</strong>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-[#2A8B8A] hover:text-[#2A8B8A] transition-all duration-200"
          >
            Go to Homepage
          </button>
        </div>

        {/* Help text */}
        <p className="text-gray-500 text-sm mt-8">
          If this problem persists, please contact our{' '}
          <a href="mailto:support@stitchbyte.in" className="text-[#2A8B8A] hover:underline font-medium">
            support team
          </a>
        </p>
      </div>
    </div>
  );
}
