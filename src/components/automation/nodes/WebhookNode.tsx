/**
 * WebhookNode - Webhook/API call node for automation flow
 */

'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

interface WebhookNodeProps {
  data: {
    label: string;
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    onEdit?: (node: any) => void;
    onDelete?: (nodeId: string) => void;
  };
  id: string;
}

const WebhookNode: React.FC<WebhookNodeProps> = ({ data, id }) => {
  const handleEdit = () => {
    if (data.onEdit) {
      data.onEdit({ id, type: 'webhook', data });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  const getMethodColor = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'text-green-600';
      case 'POST': return 'text-blue-600';
      case 'PUT': return 'text-orange-600';
      case 'DELETE': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white border-2 border-orange-200 rounded-lg shadow-sm hover:shadow-md transition-shadow min-w-[200px]">
      <div className="bg-orange-500 text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="font-medium text-sm">Webhook</span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleEdit}
            className="text-white hover:text-orange-200 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="text-white hover:text-orange-200 transition-colors"
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
          <div className="flex items-center space-x-2">
            <span className={`font-mono text-xs font-bold ${getMethodColor(data.method)}`}>
              {data.method || 'POST'}
            </span>
            <span className="text-sm text-gray-600 truncate">
              {data.url || 'Configure webhook URL...'}
            </span>
          </div>
          
          {data.headers && Object.keys(data.headers).length > 0 && (
            <div className="text-xs text-gray-500">
              Headers: {Object.keys(data.headers).length} configured
            </div>
          )}
          
          {data.body && (
            <div className="text-xs text-gray-500">
              Request body configured
            </div>
          )}
        </div>
      </div>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="webhook-input"
        className="w-6 h-6 bg-orange-500 border-2 border-white"
        style={{ top: -12 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="webhook-output"
        className="w-6 h-6 bg-orange-500 border-2 border-white"
        style={{ bottom: -12 }}
      />
    </div>
  );
};

export default WebhookNode;