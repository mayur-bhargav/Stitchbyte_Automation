"use client";
import React, { useState, useEffect } from 'react';
import {
  LuPlus,
  LuTrash2,
  LuUsers,
  LuFilter,
  LuCalendar,
  LuDollarSign,
  LuTag,
  LuActivity,
  LuEye,
  LuX
} from 'react-icons/lu';

export type SegmentRule = {
  id: string;
  attribute: string;
  operator: string;
  value: string | number;
  dataType: 'string' | 'number' | 'date' | 'boolean';
};

export type RuleGroup = {
  id: string;
  operator: 'AND' | 'OR';
  rules: SegmentRule[];
};

export type SegmentConfig = {
  name: string;
  description?: string;
  type: 'dynamic' | 'static';
  groups: RuleGroup[];
};

type SegmentBuilderProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: SegmentConfig) => void;
  initialSegment?: SegmentConfig;
};

const SEGMENT_ATTRIBUTES = [
  // Contact Properties
  { 
    id: 'first_name', 
    label: 'First Name', 
    category: 'Contact Properties',
    dataType: 'string',
    icon: <LuUsers className="w-4 h-4" />
  },
  { 
    id: 'last_name', 
    label: 'Last Name', 
    category: 'Contact Properties',
    dataType: 'string',
    icon: <LuUsers className="w-4 h-4" />
  },
  { 
    id: 'email', 
    label: 'Email', 
    category: 'Contact Properties',
    dataType: 'string',
    icon: <LuUsers className="w-4 h-4" />
  },
  { 
    id: 'phone', 
    label: 'Phone', 
    category: 'Contact Properties',
    dataType: 'string',
    icon: <LuUsers className="w-4 h-4" />
  },
  { 
    id: 'country', 
    label: 'Country', 
    category: 'Contact Properties',
    dataType: 'string',
    icon: <LuUsers className="w-4 h-4" />
  },
  { 
    id: 'city', 
    label: 'City', 
    category: 'Contact Properties',
    dataType: 'string',
    icon: <LuUsers className="w-4 h-4" />
  },
  { 
    id: 'tags', 
    label: 'Tags', 
    category: 'Contact Properties',
    dataType: 'string',
    icon: <LuTag className="w-4 h-4" />
  },
  
  // Purchase History
  { 
    id: 'total_spend', 
    label: 'Total Spend', 
    category: 'Purchase History',
    dataType: 'number',
    icon: <LuDollarSign className="w-4 h-4" />
  },
  { 
    id: 'order_count', 
    label: 'Total Orders', 
    category: 'Purchase History',
    dataType: 'number',
    icon: <LuDollarSign className="w-4 h-4" />
  },
  { 
    id: 'average_order_value', 
    label: 'Average Order Value', 
    category: 'Purchase History',
    dataType: 'number',
    icon: <LuDollarSign className="w-4 h-4" />
  },
  { 
    id: 'last_purchase_date', 
    label: 'Last Purchase Date', 
    category: 'Purchase History',
    dataType: 'date',
    icon: <LuCalendar className="w-4 h-4" />
  },
  { 
    id: 'purchased_product', 
    label: 'Purchased Product', 
    category: 'Purchase History',
    dataType: 'string',
    icon: <LuDollarSign className="w-4 h-4" />
  },
  { 
    id: 'purchased_category', 
    label: 'Purchased Category', 
    category: 'Purchase History',
    dataType: 'string',
    icon: <LuDollarSign className="w-4 h-4" />
  },
  
  // User Activity & Engagement
  { 
    id: 'last_activity_date', 
    label: 'Last Activity Date', 
    category: 'User Activity',
    dataType: 'date',
    icon: <LuActivity className="w-4 h-4" />
  },
  { 
    id: 'messages_opened', 
    label: 'Messages Opened', 
    category: 'User Activity',
    dataType: 'number',
    icon: <LuEye className="w-4 h-4" />
  },
  { 
    id: 'messages_replied', 
    label: 'Messages Replied', 
    category: 'User Activity',
    dataType: 'number',
    icon: <LuActivity className="w-4 h-4" />
  },
  { 
    id: 'links_clicked', 
    label: 'Links Clicked', 
    category: 'User Activity',
    dataType: 'number',
    icon: <LuActivity className="w-4 h-4" />
  },
  { 
    id: 'engagement_score', 
    label: 'Engagement Score', 
    category: 'User Activity',
    dataType: 'number',
    icon: <LuActivity className="w-4 h-4" />
  }
];

