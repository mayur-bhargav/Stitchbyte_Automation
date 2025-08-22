"use client";
import { useState, useEffect, useRef } from "react";
import { apiService } from "../services/apiService";
import { 
  MdSearch, 
  MdFilterList, 
  MdDownload, 
  MdRefresh, 
  MdDelete,
  MdReply,
  MdVisibility,
  MdClose,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdIndeterminateCheckBox,
  MdDateRange,
  MdPhone,
  MdMessage,
  MdTrendingUp,
  MdTrendingDown,
  MdMoreVert,
  MdClear,
  MdCalendarToday
} from "react-icons/md";

interface LogEntry {
  _id?: string;
  message_id?: string;
  phone?: string;
  contact_name?: string;
  direction: 'incoming' | 'outgoing';
  text?: string;
  template_name?: string;
  status_code?: string;
  sent_at: string;
  success: boolean;
  message_type?: string;
  media_url?: string;
  error_message?: string;
  delivery_status?: string;
}

interface FilterState {
  direction: 'all' | 'incoming' | 'outgoing';
  status: 'all' | 'success' | 'failed';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  customStartDate: string;
  customEndDate: string;
  messageType: 'all' | 'text' | 'template' | 'media';
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(20);
  const [sortField, setSortField] = useState<keyof LogEntry>('sent_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Modals and actions
  const [replyModal, setReplyModal] = useState<{ open: boolean; phone?: string; messageId?: string; logEntry?: LogEntry } | null>(null);
  const [detailModal, setDetailModal] = useState<{ open: boolean; logEntry?: LogEntry } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; logIds?: string[] } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replySuccess, setReplySuccess] = useState("");
  const [replyError, setReplyError] = useState("");
  
  // Filters
  const [filters, setFilters] = useState<FilterState>({
    direction: 'all',
    status: 'all',
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
    messageType: 'all'
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    incoming: 0,
    outgoing: 0,
    success: 0,
    failed: 0,
    todayCount: 0
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch logs with enhanced error handling
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await apiService.getOptional('/logs');
      if (data) {
        const logsData = data.logs || [];
        setLogs(logsData);
        calculateStats(logsData);
      } else {
        // Endpoint not available or returned null
        console.log('Logs endpoint not available, showing empty logs');
        setLogs([]);
        calculateStats([]);
      }
    } catch (error) {
      console.log('Error fetching logs, showing empty logs:', error);
      setLogs([]);
      calculateStats([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (logsData: LogEntry[]) => {
    const today = new Date().toDateString();
    const todayLogs = logsData.filter(log => new Date(log.sent_at).toDateString() === today);
    
    setStats({
      total: logsData.length,
      incoming: logsData.filter(log => log.direction === 'incoming').length,
      outgoing: logsData.filter(log => log.direction === 'outgoing').length,
      success: logsData.filter(log => log.success).length,
      failed: logsData.filter(log => !log.success).length,
      todayCount: todayLogs.length
    });
  };

  // Apply filters and search
  const applyFiltersAndSearch = () => {
    let filtered = [...logs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        (log.phone?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.text?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.template_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Direction filter
    if (filters.direction !== 'all') {
      filtered = filtered.filter(log => log.direction === filters.direction);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(log => 
        filters.status === 'success' ? log.success : !log.success
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'custom':
          if (filters.customStartDate && filters.customEndDate) {
            const start = new Date(filters.customStartDate);
            const end = new Date(filters.customEndDate);
            filtered = filtered.filter(log => {
              const logDate = new Date(log.sent_at);
              return logDate >= start && logDate <= end;
            });
          }
          break;
        default:
          startDate = new Date(0);
      }

      if (filters.dateRange !== 'custom') {
        filtered = filtered.filter(log => new Date(log.sent_at) >= startDate);
      }
    }

    // Message type filter
    if (filters.messageType !== 'all') {
      filtered = filtered.filter(log => {
        switch (filters.messageType) {
          case 'text':
            return log.text && !log.template_name && !log.media_url;
          case 'template':
            return log.template_name;
          case 'media':
            return log.media_url;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Selection functions
  const handleSelectAll = () => {
    if (selectedLogs.size === currentLogs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(currentLogs.map(log => log._id || log.message_id || log.sent_at)));
    }
  };

  const handleSelectLog = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Phone', 'Direction', 'Message', 'Status', 'Sent At', 'Success'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.phone || log.contact_name || '',
        log.direction,
        (log.text || log.template_name || '').replace(/,/g, ';'),
        log.status_code || '',
        new Date(log.sent_at).toLocaleString(),
        log.success ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedLogs.size === 0) return;
    
    try {
      // Implement bulk delete API call here
      console.log('Deleting logs:', Array.from(selectedLogs));
      // await fetch('/api/logs/bulk-delete', { method: 'POST', body: JSON.stringify([...selectedLogs]) });
      
      // For now, just remove from local state
      setLogs(prev => prev.filter(log => !selectedLogs.has(log._id || log.message_id || log.sent_at)));
      setSelectedLogs(new Set());
      setDeleteModal(null);
    } catch (error) {
      console.error('Error deleting logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [logs, searchTerm, filters, sortField, sortDirection]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- UPDATED handleReply FUNCTION ---
  const handleReply = async () => {
    if (!replyModal?.phone || !replyText.trim()) return;
    setReplyLoading(true);
    setReplySuccess("");
    setReplyError("");
    try {
      // Send as a simple text message
      const res = await fetch("http://localhost:8000/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: replyModal.phone,
          text: replyText, // Send 'text' field for simple replies
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail?.error?.message || "Failed to send reply");
      }
      setReplySuccess("Reply sent!");
      setTimeout(() => {
        setReplyText("");
        setReplyModal(null);
        fetchLogs(); // Refresh logs after sending
      }, 1000);
    } catch (err: any) {
      setReplyError(err.message || "An unknown error occurred.");
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F6FF] p-6">
      <section className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header with Stats */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-black">Message Logs</h1>
              <p className="text-gray-600 mt-1">Monitor and manage all your WhatsApp message activities</p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-2">
                <MdMessage className="w-5 h-5 text-[#2A8B8A]" />
                <span className="text-sm font-medium text-gray-600">Total</span>
              </div>
              <p className="text-2xl font-bold text-black mt-1">{stats.total}</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-2">
                <MdTrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Success</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.success}</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-2">
                <MdTrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-600">Failed</span>
              </div>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-2">
                <MdCalendarToday className="w-5 h-5 text-[#2A8B8A]" />
                <span className="text-sm font-medium text-gray-600">Today</span>
              </div>
              <p className="text-2xl font-bold text-[#2A8B8A] mt-1">{stats.todayCount}</p>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 p-4 relative z-[10000]">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-white/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] text-black placeholder-gray-500 transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <MdClear className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-white/50 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-all duration-200 text-black"
                >
                  <MdFilterList className="w-4 h-4" />
                  <span>Filters</span>
                  {(filters.direction !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all' || filters.messageType !== 'all') && (
                    <div className="w-2 h-2 bg-[#2A8B8A] rounded-full"></div>
                  )}
                </button>

                {showFilters && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-sm border border-white/50 rounded-xl shadow-2xl z-[9999] p-4">
                    <h3 className="font-semibold text-black mb-3">Filter Options</h3>
                  
                    {/* Direction Filter */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-black mb-2">Direction</label>
                      <select
                        value={filters.direction}
                        onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value as any }))}
                        className="w-full p-2 border border-white/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] text-black transition-all duration-200"
                      >
                        <option value="all">All Directions</option>
                        <option value="incoming">Incoming</option>
                        <option value="outgoing">Outgoing</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-black mb-2">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full p-2 border border-white/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] text-black transition-all duration-200"
                      >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-black mb-2">Date Range</label>
                      <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                        className="w-full p-2 border border-white/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] text-black transition-all duration-200"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">This Month</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>

                    {/* Custom Date Range */}
                    {filters.dateRange === 'custom' && (
                      <div className="mb-4 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">Start Date</label>
                          <input
                            type="date"
                            value={filters.customStartDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                            className="w-full p-2 border border-white/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] text-black transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-black mb-1">End Date</label>
                          <input
                            type="date"
                            value={filters.customEndDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                            className="w-full p-2 border border-white/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] text-black transition-all duration-200"
                          />
                        </div>
                      </div>
                    )}

                    {/* Message Type Filter */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-black mb-2">Message Type</label>
                      <select
                        value={filters.messageType}
                        onChange={(e) => setFilters(prev => ({ ...prev, messageType: e.target.value as any }))}
                        className="w-full p-2 border border-white/50 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] text-black transition-all duration-200"
                      >
                        <option value="all">All Types</option>
                        <option value="text">Text</option>
                        <option value="template">Template</option>
                        <option value="media">Media</option>
                      </select>
                    </div>

                    {/* Clear Filters */}
                    <button
                      onClick={() => setFilters({
                        direction: 'all',
                        status: 'all',
                        dateRange: 'all',
                        customStartDate: '',
                        customEndDate: '',
                        messageType: 'all'
                      })}
                      className="w-full px-3 py-2 text-sm text-gray-600 border border-white/50 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white/70 transition-all duration-200"
                    >
                      Clear All Filters
                    </button>
                </div>
              )}
            </div>
          </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {selectedLogs.size > 0 && (
                <button
                  onClick={() => setDeleteModal({ open: true, logIds: Array.from(selectedLogs) })}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <MdDelete className="w-4 h-4" />
                  <span>Delete ({selectedLogs.size})</span>
                </button>
              )}
              
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white rounded-xl hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <MdDownload className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white rounded-xl hover:from-[#238080] hover:to-[#1e6b6b] disabled:opacity-50 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <MdRefresh className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
        {/* Enhanced Table */}
        {logsLoading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#2A8B8A] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading logs...</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
            {/* Table Header with Sort */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/50">
                <thead className="bg-white/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center justify-center w-5 h-5"
                      >
                        {selectedLogs.size === 0 ? (
                          <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400" />
                        ) : selectedLogs.size === currentLogs.length ? (
                          <MdCheckBox className="w-5 h-5 text-[#2A8B8A]" />
                        ) : (
                          <MdIndeterminateCheckBox className="w-5 h-5 text-[#2A8B8A]" />
                        )}
                      </button>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-white/50 transition-all duration-200"
                      onClick={() => {
                        if (sortField === 'phone') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('phone');
                          setSortDirection('asc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <MdPhone className="w-4 h-4" />
                        <span>Contact</span>
                        {sortField === 'phone' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-white/50 transition-all duration-200"
                      onClick={() => {
                        if (sortField === 'sent_at') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('sent_at');
                          setSortDirection('desc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <MdDateRange className="w-4 h-4" />
                        <span>Sent At</span>
                        {sortField === 'sent_at' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-white/50">
                {currentLogs.map((log) => {
                  const logId = log._id || log.message_id || log.sent_at;
                  const isSelected = selectedLogs.has(logId);
                  
                  return (
                    <tr key={logId} className={`hover:bg-white/50 transition-all duration-200 ${isSelected ? 'bg-[#2A8B8A]/10' : ''}`}>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSelectLog(logId)}
                          className="flex items-center justify-center w-5 h-5"
                        >
                          {isSelected ? (
                            <MdCheckBox className="w-5 h-5 text-[#2A8B8A]" />
                          ) : (
                            <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-white/50 backdrop-blur-sm border border-white/50 rounded-full flex items-center justify-center">
                            <MdPhone className="w-5 h-5 text-[#2A8B8A]" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-black">
                              {log.contact_name || log.phone || 'Unknown'}
                            </div>
                            {log.contact_name && log.phone && (
                              <div className="text-sm text-gray-600">{log.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.direction === 'incoming' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {log.direction === 'incoming' ? '← Incoming' : '→ Outgoing'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-black">
                          {(log.text || log.template_name || 'No content').substring(0, 30)}
                          {(log.text || log.template_name || '').length > 3 && '...'}
                        </div>
                        {log.media_url && (
                          <div className="text-xs text-[#2A8B8A] mt-1">📎 Media attached</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mr-2 ${
                            log.success ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          <span className={`text-sm ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                            {log.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        {log.status_code && (
                          <div className="text-xs text-gray-600 mt-1">Code: {log.status_code}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>{new Date(log.sent_at).toLocaleDateString()}</div>
                        <div className="text-xs">{new Date(log.sent_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetailModal({ open: true, logEntry: log })}
                            className="text-[#2A8B8A] hover:text-[#238080] p-1 rounded-md hover:bg-white/50 transition-all duration-200"
                            title="View Details"
                          >
                            <MdVisibility className="w-4 h-4" />
                          </button>
                          {log.direction === 'incoming' && (
                            <button
                              onClick={() => setReplyModal({ open: true, phone: log.phone, messageId: log.message_id, logEntry: log })}
                              className="text-green-600 hover:text-green-700 p-1 rounded-md hover:bg-white/50 transition-all duration-200"
                              title="Reply"
                            >
                              <MdReply className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteModal({ open: true, logIds: [logId] })}
                            className="text-red-600 hover:text-red-700 p-1 rounded-md hover:bg-white/50 transition-all duration-200"
                            title="Delete"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
            
            {filteredLogs.length === 0 && !logsLoading && (
              <div className="text-center py-12">
                <MdMessage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">No logs found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{indexOfFirstLog + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastLog, filteredLogs.length)}
                </span>{' '}
                of <span className="font-medium">{filteredLogs.length}</span> results
              </div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/50 bg-white/50 backdrop-blur-sm text-sm font-medium text-gray-600 hover:bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 ${
                        currentPage === page
                          ? 'z-10 bg-[#2A8B8A]/20 border-[#2A8B8A] text-[#2A8B8A]'
                          : 'bg-white/50 backdrop-blur-sm border-white/50 text-gray-600 hover:bg-white/70'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/50 bg-white/50 backdrop-blur-sm text-sm font-medium text-gray-600 hover:bg-white/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        )}        {/* Enhanced Reply Modal */}
        {replyModal?.open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white/50 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-black">Reply to Message</h3>
                  <button
                    onClick={() => setReplyModal(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MdClose className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Contact Info */}
                <div className="mb-4 p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2A8B8A]/10 rounded-full flex items-center justify-center">
                      <MdPhone className="w-5 h-5 text-[#2A8B8A]" />
                    </div>
                    <div>
                      <div className="font-medium text-black">
                        {replyModal.logEntry?.contact_name || replyModal.phone}
                      </div>
                      {replyModal.logEntry?.contact_name && (
                        <div className="text-sm text-gray-600">{replyModal.phone}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Original Message */}
                {replyModal.logEntry?.text && (
                  <div className="mb-4 p-3 bg-[#2A8B8A]/10 rounded-xl border-l-4 border-[#2A8B8A]">
                    <div className="text-sm text-gray-600 mb-1">Original message:</div>
                    <div className="text-sm text-black">{replyModal.logEntry.text}</div>
                  </div>
                )}
                
                {/* Reply Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black mb-2">
                    Your Reply
                  </label>
                  <textarea
                    className="w-full border border-white/50 bg-white/50 backdrop-blur-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 focus:border-[#2A8B8A] resize-none text-black placeholder-gray-500 transition-all duration-200"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={replyLoading}
                    rows={4}
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    {replyText.length}/1000 characters
                  </div>
                </div>

                {/* Status Messages */}
                {replySuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 text-green-800">
                      <span className="text-green-600">✓</span>
                      {replySuccess}
                    </div>
                  </div>
                )}
                
                {replyError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 text-red-800">
                      <span className="text-red-600">✗</span>
                      {replyError}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-white/50 flex justify-end gap-3">
                <button
                  onClick={() => setReplyModal(null)}
                  disabled={replyLoading}
                  className="px-4 py-2 text-black bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/70 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={replyLoading || !replyText.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white rounded-xl hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                  {replyLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {replyLoading ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {detailModal?.open && detailModal.logEntry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white/50 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-black">Message Details</h3>
                  <button
                    onClick={() => setDetailModal(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MdClose className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Contact</label>
                    <div className="text-sm text-black">
                      {detailModal.logEntry.contact_name || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Phone</label>
                    <div className="text-sm text-black">{detailModal.logEntry.phone || 'N/A'}</div>
                  </div>
                </div>

                {/* Message Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Direction</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      detailModal.logEntry.direction === 'incoming' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {detailModal.logEntry.direction === 'incoming' ? '← Incoming' : '→ Outgoing'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Message Type</label>
                    <div className="text-sm text-black">
                      {detailModal.logEntry.template_name ? 'Template' : 
                       detailModal.logEntry.media_url ? 'Media' : 'Text'}
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Content</label>
                  <div className="p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/50">
                    <div className="text-sm text-black whitespace-pre-wrap">
                      {detailModal.logEntry.text || detailModal.logEntry.template_name || 'No content'}
                    </div>
                  </div>
                </div>

                {/* Media */}
                {detailModal.logEntry.media_url && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Media</label>
                    <div className="p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/50">
                      <a 
                        href={detailModal.logEntry.media_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#2A8B8A] hover:text-[#238080] underline"
                      >
                        View Media
                      </a>
                    </div>
                  </div>
                )}

                {/* Status Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        detailModal.logEntry.success ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <span className={`text-sm ${
                        detailModal.logEntry.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {detailModal.logEntry.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Status Code</label>
                    <div className="text-sm text-black">{detailModal.logEntry.status_code || 'N/A'}</div>
                  </div>
                </div>

                {/* Error Message */}
                {detailModal.logEntry.error_message && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Error Message</label>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="text-sm text-red-800">{detailModal.logEntry.error_message}</div>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Sent At</label>
                    <div className="text-sm text-black">
                      {new Date(detailModal.logEntry.sent_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Message ID</label>
                    <div className="text-sm text-black font-mono">
                      {detailModal.logEntry.message_id || detailModal.logEntry._id || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal?.open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white/50 shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <MdDelete className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-black">Delete Messages</h3>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete {deleteModal.logIds?.length === 1 ? 'this message' : `${deleteModal.logIds?.length} messages`}?
                    </p>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <div className="text-sm text-red-800">
                    <strong>Warning:</strong> This action cannot be undone. The message logs will be permanently deleted.
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-white/50 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 text-black bg-white/50 backdrop-blur-sm border border-white/50 rounded-xl hover:bg-white/70 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}