/**
 * AIResponseNode - AI response generation node for automation flow
 */

'use client';

import React from 'react';

interface AIResponseNodeProps {
  data: {
    label: string;
    aiPrompt?: string;
    aiModel?: string;
    temperature?: number;
    maxTokens?: number;
    onEdit?: (node: any) => void;
    onDelete?: (nodeId: string) => void;
  };
  id: string;
}

const AIResponseNode: React.FC<AIResponseNodeProps> = ({ data, id }) => {
  const handleEdit = () => {
    if (data.onEdit) {
      data.onEdit({ id, type: 'aiResponse', data });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  const getModelColor = (model?: string) => {
    if (model?.includes('gpt')) return 'text-green-600';
    if (model?.includes('gemini')) return 'text-blue-600';
    if (model?.includes('claude')) return 'text-purple-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white border-2 border-purple-200 rounded-lg shadow-sm hover:shadow-md transition-shadow min-w-[200px]">
      <div className="bg-purple-500 text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-medium text-sm">AI Response</span>
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
            className="text-white hover:text-purple-200 transition-colors"
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
            <span className={`text-xs font-medium ${getModelColor(data.aiModel)}`}>
              {data.aiModel || 'gpt-3.5-turbo'}
            </span>
            {data.temperature !== undefined && (
              <span className="text-xs text-gray-500">
                temp: {data.temperature}
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            {data.aiPrompt ? (
              <div className="bg-gray-50 p-2 rounded text-xs">
                {data.aiPrompt.length > 50 
                  ? `${data.aiPrompt.substring(0, 50)}...`
                  : data.aiPrompt
                }
              </div>
            ) : (
              <span className="text-gray-400 italic">Configure AI prompt...</span>
            )}
          </div>
          
          {data.maxTokens && (
            <div className="text-xs text-gray-500">
              Max tokens: {data.maxTokens}
            </div>
          )}
        </div>
      </div>
      
      {/* Connection handle */}
      <div className="absolute w-3 h-3 bg-purple-500 border-2 border-white rounded-full -right-1.5 top-1/2 transform -translate-y-1/2"></div>
    </div>
  );
};

export default AIResponseNode;