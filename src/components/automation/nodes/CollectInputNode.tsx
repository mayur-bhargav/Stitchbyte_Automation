/**
 * CollectInputNode - Input collection node for automation flow
 */

'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

interface CollectInputNodeProps {
  data: {
    label: string;
    messageText?: string;
    inputType?: string;
    variableName?: string;
    onEdit?: (node: any) => void;
    onDelete?: (nodeId: string) => void;
  };
  id: string;
}

const CollectInputNode: React.FC<CollectInputNodeProps> = ({ data, id }) => {
  const handleEdit = () => {
    if (data.onEdit) {
      data.onEdit({ id, type: 'collectInput', data });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <div className="bg-white border-2 border-purple-200 rounded-lg shadow-sm hover:shadow-md transition-shadow min-w-[200px]">
      <div className="bg-purple-500 text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium text-sm">Collect Input</span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleEdit}
            className="text-white hover:text-purple-200 transition-colors"
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
              <p className="text-sm text-gray-800">
                {data.messageText.substring(0, 50)}{data.messageText.length > 50 ? '...' : ''}
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-sm text-yellow-800">No question configured</p>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Type: {data.inputType || 'text'}</span>
            <span className="text-gray-500">→ {data.variableName || 'variable'}</span>
          </div>
        </div>
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="collect-input"
        className="w-6 h-6 bg-purple-500 border-2 border-white"
        style={{ top: -12 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="collect-output"
        className="w-6 h-6 bg-purple-500 border-2 border-white"
        style={{ bottom: -12 }}
      />
    </div>
  );
};

export default CollectInputNode;