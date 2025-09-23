"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import AutomationFlowBuilder from '../../components/automation/AutomationFlowBuilder';
import { apiService } from '../services/apiService';

// Import Material Design icons
import {
  MdAdd,
  MdAutoAwesome,
  MdSettings,
  MdPlayArrow,
  MdPause,
  MdDelete,
  MdEdit,
  MdVisibility,
  MdChat,
  MdPerson,
  MdShoppingCart,
  MdSupport,
  MdBusinessCenter,
  MdArrowBack,
  MdWarning,
  MdCheckCircle
} from "react-icons/md";

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger_type: string;
  preview_image?: string;
  tags: string[];
}

interface Automation {
  _id: string;
  name: string;
  description: string;
  is_active: boolean;
  trigger_config: any;
  workflow: any[];
  connections: any[];
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
  stats: {
    total_executions?: number;
    last_execution?: string;
  };
}

interface WhatsAppConnectionStatus {
  connected: boolean;
  status: string;
  message: string;
  action_required: string;
  connect_url: string;
}

export default function AutomationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'builder' | 'templates'>('dashboard');
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);

  // Check URL parameters on mount to set initial tab
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'builder') {
      setActiveTab('builder');
    }
  }, [searchParams]);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Helper function to switch tabs and update URL
  const switchTab = (tab: 'dashboard' | 'builder' | 'templates') => {
    setActiveTab(tab);
    
    // Update URL to reflect current mode
    const currentUrl = new URL(window.location.href);
    if (tab === 'builder') {
      currentUrl.searchParams.set('mode', 'builder');
    } else {
      currentUrl.searchParams.delete('mode');
    }
    
    // Update URL without causing a page reload
    window.history.pushState({}, '', currentUrl.toString());
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load automations first (most important)
      let automationsData: Automation[] = [];
      try {
        const automationsRes = await apiService.getAutomations();
        automationsData = (automationsRes as any)?.data || [];
      } catch (error) {
        console.error('Failed to load automations:', error);
        // Continue with empty array
      }

      // Load templates with fallback
      let templatesData: AutomationTemplate[] = [];
      try {
        const templatesRes = await apiService.getAutomationTemplates();
        templatesData = (templatesRes as any)?.data || [];
      } catch (error) {
        console.error('Templates not available:', error);
        // Use fallback templates
        templatesData = [
          {
            id: 'welcome_message',
            name: 'Welcome Message',
            description: 'Greet new customers and introduce your business',
            category: 'customer_service',
            trigger_type: 'welcome_message',
            tags: ['welcome', 'onboarding']
          },
          {
            id: 'lead_capture',
            name: 'Lead Capture',
            description: 'Collect customer information and qualify leads',
            category: 'sales',
            trigger_type: 'keyword',
            tags: ['lead', 'capture']
          },
          {
            id: 'faq_bot',
            name: 'FAQ Bot',
            description: 'Answer common questions automatically',
            category: 'customer_service',
            trigger_type: 'keyword',
            tags: ['faq', 'support']
          },
          {
            id: 'appointment_booking',
            name: 'Appointment Booking',
            description: 'Help customers schedule appointments',
            category: 'scheduling',
            trigger_type: 'keyword',
            tags: ['booking', 'schedule']
          },
          {
            id: 'order_status',
            name: 'Order Status',
            description: 'Check and update order status automatically',
            category: 'e_commerce',
            trigger_type: 'keyword',
            tags: ['orders', 'tracking']
          }
        ];
      }

      // Load WhatsApp status with fallback
      let statusData: WhatsAppConnectionStatus | null = null;
      try {
        const statusRes = await apiService.getWhatsAppConnectionStatus();
        statusData = (statusRes as any)?.data || statusRes;
      } catch (error) {
        console.error('WhatsApp status not available:', error);
        // Use fallback status
        statusData = {
          connected: false,
          status: 'unknown',
          message: 'Unable to check WhatsApp connection status',
          action_required: 'connect',
          connect_url: '/settings?tab=whatsapp'
        };
      }

      setAutomations(automationsData);
      setTemplates(templatesData);
      setWhatsappStatus(statusData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAutomation = async (automation: Automation) => {
    if (!automation._id) return;
    
    if (confirm(`Are you sure you want to delete "${automation.name}"?`)) {
      try {
        await apiService.deleteAutomation(automation._id);
        await loadDashboardData(); // Refresh list
      } catch (error) {
        console.error('Failed to delete automation:', error);
      }
    }
  };

  const handleToggleAutomation = async (automation: Automation) => {
    if (!automation._id) return;
    
    try {
      await apiService.updateAutomationStatus(automation._id, !automation.is_active);
      await loadDashboardData(); // Refresh list
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    }
  };

  const renderWhatsAppConnectionBanner = () => {
    if (!whatsappStatus || whatsappStatus.connected) return null;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <MdWarning className="text-amber-500 text-xl mt-0.5" />
          <div className="flex-1">
            <h3 className="text-amber-800 font-medium">WhatsApp Not Connected</h3>
            <p className="text-amber-700 text-sm mt-1">{whatsappStatus.message}</p>
            <button
              onClick={() => router.push(whatsappStatus.connect_url)}
              className="mt-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Connect WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {renderWhatsAppConnectionBanner()}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automations</h1>
          <p className="text-gray-600 mt-2">Create and manage your WhatsApp automation workflows</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MdSettings className="text-blue-600 text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Automations</p>
              <p className="text-2xl font-bold text-gray-900">{automations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <MdCheckCircle className="text-green-600 text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {automations.filter(a => a.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <MdPause className="text-yellow-600 text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paused</p>
              <p className="text-2xl font-bold text-gray-900">
                {automations.filter(a => !a.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MdChat className="text-purple-600 text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Executions</p>
              <p className="text-2xl font-bold text-gray-900">
                {automations.reduce((sum, a) => sum + (a.stats?.total_executions || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => switchTab('builder')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <MdAdd className="text-xl" />
          <span>Create New Automation</span>
        </button>
        
        <button
          onClick={() => switchTab('templates')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <MdAutoAwesome className="text-xl" />
          <span>Use Template</span>
        </button>
      </div>

      {/* Automations List */}
      <div className="bg-white rounded-lg shadow">
        
        {automations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MdAutoAwesome className="mx-auto text-gray-400 text-6xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No automations yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first automation or using a template.</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => switchTab('builder')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Create Automation
              </button>
              <button
                onClick={() => switchTab('templates')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Browse Templates
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {automations.map((automation) => (
              <div key={automation._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{automation.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        automation.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {automation.is_active ? 'Active' : 'Paused'}
                      </span>
                      {automation.category && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {automation.category}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{automation.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Trigger: {automation.trigger_config?.trigger_type || 'Unknown'}</span>
                      <span>Steps: {automation.workflow?.length || 0}</span>
                      {automation.stats?.total_executions !== undefined && (
                        <span>Executions: {automation.stats.total_executions}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleAutomation(automation)}
                      className={`p-2 rounded-md transition-colors ${
                        automation.is_active
                          ? 'bg-red-100 hover:bg-red-200 text-red-600'
                          : 'bg-green-100 hover:bg-green-200 text-green-600'
                      }`}
                      title={automation.is_active ? 'Pause automation' : 'Start automation'}
                    >
                      {automation.is_active ? <MdPause /> : <MdPlayArrow />}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedAutomation(automation);
                        switchTab('builder');
                      }}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-md transition-colors"
                      title="Edit automation"
                    >
                      <MdEdit />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteAutomation(automation)}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors"
                      title="Delete automation"
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation Templates</h1>
          <p className="text-gray-600 mt-2">Choose from our collection of pre-built automation workflows</p>
        </div>
        <button
          onClick={() => switchTab('dashboard')}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
        >
          <MdArrowBack />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MdAutoAwesome className="text-blue-600 text-xl" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <span className="text-xs text-gray-500 capitalize">{template.category.replace('_', ' ')}</span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setSelectedTemplate(template);
                  switchTab('builder');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFlowBuilder = () => (
    <div className="h-screen flex flex-col">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {selectedAutomation ? `Edit: ${selectedAutomation.name}` : 'Create New Automation'}
          </h1>
          <p className="text-gray-600 mt-1">Build your automation workflow using our visual flow builder</p>
        </div>
        <button
          onClick={() => {
            switchTab('dashboard');
            setSelectedAutomation(null);
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
        >
          <MdArrowBack />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Flow builder - takes remaining height */}
      <div className="flex-1 bg-white">
        <AutomationFlowBuilder 
          automationId={selectedAutomation?._id}
          onSave={(automationData: any) => {
            // Refresh dashboard after save
            loadDashboardData();
            switchTab('dashboard');
            setSelectedAutomation(null);
          }}
          onTest={() => {
            console.log('Test automation:', selectedAutomation);
          }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading automations...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {activeTab === 'builder' ? (
        // Full-screen layout for automation builder
        <div className="min-h-screen bg-gray-50">
          {renderFlowBuilder()}
        </div>
      ) : (
        // Normal layout for dashboard and templates
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'templates' && renderTemplates()}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}