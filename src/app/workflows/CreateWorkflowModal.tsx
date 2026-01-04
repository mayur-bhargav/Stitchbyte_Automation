"use client";
import { useState, useEffect, ReactNode } from "react";
import { apiService } from "../services/apiService";

interface CreateWorkflowModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Trigger types
type TriggerType = 'message_received' | 'keyword' | 'schedule' | 'webhook' | 'contact_created' | 'tag_added';

// Action types
type ActionType = 'send_message' | 'send_template' | 'add_tag' | 'remove_tag' | 'wait' | 'condition' | 'webhook' | 'assign_agent';

type WorkflowAction = {
  id: string;
  type: ActionType;
  config: Record<string, any>;
};

const TRIGGER_OPTIONS: { type: TriggerType; label: string; description: string; icon: ReactNode }[] = [
  {
    type: 'message_received',
    label: 'Message Received',
    description: 'Trigger when any message is received',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  },
  {
    type: 'keyword',
    label: 'Keyword Match',
    description: 'Trigger when specific keywords are detected',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
  },
  {
    type: 'schedule',
    label: 'Scheduled Time',
    description: 'Run workflow at specific times',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  {
    type: 'webhook',
    label: 'Webhook',
    description: 'Trigger from external API calls',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
  },
  {
    type: 'contact_created',
    label: 'New Contact',
    description: 'Trigger when a new contact is added',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
  },
  {
    type: 'tag_added',
    label: 'Tag Added',
    description: 'Trigger when a specific tag is added',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
  }
];

const ACTION_OPTIONS: { type: ActionType; label: string; description: string; icon: ReactNode }[] = [
  {
    type: 'send_template',
    label: 'Send Template',
    description: 'Send a WhatsApp template message',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  },
  {
    type: 'send_message',
    label: 'Send Message',
    description: 'Send a custom text message',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  },
  {
    type: 'wait',
    label: 'Wait / Delay',
    description: 'Add a time delay between actions',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  {
    type: 'condition',
    label: 'Condition',
    description: 'Add conditional logic branching',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
  {
    type: 'add_tag',
    label: 'Add Tag',
    description: 'Add a tag to the contact',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
  },
  {
    type: 'assign_agent',
    label: 'Assign Agent',
    description: 'Assign conversation to team member',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  },
  {
    type: 'webhook',
    label: 'HTTP Request',
    description: 'Make an external API call',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
  }
];

export default function CreateWorkflowModal({ onClose, onSuccess }: CreateWorkflowModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft"
  });
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType | null>(null);
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await apiService.get("/templates");
      setTemplates(data?.templates?.filter((t: any) => t.status === 'approved') || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addAction = (type: ActionType) => {
    setActions([...actions, { id: generateId(), type, config: {} }]);
    setShowActionPicker(false);
  };

  const updateAction = (id: string, config: Record<string, any>) => {
    setActions(actions.map(a => a.id === id ? { ...a, config } : a));
  };

  const removeAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    const newActions = [...actions];
    if (direction === 'up' && index > 0) {
      [newActions[index], newActions[index - 1]] = [newActions[index - 1], newActions[index]];
    } else if (direction === 'down' && index < actions.length - 1) {
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
    }
    setActions(newActions);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !selectedTrigger) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.post("/workflows", {
        ...formData,
        trigger: {
          type: selectedTrigger,
          config: triggerConfig
        },
        actions: actions.map((a, i) => ({ ...a, position: i }))
      });

      if (result) {
        onSuccess();
      } else {
        alert("Failed to create workflow");
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
      alert("Failed to create workflow");
    } finally {
      setLoading(false);
    }
  };

  const renderTriggerConfig = () => {
    switch (selectedTrigger) {
      case 'keyword':
        return (
          <div className="space-y-3 mt-4 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-medium text-gray-700">Keywords (comma separated)</label>
            <input
              type="text"
              placeholder="hello, hi, start, help"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none"
              value={triggerConfig.keywords || ''}
              onChange={(e) => setTriggerConfig({ ...triggerConfig, keywords: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="exactMatch"
                checked={triggerConfig.exactMatch || false}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, exactMatch: e.target.checked })}
                className="rounded text-[#2A8B8A] focus:ring-[#2A8B8A]"
              />
              <label htmlFor="exactMatch" className="text-sm text-gray-600">Exact match only</label>
            </div>
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-3 mt-4 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-medium text-gray-700">Schedule Type</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none"
              value={triggerConfig.scheduleType || 'daily'}
              onChange={(e) => setTriggerConfig({ ...triggerConfig, scheduleType: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom (Cron)</option>
            </select>
            <label className="block text-sm font-medium text-gray-700 mt-3">Time</label>
            <input
              type="time"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none"
              value={triggerConfig.time || '09:00'}
              onChange={(e) => setTriggerConfig({ ...triggerConfig, time: e.target.value })}
            />
          </div>
        );
      case 'tag_added':
        return (
          <div className="space-y-3 mt-4 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-medium text-gray-700">Tag Name</label>
            <input
              type="text"
              placeholder="Enter tag name..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none"
              value={triggerConfig.tagName || ''}
              onChange={(e) => setTriggerConfig({ ...triggerConfig, tagName: e.target.value })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionConfig = (action: WorkflowAction) => {
    switch (action.type) {
      case 'send_template':
        return (
          <select
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none"
            value={action.config.template || ''}
            onChange={(e) => updateAction(action.id, { ...action.config, template: e.target.value })}
          >
            <option value="">Select template...</option>
            {templates.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        );
      case 'send_message':
        return (
          <textarea
            placeholder="Enter message..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none resize-none"
            value={action.config.message || ''}
            onChange={(e) => updateAction(action.id, { ...action.config, message: e.target.value })}
          />
        );
      case 'wait':
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              placeholder="Duration"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none"
              value={action.config.duration || ''}
              onChange={(e) => updateAction(action.id, { ...action.config, duration: parseInt(e.target.value) || 0 })}
            />
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none"
              value={action.config.unit || 'minutes'}
              onChange={(e) => updateAction(action.id, { ...action.config, unit: e.target.value })}
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
        );
      case 'add_tag':
      case 'remove_tag':
        return (
          <input
            type="text"
            placeholder="Tag name..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none"
            value={action.config.tag || ''}
            onChange={(e) => updateAction(action.id, { ...action.config, tag: e.target.value })}
          />
        );
      default:
        return <p className="text-sm text-gray-500">Configure this action...</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#2A8B8A] to-[#238080]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create Workflow</h2>
                <p className="text-white/70 text-sm">Step {step} of 3</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full transition-colors ${s <= step ? 'bg-white' : 'bg-white/30'}`} />
                <p className={`text-xs mt-2 ${s <= step ? 'text-white' : 'text-white/50'}`}>
                  {s === 1 ? 'Basic Info' : s === 2 ? 'Trigger' : 'Actions'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Workflow Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Welcome New Customers"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none text-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Describe what this workflow does..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Select Trigger */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">Choose what starts this workflow:</p>
              <div className="grid grid-cols-2 gap-3">
                {TRIGGER_OPTIONS.map((trigger) => (
                  <button
                    key={trigger.type}
                    onClick={() => setSelectedTrigger(trigger.type)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedTrigger === trigger.type
                        ? 'border-[#2A8B8A] bg-[#2A8B8A]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                      selectedTrigger === trigger.type ? 'bg-[#2A8B8A] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {trigger.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900">{trigger.label}</h4>
                    <p className="text-sm text-gray-500 mt-1">{trigger.description}</p>
                  </button>
                ))}
              </div>
              {renderTriggerConfig()}
            </div>
          )}

          {/* Step 3: Add Actions */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">Add actions to your workflow:</p>
                <button
                  onClick={() => setShowActionPicker(true)}
                  className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg font-medium hover:bg-[#238080] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Action
                </button>
              </div>

              {actions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No actions added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click &quot;Add Action&quot; to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((action, index) => {
                    const actionInfo = ACTION_OPTIONS.find(a => a.type === action.type);
                    return (
                      <div key={action.id} className="p-4 border border-gray-200 rounded-xl bg-white">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-[#2A8B8A] text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[#2A8B8A]">{actionInfo?.icon}</span>
                              <h4 className="font-medium text-gray-900">{actionInfo?.label}</h4>
                            </div>
                            {renderActionConfig(action)}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => moveAction(index, 'up')}
                              disabled={index === 0}
                              className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveAction(index, 'down')}
                              disabled={index === actions.length - 1}
                              className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => removeAction(action.id)}
                              className="p-1.5 text-red-400 hover:text-red-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Picker Modal */}
              {showActionPicker && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full m-4 shadow-xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Select Action</h3>
                    <div className="space-y-2">
                      {ACTION_OPTIONS.map((action) => (
                        <button
                          key={action.type}
                          onClick={() => addAction(action.type)}
                          className="w-full p-3 border border-gray-200 rounded-xl text-left hover:border-[#2A8B8A] hover:bg-[#2A8B8A]/5 transition-all flex items-center gap-3"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                            {action.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{action.label}</h4>
                            <p className="text-sm text-gray-500">{action.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowActionPicker(false)}
                      className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <button
            onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : onClose()}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !formData.name.trim()) {
                  alert('Please enter a workflow name');
                  return;
                }
                if (step === 2 && !selectedTrigger) {
                  alert('Please select a trigger');
                  return;
                }
                setStep((step + 1) as 1 | 2 | 3);
              }}
              className="px-6 py-2.5 bg-[#2A8B8A] text-white rounded-xl font-medium hover:bg-[#238080] transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-[#2A8B8A] text-white rounded-xl font-medium hover:bg-[#238080] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Workflow
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
