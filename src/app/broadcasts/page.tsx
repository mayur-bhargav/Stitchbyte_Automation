"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '../contexts/UserContext';
import { usePermissions } from '../contexts/PermissionContext';
import { ApprovalWrapper } from '../components/ApprovalWrapper';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../services/apiService';

// Toast notification function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // console.log(`${type.toUpperCase()}: ${message}`);
};

type Broadcast = {
  id: string;
  name: string;
  message: string;
  recipient_count: number;
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
  companyId?: string;
};

type Contact = {
  phone: string;
  name?: string;
  tags: string[];
  created_at: string;
  companyId?: string;
};

function BroadcastsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { hasPermission } = usePermissions();
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
      const data = await apiService.getBroadcasts();
      const broadcastsData = (data as any).broadcasts || [];
      // Filter broadcasts by user's company for security
      const userBroadcasts = broadcastsData.filter((broadcast: Broadcast) => 
        broadcast.companyId === user.companyId || !broadcast.companyId
      );
      setBroadcasts(userBroadcasts);
    } catch (error) {
      console.error('Failed to load broadcasts:', error);
      setBroadcasts([]);
      showToast('Failed to load broadcasts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    if (!user) return;
    
    try {
      const data = await apiService.getContacts();
      const contactsData = (data as any).contacts || [];
      // Filter contacts by user's company for security
      const userContacts = contactsData.filter((contact: Contact) => 
        contact.companyId === user.companyId || !contact.companyId
      );
      setContacts(userContacts);
      
      // Extract unique tags from user's contacts only
      const tags = new Set<string>();
      userContacts.forEach((contact: Contact) => {
        contact.tags?.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    } catch (error) {
      console.error('Failed to load contacts:', error);
      showToast('Failed to load contacts', 'error');
    }
  };

  const loadTemplates = async () => {
    if (!user) return;
    
    try {
      const data = await apiService.getTemplates();
      const allTemplates = (data as any).templates || data || [];
      // Filter templates by user's company and approved status
      const approvedTemplates = allTemplates.filter((t: any) => 
        (t.companyId === user.companyId || !t.companyId) &&
        t.status?.toString().toUpperCase() === 'APPROVED'
      );
      setTemplates(approvedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      showToast('Failed to load templates', 'error');
    }
  };

  const createBroadcast = async () => {
    if (!user) return;
    
    try {
      const formData = new FormData();
      formData.append('name', newBroadcast.name);
      formData.append('message', newBroadcast.message);
      formData.append('template_name', newBroadcast.template_name);
      formData.append('target_groups', JSON.stringify(newBroadcast.target_groups));
      formData.append('scheduled_at', newBroadcast.scheduled_at);
      formData.append('companyId', user.companyId); // Add company security
      
      if (newBroadcast.media_file) {
        formData.append('media_file', newBroadcast.media_file);
      }

      const result = await apiService.postFormData('/broadcasts', formData);

      if (result && !result.error) {
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
      }
    } catch (error) {
      console.error('Failed to create broadcast:', error);
    }
  };

  const deleteBroadcast = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/broadcasts/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        loadBroadcasts();
      }
    } catch (error) {
      console.error('Failed to delete broadcast:', error);
    }
  };

  const sendBroadcast = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/broadcasts/${id}/send`, {
        method: 'POST'
      });
      if (response.ok) {
        loadBroadcasts();
      }
    } catch (error) {
      console.error('Failed to send broadcast:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('chatTheme', newTheme ? 'dark' : 'light');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="w-2 h-2 bg-gray-400 rounded-full"></span>;
      case 'scheduled':
        return <span className="w-2 h-2 bg-blue-400 rounded-full"></span>;
      case 'sending':
        return <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>;
      case 'completed':
        return <span className="w-2 h-2 bg-green-400 rounded-full"></span>;
      case 'failed':
        return <span className="w-2 h-2 bg-red-400 rounded-full"></span>;
      default:
        return <span className="w-2 h-2 bg-gray-400 rounded-full"></span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'sending':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredBroadcasts = broadcasts.filter(broadcast => {
    const matchesSearch = broadcast.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         broadcast.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || broadcast.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const targetContactsCount = newBroadcast.target_groups.length > 0 
    ? contacts.filter(contact => 
        contact.tags?.some(tag => newBroadcast.target_groups.includes(tag))
      ).length
    : contacts.length;

  // Check permission
  if (!hasPermission('manage_broadcasts')) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to manage broadcasts.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Modern Header */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl shadow-lg ${
        darkMode ? 'bg-gray-800/95 border-b border-gray-700' : 'bg-white/95 border-b border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Broadcasts
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Send bulk messages to your contacts
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  darkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              <ApprovalWrapper
                action="create_broadcast"
                requestType="broadcast"
                requestData={{
                  name: newBroadcast.name || 'New Broadcast',
                  message: newBroadcast.message,
                  template_name: newBroadcast.template_name,
                  target_groups: newBroadcast.target_groups,
                  target_contacts_count: targetContactsCount
                }}
                onExecute={async () => setShowCreateModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:from-emerald-600 hover:to-blue-600 hover:scale-105 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Broadcast
                </div>
              </ApprovalWrapper>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 pb-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search broadcasts..."
                className={`w-full pl-10 pr-4 py-2 rounded-full border transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-emerald-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-emerald-500'
                } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
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

      {/* Broadcasts Grid */}
      <div className="p-6">
        {filteredBroadcasts.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No broadcasts found</h3>
            <p className="mb-4">Get started by creating your first broadcast</p>
            <ApprovalWrapper
              action="create_broadcast"
              requestType="broadcast"
              requestData={{
                name: 'New Broadcast',
                message: '',
                template_name: '',
                target_groups: [],
                target_contacts_count: 0
              }}
              onExecute={async () => setShowCreateModal(true)}
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Create Broadcast
            </ApprovalWrapper>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBroadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className={`rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-emerald-500'
                    : 'bg-white border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {broadcast.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(broadcast.status)}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(broadcast.status)}`}>
                          {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedBroadcast(broadcast);
                          setShowDetailsModal(true);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {broadcast.status === 'draft' && (
                        <button
                          onClick={() => sendBroadcast(broadcast.id)}
                          className="p-2 rounded-full transition-colors text-emerald-600 hover:bg-emerald-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => deleteBroadcast(broadcast.id)}
                        className="p-2 rounded-full transition-colors text-red-600 hover:bg-red-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {broadcast.message || 'Template message'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {broadcast.recipient_count}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Recipients
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {broadcast.sent_count}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Sent
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Created {formatDate(broadcast.created_at)}</span>
                    {broadcast.sent_at && (
                      <span>Sent {formatDate(broadcast.sent_at)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Broadcast Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Create New Broadcast
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`p-2 rounded-full transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Broadcast Name
                  </label>
                  <input
                    type="text"
                    value={newBroadcast.name}
                    onChange={(e) => setNewBroadcast({...newBroadcast, name: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    placeholder="Enter broadcast name"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Message Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setNewBroadcast({...newBroadcast, template_name: ''})}
                      className={`p-4 border rounded-lg transition-all ${
                        !newBroadcast.template_name
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : darkMode
                            ? 'border-gray-600 text-gray-300 hover:border-gray-500'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <div className="font-medium">Custom Message</div>
                        <div className="text-xs opacity-70">Send a custom text message</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setNewBroadcast({...newBroadcast, message: ''})}
                      className={`p-4 border rounded-lg transition-all ${
                        newBroadcast.template_name
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : darkMode
                            ? 'border-gray-600 text-gray-300 hover:border-gray-500'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-center">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <div className="font-medium">Template</div>
                        <div className="text-xs opacity-70">Use an approved template</div>
                      </div>
                    </button>
                  </div>
                </div>

                {!newBroadcast.template_name ? (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Message
                    </label>
                    <textarea
                      value={newBroadcast.message}
                      onChange={(e) => setNewBroadcast({...newBroadcast, message: e.target.value})}
                      rows={4}
                      className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                      placeholder="Enter your message"
                    />
                  </div>
                ) : (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Template
                    </label>
                    <select
                      value={newBroadcast.template_name}
                      onChange={(e) => setNewBroadcast({...newBroadcast, template_name: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    >
                      <option value="">Select a template</option>
                      {templates.map((template) => (
                        <option key={template.name} value={template.name}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Target Groups (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          const isSelected = newBroadcast.target_groups.includes(tag);
                          setNewBroadcast({
                            ...newBroadcast,
                            target_groups: isSelected
                              ? newBroadcast.target_groups.filter(t => t !== tag)
                              : [...newBroadcast.target_groups, tag]
                          });
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          newBroadcast.target_groups.includes(tag)
                            ? 'bg-emerald-500 text-white'
                            : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {targetContactsCount} contacts will receive this broadcast
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Schedule (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newBroadcast.scheduled_at}
                    onChange={(e) => setNewBroadcast({...newBroadcast, scheduled_at: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Media (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={(e) => setNewBroadcast({...newBroadcast, media_file: e.target.files?.[0] || null})}
                    className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className={`flex-1 px-6 py-3 border rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <ApprovalWrapper
                    action="create_broadcast"
                    requestType="broadcast"
                    requestData={{
                      name: newBroadcast.name,
                      message: newBroadcast.message,
                      template_name: newBroadcast.template_name,
                      target_groups: newBroadcast.target_groups,
                      scheduled_at: newBroadcast.scheduled_at,
                      target_contacts_count: targetContactsCount
                    }}
                    onExecute={createBroadcast}
                    disabled={!newBroadcast.name || (!newBroadcast.message && !newBroadcast.template_name)}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Broadcast
                  </ApprovalWrapper>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Details Modal */}
      {showDetailsModal && selectedBroadcast && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Broadcast Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`p-2 rounded-full transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedBroadcast.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    {getStatusIcon(selectedBroadcast.status)}
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(selectedBroadcast.status)}`}>
                      {selectedBroadcast.status.charAt(0).toUpperCase() + selectedBroadcast.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {selectedBroadcast.recipient_count}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Recipients
                    </div>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {selectedBroadcast.sent_count}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sent
                    </div>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {selectedBroadcast.delivered_count}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Delivered
                    </div>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {selectedBroadcast.read_count}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Read
                    </div>
                  </div>
                </div>

                {selectedBroadcast.message && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Message
                    </label>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedBroadcast.message}
                      </p>
                    </div>
                  </div>
                )}

                {selectedBroadcast.template_name && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Template
                    </label>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedBroadcast.template_name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Created:
                    </span>
                    <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(selectedBroadcast.created_at)}
                    </span>
                  </div>
                  {selectedBroadcast.scheduled_at && (
                    <div>
                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Scheduled:
                      </span>
                      <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(selectedBroadcast.scheduled_at)}
                      </span>
                    </div>
                  )}
                  {selectedBroadcast.sent_at && (
                    <div>
                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Sent:
                      </span>
                      <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(selectedBroadcast.sent_at)}
                      </span>
                    </div>
                  )}
                  {selectedBroadcast.completed_at && (
                    <div>
                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Completed:
                      </span>
                      <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(selectedBroadcast.completed_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap the component with ProtectedRoute for security
const ProtectedBroadcastsPage = () => {
  return (
    <ProtectedRoute>
      <BroadcastsPage />
    </ProtectedRoute>
  );
};

export default ProtectedBroadcastsPage;
