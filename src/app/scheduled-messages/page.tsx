"use client";

import { useState, useEffect } from "react";
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../services/apiService';

// Types for scheduled messages
type ScheduledMessage = {
  _id: string;
  title: string;
  recipients: Array<{
    phone: string;
    name: string;
    contact_id?: string;
  }>;
  template_id?: string;
  custom_message?: string;
  message_type: 'text' | 'media';
  schedule_datetime_utc: string;
  schedule_datetime_local: string;
  status: 'pending' | 'sending' | 'sent' | 'partial' | 'failed' | 'cancelled';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  estimated_cost: number;
  created_at: string;
  updated_at: string;
};

type ScheduledMessageStats = {
  total_messages: number;
  pending_messages: number;
  sent_messages: number;
  failed_messages: number;
  cancelled_messages: number;
  total_cost: number;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

function ScheduledMessages() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [stats, setStats] = useState<ScheduledMessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ScheduledMessage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'schedule_datetime_utc'>('schedule_datetime_utc');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user) {
      loadData();
      // Set up auto-refresh every 30 seconds to sync with backend processing
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [messagesResponse, statsResponse] = await Promise.all([
        apiService.getScheduledMessages(),
        apiService.getScheduledMessageStats()
      ]);
      
      const typedMessagesResponse = messagesResponse as ApiResponse<ScheduledMessage[]>;
      const typedStatsResponse = statsResponse as ApiResponse<ScheduledMessageStats>;
      
      if (typedMessagesResponse && typedMessagesResponse.success) {
        const messages = typedMessagesResponse.data || [];
        // console.log('Loaded scheduled messages:', messages.length);
        setMessages(messages);
      } else {
        console.warn('Failed to load messages:', typedMessagesResponse);
        setMessages([]);
      }
      
      if (typedStatsResponse && typedStatsResponse.success) {
        setStats(typedStatsResponse.data || null);
      } else {
        console.warn('Failed to load stats:', typedStatsResponse);
        setStats(null);
      }
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
      showToastNotification('Failed to load scheduled messages', 'error');
      // Set empty data on error
      setMessages([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const showToastNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleCancelMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled message?')) {
      return;
    }

    try {
      setActionLoading(messageId);
      const response = await apiService.cancelScheduledMessage(messageId);
      const typedResponse = response as ApiResponse<any>;
      
      if (typedResponse && typedResponse.success) {
        showToastNotification('Message cancelled successfully', 'success');
        loadData(); // Refresh the list
      } else {
        throw new Error(typedResponse?.message || 'Failed to cancel message');
      }
    } catch (error) {
      console.error('Error cancelling message:', error);
      showToastNotification('Failed to cancel message', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const viewMessageDetails = async (message: ScheduledMessage) => {
    try {
      // Get fresh status
      const response = await apiService.getScheduledMessageStatus(message._id);
      const typedResponse = response as ApiResponse<ScheduledMessage>;
      if (typedResponse && typedResponse.success && typedResponse.data) {
        setSelectedMessage(typedResponse.data);
      } else {
        // If API call fails, just use the existing message data
        console.warn('Failed to fetch fresh message status, using cached data');
        setSelectedMessage(message);
      }
      setShowModal(true);
    } catch (error) {
      console.warn('Error loading message details, using cached data:', error);
      // Always show the modal with cached data even if API fails
      setSelectedMessage(message);
      setShowModal(true);
    }
  };

  // Filter and sort messages
  const getFilteredMessages = () => {
    let filtered = messages;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.recipients.some(r => 
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.phone.includes(searchTerm)
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = new Date(a[sortBy]).getTime();
      const bValue = new Date(b[sortBy]).getTime();
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'sending': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'sent': return 'text-green-600 bg-green-50 border-green-200';
      case 'partial': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'sending': return '📤';
      case 'sent': return '✅';
      case 'partial': return '⚠️';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMessages = getFilteredMessages();

  return (
    <>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Scheduled Messages</h1>
            <p className="text-gray-600 mt-2">Manage and track your scheduled WhatsApp messages</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total_messages}</div>
              <div className="text-sm text-gray-600">Total Messages</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_messages}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.sent_messages}</div>
              <div className="text-sm text-gray-600">Sent</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{stats.failed_messages}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{stats.cancelled_messages}</div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-[#2A8B8A]">₹{stats.total_cost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="sending">Sending</option>
                <option value="sent">Sent</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by title or recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
              >
                <option value="schedule_datetime_utc">Schedule Time</option>
                <option value="created_at">Created Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A8B8A]"></div>
              <span className="ml-3 text-gray-600">Loading messages...</span>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled messages found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filter criteria" 
                  : "Create your first scheduled message to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMessages.map((message, index) => (
                    <tr key={`${message._id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{message.title}</div>
                          <div className="text-sm text-gray-500">
                            {message.message_type === 'media' ? '📎 Media Message' : '💬 Text Message'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{message.total_recipients} recipient{message.total_recipients !== 1 ? 's' : ''}</div>
                        <div className="text-sm text-gray-500">
                          {message.recipients.slice(0, 2).map(r => r.name).join(', ')}
                          {message.recipients.length > 2 && ` +${message.recipients.length - 2} more`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDateTime(message.schedule_datetime_local)}</div>
                        <div className="text-sm text-gray-500">
                          Created: {formatDateTime(message.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(message.status)}`}>
                          {getStatusIcon(message.status)} {message.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {message.sent_count}/{message.total_recipients} sent
                        </div>
                        {message.failed_count > 0 && (
                          <div className="text-sm text-red-600">{message.failed_count} failed</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">₹{message.estimated_cost.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewMessageDetails(message)}
                            className="text-[#2A8B8A] hover:text-[#238080] text-sm font-medium"
                          >
                            View
                          </button>
                          {message.status === 'pending' && (
                            <button
                              onClick={() => handleCancelMessage(message._id)}
                              disabled={actionLoading === message._id}
                              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                            >
                              {actionLoading === message._id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Message Details Modal */}
        {showModal && selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMessage.title}</h2>
                  <p className="text-gray-600 text-sm">Message Details</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Status and Schedule */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedMessage.status)}`}>
                        {getStatusIcon(selectedMessage.status)} {selectedMessage.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                      <div className="text-sm text-gray-900">{formatDateTime(selectedMessage.schedule_datetime_local)}</div>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
                    <div className="text-sm text-gray-900">
                      {selectedMessage.message_type === 'media' ? '📎 Media Message' : '💬 Text Message'}
                      {selectedMessage.template_id && ` (Template: ${selectedMessage.template_id})`}
                    </div>
                  </div>

                  {selectedMessage.custom_message && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {selectedMessage.custom_message}
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Progress</label>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">{selectedMessage.sent_count}</span> sent
                      </div>
                      <div className="text-sm text-red-600">
                        <span className="font-medium">{selectedMessage.failed_count}</span> failed
                      </div>
                      <div className="text-sm text-gray-600">
                        of <span className="font-medium">{selectedMessage.total_recipients}</span> total
                      </div>
                    </div>
                  </div>

                  {/* Recipients */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {selectedMessage.recipients.map((recipient, index) => (
                        <div key={recipient.contact_id || recipient.phone || index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{recipient.name}</div>
                            <div className="text-sm text-gray-600">{recipient.phone}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                    <div className="text-sm text-gray-900">₹{selectedMessage.estimated_cost.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Close
                  </button>
                  {selectedMessage.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleCancelMessage(selectedMessage._id);
                        setShowModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancel Message
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className={`rounded-lg shadow-lg p-4 max-w-md ${
              toastType === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                  toastType === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {toastType === 'success' ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    toastType === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {toastType === 'success' ? 'Success!' : 'Error'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    toastType === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {toastMessage}
                  </p>
                </div>
                <button
                  onClick={() => setShowToast(false)}
                  className={`flex-shrink-0 ${
                    toastType === 'success' ? 'text-green-400 hover:text-green-600' : 'text-red-400 hover:text-red-600'
                  } transition-colors`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Wrap the component with ProtectedRoute for security
const ProtectedScheduledMessagesPage = () => {
  return (
    <ProtectedRoute>
      <ScheduledMessages />
    </ProtectedRoute>
  );
};

export default ProtectedScheduledMessagesPage;
