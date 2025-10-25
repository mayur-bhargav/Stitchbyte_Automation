/**
 * DelayNode - Delay/Wait node for automation flow
 */

'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

interface DelayNodeProps {
  data: {
    label: string;
    delayValue?: number;
    delayUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
    onEdit?: (node: any) => void;
    onDelete?: (nodeId: string) => void;
  };
  id: string;
}

const DelayNode: React.FC<DelayNodeProps> = ({ data, id }) => {
  const handleEdit = () => {
    if (data.onEdit) {
      data.onEdit({ id, type: 'delay', data });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  const getDelayText = () => {
    const value = data.delayValue || 1;
    const unit = data.delayUnit || 'minutes';
    return `${value} ${unit}`;
  };

  const getDelayIcon = () => {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getProgressBar = () => {
    // Visual representation of delay time
    const totalMinutes = (() => {
      const value = data.delayValue || 1;
      switch (data.delayUnit) {
        case 'seconds': return value / 60;
        case 'minutes': return value;
        case 'hours': return value * 60;
        case 'days': return value * 1440;
        default: return value;
      }
    })();

    // Scale to 0-100 for visual representation (max 24 hours = 100%)
    const percentage = Math.min((totalMinutes / 1440) * 100, 100);
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(percentage, 5)}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="bg-white border-2 border-amber-200 rounded-lg shadow-sm hover:shadow-md transition-shadow min-w-[200px]">
      <div className="bg-amber-500 text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getDelayIcon()}
          <span className="font-medium text-sm">Delay</span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleEdit}
            className="text-white hover:text-amber-200 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="text-white hover:text-amber-200 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-3">
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {data.delayValue || 1}
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {data.delayUnit || 'minutes'}
            </div>
          </div>
          
          {getProgressBar()}
          
          <div className="text-xs text-gray-500 text-center">
            Wait {getDelayText()} before continuing
          </div>
        </div>
      </div>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="delay-input"
        className="w-6 h-6 bg-amber-500 border-2 border-white"
        style={{ top: -12 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="delay-output"
        className="w-6 h-6 bg-amber-500 border-2 border-white"
        style={{ bottom: -12 }}
      />
    </div>
  );
};

export default DelayNode;