"use client";
import { useState } from "react";

type Automation = {
  _id: string;
  name: string;
  description: string;
};

interface CreateTriggerModalProps {
  automations: Automation[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTriggerModal({ automations, onClose, onSuccess }: CreateTriggerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "keyword",
    automation_id: "",
    status: "active"
  });
  
  const [triggerConfig, setTriggerConfig] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.automation_id) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/triggers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          config: triggerConfig
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert("Failed to create trigger");
      }
    } catch (error) {
      console.error("Failed to create trigger:", error);
      alert("Failed to create trigger");
    } finally {
      setLoading(false);
    }
  };

  const renderTriggerConfig = () => {
    switch (formData.type) {
      case "keyword":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Keywords (comma-separated)</label>
              <input
                type="text"
                placeholder="hello, hi, start, help"
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={triggerConfig.keywords || ""}
                onChange={(e) => setTriggerConfig({...triggerConfig, keywords: e.target.value})}
              />
              <p className="text-sm text-gray-500 mt-1">Trigger will activate when any of these keywords are received</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="case_sensitive"
                checked={triggerConfig.case_sensitive || false}
                onChange={(e) => setTriggerConfig({...triggerConfig, case_sensitive: e.target.checked})}
                className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
              />
              <label htmlFor="case_sensitive" className="text-sm text-gray-700">Case sensitive matching</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="exact_match"
                checked={triggerConfig.exact_match || false}
                onChange={(e) => setTriggerConfig({...triggerConfig, exact_match: e.target.checked})}
                className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
              />
              <label htmlFor="exact_match" className="text-sm text-gray-700">Exact word match only</label>
            </div>
          </div>
        );
      
      case "time":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Schedule Type</label>
              <select
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={triggerConfig.schedule_type || "once"}
                onChange={(e) => setTriggerConfig({...triggerConfig, schedule_type: e.target.value})}
              >
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="cron">Custom (Cron)</option>
              </select>
            </div>
            
            {triggerConfig.schedule_type === "cron" ? (
              <div>
                <label className="block text-sm font-medium text-black mb-2">Cron Expression</label>
                <input
                  type="text"
                  placeholder="0 9 * * 1-5 (Every weekday at 9 AM)"
                  className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                  value={triggerConfig.cron_expression || ""}
                  onChange={(e) => setTriggerConfig({...triggerConfig, cron_expression: e.target.value})}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use cron format: minute hour day month day-of-week
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-black mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                  value={triggerConfig.datetime || ""}
                  onChange={(e) => setTriggerConfig({...triggerConfig, datetime: e.target.value})}
                />
              </div>
            )}
            
            {triggerConfig.schedule_type === "weekly" && (
              <div>
                <label className="block text-sm font-medium text-black mb-2">Days of Week</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <label key={day} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={triggerConfig.days_of_week?.includes(day) || false}
                        onChange={(e) => {
                          const days = triggerConfig.days_of_week || [];
                          if (e.target.checked) {
                            setTriggerConfig({...triggerConfig, days_of_week: [...days, day]});
                          } else {
                            setTriggerConfig({...triggerConfig, days_of_week: days.filter((d: string) => d !== day)});
                          }
                        }}
                        className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
                      />
                      <span className="text-sm">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case "webhook":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Webhook URL</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300">
                  POST
                </span>
                <input
                  type="url"
                  placeholder="https://your-webhook-url.com/endpoint"
                  className="flex-1 border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                  value={triggerConfig.webhook_url || ""}
                  onChange={(e) => setTriggerConfig({...triggerConfig, webhook_url: e.target.value})}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">External services can trigger this automation via webhook</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-2">Secret Key (optional)</label>
              <input
                type="text"
                placeholder="webhook-secret-key"
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={triggerConfig.secret_key || ""}
                onChange={(e) => setTriggerConfig({...triggerConfig, secret_key: e.target.value})}
              />
              <p className="text-sm text-gray-500 mt-1">Optional secret for webhook validation</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-2">Expected Headers (optional)</label>
              <textarea
                placeholder="Content-Type: application/json&#10;X-Custom-Header: value"
                rows={3}
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={triggerConfig.expected_headers || ""}
                onChange={(e) => setTriggerConfig({...triggerConfig, expected_headers: e.target.value})}
              />
              <p className="text-sm text-gray-500 mt-1">One header per line in format: Header-Name: value</p>
            </div>
          </div>
        );
      
      case "api_call":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">API Endpoint</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300">
                  /api/trigger/
                </span>
                <input
                  type="text"
                  placeholder="my-automation"
                  className="flex-1 border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                  value={triggerConfig.endpoint || ""}
                  onChange={(e) => setTriggerConfig({...triggerConfig, endpoint: e.target.value})}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Custom API endpoint for triggering this automation</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-2">HTTP Methods</label>
              <div className="grid grid-cols-2 gap-2">
                {['GET', 'POST', 'PUT', 'DELETE'].map((method) => (
                  <label key={method} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={triggerConfig.allowed_methods?.includes(method) || false}
                      onChange={(e) => {
                        const methods = triggerConfig.allowed_methods || [];
                        if (e.target.checked) {
                          setTriggerConfig({...triggerConfig, allowed_methods: [...methods, method]});
                        } else {
                          setTriggerConfig({...triggerConfig, allowed_methods: methods.filter((m: string) => m !== method)});
                        }
                      }}
                      className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
                    />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="require_auth"
                checked={triggerConfig.require_auth || false}
                onChange={(e) => setTriggerConfig({...triggerConfig, require_auth: e.target.checked})}
                className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
              />
              <label htmlFor="require_auth" className="text-sm text-gray-700">Require authentication</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rate_limit"
                checked={triggerConfig.rate_limit || false}
                onChange={(e) => setTriggerConfig({...triggerConfig, rate_limit: e.target.checked})}
                className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
              />
              <label htmlFor="rate_limit" className="text-sm text-gray-700">Enable rate limiting</label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getTriggerTypeDescription = () => {
    switch (formData.type) {
      case "keyword":
        return "Trigger when specific keywords are received in messages";
      case "time":
        return "Trigger at specific times or on a schedule";
      case "webhook":
        return "Trigger via external webhook calls";
      case "api_call":
        return "Trigger via custom API endpoints";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-black">Create New Trigger</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black">Basic Information</h3>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                Trigger Name *
              </label>
              <input
                type="text"
                id="name"
                placeholder="Keyword Response Trigger"
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div>
              <label htmlFor="automation_id" className="block text-sm font-medium text-black mb-2">
                Select Automation *
              </label>
              <select
                id="automation_id"
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={formData.automation_id}
                onChange={(e) => setFormData({...formData, automation_id: e.target.value})}
                required
              >
                <option value="">Choose an automation...</option>
                {automations.map((automation) => (
                  <option key={automation._id} value={automation._id}>
                    {automation.name} - {automation.description}
                  </option>
                ))}
              </select>
              {automations.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  No automations available. Please create an automation first.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-black mb-2">
                Initial Status
              </label>
              <select
                id="status"
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Trigger Type Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black">Trigger Type</h3>
            
            <div>
              <label htmlFor="trigger_type" className="block text-sm font-medium text-black mb-2">
                Trigger Type *
              </label>
              <select
                id="trigger_type"
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={formData.type}
                onChange={(e) => {
                  setFormData({...formData, type: e.target.value});
                  setTriggerConfig({}); // Reset config when type changes
                }}
                required
              >
                <option value="keyword">Keyword Trigger</option>
                <option value="time">Time-based Trigger</option>
                <option value="webhook">Webhook Trigger</option>
                <option value="api_call">API Call Trigger</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">{getTriggerTypeDescription()}</p>
            </div>

            {renderTriggerConfig()}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || automations.length === 0}
              className="bg-[#2A8B8A] text-white px-6 py-3 font-medium hover:bg-[#238080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Trigger"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
