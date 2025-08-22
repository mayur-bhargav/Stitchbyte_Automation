"use client";
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";

interface CreateWorkflowModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type WorkflowStep = {
  type: string;
  config: any;
  critical?: boolean;
};

export default function CreateWorkflowModal({ onClose, onSuccess }: CreateWorkflowModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft"
  });
  
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>({
    type: "send_message",
    config: {},
    critical: true
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await apiService.get("/templates");
      setTemplates(data?.templates || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const addStep = () => {
    if (currentStep.type === "send_message" && !currentStep.config.template) {
      alert("Please select a template for the message step");
      return;
    }
    if (currentStep.type === "wait" && !currentStep.config.duration) {
      alert("Please set a duration for the wait step");
      return;
    }

    setSteps([...steps, { ...currentStep }]);
    setCurrentStep({
      type: "send_message",
      config: {},
      critical: true
    });
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
      setSteps(newSteps);
    } else if (direction === "down" && index < steps.length - 1) {
      const newSteps = [...steps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      setSteps(newSteps);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a workflow name");
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.post("/workflows", {
        ...formData,
        steps: steps
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

  const renderStepConfig = () => {
    switch (currentStep.type) {
      case "send_message":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Template</label>
              <select
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={currentStep.config.template || ""}
                onChange={(e) => setCurrentStep({
                  ...currentStep,
                  config: { ...currentStep.config, template: e.target.value }
                })}
              >
                <option value="">Select a template...</option>
                {templates
                  .filter(t => t.status === 'approved')
                  .map((template) => (
                    <option key={template.name} value={template.name}>
                      {template.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Phone Number (optional)</label>
              <input
                type="text"
                placeholder="Leave empty to use trigger context"
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={currentStep.config.phone || ""}
                onChange={(e) => setCurrentStep({
                  ...currentStep,
                  config: { ...currentStep.config, phone: e.target.value }
                })}
              />
              <p className="text-sm text-gray-500 mt-1">If empty, phone number will be taken from automation trigger</p>
            </div>
          </div>
        );
      
      case "wait":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Duration (seconds)</label>
              <input
                type="number"
                min="1"
                placeholder="30"
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={currentStep.config.duration || ""}
                onChange={(e) => setCurrentStep({
                  ...currentStep,
                  config: { ...currentStep.config, duration: parseInt(e.target.value) || 0 }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Description (optional)</label>
              <input
                type="text"
                placeholder="Wait for user response..."
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={currentStep.config.description || ""}
                onChange={(e) => setCurrentStep({
                  ...currentStep,
                  config: { ...currentStep.config, description: e.target.value }
                })}
              />
            </div>
          </div>
        );
      
      case "condition":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Condition Type</label>
              <select
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={currentStep.config.condition_type || "keyword"}
                onChange={(e) => setCurrentStep({
                  ...currentStep,
                  config: { ...currentStep.config, condition_type: e.target.value }
                })}
              >
                <option value="keyword">Keyword Match</option>
                <option value="time">Time-based</option>
                <option value="custom">Custom Logic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Condition Value</label>
              <input
                type="text"
                placeholder="yes, no, confirm"
                className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                value={currentStep.config.condition_value || ""}
                onChange={(e) => setCurrentStep({
                  ...currentStep,
                  config: { ...currentStep.config, condition_value: e.target.value }
                })}
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
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
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-black">Create New Workflow</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex">
            {/* Left Panel - Workflow Info & Steps */}
            <div className="flex-1 p-6 border-r border-gray-200">
              {/* Basic Information */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-black">Basic Information</h3>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                    Workflow Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Welcome Sequence"
                    className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    placeholder="Describe what this workflow does..."
                    rows={3}
                    className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
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
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black">Workflow Steps</h3>
                
                {steps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">No steps added yet</p>
                    <p className="text-xs text-gray-400">Add steps using the panel on the right</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200">
                        <div className="flex items-center justify-center w-8 h-8 bg-[#2A8B8A] text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          {getStepIcon(step.type)}
                          <span className="font-medium capitalize">{step.type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex-1 text-sm text-gray-500">
                          {step.type === "send_message" && step.config.template && `Template: ${step.config.template}`}
                          {step.type === "wait" && step.config.duration && `Wait: ${step.config.duration}s`}
                          {step.type === "condition" && step.config.condition_value && `Condition: ${step.config.condition_value}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveStep(index, "up")}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStep(index, "down")}
                            disabled={index === steps.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Add Step */}
            <div className="w-96 p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Add Step</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Step Type</label>
                  <select
                    className="w-full border border-gray-300 px-3 py-2 focus:border-[#2A8B8A] focus:outline-none"
                    value={currentStep.type}
                    onChange={(e) => setCurrentStep({
                      type: e.target.value,
                      config: {},
                      critical: true
                    })}
                  >
                    <option value="send_message">Send Message</option>
                    <option value="wait">Wait/Delay</option>
                    <option value="condition">Condition/Branch</option>
                  </select>
                </div>

                {renderStepConfig()}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="critical"
                    checked={currentStep.critical}
                    onChange={(e) => setCurrentStep({...currentStep, critical: e.target.checked})}
                    className="text-[#2A8B8A] focus:ring-[#2A8B8A]"
                  />
                  <label htmlFor="critical" className="text-sm text-gray-700">Critical step (stop workflow if fails)</label>
                </div>

                <button
                  type="button"
                  onClick={addStep}
                  className="w-full bg-[#2A8B8A] text-white py-2 px-4 font-medium hover:bg-[#238080] transition-colors"
                >
                  Add Step
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2A8B8A] text-white px-6 py-3 font-medium hover:bg-[#238080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Workflow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
