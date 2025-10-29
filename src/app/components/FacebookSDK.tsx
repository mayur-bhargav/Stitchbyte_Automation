'use client';

import { useEffect } from 'react';

export default function FacebookSDK() {
  useEffect(() => {
    // CRITICAL: Listen for Embedded Signup message events
    // This is where WABA data is sent!
    const handleMessage = (event: MessageEvent) => {
      console.log('📬 Message event from:', event.origin, 'Type:', typeof event.data);
      
      // Only accept messages from facebook.com
      if (!event.origin.includes('facebook.com')) {
        console.log('❌ Ignoring message from non-Facebook origin');
        return;
      }
      
      console.log('📨 Message event received from Facebook!');
      console.log('📨 Message data:', event.data);
      
      // Meta sends data as object, not JSON string
      let data;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch (e) {
        console.log('⚠️ Could not parse message data:', e);
        return;
      }
      
      console.log('📦 Parsed data:', data);
      console.log('📦 Data type:', data.type);
      
      if (data.type === 'WA_EMBEDDED_SIGNUP') {
        console.log('🎯 EMBEDDED SIGNUP MESSAGE EVENT:', data);
        
        // Store WABA data in sessionStorage for backend callback
        if (data.event === 'FINISH' || data.event === 'SETUP_COMPLETE') {
          console.log('✅ Embedded Signup completed!');
          console.log('📞 Phone Number ID:', data.data?.phone_number_id);
          console.log('📱 WABA ID:', data.data?.waba_id);
          console.log('🏢 Business ID:', data.data?.business_id);
          
          if (data.data) {
            sessionStorage.setItem('embedded_signup_data', JSON.stringify(data.data));
            sessionStorage.setItem('waba_id', data.data.waba_id || '');
            sessionStorage.setItem('phone_number_id', data.data.phone_number_id || '');
            sessionStorage.setItem('business_id', data.data.business_id || '');
          }
        } else if (data.event === 'CANCEL') {
          console.log('❌ User cancelled Embedded Signup');
          console.log('Cancelled at step:', data.data?.current_step);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    console.log('✅ Message event listener registered for Embedded Signup');
    
    // Cleanup
    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
    };
    
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      (window as any).FB.init({
        appId      : '1717883002200842',
        cookie     : true,
        xfbml      : true,
        version    : 'v24.0'
      });
      
      console.log('✅ Facebook SDK initialized');
    };

    // Load the SDK asynchronously
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    }(document, 'script', 'facebook-jssdk'));
    
    return cleanup;
  }, []);

  return null;
}

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: any) => void;
      login: (callback: (response: any) => void, params: any) => void;
      api: (path: string, callback: (response: any) => void) => void;
    };
  }
}
