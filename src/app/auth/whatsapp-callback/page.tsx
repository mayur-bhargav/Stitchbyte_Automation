'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LuLoader, LuPhone } from 'react-icons/lu';
import { HiCheckCircle, HiExclamationTriangle } from 'react-icons/hi2';

export default function WhatsAppCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'no_waba' | 'error'>('processing');
  const [message, setMessage] = useState('Processing your WhatsApp connection...');

  useEffect(() => {
    const metaConnected = searchParams.get('meta_connected');
    const wabaCount = searchParams.get('waba_count');
    const setupRequired = searchParams.get('setup_required');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(getErrorMessage(error));
      return;
    }

    if (metaConnected === 'true') {
      const count = parseInt(wabaCount || '0');
      
      if (count > 0) {
        // Successfully connected with WABA
        setStatus('success');
        setMessage(`Successfully connected ${count} WhatsApp Business Account${count > 1 ? 's' : ''}!`);
        
        // Redirect to settings after 2 seconds
        setTimeout(() => {
          router.push('/settings?connection_success=true');
        }, 2000);
      } else if (setupRequired === 'true') {
        // Connected to Meta but no WABA found
        setStatus('no_waba');
        setMessage('Connected to Meta, but no WhatsApp Business Account found.');
      } else {
        // Unknown state
        setStatus('error');
        setMessage('Connection completed but status is unclear.');
      }
    } else {
      // No connection info
      setStatus('error');
      setMessage('No connection information received.');
    }
  }, [searchParams, router]);

  const getErrorMessage = (errorCode: string) => {
    const errorMessages: Record<string, string> = {
      'access_denied': 'You denied access to your Meta account.',
      'missing_parameters': 'Invalid callback - missing required parameters.',
      'invalid_csrf': 'Security validation failed. Please try again.',
      'invalid_state': 'Invalid state parameter. Please try again.',
      'token_exchange_failed': 'Failed to exchange authorization code.',
      'no_access_token': 'Failed to obtain access token from Meta.',
      'processing_failed': 'Failed to process Meta authentication.',
      'callback_failed': 'An error occurred during the callback process.',
    };
    return errorMessages[errorCode] || 'An unknown error occurred.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {status === 'processing' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <LuLoader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Processing Connection</h2>
            <p className="text-slate-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <HiCheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Connection Successful!</h2>
            <p className="text-slate-600 mb-4">{message}</p>
            <p className="text-sm text-slate-500">Redirecting to settings...</p>
          </div>
        )}

        {status === 'no_waba' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <LuPhone className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Setup Required</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-slate-800 mb-3">Next Steps:</h3>
              <ol className="space-y-2 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">1.</span>
                  <span>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Meta Business Suite</a></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">2.</span>
                  <span>Navigate to <strong>WhatsApp Accounts</strong> in the left menu</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">3.</span>
                  <span>Click <strong>Add WhatsApp Account</strong> or <strong>Create Business Account</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">4.</span>
                  <span>Follow the prompts to verify your business and phone number</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">5.</span>
                  <span>Once verified, return here and click <strong>Reconnect</strong> in Settings</span>
                </li>
              </ol>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="https://business.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Open Meta Business Suite
              </a>
              <button
                onClick={() => router.push('/settings')}
                className="w-full px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition"
              >
                Go to Settings
              </button>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600">
                <strong>Note:</strong> You'll need a verified business phone number to use WhatsApp Business API. 
                The verification process may take a few minutes to complete.
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <HiExclamationTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Connection Failed</h2>
            <p className="text-slate-600 mb-6">{message}</p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/settings')}
                className="w-full px-6 py-3 bg-[#2A8B8A] text-white font-semibold rounded-lg hover:bg-[#238080] transition"
              >
                Back to Settings
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
