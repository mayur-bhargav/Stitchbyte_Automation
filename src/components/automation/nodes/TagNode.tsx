/**
 * TagNode - Add/Remove tags node for automation flow
 */

'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

interface TagNodeProps {
  data: {
    label: string;
    action?: 'add' | 'remove';
    tags?: string[];
    onEdit?: (node: any) => void;
    onDelete?: (nodeId: string) => void;
  };
  id: string;
}

const TagNode: React.FC<TagNodeProps> = ({ data, id }) => {
  const handleEdit = () => {
    if (data.onEdit) {
      data.onEdit({ id, type: 'tagUser', data });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  const getActionColor = (action?: string) => {
    return action === 'add' ? 'bg-green-500' : 'bg-red-500';
  };

  const getActionIcon = (action?: string) => {
    if (action === 'add') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    );
  };

  return (
    <div className="bg-white border-2 border-teal-200 rounded-lg shadow-sm hover:shadow-md transition-shadow min-w-[200px]">
      <div className={`${getActionColor(data.action)} text-white px-3 py-2 rounded-t-lg flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="font-medium text-sm">
            {data.action === 'add' ? 'Add Tags' : 'Remove Tags'}
          </span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleEdit}
            className="text-white hover:text-teal-200 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="text-white hover:text-teal-200 transition-colors"
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
            <div className={`w-6 h-6 ${getActionColor(data.action)} rounded-full flex items-center justify-center text-white`}>
              {getActionIcon(data.action)}
            </div>
            <span className="text-sm font-medium">
              {data.action === 'add' ? 'Add' : 'Remove'} tags
            </span>
          </div>
          
          {data.tags && data.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {data.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className={`px-2 py-1 text-xs rounded-full text-white ${
                    data.action === 'add' ? 'bg-green-400' : 'bg-red-400'
                  }`}
                >
                  {tag}
                </span>
              ))}
              {data.tags.length > 3 && (
                <span className="px-2 py-1 text-xs rounded-full bg-gray-300 text-gray-600">
                  +{data.tags.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 italic text-sm">Configure tags...</span>
          )}
        </div>
      </div>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="tag-input"
        className="w-6 h-6 bg-teal-500 border-2 border-white"
        style={{ top: -12 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="tag-output"
        className="w-6 h-6 bg-teal-500 border-2 border-white"
        style={{ bottom: -12 }}
      />
    </div>
  );
};

export default TagNode;