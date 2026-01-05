"use client";
import { useState, useEffect, ReactNode } from "react";
import { apiService } from "../services/apiService";
import {
  LuX,
  LuPlay,
  LuMessageSquare,
  LuClock,
  LuWebhook,
  LuZap,
  LuUsers,
  LuTag,
  LuCode,
  LuActivity,
  LuChevronRight,
  LuChevronLeft,
  LuCheck,
  LuInfo,
  LuCopy,
  LuRefreshCw
} from "react-icons/lu";

// Types
type TriggerType = 
  | "keyword" 
  | "schedule" 
  | "webhook" 
  | "message_received" 
  | "contact_created" 
  | "tag_added"
  | "api_call"
  | "event";

interface TriggerConfig {
  keywords?: string;
  case_sensitive?: boolean;
  exact_match?: boolean;
  match_type?: "contains" | "starts_with" | "ends_with" | "exact";
  schedule_type?: string;
  datetime?: string;
  time?: string;
  cron_expression?: string;
  days_of_week?: string[];
  timezone?: string;
  webhook_url?: string;
  webhook_id?: string;
  secret_key?: string;
  endpoint?: string;
  method?: string;
  event_type?: string;
  tag_name?: string;
  filter_conditions?: any[];
  [key: string]: any;
}

interface Trigger {
  _id: string;
  name: string;
  description?: string;
  type: TriggerType;
  config: TriggerConfig;
  workflow_id?: string;
  automation_id?: string;
  status: "active" | "inactive" | "paused";
  created_at: string;
}

interface Workflow {
  _id: string;
  name: string;
  description?: string;
}

interface Automation {
  _id: string;
  name: string;
  description?: string;
}

interface CreateTriggerModalProps {
  workflows: Workflow[];
  automations: Automation[];
  editingTrigger?: Trigger | null;
  defaultType?: TriggerType;
  onClose: () => void;
  onSuccess: () => void;
}

// Trigger type configuration
const triggerTypes: { type: TriggerType; label: string; icon: ReactNode; color: string; bgColor: string; description: string }[] = [
  {
    type: "keyword",
    label: "Keyword Match",
    icon: <LuMessageSquare size={24} />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "Trigger when specific keywords are found in incoming messages"
  },
  {
    type: "schedule",
    label: "Scheduled",
    icon: <LuClock size={24} />,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    description: "Trigger at specific times, dates, or recurring intervals"
  },
  {
    type: "webhook",
    label: "Webhook",
    icon: <LuWebhook size={24} />,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    description: "Trigger via external HTTP requests from other services"
  },
  {
    type: "message_received",
    label: "Message Received",
    icon: <LuZap size={24} />,
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: "Trigger when any new message is received"
  },
  {
    type: "contact_created",
    label: "New Contact",
    icon: <LuUsers size={24} />,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    description: "Trigger when a new contact is added to the system"
  },
  {
    type: "tag_added",
    label: "Tag Added",
    icon: <LuTag size={24} />,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    description: "Trigger when a specific tag is added to a contact"
  },
  {
    type: "api_call",
    label: "API Call",
    icon: <LuCode size={24} />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    description: "Trigger via direct API endpoint calls"
  },
  {
    type: "event",
    label: "Custom Event",
    icon: <LuActivity size={24} />,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    description: "Trigger on custom application events"
  }
];

