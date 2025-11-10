"use client";

import { Suspense, useState, useEffect } from "react";
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../services/apiService';
import { MdSchedule, MdRefresh, MdSearch, MdSort, MdFilterList, MdCheckCircle, MdError, MdCancel, MdPending, MdSend, MdGroup, MdAttachFile, MdMessage, MdClose, MdVisibility } from 'react-icons/md';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Types for scheduled messages
type ScheduledMessage = {
  _id: string;
  id?: string; // Some APIs may use 'id' instead of '_id'
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
        console.log('Loaded scheduled messages:', messages.length);
        if (messages.length > 0) {
          console.log('Sample message structure:', messages[0]);
        }
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
      // Use the message ID (check both _id and id fields)
      const messageId = message._id || (message as any).id;
      
      if (!messageId) {
        console.error('Message ID is missing:', message);
        showToastNotification('Unable to view message details: ID missing', 'error');
        return;
      }
      
      // Get fresh status
      const response = await apiService.getScheduledMessageStatus(messageId);
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
      case 'sending': return 'text-[#2A8B8A] bg-[#2A8B8A]/10 border-[#2A8B8A]/20';
      case 'sent': return 'text-green-600 bg-green-50 border-green-200';
      case 'partial': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <MdPending className="w-4 h-4" />;
      case 'sending': return <MdSend className="w-4 h-4" />;
      case 'sent': return <MdCheckCircle className="w-4 h-4" />;
      case 'partial': return <MdError className="w-4 h-4" />;
      case 'failed': return <MdCancel className="w-4 h-4" />;
      case 'cancelled': return <MdClose className="w-4 h-4" />;
      default: return <MdMessage className="w-4 h-4" />;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-br from-[#2A8B8A] via-[#238080] to-[#1d6a6a] text-white rounded-2xl p-8 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <MdSchedule className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Scheduled Messages</h1>
                <p className="text-white/90 mt-1">Manage and track your scheduled WhatsApp messages</p>
              </div>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 disabled:opacity-50 hover:scale-105"
            >
              <MdRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#2A8B8A]/10 rounded-lg flex items-center justify-center">
                  <MdMessage className="w-5 h-5 text-[#2A8B8A]" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.total_messages}</div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Messages</div>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <MdPending className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending_messages}</div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Pending</div>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <MdCheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.sent_messages}</div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Sent</div>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <MdCancel className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.failed_messages}</div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Failed</div>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <MdClose className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-600">{stats.cancelled_messages}</div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Cancelled</div>
            </div>
            
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#2A8B8A]/10 rounded-lg flex items-center justify-center">
                  <span className="text-[#2A8B8A] font-bold text-lg">₹</span>
                </div>
                <div className="text-2xl font-bold text-[#2A8B8A]">{stats.total_cost.toFixed(2)}</div>
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Cost</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <MdFilterList className="w-5 h-5 text-[#2A8B8A]" />
            <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <div className="relative">
                <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] transition-all"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or recipient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <div className="relative">
                <MdSort className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] transition-all"
                >
                  <option value="schedule_datetime_utc">Schedule Time</option>
                  <option value="created_at">Created Time</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] transition-all"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-[#2A8B8A]/20 border-t-[#2A8B8A] rounded-full animate-spin mb-4"></div>
              <span className="text-gray-600 font-medium">Loading messages...</span>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdSchedule className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled messages found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? "Try adjusting your search or filter criteria" 
                  : "Create your first scheduled message to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Recipients</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Schedule Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredMessages.map((message, index) => {
                    const messageId = message._id || message.id || `message-${index}`;
                    return (
                    <tr key={messageId} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 mb-1">{message.title}</div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            {message.message_type === 'media' ? (
                              <>
                                <MdAttachFile className="w-4 h-4" />
                                <span>Media Message</span>
                              </>
                            ) : (
                              <>
                                <MdMessage className="w-4 h-4" />
                                <span>Text Message</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-[#2A8B8A]/10 rounded-lg flex items-center justify-center">
                            <MdGroup className="w-4 h-4 text-[#2A8B8A]" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {message.total_recipients} recipient{message.total_recipients !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 ml-10">
                          {message.recipients.slice(0, 2).map(r => r.name).join(', ')}
                          {message.recipients.length > 2 && ` +${message.recipients.length - 2} more`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">{formatDateTime(message.schedule_datetime_local)}</div>
                        <div className="text-xs text-gray-500">
                          Created: {formatDateTime(message.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(message.status)}`}>
                          {getStatusIcon(message.status)}
                          <span className="capitalize">{message.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-[#2A8B8A] transition-all duration-300"
                                style={{ width: `${(message.sent_count / message.total_recipients) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-green-600 font-medium">
                              {message.sent_count} sent
                            </span>
                            {message.failed_count > 0 && (
                              <span className="text-red-600 font-medium">
                                {message.failed_count} failed
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-[#2A8B8A]">₹{message.estimated_cost.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewMessageDetails(message)}
                            className="flex items-center gap-1 px-3 py-1.5 text-[#2A8B8A] hover:bg-[#2A8B8A]/10 rounded-lg text-sm font-medium transition-all hover:scale-105"
                          >
                            <MdVisibility className="w-4 h-4" />
                            View
                          </button>
                          {message.status === 'pending' && (
                            <button
                              onClick={() => handleCancelMessage(message._id || (message as any).id)}
                              disabled={actionLoading === (message._id || (message as any).id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                            >
                              <MdCancel className="w-4 h-4" />
                              {actionLoading === (message._id || (message as any).id) ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Message Details Modal */}
        {showModal && selectedMessage && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slideUp">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-br from-[#2A8B8A] via-[#238080] to-[#1d6a6a] text-white rounded-t-2xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <MdSchedule className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedMessage.title}</h2>
                        <p className="text-white/80 text-sm mt-1">Message Details & Status</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                  >
                    <MdClose className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Status and Schedule */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Status</label>
                      <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(selectedMessage.status)}`}>
                        {getStatusIcon(selectedMessage.status)}
                        <span className="capitalize">{selectedMessage.status}</span>
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Scheduled Time</label>
                      <div className="text-sm font-medium text-gray-900">{formatDateTime(selectedMessage.schedule_datetime_local)}</div>
                    </div>
                  </div>

                  {/* Message Type */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Message Type</label>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      {selectedMessage.message_type === 'media' ? (
                        <>
                          <MdAttachFile className="w-5 h-5 text-[#2A8B8A]" />
                          <span>Media Message</span>
                        </>
                      ) : (
                        <>
                          <MdMessage className="w-5 h-5 text-[#2A8B8A]" />
                          <span>Text Message</span>
                        </>
                      )}
                      {selectedMessage.template_id && (
                        <span className="ml-2 px-2 py-1 bg-[#2A8B8A]/10 text-[#2A8B8A] rounded-lg text-xs font-semibold">
                          Template: {selectedMessage.template_id}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  {selectedMessage.custom_message && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Message Content</label>
                      <div className="text-sm text-gray-900 bg-white p-4 rounded-lg border border-gray-200">
                        {selectedMessage.custom_message}
                      </div>
                    </div>
                  )}

                  {/* Progress with Visual Bar */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Delivery Progress</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] transition-all duration-500"
                            style={{ width: `${(selectedMessage.sent_count / selectedMessage.total_recipients) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-[#2A8B8A] min-w-[60px] text-right">
                          {Math.round((selectedMessage.sent_count / selectedMessage.total_recipients) * 100)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <MdCheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">{selectedMessage.sent_count}</div>
                            <div className="text-xs text-gray-600">Sent</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                            <MdCancel className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-red-600">{selectedMessage.failed_count}</div>
                            <div className="text-xs text-gray-600">Failed</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <MdGroup className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-900">{selectedMessage.total_recipients}</div>
                            <div className="text-xs text-gray-600">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recipients List */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                      Recipients ({selectedMessage.recipients.length})
                    </label>
                    <div className="max-h-48 overflow-y-auto bg-white rounded-lg border border-gray-200">
                      {selectedMessage.recipients.map((recipient, index) => (
                        <div key={recipient.contact_id || recipient.phone || index} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#2A8B8A] to-[#238080] rounded-full flex items-center justify-center text-white font-semibold">
                            {recipient.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{recipient.name}</div>
                            <div className="text-xs text-gray-600">{recipient.phone}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="bg-gradient-to-br from-[#2A8B8A]/10 to-[#238080]/10 rounded-xl p-4 border border-[#2A8B8A]/20">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Estimated Cost</label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-[#2A8B8A]">₹{selectedMessage.estimated_cost.toFixed(2)}</span>
                      <span className="text-sm text-gray-600">INR</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-all hover:scale-105"
                  >
                    Close
                  </button>
                  {selectedMessage.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleCancelMessage(selectedMessage._id || (selectedMessage as any).id);
                        setShowModal(false);
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-all hover:scale-105"
                    >
                      <MdCancel className="w-5 h-5" />
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
          <div className="fixed top-6 right-6 z-50 animate-slideInRight">
            <div className={`rounded-xl shadow-2xl p-4 max-w-md border-2 ${
              toastType === 'success' 
                ? 'bg-white border-green-500' 
                : 'bg-white border-red-500'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${
                  toastType === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {toastType === 'success' ? (
                    <MdCheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <MdCancel className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${
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
                  className={`flex-shrink-0 rounded-lg p-1 transition-all hover:scale-110 ${
                    toastType === 'success' ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'
                  }`}
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

// Wrap the component with ProtectedRoute for security
const ProtectedScheduledMessagesPage = () => {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading scheduled messages...</p>
          </div>
        </div>
      }>
        <ScheduledMessages />
      </Suspense>
    </ProtectedRoute>
  );
};

export default ProtectedScheduledMessagesPage;
