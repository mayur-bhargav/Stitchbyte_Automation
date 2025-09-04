"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleSheetsSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('spreadsheet_id');
    setSpreadsheetId(id);

    // Auto-close the popup window after a delay
    const timer = setTimeout(() => {
      if (window.opener) {
        // This is a popup window, close it
        window.close();
      } else {
        // This is not a popup, redirect to integrations
        router.push('/integrations-marketplace');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Google Sheets Connected Successfully!
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Your Google Sheets integration has been set up successfully.
            </p>

            {spreadsheetId && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <p className="text-sm text-blue-800">
                  A new spreadsheet has been created for your contacts.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Spreadsheet ID: {spreadsheetId.substring(0, 20)}...
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              This window will close automatically in a few seconds...
            </div>

            {/* Manual close button for fallback */}
            <button
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  router.push('/integrations-marketplace');
                }
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Continue to Integrations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
