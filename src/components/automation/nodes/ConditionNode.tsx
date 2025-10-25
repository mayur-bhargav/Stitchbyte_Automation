/**
 * ConditionNode - Condition/logic node for automation flow
 */

'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

interface ConditionNodeProps {
  data: {
    label: string;
    conditionField?: string;
    conditionOperator?: string;
    conditionValue?: string;
    onEdit?: (node: any) => void;
    onDelete?: (nodeId: string) => void;
  };
  id: string;
}

const ConditionNode: React.FC<ConditionNodeProps> = ({ data, id }) => {
  const handleEdit = () => {
    if (data.onEdit) {
      data.onEdit({ id, type: 'condition', data });
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  const getOperatorSymbol = (operator?: string) => {
    switch (operator) {
      case 'equals': return '=';
      case 'not_equals': return '≠';
      case 'contains': return '⊃';
      case 'not_contains': return '⊅';
      case 'greater_than': return '>';
      case 'less_than': return '<';
      case 'starts_with': return '↗';
      case 'ends_with': return '↙';
      default: return '?';
    }
  };

  const isConfigured = data.conditionField && data.conditionOperator;

  return (
    <div className="bg-white border-2 border-yellow-200 rounded-lg shadow-sm hover:shadow-md transition-shadow min-w-[200px]">
      <div className="bg-yellow-500 text-white px-3 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium text-sm">Condition</span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleEdit}
            className="text-white hover:text-yellow-200 transition-colors"
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
        {isConfigured ? (
          <div className="space-y-2">
            <div className="bg-gray-50 border border-gray-200 rounded p-2">
              <div className="text-sm text-gray-800 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{data.conditionField}</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {getOperatorSymbol(data.conditionOperator)}
                  </span>
                  <span className="font-medium">"{data.conditionValue || 'empty'}"</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">TRUE</span>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded">FALSE</span>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
            <p className="text-sm text-yellow-800">Condition not configured</p>
          </div>
        )}
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="condition-input"
        className="w-6 h-6 bg-yellow-500 border-2 border-white"
        style={{ top: -12 }}
      />
      {/* TRUE path - right side */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="condition-true"
        className="w-6 h-6 bg-green-500 border-2 border-white"
        style={{ bottom: -12, left: '25%' }}
      />
      {/* FALSE path - left side */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="condition-false"
        className="w-6 h-6 bg-red-500 border-2 border-white"
        style={{ bottom: -12, left: '75%' }}
      />
    </div>
  );
};

export default ConditionNode;