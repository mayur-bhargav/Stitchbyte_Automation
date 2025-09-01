"use client";

import { useChatContext } from '../contexts/ChatContext';
import { useEffect, useState } from 'react';

export default function ChatDebugPanel() {
  const { unreadCounts, totalUnreadCount } = useChatContext();
  const [logs, setLogs] = useState<string[]>([]);

  // Capture console logs related to chat
  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('📨') || message.includes('📤') || message.includes('Processing') || message.includes('Message')) {
        setLogs(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${message}`]);
      }
      originalLog(...args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const resetCounts = () => {
    // Clear localStorage and reload
    localStorage.removeItem('chatUnreadCounts');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg border rounded-lg p-4 max-w-md max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Chat Debug Panel</h3>
        <div className="flex gap-2">
          <button
            onClick={clearLogs}
            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Clear Logs
          </button>
          <button
            onClick={resetCounts}
            className="text-xs px-2 py-1 bg-red-200 rounded hover:bg-red-300"
          >
            Reset Counts
          </button>
        </div>
      </div>
      
      <div className="mb-3 text-sm">
        <div className="font-semibold">Total Unread: <span className="text-blue-600">{totalUnreadCount}</span></div>
        <div className="text-xs mt-1">
          {Object.entries(unreadCounts).map(([phone, count]) => (
            <div key={phone} className="truncate">
              {phone}: {count}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-2">
        <div className="text-xs font-semibold mb-1">Recent Activity:</div>
        <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No activity yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-xs break-words">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
