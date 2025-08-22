"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../services/apiService';
import {
  MdAdd,
  MdAutoAwesome,
  MdRocket,
  MdBuild,
  MdList,
  MdGridView,
  MdSearch,
  MdFilterList,
  MdStar,
  MdChat,
  MdTrendingUp,
  MdAttachMoney,
  MdHandshake,
  MdArrowBack,
  MdClose,
  MdPlayArrow,
  MdPause,
  MdEdit,
  MdCheck,
  MdDelete,
  MdBugReport,
  MdAccessTime,
  MdFlashOn,
  MdShoppingCart,
  MdEvent,
  MdNotifications,
  MdEmail,
  MdPhone,
  MdLink,
  MdSchedule,
  MdPerson,
  MdBusinessCenter,
  MdHome,
  MdLocationOn,
  MdCelebration,
  MdFavorite,
  MdQuestionAnswer,
  MdHelp
} from "react-icons/md";

// Toast notification function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // You can implement a proper toast system later
  if (type === 'success') {
    console.log('✅ ' + message);
  } else {
    console.error('❌ ' + message);
  }
};

// Types
interface Automation {
  _id: string | null;
  name: string;
  description?: string;
  trigger_type: string;
  status: 'active' | 'paused' | 'draft';
  created_at: string;
  workflow: any[];
}

