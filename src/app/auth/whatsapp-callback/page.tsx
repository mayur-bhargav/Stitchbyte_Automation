"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '../../services/apiService';
import { LuCircleCheck, LuCircleX, LuLoaderCircle } from 'react-icons/lu';

export default function WhatsAppCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing WhatsApp connection...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || `WhatsApp connection failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from WhatsApp.');
          return;
        }

        // Send the authorization code to your backend
        const response: any = await apiService.connectMetaAccount(code, searchParams.get('state') || '');

        if (response?.success) {
          setStatus('success');
          setMessage('WhatsApp Business Account connected successfully!');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(response?.message || 'Failed to connect WhatsApp Business Account.');
        }
      } catch (error: any) {
        console.error('WhatsApp callback error:', error);
        setStatus('error');
        setMessage(error?.message || 'An unexpected error occurred while connecting WhatsApp.');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            WhatsApp Business Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {status === 'loading' && 'Connecting your account...'}
            {status === 'success' && 'Connection successful!'}
            {status === 'error' && 'Connection failed'}
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex flex-col items-center space-y-4">
            {status === 'loading' && (
              <LuLoaderCircle className="w-16 h-16 text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <LuCircleCheck className="w-16 h-16 text-green-500" />
            )}
            {status === 'error' && (
              <LuCircleX className="w-16 h-16 text-red-500" />
            )}

            <p className="text-center text-gray-700">{message}</p>

            {status === 'success' && (
              <p className="text-sm text-gray-500 text-center">
                Redirecting to dashboard...
              </p>
            )}

            {status === 'error' && (
              <div className="space-y-3 w-full">
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Debug information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-4 rounded-lg text-xs">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <p><strong>Code:</strong> {searchParams.get('code')?.substring(0, 20)}...</p>
            <p><strong>Error:</strong> {searchParams.get('error') || 'None'}</p>
            <p><strong>Status:</strong> {status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
