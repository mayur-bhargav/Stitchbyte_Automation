"use client";

import React, { useState } from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import { apiService } from '../services/apiService';
import { LuClock, LuCheck, LuX, LuLoader, LuTriangle } from 'react-icons/lu';

interface ApprovalWrapperProps {
  action: string;
  requestType: 'campaign' | 'message' | 'broadcast';
  requestData: any;
  onExecute: () => Promise<void>;
  onApprovalSubmitted?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ApprovalWrapper: React.FC<ApprovalWrapperProps> = ({
  action,
  requestType,
  requestData,
  onExecute,
  onApprovalSubmitted,
  children,
  className = '',
  disabled = false
}) => {
  const { needsApproval, userRole } = usePermissions();
  const [pendingApproval, setPendingApproval] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const requiresApproval = needsApproval(action);

  const handleClick = async () => {
    if (disabled) return;

    if (requiresApproval) {
      setShowConfirmModal(true);
    } else {
      await executeAction();
    }
  };

  const executeAction = async () => {
    try {
      setLoading(true);
      await onExecute();
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitForApproval = async () => {
    try {
      setLoading(true);
      
      await apiService.post('/team/approvals', {
        request_type: requestType,
        request_data: requestData
      });

      setPendingApproval(true);
      setShowConfirmModal(false);
      
      if (onApprovalSubmitted) {
        onApprovalSubmitted();
      }
    } catch (error) {
      console.error('Error submitting for approval:', error);
    } finally {
      setLoading(false);
    }
  };

  const wrappedChildren = (
    <div onClick={handleClick} className={`${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`.trim()}>
      {children}
    </div>
  );

  if (pendingApproval) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <LuClock className="text-amber-600" size={16} />
        <span className="text-sm text-amber-700">Pending approval</span>
      </div>
    );
  }

  return (
    <>
      {wrappedChildren}
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <LuTriangle className="text-amber-600" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Approval Required
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action requires approval from a manager or admin.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Action:</span> {action}</p>
                  <p><span className="font-medium">Type:</span> {requestType}</p>
                  <p><span className="font-medium">Your Role:</span> {userRole}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitForApproval}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238a89] transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LuLoader className="animate-spin" size={16} />
                      Submitting...
                    </>
                  ) : (
                    'Submit for Approval'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Hook for checking if user can perform an action
export const useActionPermission = (action: string) => {
  const { needsApproval, userRole, hasPermission } = usePermissions();
  
  const canExecuteDirectly = !needsApproval(action);
  const canSubmitForApproval = needsApproval(action);
  
  // Map actions to required permissions
  const actionPermissions: { [key: string]: string } = {
    'create_campaign': 'manage_campaigns',
    'send_message': 'send_messages', 
    'create_broadcast': 'manage_broadcasts',
    'delete_campaign': 'delete_campaigns',
    'manage_team': 'manage_team',
    'manage_billing': 'manage_billing'
  };
  
  const requiredPermission = actionPermissions[action];
  const hasRequiredPermission = requiredPermission ? hasPermission(requiredPermission) : true;
  
  return {
    canExecuteDirectly: canExecuteDirectly && hasRequiredPermission,
    canSubmitForApproval: canSubmitForApproval && hasRequiredPermission,
    needsApproval: needsApproval(action),
    userRole,
    hasRequiredPermission
  };
};