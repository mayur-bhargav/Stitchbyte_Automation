"use client";

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { 
  LuUsers, LuPlus, LuPencil, LuTrash2, LuCheck, LuX, 
  LuLoader, LuShield, LuUserPlus, LuSearch, LuFilter,
  LuSettings, LuCrown, LuUser, LuBriefcase 
} from 'react-icons/lu';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string[];
  department?: string;
  employeeId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  addedBy: string;
}

interface TeamManagementProps {
  colors: any;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ colors }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMemberStep, setAddMemberStep] = useState(1); // Step 1: Basic Details, Step 2: Permissions
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userRole, setUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Available roles and permissions
  const roles = [
    { value: 'owner', label: 'Owner', icon: <LuCrown size={16} className="text-black" /> },
    { value: 'admin', label: 'Admin', icon: <LuShield size={16} className="text-black" /> },
    { value: 'manager', label: 'Manager', icon: <LuBriefcase size={16} className="text-black " /> },
    { value: 'team_lead', label: 'Team Lead', icon: <LuUsers size={16} className="text-black" /> },
    { value: 'senior', label: 'Senior', icon: <LuUser size={16} className="text-black" /> },
    { value: 'employee', label: 'Employee', icon: <LuUser size={16} className="text-black" /> },
    { value: 'intern', label: 'Intern', icon: <LuUser size={16} className="text-black" /> },
    { value: 'bde', label: 'BDE', icon: <LuUser size={16} className="text-black" /> },
    { value: 'digital_marketer', label: 'Digital Marketer', icon: <LuUser size={16} className="text-black" /> }
  ];

  // State for permissions loaded from API
  const [availablePermissions, setAvailablePermissions] = useState<Array<{
    value: string;
    label: string;
    category: string;
  }>>([]);

  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'employee',
    permissions: [] as string[],
    department: '',
    employeeId: '',
    password: ''
  });

  useEffect(() => {
    loadTeamData();
    loadUserRole();
    loadAvailablePermissions();
  }, []);

  const loadAvailablePermissions = async () => {
    try {
      const response = await apiService.get('/team/permissions');
      if (response) {
        setAvailablePermissions(response);
      }
    } catch (error: any) {
      console.error('Failed to load permissions:', error);
      // Fallback to hardcoded permissions if API fails
      const fallbackPermissions = [
        'view_dashboard', 'view_analytics', 'create_campaign', 'view_campaigns',
        'edit_campaign', 'delete_campaign', 'approve_campaign', 'send_message',
        'view_messages', 'approve_message', 'add_contact', 'view_contacts',
        'edit_contact', 'delete_contact', 'import_contacts', 'add_balance',
        'view_balance', 'view_billing', 'view_team', 'add_team_member',
        'edit_team_member', 'delete_team_member', 'assign_roles',
        'manage_integrations', 'create_template', 'view_templates',
        'edit_template', 'delete_template', 'create_broadcast',
        'view_broadcasts', 'manage_settings'
      ].map(perm => ({
        value: perm,
        label: perm.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: 'General'
      }));
      setAvailablePermissions(fallbackPermissions);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddMemberStep(1);
    setNewMember({
      firstName: '', lastName: '', email: '', phone: '', role: 'employee',
      permissions: [], department: '', employeeId: '', password: ''
    });
  };

  const goToNextStep = () => {
    if (addMemberStep === 1) {
      // Validate basic details before proceeding
      if (!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.password) {
        setError('Please fill in all required fields');
        return;
      }
      setAddMemberStep(2);
      setError('');
    }
  };

  const goToPreviousStep = () => {
    if (addMemberStep === 2) {
      setAddMemberStep(1);
    }
  };

  const togglePermission = (permission: string) => {
    const currentPermissions = newMember.permissions;
    if (currentPermissions.includes(permission)) {
      setNewMember({
        ...newMember,
        permissions: currentPermissions.filter(p => p !== permission)
      });
    } else {
      setNewMember({
        ...newMember,
        permissions: [...currentPermissions, permission]
      });
    }
  };

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/team/members');
      if (response) {
        setTeamMembers(response);
      }
    } catch (error: any) {
      setError('Failed to load team members');
      console.error('Error loading team:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRole = async () => {
    try {
      const [roleResponse, permissionsResponse] = await Promise.all([
        apiService.get('/team/my-role'),
        apiService.get('/team/my-permissions')
      ]);
      
      if (roleResponse?.role) {
        setUserRole(roleResponse.role);
      }
      if (permissionsResponse) {
        setUserPermissions(permissionsResponse);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const handleAddMember = async () => {
    try {
      setLoading(true);
      const response = await apiService.post('/team/members', newMember);
      if (response) {
        setTeamMembers([...teamMembers, response]);
        closeAddModal();
        setSuccess('Team member added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to add team member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    
    try {
      setLoading(true);
      const updateData = {
        firstName: editingMember.firstName,
        lastName: editingMember.lastName,
        phone: editingMember.phone,
        role: editingMember.role,
        permissions: editingMember.permissions,
        department: editingMember.department,
        employeeId: editingMember.employeeId,
        isActive: editingMember.isActive
      };

      const response = await apiService.put(`/team/members/${editingMember.id}`, updateData);
      if (response) {
        setTeamMembers(teamMembers.map(member => 
          member.id === editingMember.id ? { ...member, ...updateData } : member
        ));
        setEditingMember(null);
        setSuccess('Team member updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update team member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    // Find the member to get their name for confirmation
    const memberToDelete = teamMembers.find(m => m.id === memberId);
    if (!memberToDelete) {
      setError('Team member not found');
      return;
    }

    // Show delete confirmation modal
    setMemberToDelete(memberToDelete);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Use permanent delete endpoint to actually remove from database
      const response = await apiService.delete(`/team/members/${memberToDelete.id}/permanent`);
      
      if (response) {
        // Remove member from local state
        setTeamMembers(teamMembers.filter(member => member.id !== memberToDelete.id));
        setSuccess(`Team member "${memberToDelete.firstName} ${memberToDelete.lastName}" permanently removed!`);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error: any) {
      console.error('Delete member error:', error);
      
      // Handle specific error messages
      if (error.message?.includes('404')) {
        setError('Team member not found or already deleted');
      } else if (error.message?.includes('403')) {
        setError('You do not have permission to delete team members');
      } else if (error.message?.includes('400')) {
        setError('Cannot delete this team member');
      } else {
        setError(error.message || 'Failed to remove team member. Please try again.');
      }
      
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
      setMemberToDelete(null); // Close modal
    }
  };

  const getRolePermissions = (role: string) => {
    // For admin and owner roles, return all permissions
    if (role === 'admin' || role === 'owner') {
      return availablePermissions.map(perm => perm.value);
    }
    
    // For other roles, return empty array to allow manual selection
    return [];
  };

  const handleRoleChange = (role: string, isNewMember: boolean = false) => {
    const defaultPermissions = getRolePermissions(role);
    
    if (isNewMember) {
      setNewMember({ ...newMember, role, permissions: defaultPermissions });
    } else if (editingMember) {
      setEditingMember({ ...editingMember, role, permissions: defaultPermissions });
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = `${member.firstName} ${member.lastName} ${member.email}`
      .toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const canAddMembers = userPermissions.includes('add_team_member');
  const canEditMembers = userPermissions.includes('edit_team_member');
  const canDeleteMembers = userPermissions.includes('delete_team_member');

  const getRoleIcon = (role: string) => {
    const iconProps = { size: 14, className: "text-black" };
    switch (role) {
      case 'owner':
        return <LuCrown {...iconProps} />;
      case 'admin':
        return <LuShield {...iconProps} />;
      case 'manager':
        return <LuBriefcase {...iconProps} />;
      case 'team_lead':
        return <LuUsers {...iconProps} />;
      default:
        return <LuUser {...iconProps} />;
    }
  };

  const getRoleLabel = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.label || role;
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      owner: '#7c3aed',
      admin: '#dc2626',
      manager: '#ea580c',
      team_lead: '#059669',
      senior: '#0284c7',
      employee: '#6b7280',
      intern: '#6b7280',
      bde: '#6b7280',
      digital_marketer: '#6b7280'
    };
    return colors[role] || '#6b7280';
  };

  const truncateEmail = (email: string) => {
    const atIndex = email.indexOf('@');
    if (atIndex !== -1 && atIndex < 15) {
      return email.substring(0, atIndex) + '...';
    }
    if (email.length > 15) {
      return email.substring(0, 15) + '...';
    }
    return email;
  };

  const getFirstName = (firstName: string) => {
    return firstName.split(' ')[0];
  };

  if (loading && teamMembers.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <LuLoader className="w-8 h-8 animate-spin text-[#2A8B8A]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
            Team Management
          </h2>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Manage your team members, roles, and permissions
          </p>
        </div>
        {canAddMembers && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <LuUserPlus size={16} />
            Add Member
          </button>
        )}
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

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
            style={{ borderColor: colors.border }}
          />
        </div>
        <div className="relative">
          <LuFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
            style={{ borderColor: colors.border }}
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="group relative border rounded-lg p-4 hover:shadow-md transition-all duration-300 overflow-hidden"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.background
            }}
          >
            {/* Background Gradient */}
            <div 
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, ${getRoleColor(member.role)}20, ${getRoleColor(member.role)}05)`
              }}
            />

            <div className="relative z-10">
              {/* Header with Avatar and Actions */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                      style={{ backgroundColor: getRoleColor(member.role) }}
                    >
                      {getFirstName(member.firstName)[0]}{member.lastName[0]}
                    </div>
                    {/* Online indicator */}
                    {member.isActive && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white">
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base leading-tight" style={{ color: colors.text }}>
                      {getFirstName(member.firstName)}
                    </h3>
                    <p className="text-xs opacity-75" style={{ color: colors.textMuted }}>
                      {truncateEmail(member.email)}
                    </p>
                  </div>
                </div>
                
                {(canEditMembers || canDeleteMembers) && (
                  <div className="flex gap-1">
                    {canEditMembers && (
                      <button
                        onClick={() => setEditingMember(member)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                      >
                        <LuPencil size={14} className="text-black" />
                      </button>
                    )}
                    {canDeleteMembers && member.role !== 'owner' && (
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                      >
                        <LuTrash2 size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Role and Details Section */}
              <div className="space-y-3">
                {/* Role Badge */}
                <div className="flex items-center gap-2">
                  <div 
                    className="p-1.5 rounded"
                    style={{ backgroundColor: `${getRoleColor(member.role)}15` }}
                  >
                    {getRoleIcon(member.role)}
                  </div>
                  <span
                    className="px-2 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: `${getRoleColor(member.role)}20`,
                      color: getRoleColor(member.role)
                    }}
                  >
                    {getRoleLabel(member.role)}
                  </span>
                </div>
                
                {/* Member Details */}
                <div className="grid grid-cols-1 gap-2">
                  {member.department && (
                    <div className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <span style={{ color: colors.textMuted }}>
                        <span className="font-medium">Department:</span> {member.department}
                      </span>
                    </div>
                  )}
                  
                  {member.employeeId && (
                    <div className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <span style={{ color: colors.textMuted }}>
                        <span className="font-medium">ID:</span> {member.employeeId}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs">
                    <div 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    />
                    <span style={{ color: colors.textMuted }}>
                      <span className="font-medium">Added:</span> {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {member.lastLogin && (
                    <div className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <span style={{ color: colors.textMuted }}>
                        <span className="font-medium">Last login:</span> {new Date(member.lastLogin).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div 
                className="mt-4 pt-3 border-t"
                style={{ borderColor: colors.border + '40' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <LuSettings 
                      size={14} 
                      className="text-black "
                    />
                    <span className="text-xs font-medium" style={{ color: colors.text }}>
                      {member.permissions.length} Permission{member.permissions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        member.isActive 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {!member.isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <LuUsers className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
            No team members found
          </h3>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            {searchTerm || roleFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first team member'
            }
          </p>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            style={{ backgroundColor: colors.background }}
          >
            {/* Header */}
            <div 
              className="p-6 border-b"
              style={{ 
                backgroundColor: colors.primary + '10',
                borderColor: colors.border
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <LuUserPlus 
                      size={24} 
                      style={{ color: colors.primary }}
                    />
                  </div>
                  <div>
                    <h3 
                      className="text-xl font-bold"
                      style={{ color: colors.text }}
                    >
                      Add Team Member
                    </h3>
                    <p 
                      className="text-sm mt-1"
                      style={{ color: colors.textMuted }}
                    >
                      {addMemberStep === 1 ? 'Step 1: Basic Details' : 'Step 2: Permissions & Access'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeAddModal}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  style={{ color: colors.textMuted }}
                >
                  <LuX size={20} />
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div 
                    className={`h-2 flex-1 rounded-full ${addMemberStep >= 1 ? 'opacity-100' : 'opacity-30'}`}
                    style={{ backgroundColor: addMemberStep >= 1 ? colors.primary : colors.border }}
                  />
                  <div 
                    className={`h-2 flex-1 rounded-full ${addMemberStep >= 2 ? 'opacity-100' : 'opacity-30'}`}
                    style={{ backgroundColor: addMemberStep >= 2 ? colors.primary : colors.border }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span 
                    className={`text-xs font-medium ${addMemberStep >= 1 ? 'opacity-100' : 'opacity-50'}`}
                    style={{ color: addMemberStep >= 1 ? colors.primary : colors.textMuted }}
                  >
                    Basic Details
                  </span>
                  <span 
                    className={`text-xs font-medium ${addMemberStep >= 2 ? 'opacity-100' : 'opacity-50'}`}
                    style={{ color: addMemberStep >= 2 ? colors.primary : colors.textMuted }}
                  >
                    Permissions
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {addMemberStep === 1 ? (
                /* Step 1: Basic Details */
                <div className="space-y-5">
                  {/* Personal Information Section */}
                  <div>
                    <h4 
                      className="text-sm font-semibold mb-3 flex items-center gap-2"
                      style={{ color: colors.text }}
                    >
                      <LuUser size={16} />
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="First Name *"
                          value={newMember.firstName}
                          onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                          className="input-field pl-3"
                          style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text
                          }}
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Last Name *"
                          value={newMember.lastName}
                          onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                          className="input-field pl-3"
                          style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Section */}
                  <div>
                    <h4 
                      className="text-sm font-semibold mb-3 flex items-center gap-2"
                      style={{ color: colors.text }}
                    >
                      <LuSettings size={16} />
                      Contact Information
                    </h4>
                    <div className="space-y-4">
                      <input
                        type="email"
                        placeholder="Email Address *"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        className="input-field pl-3"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={newMember.phone}
                        onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                        className="input-field pl-3"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                      />
                    </div>
                  </div>

                  {/* Security Section */}
                  <div>
                    <h4 
                      className="text-sm font-semibold mb-3 flex items-center gap-2"
                      style={{ color: colors.text }}
                    >
                      <LuShield size={16} />
                      Security
                    </h4>
                    <input
                      type="password"
                      placeholder="Password *"
                      value={newMember.password}
                      onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                      className="input-field pl-3"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    />
                  </div>

                  {/* Organization Section */}
                  <div>
                    <h4 
                      className="text-sm font-semibold mb-3 flex items-center gap-2"
                      style={{ color: colors.text }}
                    >
                      <LuBriefcase size={16} />
                      Organization Details
                    </h4>
                    <div className="space-y-4">
                      <select
                        value={newMember.role}
                        onChange={(e) => handleRoleChange(e.target.value, true)}
                        className="input-field pl-3"
                        style={{
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                      >
                        {roles.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Department"
                          value={newMember.department}
                          onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                          className="input-field pl-3"
                          style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Employee ID"
                          value={newMember.employeeId}
                          onChange={(e) => setNewMember({ ...newMember, employeeId: e.target.value })}
                          className="input-field pl-3"
                          style={{
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.text
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Step 2: Permissions */
                <div className="space-y-5">
                  <div>
                    <h4 
                      className="text-lg font-semibold mb-2 flex items-center gap-2"
                      style={{ color: colors.text }}
                    >
                      <LuShield size={20} />
                      Select Permissions for {newMember.firstName} {newMember.lastName}
                    </h4>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: colors.textMuted }}
                    >
                      {newMember.role === 'admin' || newMember.role === 'owner' 
                        ? 'Admin and Owner roles automatically receive all permissions.'
                        : 'Choose which features and actions this team member can access. You can modify these later.'
                      }
                    </p>
                    
                    {newMember.role === 'admin' || newMember.role === 'owner' ? (
                      <div 
                        className="p-4 rounded-lg border-2 border-dashed text-center"
                        style={{ 
                          borderColor: colors.primary + '50', 
                          backgroundColor: colors.primary + '10',
                          color: colors.text 
                        }}
                      >
                        <LuShield size={24} className="mx-auto mb-2" style={{ color: colors.primary }} />
                        <p className="font-medium">Full Access Granted</p>
                        <p className="text-sm opacity-70">This role has access to all {availablePermissions.length} permissions</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                      {availablePermissions.map((permission) => {
                        const isSelected = newMember.permissions.includes(permission.value);
                        return (
                          <label 
                            key={permission.value}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected ? 'border-opacity-100' : 'border-opacity-50'
                            }`}
                            style={{ 
                              borderColor: isSelected ? colors.primary : colors.border,
                              backgroundColor: isSelected ? colors.primary + '10' : 'transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePermission(permission.value)}
                              className="rounded"
                              style={{ accentColor: colors.primary }}
                            />
                            <div className="flex-1">
                              <span 
                                className="text-sm font-medium capitalize"
                                style={{ color: colors.text }}
                              >
                                {permission.label}
                              </span>
                              {permission.category && (
                                <div 
                                  className="text-xs opacity-70 mt-1"
                                  style={{ color: colors.text }}
                                >
                                  {permission.category}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <LuCheck 
                                size={16} 
                                style={{ color: colors.primary }}
                              />
                            )}
                          </label>
                        );
                      })}
                      </div>
                    )}
                    
                    <div 
                      className="mt-4 p-3 rounded-lg border"
                      style={{ 
                        borderColor: colors.border,
                        backgroundColor: colors.background + '50'
                      }}
                    >
                      <p 
                        className="text-sm font-medium"
                        style={{ color: colors.text }}
                      >
                        Selected Permissions: {newMember.permissions.length}
                      </p>
                      <p 
                        className="text-xs mt-1"
                        style={{ color: colors.textMuted }}
                      >
                        Role: {roles.find(r => r.value === newMember.role)?.label}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div 
              className="p-6 border-t"
              style={{ 
                backgroundColor: colors.background,
                borderColor: colors.border
              }}
            >
              <div className="flex gap-3">
                {addMemberStep === 1 ? (
                  <>
                    <button
                      onClick={closeAddModal}
                      className="btn-secondary flex-1"
                    >
                      <LuX size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={goToNextStep}
                      disabled={!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.password}
                      className="btn-primary flex-1"
                      style={{
                        backgroundColor: colors.primary,
                        borderColor: colors.primary
                      }}
                    >
                      Next: Permissions
                      <LuSettings size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={goToPreviousStep}
                      className="btn-secondary"
                    >
                      <LuSettings size={16} />
                      Back
                    </button>
                    <button
                      onClick={handleAddMember}
                      className="btn-primary flex-1"
                      style={{
                        backgroundColor: colors.primary,
                        borderColor: colors.primary
                      }}
                    >
                      {loading ? (
                        <LuLoader className="animate-spin" size={16} />
                      ) : (
                        <>
                          <LuUserPlus size={16} />
                          Add Member
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            style={{ backgroundColor: colors.background }}
          >
            {/* Header */}
            <div 
              className="p-6 border-b"
              style={{ 
                backgroundColor: colors.primary + '10',
                borderColor: colors.border
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <LuPencil 
                      size={24} 
                      style={{ color: colors.primary }}
                    />
                  </div>
                  <div>
                    <h3 
                      className="text-xl font-bold"
                      style={{ color: colors.text }}
                    >
                      Edit Team Member
                    </h3>
                    <p 
                      className="text-sm mt-1"
                      style={{ color: colors.textMuted }}
                    >
                      Update {editingMember.firstName}'s information
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingMember(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  style={{ color: colors.textMuted }}
                >
                  <LuX size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-5">
                {/* Personal Information Section */}
                <div>
                  <h4 
                    className="text-sm font-semibold mb-3 flex items-center gap-2"
                    style={{ color: colors.text }}
                  >
                    <LuUser size={16} />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={editingMember.firstName}
                      onChange={(e) => setEditingMember({ ...editingMember, firstName: e.target.value })}
                      className="input-field pl-3"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={editingMember.lastName}
                      onChange={(e) => setEditingMember({ ...editingMember, lastName: e.target.value })}
                      className="input-field pl-3"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={editingMember.phone || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                      className="input-field pl-3"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    />
                  </div>
                </div>

                {/* Role & Access Section */}
                <div>
                  <h4 
                    className="text-sm font-semibold mb-3 flex items-center gap-2"
                    style={{ color: colors.text }}
                  >
                    <LuShield size={16} />
                    Role & Access
                  </h4>
                  <select
                    value={editingMember.role}
                    onChange={(e) => handleRoleChange(e.target.value, false)}
                    className="input-field pl-3"
                    disabled={editingMember.role === 'owner'}
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                      opacity: editingMember.role === 'owner' ? 0.6 : 1
                    }}
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                  {editingMember.role === 'owner' && (
                    <p 
                      className="text-xs mt-2"
                      style={{ color: colors.textMuted }}
                    >
                      Owner role cannot be changed
                    </p>
                  )}
                </div>

                {/* Permissions Section */}
                <div>
                  <h4 
                    className="text-sm font-semibold mb-3 flex items-center gap-2"
                    style={{ color: colors.text }}
                  >
                    <LuSettings size={16} />
                    Custom Permissions
                  </h4>
                  <p 
                    className="text-xs mb-3"
                    style={{ color: colors.textMuted }}
                  >
                    {editingMember.role === 'admin' || editingMember.role === 'owner' 
                      ? 'Admin and Owner roles automatically have all permissions and cannot be customized.'
                      : 'Customize permissions beyond the default role settings. Changes are applied immediately.'
                    }
                  </p>
                  
                  {editingMember.role === 'admin' || editingMember.role === 'owner' ? (
                    <div 
                      className="p-3 rounded-lg border text-center"
                      style={{ 
                        borderColor: colors.primary + '50', 
                        backgroundColor: colors.primary + '10',
                        color: colors.text 
                      }}
                    >
                      <LuShield size={20} className="mx-auto mb-2" style={{ color: colors.primary }} />
                      <p className="text-sm font-medium">Full Access</p>
                      <p className="text-xs opacity-70">All {availablePermissions.length} permissions granted</p>
                    </div>
                  ) : (
                  
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3" style={{ borderColor: colors.border }}>
                    {availablePermissions.map((permission) => {
                      const isSelected = editingMember.permissions.includes(permission.value);
                      return (
                        <label 
                          key={permission.value}
                          className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all ${
                            isSelected ? 'border-opacity-100' : 'border-opacity-50'
                          }`}
                          style={{ 
                            backgroundColor: isSelected ? colors.primary + '10' : 'transparent'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const updatedPermissions = isSelected
                                ? editingMember.permissions.filter(p => p !== permission.value)
                                : [...editingMember.permissions, permission.value];
                              setEditingMember({ ...editingMember, permissions: updatedPermissions });
                            }}
                            className="rounded"
                            style={{ accentColor: colors.primary }}
                          />
                          <div className="flex-1">
                            <span 
                              className="text-sm font-medium capitalize"
                              style={{ color: colors.text }}
                            >
                              {permission.label}
                            </span>
                            {permission.category && (
                              <div 
                                className="text-xs opacity-70"
                                style={{ color: colors.text }}
                              >
                                {permission.category}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <LuCheck 
                              size={14} 
                              style={{ color: colors.primary }}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                  )}
                </div>

                {/* Organization Section */}
                <div>
                  <h4 
                    className="text-sm font-semibold mb-3 flex items-center gap-2"
                    style={{ color: colors.text }}
                  >
                    <LuBriefcase size={16} />
                    Organization Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Department"
                      value={editingMember.department || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, department: e.target.value })}
                      className="input-field pl-3"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Employee ID"
                      value={editingMember.employeeId || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, employeeId: e.target.value })}
                      className="input-field pl-3"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    />
                  </div>
                </div>

                {/* Status Section */}
                <div>
                  <h4 
                    className="text-sm font-semibold mb-3 flex items-center gap-2"
                    style={{ color: colors.text }}
                  >
                    <LuSettings size={16} />
                    Member Status
                  </h4>
                  <label className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: colors.border }}>
                    <input
                      type="checkbox"
                      checked={editingMember.isActive}
                      onChange={(e) => setEditingMember({ ...editingMember, isActive: e.target.checked })}
                      className="rounded"
                      style={{ accentColor: colors.primary }}
                    />
                    <span className="text-sm font-medium" style={{ color: colors.text }}>
                      Active Member
                    </span>
                    <span 
                      className="text-xs ml-auto"
                      style={{ color: colors.textMuted }}
                    >
                      {editingMember.isActive ? 'Can access system' : 'Access disabled'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div 
              className="p-6 border-t"
              style={{ 
                backgroundColor: colors.background,
                borderColor: colors.border
              }}
            >
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingMember(null)}
                  className="btn-secondary flex-1"
                >
                  <LuX size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMember}
                  className="btn-primary flex-1"
                  style={{
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  }}
                >
                  {loading ? (
                    <LuLoader className="animate-spin" size={16} />
                  ) : (
                    <>
                      <LuCheck size={16} />
                      Update Member
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            style={{ backgroundColor: colors.background }}
          >
            {/* Header */}
            <div 
              className="p-6 border-b"
              style={{ 
                backgroundColor: '#fee2e2',
                borderColor: colors.border
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <LuTrash2 
                    size={24} 
                    className="text-red-600"
                  />
                </div>
                <div>
                  <h3 
                    className="text-xl font-bold text-red-800"
                  >
                    Remove Team Member
                  </h3>
                  <p 
                    className="text-sm mt-1 text-red-600"
                  >
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                    style={{ 
                      backgroundColor: getRoleColor(memberToDelete.role)
                    }}
                  >
                    {getFirstName(memberToDelete.firstName)[0]}{memberToDelete.lastName[0]}
                  </div>
                  <h4 
                    className="text-lg font-semibold"
                    style={{ color: colors.text }}
                  >
                    {getFirstName(memberToDelete.firstName)} {memberToDelete.lastName}
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: colors.textMuted }}
                  >
                    {memberToDelete.email}
                  </p>
                  <span 
                    className="inline-block px-2 py-1 text-xs rounded-full mt-2 capitalize"
                    style={{ 
                      backgroundColor: colors.primary + '20',
                      color: colors.primary
                    }}
                  >
                    {memberToDelete.role.replace('_', ' ')}
                  </span>
                </div>
                
                <div 
                  className="p-4 rounded-lg border mb-4"
                  style={{ 
                    borderColor: '#fca5a5',
                    backgroundColor: '#fef2f2'
                  }}
                >
                  <p 
                    className="text-sm font-medium text-red-800 mb-2"
                  >
                    Are you sure you want to remove this team member?
                  </p>
                  <ul className="text-xs text-red-600 text-left space-y-1">
                    <li>• Their account will be deactivated</li>
                    <li>• They will lose access to the system</li>
                    <li>• All their permissions will be revoked</li>
                    <li>• This action can be reversed by reactivating their account</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div 
              className="p-6 border-t"
              style={{ 
                backgroundColor: colors.background,
                borderColor: colors.border
              }}
            >
              <div className="flex gap-3">
                <button
                  onClick={() => setMemberToDelete(null)}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  <LuX size={16} />
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMember}
                  disabled={loading}
                  className="btn-danger flex-1"
                >
                  {loading ? (
                    <LuLoader className="animate-spin" size={16} />
                  ) : (
                    <>
                      <LuTrash2 size={16} />
                      Remove Member
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;