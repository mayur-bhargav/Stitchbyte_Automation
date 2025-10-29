"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuInstagram, LuCircleCheck, LuCircleX, LuLoader } from "react-icons/lu";

const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

export default function InstagramCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your Instagram connection...');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    const processCallback = async () => {
      try {
        addDetail('Received callback from Instagram');
        
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          addDetail(`Error: ${error}`);
          addDetail(`Description: ${errorDescription}`);
          setStatus('error');
          setMessage(errorDescription || 'Instagram connection failed');
          return;
        }
        
        const success = searchParams.get('success');
        const username = searchParams.get('username');
        const accountId = searchParams.get('account_id');
        
        if (success === 'true' && accountId) {
          addDetail('Successfully connected Instagram account');
          addDetail(`Account: @${username}`);
          addDetail(`Account ID: ${accountId}`);
          
          setStatus('success');
          setMessage(`Instagram account @${username} connected successfully!`);
          
          addDetail('Redirecting to Instagram settings...');
          
          setTimeout(() => {
            router.push('/instagram/settings');
          }, 2000);
        } else {
          addDetail('No success confirmation received');
          setStatus('error');
          setMessage('Failed to complete Instagram connection');
        }
        
      } catch (error: any) {
        console.error('Callback processing error:', error);
        addDetail(`Exception: ${error.message}`);
        setStatus('error');
        setMessage('An error occurred while processing your connection');
      }
    };

    processCallback();
  }, [searchParams, router]);

  const addDetail = (detail: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDetails(prev => [...prev, `[${timestamp}] ${detail}`]);
    debugLog(detail);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A8B8A] to-[#1a5f5e] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-[#2A8B8A] rounded-2xl flex items-center justify-center">
            <LuInstagram className="text-white" size={48} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-black mb-4">
          {status === 'loading' && 'Connecting Instagram...'}
          {status === 'success' && 'Connection Successful! 🎉'}
          {status === 'error' && 'Connection Failed'}
        </h1>

        <p className="text-center text-slate-600 mb-8 text-lg">
          {message}
        </p>

        <div className="flex justify-center mb-8">
          {status === 'loading' && (
            <LuLoader className="text-[#2A8B8A] animate-spin" size={64} />
          )}
          {status === 'success' && (
            <LuCircleCheck className="text-green-500" size={64} />
          )}
          {status === 'error' && (
            <LuCircleX className="text-red-500" size={64} />
          )}
        </div>

        {details.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Connection Log:</h3>
            <div className="space-y-1">
              {details.map((detail, index) => (
                <p
                  key={index}
                  className={`text-xs font-mono ${
                    detail.includes('Successfully')
                      ? 'text-green-600 font-semibold'
                      : detail.includes('Error')
                      ? 'text-red-600 font-semibold'
                      : 'text-slate-600'
                  }`}
                >
                  {detail}
                </p>
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => router.push('/instagram/settings')}
              className="flex-1 px-6 py-3 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-all font-semibold"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/instagram')}
              className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all font-semibold"
            >
              Back to Hub
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-8">
            <button
              onClick={() => router.push('/instagram/settings')}
              className="w-full px-6 py-3 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-all font-semibold"
            >
              Go to Instagram Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
