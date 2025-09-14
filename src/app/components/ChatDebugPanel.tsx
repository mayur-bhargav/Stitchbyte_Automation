"use client";

import { useChatContext } from '../contexts/ChatContext';

export default function ChatDebugPanel() {
  const { unreadCounts, totalUnreadCount } = useChatContext();

  const resetCounts = () => {
    // Clear localStorage and reload
    localStorage.removeItem('chatUnreadCounts');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg border rounded-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Chat Debug Panel</h3>
        <button
          onClick={resetCounts}
          className="text-xs px-2 py-1 bg-red-200 rounded hover:bg-red-300"
        >
          Reset Counts
        </button>
      </div>
      
      <div className="text-sm">
        <div className="font-semibold">Total Unread: <span className="text-blue-600">{totalUnreadCount}</span></div>
        <div className="text-xs mt-1">
          {Object.entries(unreadCounts).map(([phone, count]) => (
            <div key={phone} className="truncate">
              {phone}: {count}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
