'use client';

import { useEffect } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-12 border border-gray-200">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center shadow-xl animate-pulse">
              <FaExclamationTriangle size={56} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-4 tracking-tight">
            Oops! Something Went Wrong
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-center text-lg mb-8">
            We encountered an unexpected error. Don't worry, our team has been notified and we're working on it.
          </p>

          {/* Error Details (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
              <p className="text-sm font-semibold text-red-900 mb-2">Error Details:</p>
              <p className="text-sm text-red-700 font-mono break-words">
                {error.message || 'Unknown error occurred'}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl font-bold hover:from-gray-800 hover:to-gray-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <LuRefreshCw size={20} />
              Try Again
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-900 text-gray-900 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FaHome size={20} />
              Go Home
            </button>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-gray-500 mt-8">
            If this problem persists, please{' '}
            <a href="mailto:support@yourdomain.com" className="text-gray-900 font-semibold hover:underline">
              contact support
            </a>
          </p>
        </div>

        {/* Tips */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4 font-medium">Quick Tips:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl text-xs text-gray-700 border border-gray-200">
              🔄 Refresh the page
            </span>
            <span className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl text-xs text-gray-700 border border-gray-200">
              🧹 Clear browser cache
            </span>
            <span className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl text-xs text-gray-700 border border-gray-200">
              📡 Check your connection
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
