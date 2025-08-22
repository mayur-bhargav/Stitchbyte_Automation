"use client";
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import CreateTriggerModal from "./CreateTriggerModal";

type Trigger = {
  _id: string;
  name: string;
  type: string;
  config: any;
  automation_id: string;
  status: "active" | "inactive";
  created_at: string;
};

type Automation = {
  _id: string;
  name: string;
  description: string;
};

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [triggersData, automationsData] = await Promise.all([
        apiService.get("/triggers"),
        apiService.get("/automations")
      ]);

      setTriggers(triggersData?.triggers || []);
      setAutomations(automationsData?.automations || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTriggerStatus = async (triggerId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      const trigger = triggers.find(t => t._id === triggerId);
      if (!trigger) return;

      const result = await apiService.put(`/triggers/${triggerId}`, {
        ...trigger,
        status: newStatus,
      });

      if (result) {
        loadData();
      }
    } catch (error) {
      console.error("Failed to update trigger status:", error);
    }
  };

  const deleteTrigger = async (triggerId: string) => {
    if (!confirm("Are you sure you want to delete this trigger?")) return;

    try {
      const result = await apiService.delete(`/triggers/${triggerId}`);

      if (result) {
        loadData();
      }
    } catch (error) {
      console.error("Failed to delete trigger:", error);
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "keyword":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case "time":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "webhook":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case "api_call":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V9h5l-5-5-5 5h5v8z" />
          </svg>
        );
    }
  };

  const getAutomationName = (automationId: string) => {
    const automation = automations.find(a => a._id === automationId);
    return automation ? automation.name : "Unknown Automation";
  };

  const getTriggerDescription = (trigger: Trigger) => {
    switch (trigger.type) {
      case "keyword":
        return `Keywords: ${trigger.config.keywords || "Not configured"}`;
      case "time":
        return `Schedule: ${trigger.config.schedule_type || "Not configured"}`;
      case "webhook":
        return `Webhook URL: ${trigger.config.webhook_url || "Not configured"}`;
      case "api_call":
        return `API Endpoint: ${trigger.config.endpoint || "Not configured"}`;
      default:
        return "No configuration";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Triggers</h1>
          <p className="text-gray-600 mt-2">Manage what starts your automations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#2A8B8A] text-white px-6 py-3 font-medium hover:bg-[#238080] transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Trigger
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Triggers</p>
              <p className="text-2xl font-bold text-black">{triggers.length}</p>
            </div>
            <div className="w-12 h-12 bg-black flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V9h5l-5-5-5 5h5v8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-black">{triggers.filter(t => t.status === "active").length}</p>
            </div>
            <div className="w-12 h-12 bg-[#2A8B8A] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Keyword Triggers</p>
              <p className="text-2xl font-bold text-black">{triggers.filter(t => t.type === "keyword").length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Triggers</p>
              <p className="text-2xl font-bold text-black">{triggers.filter(t => t.type === "time").length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Triggers List */}
      {triggers.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V9h5l-5-5-5 5h5v8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-black mb-2">No triggers yet</h3>
          <p className="text-gray-600 mb-6">Create your first trigger to start automating based on events.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#2A8B8A] text-white px-6 py-3 font-medium hover:bg-[#238080] transition-colors"
          >
            Create Your First Trigger
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">Your Triggers</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {triggers.map((trigger) => (
              <div key={trigger._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 ${
                        trigger.status === "active" ? "bg-[#2A8B8A]" : "bg-gray-400"
                      } text-white`}>
                        {getTriggerIcon(trigger.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-black">{trigger.name}</h3>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-medium ${
                            trigger.status === "active" ? "bg-[#2A8B8A] text-white" : "bg-gray-400 text-white"
                          }`}>
                            {trigger.status.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">{trigger.type.replace('_', ' ')} Trigger</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-14 space-y-2">
                      <p className="text-sm text-gray-600">{getTriggerDescription(trigger)}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                          Automation: {getAutomationName(trigger.automation_id)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Created: {new Date(trigger.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTriggerStatus(trigger._id, trigger.status)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        trigger.status === "active" 
                          ? "bg-gray-400 text-white hover:bg-gray-500" 
                          : "bg-[#2A8B8A] text-white hover:bg-[#238080]"
                      }`}
                    >
                      {trigger.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteTrigger(trigger._id)}
                      className="bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Trigger Modal */}
      {showCreateModal && (
        <CreateTriggerModal
          automations={automations}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
