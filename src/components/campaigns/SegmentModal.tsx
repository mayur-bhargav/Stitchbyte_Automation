"use client";
import React, { useState, useEffect } from 'react';
import { 
  LuUsers, 
  LuX, 
  LuPlus, 
  LuTrash2, 
  LuRefreshCw 
} from 'react-icons/lu';
import { apiService } from '../../app/services/apiService';

interface SegmentRule {
  field: string;
  operator: string;
  value: any;
}

interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  segment?: any;
}

const FIELD_OPTIONS = [
  { value: 'tags', label: 'Tags', type: 'array' },
  { value: 'engagement_status', label: 'Engagement Status', type: 'select' },
  { value: 'last_active_date', label: 'Last Active Date', type: 'date' },
  { value: 'created_at', label: 'Created Date', type: 'date' },
  { value: 'campaign_participated', label: 'Campaign Participated', type: 'string' },
  { value: 'phone', label: 'Phone Number', type: 'string' },
  { value: 'name', label: 'Contact Name', type: 'string' },
];

const OPERATOR_OPTIONS: Record<string, Array<{value: string, label: string}>> = {
  array: [
    { value: 'in', label: 'Contains any' },
    { value: 'not_in', label: 'Does not contain' },
  ],
  select: [
    { value: 'in', label: 'Is' },
    { value: 'not_in', label: 'Is not' },
  ],
  date: [
    { value: 'gte', label: 'On or after' },
    { value: 'lte', label: 'On or before' },
    { value: 'eq', label: 'Exactly on' },
  ],
  string: [
    { value: 'eq', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'ne', label: 'Does not equal' },
  ],
};

const ENGAGEMENT_OPTIONS = [
  { value: 'opened', label: 'Opened' },
  { value: 'replied', label: 'Replied' },
  { value: 'clicked', label: 'Clicked' },
  { value: 'ignored', label: 'Ignored' },
];

export default function SegmentModal({ isOpen, onClose, onSuccess, segment }: SegmentModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'dynamic' | 'static'>('dynamic');
  const [rules, setRules] = useState<SegmentRule[]>([
    { field: 'tags', operator: 'in', value: [] }
  ]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (segment) {
      setName(segment.name || '');
      setDescription(segment.description || '');
      setType(segment.type || 'dynamic');
      setRules(segment.rules || [{ field: 'tags', operator: 'in', value: [] }]);
    }
  }, [segment]);

  useEffect(() => {
    if (type === 'dynamic' && rules.length > 0) {
      const timer = setTimeout(() => {
        countUsers();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [rules, type]);

  const countUsers = async () => {
    if (type !== 'dynamic' || rules.length === 0) return;
    
    try {
      setCounting(true);
      const response = await apiService.post('/segments/count', rules);
      setUserCount(response.count);
    } catch (error) {
      console.error('Error counting users:', error);
      setUserCount(0);
    } finally {
      setCounting(false);
    }
  };

  const addRule = () => {
    setRules([...rules, { field: 'tags', operator: 'in', value: [] }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof SegmentRule, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    
    // Reset value when field changes
    if (field === 'field') {
      newRules[index].value = value === 'tags' || value === 'engagement_status' ? [] : '';
      const fieldOption = FIELD_OPTIONS.find(f => f.value === value);
      newRules[index].operator = OPERATOR_OPTIONS[fieldOption?.type || 'string'][0].value;
    }
    
    setRules(newRules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter a segment name');
      return;
    }

    try {
      setLoading(true);
      const data = {
        name: name.trim(),
        description: description.trim(),
        type,
        rules: type === 'dynamic' ? rules : [],
        contact_ids: type === 'static' ? [] : undefined,
      };

      if (segment) {
        await apiService.put(`/segments/${segment.id}`, data);
      } else {
        await apiService.post('/segments/', data);
      }
      resetForm();
    } catch (error: any) {
      console.error('Error saving segment:', error);
      alert(error.message || 'Failed to save segment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('dynamic');
    setRules([{ field: 'tags', operator: 'in', value: [] }]);
    setUserCount(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-white/30 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <LuUsers className="text-2xl text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {segment ? 'Edit Segment' : 'Create Segment'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Define rules to group your contacts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LuX className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Segment Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Active Customers"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional description"
                rows={2}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Segment Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="dynamic"
                    checked={type === 'dynamic'}
                    onChange={(e) => setType(e.target.value as 'dynamic')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Dynamic (Auto-updates based on rules)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="static"
                    checked={type === 'static'}
                    onChange={(e) => setType(e.target.value as 'static')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Static (Manual selection)
                  </span>
                </label>
              </div>
            </div>

            {/* Rules (Dynamic only) */}
            {type === 'dynamic' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Segment Rules
                  </label>
                  <button
                    type="button"
                    onClick={addRule}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <LuPlus className="text-sm" />
                    <span>Add Rule</span>
                  </button>
                </div>

                {rules.map((rule, index) => {
                  const fieldOption = FIELD_OPTIONS.find(f => f.value === rule.field);
                  const operators = OPERATOR_OPTIONS[fieldOption?.type || 'string'];

                  return (
                    <div key={index} className="flex items-start space-x-2 bg-gray-50 p-4 rounded-lg">
                      {/* Field */}
                      <select
                        value={rule.field}
                        onChange={(e) => updateRule(index, 'field', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {FIELD_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {/* Operator */}
                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(index, 'operator', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      {/* Value */}
                      {rule.field === 'engagement_status' ? (
                        <select
                          multiple
                          value={Array.isArray(rule.value) ? rule.value : []}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            updateRule(index, 'value', selected);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {ENGAGEMENT_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : fieldOption?.type === 'date' ? (
                        <input
                          type="date"
                          value={rule.value}
                          onChange={(e) => updateRule(index, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateRule(index, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter value"
                        />
                      )}

                      {/* Delete */}
                      {rules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRule(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LuTrash2 />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* User Count */}
            {type === 'dynamic' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <LuUsers className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Matching Contacts:
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {counting ? (
                      <LuRefreshCw className="text-blue-600 animate-spin" />
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">
                        {userCount !== null ? userCount.toLocaleString() : '-'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <LuRefreshCw className="animate-spin" />}
                <span>{segment ? 'Update' : 'Create'} Segment</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
