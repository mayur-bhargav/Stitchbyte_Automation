/**
 * MessageNode - Send message node for automation flow
 */

'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

interface MessageNodeProps {
  data: {
    label: string;
    messageText?: string;
    quickReplies?: string[];
    onEdit?: (node: any) => void;
    onDelete?: (nodeId: string) => void;
  };
  id: string;
}

const MessageNode: React.FC<MessageNodeProps> = ({ data, id }) => {
  const handleEdit = () => {
    if (data.onEdit) {
      data.onEdit({ id, type: 'sendMessage', data });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-lg shadow-sm hover:shadow-md transition-shadow min-w-[200px]">
      <div className="bg-indigo-500 text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-medium text-sm">Send Message</span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleEdit}
            className="text-white hover:text-indigo-200 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="text-white hover:text-red-200 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-3">
        <div className="space-y-2">
          {data.messageText ? (
            <div className="bg-gray-50 border border-gray-200 rounded p-2">
              <p className="text-sm text-gray-800 leading-relaxed">
                {data.messageText.length > 100 
                  ? `${data.messageText.substring(0, 100)}...` 
                  : data.messageText
                }
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-sm text-yellow-800">No message text configured</p>
            </div>
          )}
          
          {data.quickReplies && data.quickReplies.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Quick Replies:</p>
              <div className="flex flex-wrap gap-1">
                {data.quickReplies.slice(0, 3).map((reply, index) => (
                  <span
                    key={index}
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {reply.length > 15 ? `${reply.substring(0, 15)}...` : reply}
                  </span>
                ))}
                {data.quickReplies.length > 3 && (
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    +{data.quickReplies.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="message-input"
        className="w-6 h-6 bg-indigo-500 border-2 border-white"
        style={{ top: -12 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="message-output"
        className="w-6 h-6 bg-indigo-500 border-2 border-white"
        style={{ bottom: -12 }}
      />
    </div>
  );
};

export default MessageNode;