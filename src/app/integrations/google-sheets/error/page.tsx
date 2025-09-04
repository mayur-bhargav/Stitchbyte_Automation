"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleSheetsErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    setError(decodeURIComponent(errorParam || 'Unknown error occurred'));

    // Auto-close the popup window after a longer delay for errors
    const timer = setTimeout(() => {
      if (window.opener) {
        // This is a popup window, close it
        window.close();
      } else {
        // This is not a popup, redirect to integrations
        router.push('/integrations-marketplace');
      }
    }, 8000); // Longer delay for errors so user can read

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  const getErrorMessage = (error: string) => {
    if (error.includes('offset-naive and offset-aware datetimes')) {
      return {
        title: 'Timezone Configuration Error',
        message: 'There was a technical issue with date handling. Our team has been notified.',
        technical: 'Backend timezone configuration needs to be updated.'
      };
    }
    
    if (error.includes('access_denied')) {
      return {
        title: 'Permission Denied',
        message: 'You denied access to Google Sheets. Please try again and grant the necessary permissions.',
        technical: 'User denied OAuth permissions.'
      };
    }

    if (error.includes('invalid_grant')) {
      return {
        title: 'Invalid Authorization',
        message: 'The authorization code was invalid or expired. Please try connecting again.',
        technical: 'OAuth grant validation failed.'
      };
    }

    return {
      title: 'Connection Failed',
      message: 'Unable to connect to Google Sheets. Please try again later.',
      technical: error
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {errorInfo.title}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {errorInfo.message}
            </p>

            {/* Error Details */}
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-xs text-red-800 font-mono break-all">
                {errorInfo.technical}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  if (window.opener) {
                    window.close();
                  } else {
                    router.push('/integrations-marketplace');
                  }
                }}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Close & Return to Integrations
              </button>

              <button
                onClick={() => {
                  // Try to trigger the connection flow again
                  if (window.opener) {
                    window.opener.postMessage({ action: 'retry-connection' }, '*');
                    window.close();
                  } else {
                    router.push('/integrations-marketplace');
                  }
                }}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              This window will close automatically in 8 seconds...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
