"use client";
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import { SERVER_URI } from "@/config/server";
import CreateWorkflowModal from "./CreateWorkflowModal";

// Types
type WorkflowTrigger = {
  type: 'message_received' | 'keyword' | 'schedule' | 'webhook' | 'contact_created' | 'tag_added';
  config: Record<string, any>;
};

type WorkflowAction = {
  id: string;
  type: 'send_message' | 'send_template' | 'add_tag' | 'remove_tag' | 'wait' | 'condition' | 'webhook' | 'assign_agent';
  config: Record<string, any>;
  position: number;
};

type Workflow = {
  _id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  status: "active" | "paused" | "draft";
  stats: {
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    last_run?: string;
  };
  created_at: string;
  updated_at: string;
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'paused' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await apiService.get("/workflows");
      setWorkflows(data?.workflows || []);
    } catch (error: any) {
      // Endpoint may not exist yet - show empty state
      console.log("Workflows endpoint not available yet:", error?.message);
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      const result = await apiService.delete(`/workflows/${workflowId}`);

      if (result) {
        loadWorkflows();
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error);
    }
  };

  const toggleWorkflowStatus = async (workflowId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    
    try {
      const workflow = workflows.find(w => w._id === workflowId);
      if (!workflow) return;

      const response = await fetch(`${SERVER_URI}/workflows/${workflowId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...workflow,
          status: newStatus,
        }),
      });

      if (response.ok) {
        loadWorkflows();
      }
    } catch (error) {
      console.error("Failed to update workflow status:", error);
    }
  };

  // Filter workflows based on tab and search
  const filteredWorkflows = workflows.filter(w => {
    const matchesTab = activeTab === 'all' || w.status === activeTab;
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         w.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Get trigger icon
  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'message_received':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'keyword':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        );
      case 'schedule':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'webhook':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'contact_created':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'tag_added':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  // Get action icon
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_message':
      case 'send_template':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'wait':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'condition':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'add_tag':
      case 'remove_tag':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'webhook':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'assign_agent':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2A8B8A]/20 border-t-[#2A8B8A] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1d6b6a] rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Automation Workflows</h1>
                <p className="text-white/80 mt-1">Build powerful multi-step automations with triggers and actions</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-[#2A8B8A] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Workflow
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Workflows</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{workflows.length}</p>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#2A8B8A] to-[#1d6b6a] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{workflows.filter(w => w.status === "active").length}</p>
              <p className="text-xs text-gray-400 mt-1">Running now</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Paused</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{workflows.filter(w => w.status === "paused").length}</p>
              <p className="text-xs text-gray-400 mt-1">Temporarily stopped</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Drafts</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">{workflows.filter(w => w.status === "draft").length}</p>
              <p className="text-xs text-gray-400 mt-1">In progress</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] outline-none transition-all"
            />
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {(['all', 'active', 'paused', 'draft'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                  activeTab === tab 
                    ? 'bg-white text-[#2A8B8A] shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workflows List */}
      {filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-[#2A8B8A]/10 to-[#2A8B8A]/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchQuery ? 'No workflows found' : 'Create your first workflow'}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {searchQuery 
              ? `No workflows match "${searchQuery}". Try a different search term.`
              : 'Automate your WhatsApp messaging with powerful workflows. Set triggers, define actions, and let the magic happen.'
            }
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Workflow
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow._id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              {/* Workflow Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        workflow.status === 'active' ? 'bg-green-100' :
                        workflow.status === 'paused' ? 'bg-amber-100' :
                        'bg-gray-100'
                      }`}>
                        {getTriggerIcon(workflow.trigger?.type || 'message_received')}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                        <p className="text-sm text-gray-500">{workflow.description || "No description"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    workflow.status === "active" ? "bg-green-100 text-green-700" :
                    workflow.status === "paused" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {workflow.status === 'active' ? '● Active' : 
                     workflow.status === 'paused' ? '◐ Paused' : '○ Draft'}
                  </span>
                </div>
                
                {/* Workflow Stats */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{workflow.actions?.length || 0} actions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>{workflow.stats?.total_runs || 0} runs</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(workflow.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions Preview */}
              <div className="p-4 bg-gray-50/50">
                {(!workflow.actions || workflow.actions.length === 0) ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">No actions configured</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {workflow.actions.slice(0, 4).map((action, index) => (
                      <div key={action.id || index} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100 shrink-0">
                        <div className="w-6 h-6 rounded-full bg-[#2A8B8A]/10 flex items-center justify-center text-[#2A8B8A]">
                          {getActionIcon(action.type)}
                        </div>
                        <span className="text-xs font-medium text-gray-600 capitalize whitespace-nowrap">
                          {action.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                    {workflow.actions.length > 4 && (
                      <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 shrink-0">
                        +{workflow.actions.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedWorkflow(workflow)}
                    className="px-4 py-2 text-sm font-medium text-[#2A8B8A] hover:bg-[#2A8B8A]/5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleWorkflowStatus(workflow._id, workflow.status)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      workflow.status === "active" 
                        ? "text-amber-600 hover:bg-amber-50" 
                        : "text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {workflow.status === "active" ? "Pause" : "Activate"}
                  </button>
                </div>
                <button
                  onClick={() => deleteWorkflow(workflow._id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workflow Modal - Simple Version for Now */}
      {showCreateModal && (
        <CreateWorkflowModal 
          onSuccess={() => {
            setShowCreateModal(false);
            loadWorkflows();
          }}
        />
      )}
    </div>
  );
}
