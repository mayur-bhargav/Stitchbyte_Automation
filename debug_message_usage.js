// Debug script to test message-usage endpoint
const BACKEND_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
};

async function testMessageUsageEndpoint() {
  try {
    console.log('Testing message-usage endpoint...');
    console.log('Backend URL:', BACKEND_CONFIG.BASE_URL);
    
    // Test without auth first
    const response = await fetch(`${BACKEND_CONFIG.BASE_URL}/message-usage`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
    // Test with potential auth header (if stored in localStorage)
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      console.log('\nTesting with auth token...');
      const authResponse = await fetch(`${BACKEND_CONFIG.BASE_URL}/message-usage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Auth response status:', authResponse.status);
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('Auth response data:', JSON.stringify(authData, null, 2));
      } else {
        const authErrorText = await authResponse.text();
        console.log('Auth error response:', authErrorText);
      }
    }
    
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

// Test alternative endpoints that might provide message data
async function testAlternativeEndpoints() {
  const endpoints = [
    '/analytics',
    '/analytics/dashboard', 
    '/logs',
    '/messages',
    '/messages/stats',
    '/dashboard',
    '/dashboard/stats',
    '/stats',
    '/usage',
    '/whatsapp/usage'
  ];
  
  console.log('\nTesting alternative endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BACKEND_CONFIG.BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('token') ? {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          } : {})
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint}:`, Object.keys(data));
        
        // Check if this endpoint has message data
        if (JSON.stringify(data).includes('message')) {
          console.log(`   Message-related data found in ${endpoint}:`, JSON.stringify(data, null, 2));
        }
      } else {
        console.log(`❌ ${endpoint}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// Run the tests
testMessageUsageEndpoint();
testAlternativeEndpoints();