// Main component
function AutomationsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'templates'>('list');
  
  // Test modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testAutomationId, setTestAutomationId] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Mock templates data
  const templates = [
    {
      id: 'welcome',
      name: 'Welcome New Users',
      description: 'Send a personalized welcome message to new sign-ups',
      category: 'engagement',
      icon: 'MdCelebration',
      color: 'bg-gradient-to-br from-[#2A8B8A] to-[#238080]',
      popular: true,
      trigger: { type: 'user_signup' },
      workflow: []
    },
    {
      id: 'abandoned-cart',
      name: 'Abandoned Cart Recovery',
      description: 'Re-engage customers who left items in their cart',
      category: 'revenue',
      icon: 'MdShoppingCart',
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
      popular: true,
      trigger: { type: 'cart_abandonment' },
      workflow: []
    },
    {
      id: 'custom-4step',
      name: '4-Step Business Automation',
      description: 'Complete business workflow: Trigger → Response → Data Collection → Custom Action',
      category: 'business',
      icon: 'MdAutoAwesome',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      popular: true,
      trigger: { type: 'keyword' },
      workflow: []
    }
  ];

  const categories = [
    { id: "all", label: "All", icon: <MdList className="w-4 h-4" /> },
    { id: "popular", label: "Most popular", icon: <MdStar className="w-4 h-4" /> },
    { id: "engagement", label: "Improve engagement", icon: <MdChat className="w-4 h-4" /> },
    { id: "revenue", label: "Increase revenue", icon: <MdAttachMoney className="w-4 h-4" /> },
    { id: "business", label: "Business Automation", icon: <MdBusinessCenter className="w-4 h-4" /> }
  ];

  // Load automations from backend
  const loadAutomations = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }


      const response = await apiService.getOptional('/automations');

      if (response) {
        // Normalize array source
        const dataArray = Array.isArray(response) ? response : (response.automations && Array.isArray(response.automations) ? response.automations : null);
        if (dataArray) {
          // Ensure each automation has an _id when possible. Try several common id fields.
          const normalized = dataArray.map((a: any, idx: number) => {
            const foundId = a?._id ?? a?.id ?? a?.uuid ?? a?.id_str ?? a?.uid ?? (a && a._meta && a._meta.id) ?? null;
            return {
              ...a,
              // store null explicitly when no id found so callers can handle it
              _id: foundId ?? null,
              // keep a client-only fallback key for rendering if needed
              __clientTempId: foundId ? undefined : `tmp-${idx}`,
            };
          });
          setAutomations(normalized);
        } else {
          console.log('No automations found in response:', response);
          setAutomations([]);
        }
      } else {
        // Automations endpoint not available
        console.log('Automations endpoint not available, showing empty automations');
        setAutomations([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.log('Failed to load automations, showing empty automations:', error);
      setAutomations([]);
      setLoading(false);
    }
  };

  const createFromTemplate = (template: any) => {
    const params = new URLSearchParams();
    if (template) {
      params.set('template', template.id);
    }
    const queryString = params.toString();
    const url = `/automations/builder${queryString ? `?${queryString}` : ''}`;
    router.push(url);
  };

  const renderIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      MdCelebration,
      MdShoppingCart,
      MdAutoAwesome,
      MdBusinessCenter
    };
    const IconComponent = icons[iconName] || MdAutoAwesome;
    return <IconComponent className="w-8 h-8" />;
  };

  // Automation action functions
  const toggleAutomationStatus = async (automationId: string, currentStatus: string) => {
    if (!automationId) {
      console.error('Cannot toggle automation: missing id');
      showToast('Cannot update automation: missing id', 'error');
      return;
    }

    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      console.log(`Toggling automation ${automationId} from ${currentStatus} to ${newStatus}`);

      // Use patch method for partial updates
      try {
        await apiService.patchAutomation(automationId, { status: newStatus });
      } catch (err) {
        // Log detailed server error if available
        console.error('Patch failed, error:', err);
        // Try to surface server response if it's a JSON error
        try {
          // Attempt a direct fetch to read response body for debugging
          const token = localStorage.getItem('token');
          const res = await fetch(`${apiService.baseURL}/automations/${automationId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ status: newStatus })
          });

          let bodyText = null;
          try { bodyText = await res.text(); } catch(e) { bodyText = String(e); }
          console.error('Direct PATCH response status:', res.status, res.statusText, 'body:', bodyText);
        } catch (fetchErr) {
          console.error('Direct PATCH attempt failed:', fetchErr);
        }
        throw err;
      }

      // Update local state
      setAutomations(prev => prev.map(automation => 
        automation._id === automationId 
          ? { ...automation, status: newStatus as 'active' | 'paused' | 'draft' }
          : automation
      ));

      showToast(`Automation ${newStatus === 'active' ? 'activated' : 'paused'}`, 'success');
    } catch (error) {
      console.error('Failed to toggle automation status:', error);
      showToast('Failed to update automation status', 'error');
    }
  };

  const deleteAutomation = async (automationId: string) => {
    if (!confirm('Are you sure you want to delete this automation? This action cannot be undone.')) {
      return;
    }

    if (!automationId) {
      console.error('Cannot delete automation: missing id');
      showToast('Cannot delete automation: missing id', 'error');
      return;
    }

    try {
      console.log(`Deleting automation ${automationId}`);
      await apiService.deleteAutomation(automationId);

      // Remove from local state
      setAutomations(prev => prev.filter(automation => automation._id !== automationId));

      showToast('Automation deleted successfully!', 'success');
    } catch (error) {
      console.error('Failed to delete automation:', error);
      showToast('Failed to delete automation', 'error');
    }
  };

  const openTestModal = (automationId: string) => {
    setTestAutomationId(automationId);
    setShowTestModal(true);
    setTestPhoneNumber('');
  };

  const handleTestSubmit = async () => {
    if (!testPhoneNumber.trim() || !testAutomationId) return;

    setIsTesting(true);
    try {
      console.log(`Testing automation ${testAutomationId} with phone ${testPhoneNumber}`);
      
      // Call test API endpoint
      const response = await fetch(`${apiService.baseURL}/automations/${testAutomationId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          phone_number: testPhoneNumber.replace(/\D/g, ''), // Remove non-digits
          test_mode: true 
        }),
      });

      if (!response.ok) {
        throw new Error('Test failed');
      }

      const result = await response.json();
      console.log('Test result:', result);
      
      showToast('Test message sent successfully!', 'success');
      setShowTestModal(false);
      setTestPhoneNumber('');
      setTestAutomationId(null);
    } catch (error) {
      console.error('Failed to test automation:', error);
      showToast('Failed to send test message', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadAutomations();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-black rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ backgroundColor: '#F0F6FF', minHeight: '100vh', padding: '1.5rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {currentView !== "list" && (
            <button
              onClick={() => setCurrentView("list")}
              className="flex items-center gap-2 text-gray-600 hover:text-black transition-all duration-200 p-2 rounded-xl hover:bg-white/50 backdrop-blur-sm"
            >
              <MdArrowBack className="w-5 h-5" />
              Back
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-black">
              {currentView === "templates" ? "Create an automation" : "Automations"}
            </h1>
            <p className="text-gray-600 mt-2">
              {currentView === "templates" 
                ? "Choose from our pre-built automations or create your own 4-step business workflow"
                : "Set up automated workflows to streamline your messaging"
              }
            </p>
          </div>
        </div>
        {currentView === "list" && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                params.set('template', 'custom-enhanced');
                router.push(`/automations/builder?${params.toString()}`);
              }}
              className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-6 py-3 font-medium transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <MdBuild className="w-5 h-5" />
              Create Automation
            </button>
            <button
              onClick={() => setCurrentView("templates")}
              className="bg-gradient-to-r from-[#2A8B8A] to-[#1e6b6b] text-white px-6 py-3 font-medium hover:from-[#238080] hover:to-[#1a5c5c] transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <MdAdd className="w-5 h-5" />
              Browse Templates
            </button>
          </div>
        )}
      </div>

      {/* Templates View */}
      {currentView === "templates" && (
        <div className="space-y-6">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg"
              >
                {category.icon}
                {category.label}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white/80 backdrop-blur-sm border border-white/50 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer rounded-xl hover:border-white/70 hover:-translate-y-1 shadow-lg"
                onClick={() => createFromTemplate(template)}
              >
                <div className={`w-14 h-14 ${template.color} flex items-center justify-center text-white mb-4 rounded-xl shadow-lg`}>
                  {renderIcon(template.icon)}
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">{template.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{template.description}</p>
                {template.popular && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-medium px-2 py-1 rounded-full">
                      <MdStar className="w-3 h-3" />
                      Popular
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {currentView === "list" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm border border-white/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Automations</p>
                  <p className="text-2xl font-bold text-black">{automations.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/50 bg-white/50">
                  <MdAutoAwesome className="w-6 h-6 text-[#2A8B8A]" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-white/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-black">{automations.filter(a => a.status === "active").length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-200 bg-emerald-50">
                  <MdPlayArrow className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-white/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paused</p>
                  <p className="text-2xl font-bold text-black">{automations.filter(a => a.status === "paused").length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-amber-200 bg-amber-50">
                  <MdPause className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-white/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Draft</p>
                  <p className="text-2xl font-bold text-black">{automations.filter(a => a.status === "draft").length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/50 bg-white/50">
                  <MdEdit className="w-6 h-6 text-[#2A8B8A]" />
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {automations.length === 0 && (
            <div className="bg-white/80 backdrop-blur-sm border border-white/50 p-12 text-center rounded-xl shadow-lg">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-xl border border-white/50 bg-white/50">
                <MdAutoAwesome className="w-8 h-8 text-[#2A8B8A]" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">No automations yet</h3>
              <p className="text-gray-600 mb-6">Create your first 4-step business automation: Trigger → Response → Data Collection → Custom Action</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('template', 'custom-enhanced');
                    router.push(`/automations/builder?${params.toString()}`);
                  }}
                  className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] hover:from-[#238080] hover:to-[#1e6b6b] text-white px-6 py-3 font-medium transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <MdBuild className="w-5 h-5" />
                  Create Automation
                </button>
                <button
                  onClick={() => setCurrentView("templates")}
                  className="bg-gradient-to-r from-[#2A8B8A] to-[#1e6b6b] text-white px-6 py-3 font-medium hover:from-[#238080] hover:to-[#1a5c5c] transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <MdAdd className="w-5 h-5" />
                  Browse Templates
                </button>
              </div>
            </div>
          )}

          {/* Automations List (if we have any) */}
          {automations.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-white/50">
                <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                  <MdList className="w-5 h-5" />
                  Your Automations
                </h2>
              </div>
              <div className="divide-y divide-white/50">
                {automations.map((automation, index) => (
                  <div key={`${automation._id ?? automation.__clientTempId ?? 'automation'}-${index}`} className="p-6 hover:bg-white/50 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-black">{automation.name}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                            automation.status === "active" 
                              ? "text-emerald-700 border-emerald-200 bg-emerald-50" :
                            automation.status === "paused" 
                              ? "text-amber-700 border-amber-200 bg-amber-50" :
                            "text-[#2A8B8A] border-[#2A8B8A]/30 bg-[#2A8B8A]/10"
                          }`}>
                            {automation.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{automation.description || "No description"}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MdFlashOn className="w-4 h-4" />
                            Trigger: {automation.trigger_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <MdAccessTime className="w-4 h-4" />
                            Created: {new Date(automation.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openTestModal(automation._id ?? '')}
                          disabled={!automation._id}
                          title={!automation._id ? 'Automation missing id; cannot test' : 'Test automation'}
                          className={`text-[#2A8B8A] border border-[#2A8B8A]/30 hover:bg-[#2A8B8A]/10 px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-1 rounded-lg shadow-lg hover:shadow-xl backdrop-blur-sm ${!automation._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <MdBugReport className="w-4 h-4" />
                          Test
                        </button>
                        <button
                          onClick={() => toggleAutomationStatus(automation._id ?? '', automation.status)}
                          disabled={!automation._id}
                          title={!automation._id ? 'Automation missing id; cannot change status' : (automation.status === 'active' ? 'Pause automation' : 'Activate automation')}
                          className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg flex items-center gap-1 border shadow-lg hover:shadow-xl backdrop-blur-sm ${automation.status === "active" ? "text-amber-700 border-amber-200 hover:bg-amber-50" : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"} ${!automation._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {automation.status === 'active' ? (
                            <>
                              <MdPause className="w-4 h-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <MdCheck className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => deleteAutomation(automation._id ?? '')}
                          disabled={!automation._id}
                          title={!automation._id ? 'Automation missing id; cannot delete' : 'Delete automation'}
                          className={`text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg flex items-center gap-1 shadow-lg hover:shadow-xl backdrop-blur-sm ${!automation._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <MdDelete className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Test Phone Number Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                  <MdBugReport className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-black">Test Automation</h2>
                  <p className="text-sm text-gray-600">Send test message to phone number</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestPhoneNumber("");
                  setTestAutomationId(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-white/50"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-black mb-2">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="+1234567890 or 1234567890"
                  className="w-full px-4 py-3 border border-white/50 rounded-xl focus:ring-2 focus:ring-[#2A8B8A] focus:border-[#2A8B8A] transition-all duration-200 text-black placeholder-gray-500 bg-white/50 backdrop-blur-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter phone number with country code (e.g., +1234567890)
                </p>
              </div>

              <div className="bg-gradient-to-r from-[#2A8B8A]/10 to-[#238080]/10 p-4 rounded-xl border border-[#2A8B8A]/20">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#2A8B8A]/30 bg-white/50 backdrop-blur-sm">
                    <svg className="w-3 h-3 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#2A8B8A] mb-1">Test Information</h4>
                    <p className="text-xs text-gray-600">
                      This will execute the automation workflow and send the configured messages to the specified phone number.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestPhoneNumber("");
                  setTestAutomationId(null);
                }}
                className="flex-1 px-4 py-3 border border-white/50 text-gray-700 rounded-xl hover:bg-white/50 transition-all duration-200 font-medium shadow-lg hover:shadow-xl backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleTestSubmit}
                disabled={isTesting || !testPhoneNumber.trim()}
                className="flex-1 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-4 py-3 rounded-xl hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isTesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <MdBugReport className="w-4 h-4" />
                    Send Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with ProtectedRoute - this is the key fix!
const ProtectedAutomationsPage = () => {
  return (
    <ProtectedRoute>
      <AutomationsPage />
    </ProtectedRoute>
  );
};

export default ProtectedAutomationsPage;
