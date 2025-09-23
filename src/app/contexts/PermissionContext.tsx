"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/apiService';
import { useUser } from './UserContext';

interface PermissionContextType {
  permissions: string[];
  userRole: string | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canApprove: (requestType: string) => boolean;
  needsApproval: (action: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user } = useUser();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserPermissions = async () => {
    if (!user?.id) {
      setPermissions([]);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log("🔍 PermissionContext: User data:", {
        isTeamMember: user.isTeamMember,
        role: user.role,
        permissions: user.permissions
      });
      
      // If user is a team member and already has permissions in their user data, use those
      if (user.isTeamMember && user.permissions && user.permissions.length > 0) {
        console.log("✅ Using permissions from user context:", user.permissions);
        setUserRole(user.role || 'employee');
        setPermissions(user.permissions);
        setLoading(false);
        return;
      }
      
      console.log("🔄 Fetching permissions from API...");
      
      // Otherwise, try to fetch from API endpoints
      const [roleResponse, permissionsResponse] = await Promise.all([
        apiService.get('/team/my-role'),
        apiService.get('/team/my-permissions')
      ]);
      
      if (roleResponse && permissionsResponse) {
        console.log("✅ Got permissions from API:", permissionsResponse);
        setUserRole(roleResponse.role);
        setPermissions(permissionsResponse || []);
      } else {
        // If user is not found in team members, assume they are the main account owner
        console.log("✅ Setting owner permissions as fallback");
        setUserRole('owner');
        setPermissions([
          'view_dashboard', 'manage_team', 'manage_campaigns', 'send_messages',
          'manage_broadcasts', 'view_analytics', 'manage_settings', 'manage_billing',
          'export_data', 'manage_templates', 'manage_contacts', 'view_logs',
          'manage_webhooks', 'manage_integrations', 'approve_campaigns',
          'approve_messages', 'approve_broadcasts', 'manage_roles', 'delete_campaigns',
          'manage_automations', 'access_api', 'manage_segments', 'view_reports',
          'manage_notifications'
        ]);
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      // Fallback: if API call fails, check if this is a team member from user context
      if (user.isTeamMember) {
        setUserRole(user.role || 'employee');
        setPermissions(user.permissions || ['view_dashboard']);
      } else {
        // Main account user fallback
        setUserRole('owner');
        setPermissions([
          'view_dashboard', 'manage_team', 'manage_campaigns', 'send_messages',
          'manage_broadcasts', 'view_analytics', 'manage_settings', 'manage_billing',
          'export_data', 'manage_templates', 'manage_contacts', 'view_logs',
          'manage_webhooks', 'manage_integrations', 'approve_campaigns',
          'approve_messages', 'approve_broadcasts', 'manage_roles', 'delete_campaigns',
          'manage_automations', 'access_api', 'manage_segments', 'view_reports',
          'manage_notifications'
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPermissions();
  }, [user?.id]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => permissions.includes(permission));
  };

  const canApprove = (requestType: string): boolean => {
    if (!userRole) return false;
    
    // Admins and managers can approve everything
    if (['admin', 'manager'].includes(userRole)) return true;
    
    // Check specific approval permissions
    const approvalPermissions = {
      'campaign': 'approve_campaigns',
      'message': 'approve_messages',
      'broadcast': 'approve_broadcasts'
    };
    
    const requiredPermission = approvalPermissions[requestType as keyof typeof approvalPermissions];
    return requiredPermission ? hasPermission(requiredPermission) : false;
  };

  const needsApproval = (action: string): boolean => {
    if (!userRole) return true;
    
    // Admins and managers don't need approval
    if (['admin', 'manager'].includes(userRole)) return false;
    
    // Actions that require approval for non-admin/manager roles
    const approvalRequiredActions = [
      'create_campaign',
      'send_message',
      'create_broadcast',
      'delete_campaign',
      'manage_team',
      'manage_billing'
    ];
    
    return approvalRequiredActions.includes(action);
  };

  const refreshPermissions = async () => {
    await fetchUserPermissions();
  };

  const value: PermissionContextType = {
    permissions,
    userRole,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canApprove,
    needsApproval,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// Permission checking hook for components
export const usePermissionCheck = (requiredPermissions: string | string[]) => {
  const { hasPermission, hasAnyPermission, loading } = usePermissions();
  
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  const hasAccess = permissions.length === 1 ? hasPermission(permissions[0]) : hasAnyPermission(permissions);
  
  return { hasAccess, loading };
};

// Permission gate component
interface PermissionGateProps {
  permission: string | string[];
  fallback?: ReactNode;
  requireAll?: boolean;
  children: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permission, 
  fallback = null, 
  requireAll = false,
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();
  
  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-8 rounded"></div>;
  }
  
  const permissions = Array.isArray(permission) ? permission : [permission];
  
  let hasAccess: boolean;
  if (permissions.length === 1) {
    hasAccess = hasPermission(permissions[0]);
  } else if (requireAll) {
    hasAccess = hasAllPermissions(permissions);
  } else {
    hasAccess = hasAnyPermission(permissions);
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};