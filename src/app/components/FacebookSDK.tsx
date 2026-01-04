'use client';

import { useEffect } from 'react';

export default function FacebookSDK() {
  useEffect(() => {
    // CRITICAL: Listen for Embedded Signup message events
    // This is where WABA data is sent! Following Meta's exact documentation
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Facebook domains
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
        return;
      }
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          console.log('🎯 EMBEDDED SIGNUP EVENT:', data.event);
          
          // if user finishes the Embedded Signup flow
          if (data.event === 'FINISH') {
            const { phone_number_id, waba_id } = data.data;
            console.log('✅ Embedded Signup completed!');
            console.log('📞 Phone Number ID:', phone_number_id);
            console.log('📱 WABA ID:', waba_id);
            
            // Store in sessionStorage for the FB.login callback to use
            if (phone_number_id) sessionStorage.setItem('phone_number_id', phone_number_id);
            if (waba_id) sessionStorage.setItem('waba_id', waba_id);
            sessionStorage.setItem('embedded_signup_data', JSON.stringify(data.data));
            
          // if user cancels the Embedded Signup flow
          } else if (data.event === 'CANCEL') {
            const { current_step } = data.data;
            console.warn('❌ User cancelled at step:', current_step);
            sessionStorage.setItem('embedded_signup_cancelled', current_step);
            
          // if user reports an error during the Embedded Signup flow
          } else if (data.event === 'ERROR') {
            const { error_message } = data.data;
            console.error('🚨 Embedded Signup error:', error_message);
            sessionStorage.setItem('embedded_signup_error', error_message);
          }
        }
        
        // Log session info for debugging
        console.log('📦 Session info response:', JSON.stringify(data, null, 2));
        
      } catch {
        // Non-JSON responses are expected sometimes
        console.log('📝 Non-JSON response from Facebook:', event.data);
      }
    };
    
    window.addEventListener('message', handleMessage);
    console.log('✅ Message event listener registered for Embedded Signup');
    
    // Load Facebook SDK - Following Meta's exact documentation
    window.fbAsyncInit = function() {
      (window as any).FB.init({
        appId            : '1717883002200842',
        autoLogAppEvents : true,
        xfbml            : true,
        version          : 'v24.0'
      });
      
      console.log('✅ Facebook SDK initialized (v24.0)');
    };

    // Load the SDK asynchronously with crossorigin attribute
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.crossOrigin = "anonymous";
      js.async = true;
      js.defer = true;
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    }(document, 'script', 'facebook-jssdk'));
    
    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
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
