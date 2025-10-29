'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SERVER_URL, buildApiUrl } from '@/config/server';

export default function MetaCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const processCallback = async () => {
      // Backend API URL - must be determined at runtime
      const apiUrl = SERVER_URL;
      console.log('🔧 Using API URL:', apiUrl);
      
      // Get OAuth parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      // Also check for Embedded Signup parameters in query string
      const wabaIdParam = searchParams.get('waba_id');
      const phoneNumberIdParam = searchParams.get('phone_number_id');
      const businessIdParam = searchParams.get('business_id');
      const setupParam = searchParams.get('setup');
      
      console.log('📋 Query params - waba_id:', wabaIdParam, 'phone_number_id:', phoneNumberIdParam, 'business_id:', businessIdParam);
      console.log('📋 Setup param:', setupParam);

      console.log('🔄 Meta OAuth callback received');
      console.log('Code:', code?.substring(0, 20) + '...');
      console.log('State:', state?.substring(0, 20) + '...');
      
      // Check URL hash for Embedded Signup data (Meta sends it here in redirect flow)
      const hash = window.location.hash;
      console.log('🔗 URL hash:', hash);
      
      if (hash) {
        try {
          // Parse hash parameters
          const hashParams = new URLSearchParams(hash.substring(1)); // Remove '#'
          const setupData = hashParams.get('setup');
          
          if (setupData) {
            console.log('📦 Found setup data in URL hash!');
            const parsedSetup = JSON.parse(decodeURIComponent(setupData));
            console.log('📦 Parsed setup data:', parsedSetup);
            
            // Store in sessionStorage
            if (parsedSetup.phone_number_id) {
              sessionStorage.setItem('phone_number_id', parsedSetup.phone_number_id);
            }
            if (parsedSetup.waba_id) {
              sessionStorage.setItem('waba_id', parsedSetup.waba_id);
            }
            if (parsedSetup.business_id) {
              sessionStorage.setItem('business_id', parsedSetup.business_id);
            }
          }
        } catch (e) {
          console.error('Error parsing hash data:', e);
        }
      }
      
      // Also check query parameters for WABA data
      if (wabaIdParam || phoneNumberIdParam || businessIdParam) {
        console.log('✅ Found WABA data in query parameters!');
        if (wabaIdParam) sessionStorage.setItem('waba_id', wabaIdParam);
        if (phoneNumberIdParam) sessionStorage.setItem('phone_number_id', phoneNumberIdParam);
        if (businessIdParam) sessionStorage.setItem('business_id', businessIdParam);
      }
      
      if (setupParam) {
        console.log('📦 Found setup parameter in query!');
        try {
          const parsedSetup = JSON.parse(decodeURIComponent(setupParam));
          console.log('📦 Parsed setup:', parsedSetup);
          
          if (parsedSetup.phone_number_id) sessionStorage.setItem('phone_number_id', parsedSetup.phone_number_id);
          if (parsedSetup.waba_id) sessionStorage.setItem('waba_id', parsedSetup.waba_id);
          if (parsedSetup.business_id) sessionStorage.setItem('business_id', parsedSetup.business_id);
        } catch (e) {
          console.error('Error parsing setup param:', e);
        }
      }

      if (error) {
        console.error('❌ OAuth error:', error, errorDescription);
        setStatus('Error: ' + (errorDescription || error));
        setTimeout(() => {
          router.push('/settings?error=' + encodeURIComponent(errorDescription || error));
        }, 2000);
        return;
      }

      if (!code || !state) {
        console.error('❌ Missing code or state');
        setStatus('Error: Invalid callback parameters');
        setTimeout(() => {
          router.push('/settings?error=invalid_callback');
        }, 2000);
        return;
      }

      // Retrieve WABA data from sessionStorage (set by message event listener)
      const wabaData = {
        waba_id: sessionStorage.getItem('waba_id'),
        phone_number_id: sessionStorage.getItem('phone_number_id'),
        business_id: sessionStorage.getItem('business_id')
      };

      console.log('📞 WABA data from sessionStorage:', wabaData);

      // If we have WABA data, use the exchange-code endpoint
      // Otherwise, use the traditional callback endpoint
      if (wabaData.waba_id || wabaData.phone_number_id) {
        console.log('✅ Using exchange-code endpoint with WABA data');
        setStatus('Setting up WhatsApp with captured data...');

        try {
          const response = await fetch(buildApiUrl('/api/auth/meta/exchange-code'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              code,
              state,
              waba_id: wabaData.waba_id,
              phone_number_id: wabaData.phone_number_id,
              business_id: wabaData.business_id
            })
          });

          const result = await response.json();
          console.log('Exchange result:', result);

          if (result.success) {
            // Clear sessionStorage
            sessionStorage.removeItem('waba_id');
            sessionStorage.removeItem('phone_number_id');
            sessionStorage.removeItem('business_id');
            sessionStorage.removeItem('embedded_signup_data');

            setStatus('Success! Redirecting...');
            setTimeout(() => {
              router.push('/settings?success=whatsapp_connected');
            }, 1000);
          } else {
            throw new Error(result.message || 'Failed to setup WhatsApp');
          }
        } catch (err) {
          console.error('Exchange error:', err);
          setStatus('Error: Failed to complete setup');
          setTimeout(() => {
            router.push('/settings?error=setup_failed');
          }, 2000);
        }
      } else {
        // No WABA data in sessionStorage, use traditional callback
        console.log('⚠️ No WABA data in sessionStorage, using traditional callback');
        setStatus('Completing setup via traditional flow...');
        
        // Redirect to backend callback which will handle API discovery
  const callbackUrl = buildApiUrl(`/api/auth/meta/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
  window.location.href = callbackUrl;
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Setting up WhatsApp
          </h2>
          <p className="text-gray-600">{status}</p>
        </div>
      </div>
    </div>
  );
}
