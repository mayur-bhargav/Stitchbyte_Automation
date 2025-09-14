// Test component for chat functionality - can be removed later
"use client";
import { useChatContext } from '../contexts/ChatContext';

export const ChatTestComponent = () => {
  const { totalUnreadCount, unreadCounts, incrementCount, markAsRead, addNewMessage } = useChatContext();

  const testAddIncomingMessage = () => {
    // Simulate a new incoming message
    addNewMessage({
      id: `test-incoming-${Date.now()}`,
      phone: '+1234567890',
      direction: 'incoming',
      timestamp: new Date().toISOString(),
      read: false
    });
  };

  const testAddOutgoingMessage = () => {
    // Simulate a new outgoing message (should NOT increment count)
    addNewMessage({
      id: `test-outgoing-${Date.now()}`,
      phone: '+1234567890',
      direction: 'outgoing',
      timestamp: new Date().toISOString(),
      read: false
    });
  };

  const testMarkAsRead = () => {
    // Mark all messages as read for the test phone number
    markAsRead('+1234567890');
  };

  const testNotificationSound = () => {
    // Test the notification sound
    try {
      const audio = new Audio('/notification.wav');
      audio.play().catch(e => {});
    } catch (e) {
    }
  };

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-w-xs">
      <h3 className="font-bold text-sm mb-2">Chat Test</h3>
      <div className="text-xs space-y-1">
        <div>Total Unread: {totalUnreadCount}</div>
        <div>
          Counts: {Object.entries(unreadCounts).map(([phone, count]) => 
            `${phone}: ${count}`
          ).join(', ') || 'None'}
        </div>
        <div className="grid grid-cols-2 gap-1 mt-2">
          <button 
            onClick={testAddIncomingMessage}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
          >
            + Incoming
          </button>
          <button 
            onClick={testAddOutgoingMessage}
            className="px-2 py-1 bg-gray-500 text-white text-xs rounded"
          >
            + Outgoing
          </button>
          <button 
            onClick={testMarkAsRead}
            className="px-2 py-1 bg-green-500 text-white text-xs rounded"
          >
            Mark Read
          </button>
          <button 
            onClick={testNotificationSound}
            className="px-2 py-1 bg-purple-500 text-white text-xs rounded"
          >
            Test Sound
          </button>
        </div>
      </div>
    </div>
  );
};