export default function CreateTriggerModal({ 
  workflows, 
  automations, 
  editingTrigger,
  defaultType,
  onClose, 
  onSuccess 
}: CreateTriggerModalProps) {
  const [step, setStep] = useState(editingTrigger ? 2 : 1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: editingTrigger?.name || "",
    description: editingTrigger?.description || "",
    type: editingTrigger?.type || defaultType || ("keyword" as TriggerType),
    workflow_id: editingTrigger?.workflow_id || "",
    automation_id: editingTrigger?.automation_id || "",
    status: editingTrigger?.status || "active"
  });
  
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>(
    editingTrigger?.config || {}
  );

  // Generate webhook URL
  const [webhookId] = useState(() => 
    editingTrigger?.config?.webhook_id || `wh_${Math.random().toString(36).substring(2, 15)}`
  );

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a trigger name");
      return;
    }

    if (!formData.workflow_id && !formData.automation_id) {
      alert("Please select a workflow or automation to link");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        config: {
          ...triggerConfig,
          ...(formData.type === "webhook" && { webhook_id: webhookId })
        }
      };

      if (editingTrigger) {
        await apiService.put(`/triggers/${editingTrigger._id}`, payload);
      } else {
        await apiService.post("/triggers", payload);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Failed to save trigger:", error);
      alert("Failed to save trigger. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // Get selected trigger type config
  const selectedTypeConfig = triggerTypes.find(t => t.type === formData.type);

  // Render trigger-specific configuration
  const renderTriggerConfig = () => {
    switch (formData.type) {
      case "keyword":
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
              <textarea
                placeholder="Enter keywords separated by commas (e.g., hello, hi, start, help)"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none resize-none"
                rows={3}
                value={triggerConfig.keywords || ""}
                onChange={(e) => setTriggerConfig({...triggerConfig, keywords: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">Trigger activates when any of these keywords are found</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Match Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                value={triggerConfig.match_type || "contains"}
                onChange={(e) => setTriggerConfig({...triggerConfig, match_type: e.target.value as any})}
              >
                <option value="contains">Contains keyword</option>
                <option value="starts_with">Starts with keyword</option>
                <option value="ends_with">Ends with keyword</option>
                <option value="exact">Exact match only</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triggerConfig.case_sensitive || false}
                  onChange={(e) => setTriggerConfig({...triggerConfig, case_sensitive: e.target.checked})}
                  className="w-5 h-5 text-[#2A8B8A] rounded focus:ring-[#2A8B8A]"
                />
                <span className="text-sm text-gray-700">Case sensitive matching</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={triggerConfig.exact_match || false}
                  onChange={(e) => setTriggerConfig({...triggerConfig, exact_match: e.target.checked})}
                  className="w-5 h-5 text-[#2A8B8A] rounded focus:ring-[#2A8B8A]"
                />
                <span className="text-sm text-gray-700">Match whole words only</span>
              </label>
            </div>
          </div>
        );
      
      case "schedule":
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                value={triggerConfig.schedule_type || "once"}
                onChange={(e) => setTriggerConfig({...triggerConfig, schedule_type: e.target.value})}
              >
                <option value="once">One Time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="cron">Custom (Cron Expression)</option>
              </select>
            </div>

            {triggerConfig.schedule_type === "cron" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cron Expression</label>
                <input
                  type="text"
                  placeholder="0 9 * * 1-5 (Every weekday at 9 AM)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                  value={triggerConfig.cron_expression || ""}
                  onChange={(e) => setTriggerConfig({...triggerConfig, cron_expression: e.target.value})}
                />
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Common Examples:</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li><code className="bg-gray-200 px-1 rounded">0 9 * * *</code> - Every day at 9 AM</li>
                    <li><code className="bg-gray-200 px-1 rounded">0 9 * * 1-5</code> - Weekdays at 9 AM</li>
                    <li><code className="bg-gray-200 px-1 rounded">0 0 1 * *</code> - First day of month at midnight</li>
                  </ul>
                </div>
              </div>
            ) : triggerConfig.schedule_type === "once" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                  value={triggerConfig.datetime || ""}
                  onChange={(e) => setTriggerConfig({...triggerConfig, datetime: e.target.value})}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                  value={triggerConfig.time || "09:00"}
                  onChange={(e) => setTriggerConfig({...triggerConfig, time: e.target.value})}
                />
              </div>
            )}

            {triggerConfig.schedule_type === "weekly" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                    const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx];
                    const isSelected = triggerConfig.days_of_week?.includes(fullDay);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const days = triggerConfig.days_of_week || [];
                          if (isSelected) {
                            setTriggerConfig({...triggerConfig, days_of_week: days.filter(d => d !== fullDay)});
                          } else {
                            setTriggerConfig({...triggerConfig, days_of_week: [...days, fullDay]});
                          }
                        }}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected 
                            ? "bg-[#2A8B8A] text-white" 
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                value={triggerConfig.timezone || "Asia/Kolkata"}
                onChange={(e) => setTriggerConfig({...triggerConfig, timezone: e.target.value})}
              >
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="America/New_York">US Eastern</option>
                <option value="America/Los_Angeles">US Pacific</option>
                <option value="Europe/London">UK (GMT/BST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        );
      
      case "webhook":
        const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/${webhookId}`;
        return (
          <div className="space-y-5">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <LuInfo className="text-orange-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-orange-800">Webhook URL</p>
                  <p className="text-xs text-orange-600 mt-1">External services can trigger this automation by sending a POST request to this URL</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Webhook URL</label>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 border border-gray-300 rounded-l-lg px-4 py-3 bg-gray-50 text-gray-600 text-sm"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="px-4 py-3 bg-[#2A8B8A] text-white rounded-r-lg hover:bg-[#238080] transition-colors"
                >
                  <LuCopy size={18} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key (Optional)</label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Enter a secret key for validation"
                  className="flex-1 border border-gray-300 rounded-l-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                  value={triggerConfig.secret_key || ""}
                  onChange={(e) => setTriggerConfig({...triggerConfig, secret_key: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => {
                    const key = `sk_${Math.random().toString(36).substring(2, 15)}`;
                    setTriggerConfig({...triggerConfig, secret_key: key});
                  }}
                  className="px-4 py-3 bg-gray-100 text-gray-600 rounded-r-lg hover:bg-gray-200 transition-colors"
                >
                  <LuRefreshCw size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Add this secret in the X-Webhook-Secret header for validation</p>
            </div>
          </div>
        );
      
      case "message_received":
        return (
          <div className="space-y-5">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <LuZap className="text-green-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-green-800">Message Received Trigger</p>
                  <p className="text-xs text-green-600 mt-1">This trigger fires whenever any new message is received from any contact</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Message Type (Optional)</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                value={triggerConfig.message_type || "all"}
                onChange={(e) => setTriggerConfig({...triggerConfig, message_type: e.target.value})}
              >
                <option value="all">All Messages</option>
                <option value="text">Text Messages Only</option>
                <option value="image">Image Messages Only</option>
                <option value="document">Document Messages Only</option>
                <option value="audio">Audio Messages Only</option>
                <option value="video">Video Messages Only</option>
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={triggerConfig.first_message_only || false}
                onChange={(e) => setTriggerConfig({...triggerConfig, first_message_only: e.target.checked})}
                className="w-5 h-5 text-[#2A8B8A] rounded focus:ring-[#2A8B8A]"
              />
              <span className="text-sm text-gray-700">Only trigger on first message from new contacts</span>
            </label>
          </div>
        );
      
      case "contact_created":
        return (
          <div className="space-y-5">
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="flex items-start gap-3">
                <LuUsers className="text-cyan-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-cyan-800">New Contact Trigger</p>
                  <p className="text-xs text-cyan-600 mt-1">This trigger fires when a new contact is created in your system</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Source (Optional)</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                value={triggerConfig.source || "all"}
                onChange={(e) => setTriggerConfig({...triggerConfig, source: e.target.value})}
              >
                <option value="all">All Sources</option>
                <option value="manual">Manual Entry</option>
                <option value="import">CSV Import</option>
                <option value="api">API</option>
                <option value="whatsapp">WhatsApp Message</option>
                <option value="widget">Website Widget</option>
              </select>
            </div>
          </div>
        );
      
      case "tag_added":
        return (
          <div className="space-y-5">
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <div className="flex items-start gap-3">
                <LuTag className="text-pink-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-pink-800">Tag Added Trigger</p>
                  <p className="text-xs text-pink-600 mt-1">This trigger fires when a specific tag is added to a contact</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tag Name</label>
              <input
                type="text"
                placeholder="Enter tag name (leave empty for any tag)"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                value={triggerConfig.tag_name || ""}
                onChange={(e) => setTriggerConfig({...triggerConfig, tag_name: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to trigger on any tag addition</p>
            </div>
          </div>
        );
      
      case "api_call":
        return (
          <div className="space-y-5">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-start gap-3">
                <LuCode className="text-indigo-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-indigo-800">API Call Trigger</p>
                  <p className="text-xs text-indigo-600 mt-1">Trigger this automation via a direct API call</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint Name</label>
              <input
                type="text"
                placeholder="my-trigger-endpoint"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                value={triggerConfig.endpoint || ""}
                onChange={(e) => setTriggerConfig({...triggerConfig, endpoint: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                value={triggerConfig.method || "POST"}
                onChange={(e) => setTriggerConfig({...triggerConfig, method: e.target.value})}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
          </div>
        );
      
      case "event":
        return (
          <div className="space-y-5">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <LuActivity className="text-amber-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-amber-800">Custom Event Trigger</p>
                  <p className="text-xs text-amber-600 mt-1">Trigger based on custom application events</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                value={triggerConfig.event_type || ""}
                onChange={(e) => setTriggerConfig({...triggerConfig, event_type: e.target.value})}
              >
                <option value="">Select an event type</option>
                <option value="campaign_completed">Campaign Completed</option>
                <option value="broadcast_sent">Broadcast Sent</option>
                <option value="contact_replied">Contact Replied</option>
                <option value="message_failed">Message Failed</option>
                <option value="template_approved">Template Approved</option>
                <option value="subscription_changed">Subscription Changed</option>
                <option value="custom">Custom Event</option>
              </select>
            </div>

            {triggerConfig.event_type === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Event Name</label>
                <input
                  type="text"
                  placeholder="my_custom_event"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                  value={triggerConfig.custom_event_name || ""}
                  onChange={(e) => setTriggerConfig({...triggerConfig, custom_event_name: e.target.value})}
                />
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A8B8A] to-[#1f6b6a] p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <LuPlay size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {editingTrigger ? "Edit Trigger" : "Create New Trigger"}
                </h2>
                <p className="text-sm text-white/70">
                  {step === 1 ? "Select trigger type" : "Configure trigger settings"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <LuX size={20} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? "bg-white text-[#2A8B8A]" : "bg-white/30 text-white"
                }`}>
                  {step > s ? <LuCheck size={16} /> : s}
                </div>
                {s < 2 && <div className={`w-16 h-1 rounded ${step > s ? "bg-white" : "bg-white/30"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 ? (
            // Step 1: Select Trigger Type
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">Choose what will start your automation</p>
              <div className="grid grid-cols-2 gap-3">
                {triggerTypes.map((trigger) => (
                  <button
                    key={trigger.type}
                    type="button"
                    onClick={() => {
                      setFormData({...formData, type: trigger.type});
                      setTriggerConfig({});
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.type === trigger.type
                        ? `border-[#2A8B8A] ${trigger.bgColor}`
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-10 h-10 ${trigger.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                      <span className={trigger.color}>{trigger.icon}</span>
                    </div>
                    <h4 className="font-medium text-gray-900">{trigger.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{trigger.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Step 2: Configure Trigger
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  Basic Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Name *</label>
                  <input
                    type="text"
                    placeholder="Enter a descriptive name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    placeholder="What does this trigger do?"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none resize-none"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              {/* Link to Workflow/Automation */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Link to Workflow or Automation *</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Workflow</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                      value={formData.workflow_id}
                      onChange={(e) => setFormData({...formData, workflow_id: e.target.value, automation_id: ""})}
                    >
                      <option value="">Select a workflow</option>
                      {workflows.map((w) => (
                        <option key={w._id} value={w._id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Or Automation</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
                      value={formData.automation_id}
                      onChange={(e) => setFormData({...formData, automation_id: e.target.value, workflow_id: ""})}
                    >
                      <option value="">Select an automation</option>
                      {automations.map((a) => (
                        <option key={a._id} value={a._id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Trigger Configuration */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  {selectedTypeConfig && (
                    <span className={`w-6 h-6 ${selectedTypeConfig.bgColor} rounded flex items-center justify-center`}>
                      <span className={`${selectedTypeConfig.color} scale-75`}>{selectedTypeConfig.icon}</span>
                    </span>
                  )}
                  {selectedTypeConfig?.label} Configuration
                </h3>
                {renderTriggerConfig()}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-4">
                  {["active", "inactive"].map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={formData.status === status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                        className="w-4 h-4 text-[#2A8B8A] focus:ring-[#2A8B8A]"
                      />
                      <span className="text-sm text-gray-700 capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
          <button
            onClick={() => step === 1 ? onClose() : setStep(1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <LuChevronLeft size={18} />
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2A8B8A] text-white rounded-lg font-medium hover:bg-[#238080] transition-colors"
            >
              Continue
              <LuChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name || (!formData.workflow_id && !formData.automation_id)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2A8B8A] text-white rounded-lg font-medium hover:bg-[#238080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <LuCheck size={18} />
                  {editingTrigger ? "Update Trigger" : "Create Trigger"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
