// TEMPORARY: Add this import to any page to debug the chat system
// For example, add to your chats page or dashboard

import ChatDebugPanel from '../components/ChatDebugPanel';

// Then add <ChatDebugPanel /> anywhere in your JSX to see:
// - Current unread counts by phone number
// - Real-time logs of message processing
// - Buttons to clear logs and reset counts

// Example usage in a component:
export default function YourPage() {
  return (
    <div>
      {/* Your existing content */}
      
      {/* Add this temporarily for debugging */}
      {process.env.NODE_ENV === 'development' && <ChatDebugPanel />}
    </div>
  );
}

// INSTRUCTIONS:
// 1. Add the ChatDebugPanel import and component to any page
// 2. Watch the logs to see if messages are being processed multiple times
// 3. Check if the unread counts are increasing infinitely
// 4. Use "Reset Counts" button to clear everything and start fresh
// 5. Remove the debug panel once the issue is resolved
