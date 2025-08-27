// Test script to debug message sending issues
// Run this in your browser console or as a Node.js script

async function testMessageSending() {
  const phone = "918619365849"; // Replace with your test phone number
  const message = "Test message from debug script";
  const token = localStorage.getItem('token'); // Get the auth token
  
  console.log('Testing message sending...');
  console.log('Phone:', phone);
  console.log('Message:', message);
  console.log('Token available:', !!token);
  
  try {
    const response = await fetch("http://localhost:8000/chat/send-text", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        phone: phone,
        message: message
      }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success! Message sent:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ Failed! Error response:', errorText);
      
      // Try to parse as JSON for better error details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Error details:', errorJson);
      } catch (e) {
        console.error('Raw error text:', errorText);
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Test if backend is reachable
async function testBackendConnection() {
  console.log('Testing backend connection...');
  
  try {
    const response = await fetch("http://localhost:8000/");
    console.log('Backend status:', response.status);
    
    if (response.ok) {
      console.log('✅ Backend is reachable');
    } else {
      console.log('❌ Backend returned error:', response.status);
    }
  } catch (error) {
    console.error('❌ Cannot reach backend:', error);
  }
}

// Run the tests
console.log('=== WhatsApp Message Sending Debug ===');
testBackendConnection();
testMessageSending();