const OPERATORS = {
  string: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' }
  ],
  number: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'greater_than', label: 'greater than' },
    { value: 'greater_than_or_equal', label: 'greater than or equal to' },
    { value: 'less_than', label: 'less than' },
    { value: 'less_than_or_equal', label: 'less than or equal to' },
    { value: 'between', label: 'between' }
  ],
  date: [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'within_last', label: 'within the last' },
    { value: 'more_than_ago', label: 'more than ago' },
    { value: 'between', label: 'between' }
  ],
  boolean: [
    { value: 'is_true', label: 'is true' },
    { value: 'is_false', label: 'is false' }
  ]
};

export default function SegmentBuilder({ isOpen, onClose, onSave, initialSegment }: SegmentBuilderProps) {
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [segmentType, setSegmentType] = useState<'dynamic' | 'static'>('dynamic');
  const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>([]);
  const [contactCount, setContactCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  useEffect(() => {
    if (initialSegment) {
      setSegmentName(initialSegment.name);
      setSegmentDescription(initialSegment.description || '');
      setSegmentType(initialSegment.type);
      setRuleGroups(initialSegment.groups);
    } else {
      // Initialize with one empty rule group
      setRuleGroups([{
        id: generateId(),
        operator: 'AND',
        rules: [{
          id: generateId(),
          attribute: '',
          operator: '',
          value: '',
          dataType: 'string'
        }]
      }]);
    }
  }, [initialSegment, isOpen]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addRuleGroup = () => {
    const newGroup: RuleGroup = {
      id: generateId(),
      operator: 'OR',
      rules: [{
        id: generateId(),
        attribute: '',
        operator: '',
        value: '',
        dataType: 'string'
      }]
    };
    setRuleGroups([...ruleGroups, newGroup]);
  };

  const removeRuleGroup = (groupId: string) => {
    setRuleGroups(ruleGroups.filter(group => group.id !== groupId));
  };

  const updateRuleGroup = (groupId: string, updates: Partial<RuleGroup>) => {
    setRuleGroups(ruleGroups.map(group => 
      group.id === groupId ? { ...group, ...updates } : group
    ));
  };

  const addRule = (groupId: string) => {
    const newRule: SegmentRule = {
      id: generateId(),
      attribute: '',
      operator: '',
      value: '',
      dataType: 'string'
    };
    
    setRuleGroups(ruleGroups.map(group => 
      group.id === groupId 
        ? { ...group, rules: [...group.rules, newRule] }
        : group
    ));
  };

  const removeRule = (groupId: string, ruleId: string) => {
    setRuleGroups(ruleGroups.map(group => 
      group.id === groupId 
        ? { ...group, rules: group.rules.filter(rule => rule.id !== ruleId) }
        : group
    ));
  };

  const updateRule = (groupId: string, ruleId: string, updates: Partial<SegmentRule>) => {
    setRuleGroups(ruleGroups.map(group => 
      group.id === groupId 
        ? {
            ...group,
            rules: group.rules.map(rule => 
              rule.id === ruleId ? { ...rule, ...updates } : rule
            )
          }
        : group
    ));
  };

  const getAttributeById = (id: string) => {
    return SEGMENT_ATTRIBUTES.find(attr => attr.id === id);
  };

  const handleAttributeChange = (groupId: string, ruleId: string, attributeId: string) => {
    const attribute = getAttributeById(attributeId);
    if (attribute) {
      updateRule(groupId, ruleId, {
        attribute: attributeId,
        dataType: attribute.dataType as 'string' | 'number' | 'date' | 'boolean',
        operator: '',
        value: ''
      });
    }
  };

  const previewSegment = async () => {
    if (!isValidSegment()) return;
    
    setIsLoadingCount(true);
    try {
      // This would be an API call to preview the segment
      // For now, simulate with random count
      await new Promise(resolve => setTimeout(resolve, 1000));
      setContactCount(Math.floor(Math.random() * 5000) + 100);
    } catch (error) {
      console.error('Failed to preview segment:', error);
    }
    setIsLoadingCount(false);
  };

  const isValidSegment = () => {
    return segmentName.trim() && ruleGroups.some(group => 
      group.rules.some(rule => rule.attribute && rule.operator)
    );
  };

  const handleSave = () => {
    if (!isValidSegment()) return;
    
    const segment: SegmentConfig = {
      name: segmentName,
      description: segmentDescription,
      type: segmentType,
      groups: ruleGroups.filter(group => 
        group.rules.some(rule => rule.attribute && rule.operator)
      )
    };
    
    onSave(segment);
    onClose();
  };

  const groupedAttributes = SEGMENT_ATTRIBUTES.reduce((acc, attr) => {
    if (!acc[attr.category]) acc[attr.category] = [];
    acc[attr.category].push(attr);
    return acc;
  }, {} as Record<string, typeof SEGMENT_ATTRIBUTES>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {initialSegment ? 'Edit Segment' : 'Create New Segment'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Build dynamic or static contact segments with advanced rules
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LuX className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-80px)]">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Segment Info */}
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Segment Name *
                    </label>
                    <input
                      type="text"
                      value={segmentName}
                      onChange={(e) => setSegmentName(e.target.value)}
                      placeholder="e.g., VIP Customers Last 60 Days"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={segmentDescription}
                      onChange={(e) => setSegmentDescription(e.target.value)}
                      placeholder="Describe what this segment represents..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Segment Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="dynamic"
                          checked={segmentType === 'dynamic'}
                          onChange={(e) => setSegmentType(e.target.value as 'dynamic')}
                          className="mr-2"
                        />
                        <span className="text-sm text-slate-700">Dynamic</span>
                        <span className="text-xs text-slate-500 ml-1">(Auto-updates)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="static"
                          checked={segmentType === 'static'}
                          onChange={(e) => setSegmentType(e.target.value as 'static')}
                          className="mr-2"
                        />
                        <span className="text-sm text-slate-700">Static</span>
                        <span className="text-xs text-slate-500 ml-1">(One-time snapshot)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rule Groups */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-800">Segment Rules</h3>
                  <button
                    onClick={addRuleGroup}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    <LuPlus className="w-4 h-4" />
                    Add Rule Group
                  </button>
                </div>

                {ruleGroups.map((group, groupIndex) => (
                  <div key={group.id} className="border border-slate-200 rounded-lg p-4">
                    {/* Group Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {groupIndex > 0 && (
                          <select
                            value={group.operator}
                            onChange={(e) => updateRuleGroup(group.id, { operator: e.target.value as 'AND' | 'OR' })}
                            className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                        )}
                        <span className="text-sm font-medium text-slate-700">
                          Rule Group {groupIndex + 1}
                        </span>
                      </div>
                      {ruleGroups.length > 1 && (
                        <button
                          onClick={() => removeRuleGroup(group.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                        >
                          <LuTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Rules */}
                    <div className="space-y-3">
                      {group.rules.map((rule, ruleIndex) => (
                        <div key={rule.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          {ruleIndex > 0 && (
                            <span className="text-sm text-slate-500 font-medium min-w-[40px]">
                              AND
                            </span>
                          )}
                          
                          {/* Attribute */}
                          <select
                            value={rule.attribute}
                            onChange={(e) => handleAttributeChange(group.id, rule.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                          >
                            <option value="">Select attribute...</option>
                            {Object.entries(groupedAttributes).map(([category, attributes]) => (
                              <optgroup key={category} label={category}>
                                {attributes.map(attr => (
                                  <option key={attr.id} value={attr.id}>
                                    {attr.label}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>

                          {/* Operator */}
                          <select
                            value={rule.operator}
                            onChange={(e) => updateRule(group.id, rule.id, { operator: e.target.value })}
                            disabled={!rule.attribute}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent disabled:bg-slate-100"
                          >
                            <option value="">Select operator...</option>
                            {rule.dataType && OPERATORS[rule.dataType]?.map(op => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>

                          {/* Value */}
                          {rule.operator && !['is_empty', 'is_not_empty', 'is_true', 'is_false'].includes(rule.operator) && (
                            <input
                              type={rule.dataType === 'number' ? 'number' : rule.dataType === 'date' ? 'date' : 'text'}
                              value={rule.value}
                              onChange={(e) => updateRule(group.id, rule.id, { value: e.target.value })}
                              placeholder="Enter value..."
                              className="flex-1 px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                            />
                          )}

                          {/* Remove Rule */}
                          {group.rules.length > 1 && (
                            <button
                              onClick={() => removeRule(group.id, rule.id)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                            >
                              <LuTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button
                        onClick={() => addRule(group.id)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <LuPlus className="w-4 h-4" />
                        Add Rule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar - Preview */}
            <div className="w-80 border-l border-slate-200 p-6 bg-slate-50">
              <div className="sticky top-0">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Preview Results</h3>
                
                <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <LuUsers className="w-5 h-5 text-[#2A8B8A]" />
                    <span className="font-medium text-slate-800">
                      Matching Contacts: {isLoadingCount ? '...' : contactCount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">
                    Last Updated: Real-time
                  </p>
                  <button
                    onClick={previewSegment}
                    disabled={!isValidSegment() || isLoadingCount}
                    className="w-full px-4 py-2 bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 disabled:bg-slate-300 text-white rounded-lg transition-colors text-sm"
                  >
                    {isLoadingCount ? 'Loading...' : 'Preview Contact List'}
                  </button>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={!isValidSegment()}
                    className="w-full px-4 py-2 bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                  >
                    {initialSegment ? 'Update Segment' : 'Create Segment'}
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
