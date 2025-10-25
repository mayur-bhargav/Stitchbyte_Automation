'use client';

import { useEffect } from 'react';
import { LuRefreshCw } from 'react-icons/lu';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            {/* Critical Error Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-12 border-2 border-red-200">
              {/* Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl">
                  <FaExclamationTriangle size={56} className="text-white" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-4 tracking-tight">
                Critical Error
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-center text-lg mb-8">
                A critical error occurred. Please try refreshing the page or contact support if the issue persists.
              </p>

              {/* Error Details */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                  <p className="text-sm font-semibold text-red-900 mb-2">Error Details:</p>
                  <p className="text-sm text-red-700 font-mono break-words">
                    {error.message || 'Unknown critical error'}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-600 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-center">
                <button
                  onClick={reset}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-2xl font-bold hover:from-red-700 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <LuRefreshCw size={20} />
                  Reload Application
                </button>
              </div>

              {/* Help Text */}
              <p className="text-center text-sm text-gray-500 mt-8">
                Error persists?{' '}
                <a href="mailto:support@yourdomain.com" className="text-red-600 font-semibold hover:underline">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
