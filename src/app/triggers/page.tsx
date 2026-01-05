"use client";
import { useState, useEffect, ReactNode } from "react";
import { apiService } from "../services/apiService";
import CreateTriggerModal from "./CreateTriggerModal";
import {
  LuPlay,
  LuPlus,
  LuSearch,
  LuFilter,
  LuZap,
  LuClock,
  LuMessageSquare,
  LuWebhook,
  LuCode,
  LuTag,
  LuUsers,
  LuCalendar,
  LuPause,
  LuTrash2,
  LuPencil,
  LuCheck,
  LuX,
  LuRefreshCw,
  LuActivity,
  LuCircleAlert,
  LuCircleCheck,
  LuChevronRight,
  LuSettings,
  LuEye,
  LuEllipsisVertical
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

type TriggerStatus = "active" | "inactive" | "paused";

interface TriggerConfig {
  keywords?: string;
  case_sensitive?: boolean;
  exact_match?: boolean;
  schedule_type?: string;
  datetime?: string;
  cron_expression?: string;
  days_of_week?: string[];
  webhook_url?: string;
  secret_key?: string;
  endpoint?: string;
  method?: string;
  event_type?: string;
  tag_name?: string;
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
  status: TriggerStatus;
  stats?: {
    total_fires: number;
    successful_fires: number;
    failed_fires: number;
    last_fired?: string;
  };
  created_at: string;
  updated_at?: string;
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

// Trigger type configuration
const triggerTypeConfig: Record<TriggerType, { label: string; icon: ReactNode; color: string; bgColor: string; description: string }> = {
  keyword: {
    label: "Keyword Match",
    icon: <LuMessageSquare size={20} />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "Triggers when specific keywords are received"
  },
  schedule: {
    label: "Scheduled",
    icon: <LuClock size={20} />,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    description: "Triggers at specified times or intervals"
  },
  webhook: {
    label: "Webhook",
    icon: <LuWebhook size={20} />,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    description: "Triggers via external HTTP requests"
  },
  message_received: {
    label: "Message Received",
    icon: <LuZap size={20} />,
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: "Triggers when any message is received"
  },
  contact_created: {
    label: "New Contact",
    icon: <LuUsers size={20} />,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    description: "Triggers when a new contact is created"
  },
  tag_added: {
    label: "Tag Added",
    icon: <LuTag size={20} />,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    description: "Triggers when a tag is added to a contact"
  },
  api_call: {
    label: "API Call",
    icon: <LuCode size={20} />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    description: "Triggers via API endpoint calls"
  },
  event: {
    label: "Custom Event",
    icon: <LuActivity size={20} />,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    description: "Triggers on custom application events"
  }
};

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive" | "paused">("all");
  const [selectedType, setSelectedType] = useState<TriggerType | "all">("all");
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [triggersData, workflowsData, automationsData] = await Promise.all([
        apiService.get("/triggers"),
        apiService.get("/workflows"),
        apiService.get("/automations")
      ]);

      setTriggers(triggersData?.triggers || []);
      setWorkflows(workflowsData?.workflows || []);
      setAutomations(automationsData?.automations || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTriggerStatus = async (triggerId: string, currentStatus: TriggerStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      await apiService.post(`/triggers/${triggerId}/${newStatus === "active" ? "activate" : "deactivate"}`);
      loadData();
    } catch (error) {
      console.error("Failed to update trigger status:", error);
    }
  };

  const deleteTrigger = async (triggerId: string) => {
    if (!confirm("Are you sure you want to delete this trigger? This action cannot be undone.")) return;

    try {
      await apiService.delete(`/triggers/${triggerId}`);
      loadData();
    } catch (error) {
      console.error("Failed to delete trigger:", error);
    }
  };

  const getLinkedItemName = (trigger: Trigger) => {
    if (trigger.workflow_id) {
      const workflow = workflows.find(w => w._id === trigger.workflow_id);
      return workflow ? `Workflow: ${workflow.name}` : "Unknown Workflow";
    }
    if (trigger.automation_id) {
      const automation = automations.find(a => a._id === trigger.automation_id);
      return automation ? `Automation: ${automation.name}` : "Unknown Automation";
    }
    return "Not linked";
  };

  const getTriggerDescription = (trigger: Trigger) => {
    const config = trigger.config;
    switch (trigger.type) {
      case "keyword":
        return config.keywords ? `Keywords: ${config.keywords}` : "No keywords configured";
      case "schedule":
        if (config.schedule_type === "cron") {
          return `Cron: ${config.cron_expression || "Not set"}`;
        }
        return config.datetime ? `Scheduled: ${new Date(config.datetime).toLocaleString()}` : `Type: ${config.schedule_type || "Not configured"}`;
      case "webhook":
        return config.webhook_url ? `URL: ${config.webhook_url.substring(0, 40)}...` : "Webhook URL not set";
      case "api_call":
        return config.endpoint ? `Endpoint: ${config.endpoint}` : "API endpoint not configured";
      case "tag_added":
        return config.tag_name ? `Tag: ${config.tag_name}` : "Any tag";
      case "message_received":
        return "Triggers on any incoming message";
      case "contact_created":
        return "Triggers when new contacts are added";
      case "event":
        return config.event_type ? `Event: ${config.event_type}` : "Custom event";
      default:
        return trigger.description || "No description";
    }
  };

  // Filter triggers
  const filteredTriggers = triggers.filter(trigger => {
    const matchesSearch = trigger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          trigger.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || trigger.status === activeTab;
    const matchesType = selectedType === "all" || trigger.type === selectedType;
    return matchesSearch && matchesTab && matchesType;
  });

  // Calculate stats
  const stats = {
    total: triggers.length,
    active: triggers.filter(t => t.status === "active").length,
    inactive: triggers.filter(t => t.status === "inactive").length,
    paused: triggers.filter(t => t.status === "paused").length,
    totalFires: triggers.reduce((sum, t) => sum + (t.stats?.total_fires || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2A8B8A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading triggers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2A8B8A] to-[#1f6b6a] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <LuPlay size={24} />
              </div>
              <h1 className="text-2xl font-bold">Triggers</h1>
            </div>
            <p className="text-white/80 max-w-xl">
              Configure what starts your automations and workflows. Set up keyword matches, scheduled times, webhooks, and more.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-[#2A8B8A] px-5 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
          >
            <LuPlus size={20} />
            Create Trigger
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Triggers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <LuPlay className="text-gray-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <LuCircleCheck className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <LuX className="text-gray-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Paused</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.paused}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <LuPause className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Fires</p>
              <p className="text-2xl font-bold text-[#2A8B8A] mt-1">{stats.totalFires}</p>
            </div>
            <div className="w-12 h-12 bg-[#2A8B8A]/10 rounded-xl flex items-center justify-center">
              <LuZap className="text-[#2A8B8A]" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search triggers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <LuFilter className="text-gray-400" size={18} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TriggerType | "all")}
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] outline-none"
            >
              <option value="all">All Types</option>
              {Object.entries(triggerTypeConfig).map(([type, config]) => (
                <option key={type} value={type}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LuRefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mt-4 border-t border-gray-100 pt-4">
          {[
            { key: "all", label: "All", count: stats.total },
            { key: "active", label: "Active", count: stats.active },
            { key: "inactive", label: "Inactive", count: stats.inactive },
            { key: "paused", label: "Paused", count: stats.paused }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-[#2A8B8A] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Triggers List */}
      {filteredTriggers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <LuPlay className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || selectedType !== "all" ? "No triggers found" : "No triggers yet"}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || selectedType !== "all" 
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Triggers define what starts your automations. Create your first trigger to get started."}
          </p>
          {!searchQuery && selectedType === "all" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#2A8B8A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#238080] transition-colors inline-flex items-center gap-2"
            >
              <LuPlus size={20} />
              Create Your First Trigger
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTriggers.map((trigger) => {
            const typeConfig = triggerTypeConfig[trigger.type] || triggerTypeConfig.event;
            return (
              <div
                key={trigger._id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Type Icon */}
                    <div className={`w-12 h-12 ${typeConfig.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className={typeConfig.color}>{typeConfig.icon}</span>
                    </div>

                    {/* Trigger Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{trigger.name}</h3>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          trigger.status === "active" 
                            ? "bg-green-100 text-green-700"
                            : trigger.status === "paused"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {trigger.status.charAt(0).toUpperCase() + trigger.status.slice(1)}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${typeConfig.bgColor} ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{getTriggerDescription(trigger)}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <LuSettings size={14} />
                          {getLinkedItemName(trigger)}
                        </span>
                        {trigger.stats && (
                          <span className="flex items-center gap-1">
                            <LuZap size={14} />
                            {trigger.stats.total_fires} fires
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <LuCalendar size={14} />
                          Created {new Date(trigger.created_at).toLocaleDateString()}
                        </span>
                        {trigger.stats?.last_fired && (
                          <span className="flex items-center gap-1">
                            <LuClock size={14} />
                            Last fired {new Date(trigger.stats.last_fired).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleTriggerStatus(trigger._id, trigger.status)}
                      className={`p-2 rounded-lg transition-colors ${
                        trigger.status === "active"
                          ? "text-yellow-600 hover:bg-yellow-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                      title={trigger.status === "active" ? "Deactivate" : "Activate"}
                    >
                      {trigger.status === "active" ? <LuPause size={18} /> : <LuPlay size={18} />}
                    </button>
                    <button
                      onClick={() => setEditingTrigger(trigger)}
                      className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <LuPencil size={18} />
                    </button>
                    <button
                      onClick={() => deleteTrigger(trigger._id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <LuTrash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trigger Types Quick Reference */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Trigger Types</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(triggerTypeConfig).map(([type, config]) => (
            <div
              key={type}
              className={`p-4 rounded-xl ${config.bgColor} cursor-pointer hover:scale-[1.02] transition-transform`}
              onClick={() => {
                setSelectedType(type as TriggerType);
                setShowCreateModal(true);
              }}
            >
              <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3 ${config.color}`}>
                {config.icon}
              </div>
              <h4 className={`font-medium ${config.color}`}>{config.label}</h4>
              <p className="text-xs text-gray-600 mt-1">{config.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Trigger Modal */}
      {(showCreateModal || editingTrigger) && (
        <CreateTriggerModal
          workflows={workflows}
          automations={automations}
          editingTrigger={editingTrigger}
          defaultType={selectedType !== "all" ? selectedType : undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTrigger(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingTrigger(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
