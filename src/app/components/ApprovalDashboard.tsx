"use client";

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { 
  LuCheck, LuClock, LuUser, LuMessageSquare, 
  LuMegaphone, LuTarget, LuCalendar, LuLoader, LuX,
  LuEye, LuThumbsUp, LuThumbsDown, LuTriangle
} from 'react-icons/lu';

interface ApprovalRequest {
  id: string;
  requestType: string;
  requestId: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  requestData: any;
}

interface ApprovalDashboardProps {
  colors: any;
}

const ApprovalDashboard: React.FC<ApprovalDashboardProps> = ({ colors }) => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/team/approvals/pending');
      if (response) {
        setApprovals(response);
      }
    } catch (error: any) {
      setError('Failed to load pending approvals');
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      setProcessing(approvalId);
      const response = await apiService.post(`/team/approvals/${approvalId}/approve`);
      if (response) {
        setApprovals(approvals.filter(approval => approval.id !== approvalId));
        setSuccess('Request approved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    
    try {
      setProcessing(selectedRequest.id);
      const response = await apiService.post(`/team/approvals/${selectedRequest.id}/reject`, {
        reason: rejectionReason
      });
      if (response) {
        setApprovals(approvals.filter(approval => approval.id !== selectedRequest.id));
        setSuccess('Request rejected successfully!');
        setTimeout(() => setSuccess(''), 3000);
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const formatRequestType = (type: string) => {
    const types: { [key: string]: { label: string; icon: React.ReactNode; color: string } } = {
      campaign: { label: 'Campaign', icon: <LuTarget size={16} />, color: '#059669' },
      message: { label: 'Message', icon: <LuMessageSquare size={16} />, color: '#0284c7' },
      broadcast: { label: 'Broadcast', icon: <LuMegaphone size={16} />, color: '#7c3aed' }
    };
    return types[type] || { label: type, icon: <LuTriangle size={16} />, color: '#6b7280' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRequestPriority = (request: ApprovalRequest) => {
    const requestedAt = new Date(request.requestedAt);
    const hoursOld = (new Date().getTime() - requestedAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursOld > 24) return { level: 'high', label: 'High Priority', color: '#dc2626' };
    if (hoursOld > 8) return { level: 'medium', label: 'Medium Priority', color: '#ea580c' };
    return { level: 'low', label: 'Normal Priority', color: '#059669' };
  };

  const renderRequestSummary = (request: ApprovalRequest) => {
    const data = request.requestData;
    
    switch (request.requestType) {
      case 'campaign':
        return (
          <div className="space-y-2">
            <p className="font-medium">{data.name || 'Untitled Campaign'}</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Audience: {data.audienceSize || 0} contacts
            </p>
            {data.message && (
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Message: {data.message.substring(0, 100)}...
              </p>
            )}
          </div>
        );
      case 'message':
        return (
          <div className="space-y-2">
            <p className="font-medium">Direct Message</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              To: {data.recipient || 'Unknown'}
            </p>
            {data.message && (
              <p className="text-sm" style={{ color: colors.textMuted }}>
                {data.message.substring(0, 100)}...
              </p>
            )}
          </div>
        );
      case 'broadcast':
        return (
          <div className="space-y-2">
            <p className="font-medium">{data.title || 'Untitled Broadcast'}</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Recipients: {data.recipientCount || 0} contacts
            </p>
            {data.content && (
              <p className="text-sm" style={{ color: colors.textMuted }}>
                {data.content.substring(0, 100)}...
              </p>
            )}
          </div>
        );
      default:
        return (
          <p className="text-sm" style={{ color: colors.textMuted }}>
            No details available
          </p>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LuLoader className="w-8 h-8 animate-spin text-[#2A8B8A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
            Approval Dashboard
          </h2>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Review and approve pending requests from your team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LuClock size={16} style={{ color: colors.textMuted }} />
          <span className="text-sm font-medium" style={{ color: colors.text }}>
            {approvals.length} Pending
          </span>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <LuCheck size={16} />
            {success}
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <LuX size={16} />
            {error}
          </div>
        </div>
      )}

      {/* Approval Requests */}
      {approvals.length === 0 ? (
        <div className="text-center py-12">
          <LuCheck className="w-16 h-16 mx-auto mb-4" style={{ color: colors.textMuted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            All caught up!
          </h3>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            No pending approval requests at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((request) => {
            const requestType = formatRequestType(request.requestType);
            const priority = getRequestPriority(request);
            
            return (
              <div
                key={request.id}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: requestType.color }}
                    >
                      {requestType.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold" style={{ color: colors.text }}>
                          {requestType.label} Request
                        </h3>
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${priority.color}20`,
                            color: priority.color
                          }}
                        >
                          {priority.label}
                        </span>
                      </div>
                      
                      {renderRequestSummary(request)}
                      
                      <div className="flex items-center gap-4 mt-3 text-sm" style={{ color: colors.textMuted }}>
                        <div className="flex items-center gap-1">
                          <LuUser size={14} />
                          {request.requestedByName}
                        </div>
                        <div className="flex items-center gap-1">
                          <LuCalendar size={14} />
                          {formatDate(request.requestedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: colors.border }}>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <LuEye size={14} />
                    View Details
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectModal(true);
                      }}
                      disabled={processing === request.id}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                    >
                      {processing === request.id ? (
                        <LuLoader className="animate-spin" size={14} />
                      ) : (
                        <LuThumbsDown size={14} />
                      )}
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={processing === request.id}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#2A8B8A] hover:bg-[#238a89] rounded-lg transition-colors"
                    >
                      {processing === request.id ? (
                        <LuLoader className="animate-spin" size={14} />
                      ) : (
                        <LuThumbsUp size={14} />
                      )}
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Request Details</h3>
                <button onClick={() => setSelectedRequest(null)}>
                  <LuX size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: formatRequestType(selectedRequest.requestType).color }}
                  >
                    {formatRequestType(selectedRequest.requestType).icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">
                      {formatRequestType(selectedRequest.requestType).label} Request
                    </h4>
                    <p className="text-sm text-gray-600">
                      Requested by {selectedRequest.requestedByName} • {formatDate(selectedRequest.requestedAt)}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium mb-3">Request Data</h5>
                  <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                    {JSON.stringify(selectedRequest.requestData, null, 2)}
                  </pre>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                    className="btn-danger flex-1"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="btn-primary flex-1"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Reject Request</h3>
                <button onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}>
                  <LuX size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Please provide a reason for rejecting this {selectedRequest.requestType} request from {selectedRequest.requestedByName}.
                </p>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                />

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason.trim() || processing === selectedRequest.id}
                    className="btn-danger flex-1"
                  >
                    {processing === selectedRequest.id ? (
                      <LuLoader className="animate-spin" />
                    ) : (
                      'Reject Request'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDashboard;