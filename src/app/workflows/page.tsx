"use client";
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import CreateWorkflowModal from "./CreateWorkflowModal";

type Workflow = {
  _id: string;
  name: string;
  description: string;
  steps: any[];
  status: "active" | "inactive" | "draft";
  created_at: string;
  updated_at: string;
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const data = await apiService.get("/workflows");
      setWorkflows(data?.workflows || []);
    } catch (error) {
      console.error("Failed to load workflows:", error);
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
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      const workflow = workflows.find(w => w._id === workflowId);
      if (!workflow) return;

      const response = await fetch(`http://localhost:8000/workflows/${workflowId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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

  const getStepTypeIcon = (stepType: string) => {
    switch (stepType) {
      case "send_message":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case "wait":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "condition":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <h1 className="text-3xl font-bold text-black">Workflows</h1>
          <p className="text-gray-600 mt-2">Design step-by-step automation workflows</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#2A8B8A] text-white px-6 py-3 font-medium hover:bg-[#238080] transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Workflow
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Workflows</p>
              <p className="text-2xl font-bold text-black">{workflows.length}</p>
            </div>
            <div className="w-12 h-12 bg-black flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-black">{workflows.filter(w => w.status === "active").length}</p>
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
              <p className="text-sm font-medium text-gray-600">Total Steps</p>
              <p className="text-2xl font-bold text-black">{workflows.reduce((sum, w) => sum + w.steps.length, 0)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-black">{workflows.filter(w => w.status === "draft").length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-300 flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-black mb-2">No workflows yet</h3>
          <p className="text-gray-600 mb-6">Create your first workflow to start building automation sequences.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#2A8B8A] text-white px-6 py-3 font-medium hover:bg-[#238080] transition-colors"
          >
            Create Your First Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workflows.map((workflow) => (
            <div key={workflow._id} className="bg-white border border-gray-200">
              {/* Workflow Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-black">{workflow.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium ${
                        workflow.status === "active" ? "bg-[#2A8B8A] text-white" :
                        workflow.status === "inactive" ? "bg-gray-400 text-white" :
                        "bg-gray-300 text-black"
                      }`}>
                        {workflow.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{workflow.description || "No description"}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{workflow.steps.length} steps</span>
                      <span>Created: {new Date(workflow.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleWorkflowStatus(workflow._id, workflow.status)}
                      className={`px-3 py-1 text-xs font-medium transition-colors ${
                        workflow.status === "active" 
                          ? "bg-gray-400 text-white hover:bg-gray-500" 
                          : "bg-[#2A8B8A] text-white hover:bg-[#238080]"
                      }`}
                    >
                      {workflow.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteWorkflow(workflow._id)}
                      className="bg-red-600 text-white px-3 py-1 text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="p-6">
                {workflow.steps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">No steps configured</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Workflow Steps:</h4>
                    {workflow.steps.slice(0, 3).map((step, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
                        <div className="flex items-center justify-center w-8 h-8 bg-[#2A8B8A] text-white text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          {getStepTypeIcon(step.type)}
                          <span className="text-sm font-medium capitalize">{step.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex-1 text-sm text-gray-500 truncate">
                          {step.type === "send_message" && step.config?.template && `Template: ${step.config.template}`}
                          {step.type === "wait" && step.config?.duration && `Wait: ${step.config.duration}s`}
                          {step.type === "condition" && "Conditional logic"}
                        </div>
                      </div>
                    ))}
                    {workflow.steps.length > 3 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        +{workflow.steps.length - 3} more steps
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <CreateWorkflowModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadWorkflows();
          }}
        />
      )}
    </div>
  );
}
