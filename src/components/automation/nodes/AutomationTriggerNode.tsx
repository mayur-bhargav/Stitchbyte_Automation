/**
 * AutomationTriggerNode - Trigger node for automation flow
 */

'use client';

import React from 'react';

interface AutomationTriggerNodeProps {
  data: {
    label: string;
    triggerType?: string;
    keywords?: string[];
    onEdit?: (node: any) => void;
  };
  id: string;
}

const AutomationTriggerNode: React.FC<AutomationTriggerNodeProps> = ({ data, id }) => {
  const handleEdit = () => {
    if (data.onEdit) {
      data.onEdit({ id, type: 'trigger', data });
    }
  };

  const getTriggerIcon = () => {
    switch (data.triggerType) {
      case 'welcome_message':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'keyword':
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
          </svg>
        );
    }
  };

  const getTriggerTypeLabel = () => {
    switch (data.triggerType) {
      case 'welcome_message':
        return 'Welcome Message';
      case 'postback':
        return 'Button Click';
      case 'schedule':
        return 'Schedule';
      case 'keyword':
      default:
        return 'Keyword';
    }
  };

  return (
    <div className="bg-white border-2 border-green-200 rounded-lg shadow-sm hover:shadow-md transition-shadow min-w-[200px]">
      <div className="bg-green-500 text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getTriggerIcon()}
          <span className="font-medium text-sm">Trigger</span>
        </div>
        <button
          onClick={handleEdit}
          className="text-white hover:text-green-200 transition-colors"
          title="Edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
      
      <div className="p-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500">Type:</span>
            <span className="text-sm font-medium text-gray-800">{getTriggerTypeLabel()}</span>
          </div>
          
          {data.triggerType === 'keyword' && data.keywords && data.keywords.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Keywords:</p>
              <div className="flex flex-wrap gap-1">
                {data.keywords.slice(0, 3).map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                  >
                    {keyword}
                  </span>
                ))}
                {data.keywords.length > 3 && (
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    +{data.keywords.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ) : data.triggerType === 'keyword' ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-sm text-yellow-800">No keywords configured</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Connection handle (only bottom for trigger) */}
      <div 
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full"
        style={{ pointerEvents: 'all' }}
      />
    </div>
  );
};

export default AutomationTriggerNode;