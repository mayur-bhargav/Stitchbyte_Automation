"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../services/apiService';

// Toast notification function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`${type.toUpperCase()}: ${message}`);
};

type Broadcast = {
  id: string;
  name: string;
  message: string;
  companyId: string;
  total_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  completed_at?: string;
  template_name?: string;
  target_groups: string[];
  media_url?: string;
  media_type?: string;
};

type Contact = {
  phone: string;
  name?: string;
  tags: string[];
  created_at: string;
};

function BroadcastsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Create broadcast form state
  const [newBroadcast, setNewBroadcast] = useState({
    name: '',
    message: '',
    template_name: '',
    target_groups: [] as string[],
    scheduled_at: '',
    media_file: null as File | null
  });

  const [templates, setTemplates] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadBroadcasts();
      loadContacts();
      loadTemplates();
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('chatTheme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, [user]);

  const loadBroadcasts = async () => {
    if (!user) return;
    
    try {
      const data = await apiService.getOptional('/broadcasts');
      if (data) {
        const broadcastsData = data.broadcasts || [];
        // Filter broadcasts by user's company for security
        const userBroadcasts = broadcastsData.filter((broadcast: Broadcast) => 
          broadcast.companyId === user.companyId || !broadcast.companyId
        );
        setBroadcasts(userBroadcasts);
      } else {
        // Broadcasts endpoint not available
        setBroadcasts([]);
      }
    } catch (error) {
      console.error('Error loading broadcasts:', error);
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await apiService.getOptional('/contacts');
      if (data) {
        setContacts(data.contacts || []);
        
        // Extract unique tags from contacts
        const allTags = data.contacts?.flatMap((contact: Contact) => contact.tags || []) || [];
        const uniqueTags = Array.from(new Set(allTags));
        setAvailableTags(uniqueTags);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await apiService.getOptional('/templates');
      if (data) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateBroadcast = async () => {
    if (!newBroadcast.name || !newBroadcast.message) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newBroadcast.name);
      formData.append('message', newBroadcast.message);
      formData.append('template_name', newBroadcast.template_name);
      formData.append('target_groups', JSON.stringify(newBroadcast.target_groups));
      
      if (newBroadcast.scheduled_at) {
        formData.append('scheduled_at', newBroadcast.scheduled_at);
      }
      
      if (newBroadcast.media_file) {
        formData.append('media', newBroadcast.media_file);
      }

      await apiService.post('/broadcasts', formData);
      showToast('Broadcast created successfully!');
      setShowCreateModal(false);
      setNewBroadcast({
        name: '',
        message: '',
        template_name: '',
        target_groups: [],
        scheduled_at: '',
        media_file: null
      });
      loadBroadcasts();
    } catch (error) {
      console.error('Error creating broadcast:', error);
      showToast('Failed to create broadcast', 'error');
    }
  };

  // Filter broadcasts based on search and status
  const filteredBroadcasts = broadcasts.filter(broadcast => {
    const matchesSearch = broadcast.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         broadcast.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || broadcast.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2A8B8A] mx-auto"></div>
            <p className="text-center mt-4 text-black">Loading broadcasts...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F0F6FF] p-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 mb-6">
          <div className="p-6 border-b border-white/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-black">Broadcasts</h1>
                <p className="text-gray-600 mt-1">Send messages to multiple contacts at once</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-3 rounded-xl hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Broadcast
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search broadcasts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm text-black placeholder-gray-500 focus:border-[#2A8B8A] focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 transition-all duration-200"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm text-black focus:border-[#2A8B8A] focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sending">Sending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Broadcasts Grid */}
        <div className="space-y-6">
          {filteredBroadcasts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="text-center py-12 text-gray-600">
                <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-white/50 backdrop-blur-sm border border-white/50 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#2A8B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 616 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2 text-black">No broadcasts found</h3>
                <p className="mb-6 text-gray-600">Get started by creating your first broadcast</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-3 rounded-xl hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Create Broadcast
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredBroadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden group"
                >
                  {/* Broadcast Header */}
                  <div className="p-6 border-b border-white/50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-black mb-2">{broadcast.name}</h3>
                        <p className="text-gray-600 text-sm">
                          Created: {new Date(broadcast.created_at).toLocaleDateString()}
                        </p>
                        {broadcast.scheduled_at && (
                          <p className="text-gray-600 text-sm">
                            Scheduled: {new Date(broadcast.scheduled_at).toLocaleDateString()} at {new Date(broadcast.scheduled_at).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          broadcast.status === 'completed' ? 'bg-green-100 text-green-700' :
                          broadcast.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                          broadcast.status === 'failed' ? 'bg-red-100 text-red-700' :
                          broadcast.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
                        </span>
                        
                        <button
                          onClick={() => {
                            setSelectedBroadcast(broadcast);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-[#2A8B8A] hover:bg-white/50 rounded-lg transition-colors duration-200"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Message Preview */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                      <p className="text-gray-700 leading-relaxed line-clamp-3">
                        {broadcast.message}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-black">{broadcast.total_count || 0}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{broadcast.sent_count || 0}</div>
                      <div className="text-sm text-gray-600">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{broadcast.delivered_count || 0}</div>
                      <div className="text-sm text-gray-600">Delivered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{broadcast.failed_count || 0}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Broadcast Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white/50 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/50">
                <h2 className="text-2xl font-bold text-black">Create New Broadcast</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Broadcast Name */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Broadcast Name
                  </label>
                  <input
                    type="text"
                    value={newBroadcast.name}
                    onChange={(e) => setNewBroadcast({...newBroadcast, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm text-black placeholder-gray-500 focus:border-[#2A8B8A] focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 transition-all duration-200"
                    placeholder="Enter broadcast name"
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Template (Optional)
                  </label>
                  <select
                    value={newBroadcast.template_name}
                    onChange={(e) => {
                      const selectedTemplate = templates.find(t => t.name === e.target.value);
                      setNewBroadcast({
                        ...newBroadcast, 
                        template_name: e.target.value,
                        message: selectedTemplate ? selectedTemplate.body : newBroadcast.message
                      });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm text-black focus:border-[#2A8B8A] focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 transition-all duration-200"
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.name} value={template.name}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Message
                  </label>
                  <textarea
                    value={newBroadcast.message}
                    onChange={(e) => setNewBroadcast({...newBroadcast, message: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm text-black placeholder-gray-500 focus:border-[#2A8B8A] focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 transition-all duration-200 h-32 resize-none"
                    placeholder="Enter your message"
                  />
                </div>

                {/* Target Groups */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Target Groups
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    {availableTags.map((tag) => (
                      <label key={tag} className="flex items-center space-x-3 cursor-pointer hover:bg-white/20 p-2 rounded-lg transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={newBroadcast.target_groups.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewBroadcast({
                                ...newBroadcast,
                                target_groups: [...newBroadcast.target_groups, tag]
                              });
                            } else {
                              setNewBroadcast({
                                ...newBroadcast,
                                target_groups: newBroadcast.target_groups.filter(t => t !== tag)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-[#2A8B8A] focus:ring-[#2A8B8A]"
                        />
                        <span className="text-black text-sm">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Schedule (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Schedule (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newBroadcast.scheduled_at}
                    onChange={(e) => setNewBroadcast({...newBroadcast, scheduled_at: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm text-black focus:border-[#2A8B8A] focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 transition-all duration-200"
                  />
                </div>

                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Media (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,video/*,audio/*"
                      onChange={(e) => setNewBroadcast({...newBroadcast, media_file: e.target.files?.[0] || null})}
                      className="w-full px-4 py-3 rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2A8B8A] file:text-white hover:file:bg-[#238080] focus:border-[#2A8B8A] focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/50 flex justify-end space-x-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm text-black hover:bg-white/70 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBroadcast}
                  disabled={!newBroadcast.name || !newBroadcast.message}
                  className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-3 rounded-xl hover:from-[#238080] hover:to-[#1e6b6b] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Create Broadcast
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Broadcast Details Modal */}
        {showDetailsModal && selectedBroadcast && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white/50 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-black mb-2">{selectedBroadcast.name}</h2>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedBroadcast.status === 'completed' ? 'bg-green-100 text-green-700' :
                        selectedBroadcast.status === 'sending' ? 'bg-blue-100 text-blue-700' :
                        selectedBroadcast.status === 'failed' ? 'bg-red-100 text-red-700' :
                        selectedBroadcast.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedBroadcast.status.charAt(0).toUpperCase() + selectedBroadcast.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        Created: {new Date(selectedBroadcast.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-white/50 rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Message Content */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-3">Message Content</h3>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedBroadcast.message}</p>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-3">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 text-center">
                      <div className="text-2xl font-bold text-black">{selectedBroadcast.total_count || 0}</div>
                      <div className="text-sm text-gray-600">Total Recipients</div>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedBroadcast.sent_count || 0}</div>
                      <div className="text-sm text-gray-600">Messages Sent</div>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedBroadcast.delivered_count || 0}</div>
                      <div className="text-sm text-gray-600">Delivered</div>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 text-center">
                      <div className="text-2xl font-bold text-red-600">{selectedBroadcast.failed_count || 0}</div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                  </div>
                </div>

                {/* Target Groups */}
                {selectedBroadcast.target_groups && selectedBroadcast.target_groups.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-3">Target Groups</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBroadcast.target_groups.map((group, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[#2A8B8A]/10 text-[#2A8B8A] rounded-full text-sm font-medium border border-[#2A8B8A]/20"
                        >
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timing Information */}
                <div>
                  <h3 className="text-lg font-semibold text-black mb-3">Timing</h3>
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-black">{new Date(selectedBroadcast.created_at).toLocaleString()}</span>
                    </div>
                    {selectedBroadcast.scheduled_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scheduled:</span>
                        <span className="text-black">{new Date(selectedBroadcast.scheduled_at).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedBroadcast.sent_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sent:</span>
                        <span className="text-black">{new Date(selectedBroadcast.sent_at).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedBroadcast.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="text-black">{new Date(selectedBroadcast.completed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default BroadcastsPage;
