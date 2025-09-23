/**
 * NodeEditor - Side panel for editing node properties
 * Dynamic editor that adapts to different node types
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';

interface NodeEditorProps {
  node: Node;
  onUpdate: (updatedNode: Node) => void;
  onClose: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onUpdate, onClose }) => {
  const [nodeData, setNodeData] = useState(node.data);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setNodeData(node.data);
    setErrors([]);
  }, [node]);

  const handleSave = () => {
    const validationErrors = validateNodeData();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedNode = {
      ...node,
      data: {
        ...nodeData,
        label: getNodeLabel(node.type!, nodeData)
      }
    };
    
    onUpdate(updatedNode);
  };

  const validateNodeData = (): string[] => {
    const errors: string[] = [];
    
    switch (node.type) {
      case 'sendMessage':
        if (!nodeData.messageText?.trim()) {
          errors.push('Message text is required');
        }
        break;
      case 'condition':
        if (!nodeData.conditionField?.trim()) {
          errors.push('Condition field is required');
        }
        if (!nodeData.conditionOperator) {
          errors.push('Condition operator is required');
        }
        break;
      case 'collectInput':
        if (!nodeData.variableName?.trim()) {
          errors.push('Variable name is required');
        }
        if (!nodeData.inputType) {
          errors.push('Input type is required');
        }
        break;
      case 'webhook':
        if (!nodeData.webhookUrl?.trim()) {
          errors.push('Webhook URL is required');
        }
        break;
      case 'trigger':
        if (nodeData.triggerType === 'keyword' && (!nodeData.keywords || nodeData.keywords.length === 0)) {
          errors.push('At least one keyword is required');
        }
        break;
    }
    
    return errors;
  };

  const updateField = (field: string, value: any) => {
    setNodeData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const addKeyword = () => {
    const keywords = nodeData.keywords || [];
    keywords.push('');
    updateField('keywords', [...keywords]);
  };

  const updateKeyword = (index: number, value: string) => {
    const keywords = [...(nodeData.keywords || [])];
    keywords[index] = value;
    updateField('keywords', keywords);
  };

  const removeKeyword = (index: number) => {
    const keywords = [...(nodeData.keywords || [])];
    keywords.splice(index, 1);
    updateField('keywords', keywords);
  };

  const addQuickReply = () => {
    const quickReplies = nodeData.quickReplies || [];
    quickReplies.push('');
    updateField('quickReplies', [...quickReplies]);
  };

  const updateQuickReply = (index: number, value: string) => {
    const quickReplies = [...(nodeData.quickReplies || [])];
    quickReplies[index] = value;
    updateField('quickReplies', quickReplies);
  };

  const removeQuickReply = (index: number) => {
    const quickReplies = [...(nodeData.quickReplies || [])];
    quickReplies.splice(index, 1);
    updateField('quickReplies', quickReplies);
  };

  const renderEditor = () => {
    switch (node.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Type
              </label>
              <select
                value={nodeData.triggerType || 'keyword'}
                onChange={(e) => updateField('triggerType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="keyword">Keyword</option>
                <option value="welcome_message">Welcome Message</option>
                <option value="postback">Postback</option>
                <option value="schedule">Schedule</option>
              </select>
            </div>

            {nodeData.triggerType === 'keyword' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <div className="space-y-2">
                  {(nodeData.keywords || []).map((keyword: string, index: number) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => updateKeyword(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter keyword"
                      />
                      <button
                        onClick={() => removeKeyword(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addKeyword}
                    className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600"
                  >
                    + Add Keyword
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'sendMessage':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Text *
              </label>
              <textarea
                value={nodeData.messageText || ''}
                onChange={(e) => updateField('messageText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="Enter your message..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Replies (Optional)
              </label>
              <div className="space-y-2">
                {(nodeData.quickReplies || []).map((reply: string, index: number) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => updateQuickReply(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Quick reply text"
                    />
                    <button
                      onClick={() => removeQuickReply(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addQuickReply}
                  className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600"
                >
                  + Add Quick Reply
                </button>
              </div>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field to Check *
              </label>
              <select
                value={nodeData.conditionField || ''}
                onChange={(e) => updateField('conditionField', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select field...</option>
                <option value="user_message">User Message</option>
                <option value="first_name">First Name</option>
                <option value="last_name">Last Name</option>
                <option value="email">Email</option>
                <option value="tags">User Tags</option>
                <option value="custom_field">Custom Field</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator *
              </label>
              <select
                value={nodeData.conditionOperator || ''}
                onChange={(e) => updateField('conditionOperator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select operator...</option>
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Does Not Contain</option>
                <option value="starts_with">Starts With</option>
                <option value="ends_with">Ends With</option>
                <option value="is_empty">Is Empty</option>
                <option value="is_not_empty">Is Not Empty</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value to Compare
              </label>
              <input
                type="text"
                value={nodeData.conditionValue || ''}
                onChange={(e) => updateField('conditionValue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter value..."
              />
            </div>
          </div>
        );

      case 'collectInput':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text *
              </label>
              <textarea
                value={nodeData.messageText || ''}
                onChange={(e) => updateField('messageText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="What would you like to ask?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input Type *
              </label>
              <select
                value={nodeData.inputType || ''}
                onChange={(e) => updateField('inputType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select type...</option>
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone Number</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variable Name *
              </label>
              <input
                type="text"
                value={nodeData.variableName || ''}
                onChange={(e) => updateField('variableName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., user_email, customer_name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use this name to reference the value in other messages
              </p>
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL *
              </label>
              <input
                type="url"
                value={nodeData.webhookUrl || ''}
                onChange={(e) => updateField('webhookUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://your-server.com/webhook"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Method
              </label>
              <select
                value={nodeData.webhookMethod || 'POST'}
                onChange={(e) => updateField('webhookMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data to Send (JSON)
              </label>
              <textarea
                value={nodeData.webhookDataString || JSON.stringify(nodeData.webhookData || {}, null, 2)}
                onChange={(e) => {
                  updateField('webhookDataString', e.target.value);
                  try {
                    const data = JSON.parse(e.target.value);
                    updateField('webhookData', data);
                  } catch {
                    // Invalid JSON, keep the string for editing
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                rows={6}
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        );

      case 'aiResponse':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Prompt *
              </label>
              <textarea
                value={nodeData.aiPrompt || ''}
                onChange={(e) => updateField('aiPrompt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                placeholder="How should the AI respond? Be specific about tone and style."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context (Optional)
              </label>
              <textarea
                value={nodeData.aiContext || ''}
                onChange={(e) => updateField('aiContext', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Additional context about your business, products, or services..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fallback Message
              </label>
              <input
                type="text"
                value={nodeData.fallbackMessage || ''}
                onChange={(e) => updateField('fallbackMessage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Message to send if AI fails"
              />
            </div>
          </div>
        );

      case 'addTag':
      case 'removeTag':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags to {node.type === 'addTag' ? 'Add' : 'Remove'}
              </label>
              <input
                type="text"
                value={(nodeData.tags || []).join(', ')}
                onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple tags with commas
              </p>
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay Amount
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={nodeData.delayValue || 1}
                  onChange={(e) => updateField('delayValue', parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
                <select
                  value={nodeData.delayUnit || 'minutes'}
                  onChange={(e) => updateField('delayUnit', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <p>No editor available for this node type</p>
          </div>
        );
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit {getNodeTypeLabel(node.type!)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-red-800">Validation Errors</span>
            </div>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {renderEditor()}
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

function getNodeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    trigger: 'Trigger',
    sendMessage: 'Message',
    condition: 'Condition',
    collectInput: 'Input Collection',
    webhook: 'Webhook',
    aiResponse: 'AI Response',
    addTag: 'Add Tag',
    removeTag: 'Remove Tag',
    delay: 'Delay',
  };
  return labels[type] || 'Node';
}

function getNodeLabel(type: string, data: any): string {
  switch (type) {
    case 'trigger':
      if (data.triggerType === 'keyword' && data.keywords?.length > 0) {
        return `Trigger: ${data.keywords.slice(0, 2).join(', ')}${data.keywords.length > 2 ? '...' : ''}`;
      }
      return `Trigger: ${data.triggerType || 'Keyword'}`;
    case 'sendMessage':
      return data.messageText?.substring(0, 30) + (data.messageText?.length > 30 ? '...' : '') || 'Send Message';
    case 'condition':
      return `If ${data.conditionField || 'field'} ${data.conditionOperator || 'equals'} ${data.conditionValue || 'value'}`;
    case 'collectInput':
      return `Collect ${data.inputType || 'input'}: ${data.variableName || 'variable'}`;
    case 'webhook':
      return `Webhook: ${data.webhookMethod || 'POST'}`;
    case 'aiResponse':
      return 'AI Response';
    case 'addTag':
      return `Add Tags: ${data.tags?.join(', ') || 'none'}`;
    case 'removeTag':
      return `Remove Tags: ${data.tags?.join(', ') || 'none'}`;
    case 'delay':
      return `Delay ${data.delayValue || 1} ${data.delayUnit || 'minutes'}`;
    default:
      return 'Node';
  }
}

export default NodeEditor;