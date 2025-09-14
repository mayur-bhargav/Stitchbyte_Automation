"use client";

import { useChatContext } from '../contexts/ChatContext';
import { useRealTimeChat } from '../hooks/useRealTimeChat';

export default function ChatSystemTest() {
  const { unreadCounts, totalUnreadCount, addNewMessage, markAsRead } = useChatContext();
  
  // Start real-time monitoring
  useRealTimeChat({
    enabled: true,
    pollingInterval: 5000,
    onNewMessage: (contact) => {
      // console.log('New message received from:', contact.phone);
    }
  });

  const simulateIncomingMessage = () => {
    const testMessage = {
      id: `test-${Date.now()}`,
      phone: '918619365849',
      direction: 'incoming' as const,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    addNewMessage(testMessage);
    // console.log('Simulated incoming message:', testMessage);
  };

  const simulateOutgoingMessage = () => {
    const testMessage = {
      id: `test-${Date.now()}`,
      phone: '918619365849',
      direction: 'outgoing' as const,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    addNewMessage(testMessage);
    // console.log('Simulated outgoing message (should not increase count):', testMessage);
  };

  const markTestAsRead = () => {
    markAsRead('918619365849');
    // console.log('Marked 918619365849 as read');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Chat System Test</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold">Current Status:</h3>
        <p>Total Unread Count: <span className="font-bold text-blue-600">{totalUnreadCount}</span></p>
        <p>Unread by Phone:</p>
        <div className="ml-4">
          {Object.entries(unreadCounts).map(([phone, count]) => (
            <div key={phone}>
              {phone}: {count} unread
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={simulateIncomingMessage}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
        >
          Simulate Incoming Message (should increase count + play sound)
        </button>
        
        <button
          onClick={simulateOutgoingMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
        >
          Simulate Outgoing Message (should NOT increase count)
        </button>
        
        <button
          onClick={markTestAsRead}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Mark Test Phone as Read
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>• Incoming messages should increase the count and play a notification sound</p>
        <p>• Outgoing messages should NOT affect the count</p>
        <p>• Audio should have a 2-second cooldown between plays</p>
        <p>• Count should show 99+ when above 99</p>
      </div>
    </div>
  );
}
