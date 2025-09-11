"use client";
import React, { useState, useEffect } from 'react';
import {
  LuPlus,
  LuSearch,
  LuFilter,
  LuPencil,
  LuTrash2,
  LuUsers,
  LuRefreshCw,
  LuClock,
  LuZap,
  LuCopy,
  LuDownload,
  LuMenu
} from 'react-icons/lu';
import SegmentBuilder, { SegmentConfig } from './SegmentBuilder';

export type Segment = {
  id: string;
  name: string;
  description?: string;
  type: 'dynamic' | 'static';
  contactCount: number;
  rules: any; // Rule configuration
  createdAt: string;
  updatedAt: string;
  lastCalculated?: string;
  tags?: string[];
  isActive: boolean;
};

type SegmentManagerProps = {
  segments: Segment[];
  onCreateSegment: (segment: SegmentConfig) => void;
  onUpdateSegment: (segmentId: string, segment: SegmentConfig) => void;
  onDeleteSegment: (segmentId: string) => void;
  onDuplicateSegment: (segmentId: string) => void;
  onRefreshSegment: (segmentId: string) => void;
  onExportSegment: (segmentId: string, format: 'csv' | 'xlsx') => void;
  onToggleActive: (segmentId: string, isActive: boolean) => void;
};

export default function SegmentManager({
  segments,
  onCreateSegment,
  onUpdateSegment,
  onDeleteSegment,
  onDuplicateSegment,
  onRefreshSegment,
  onExportSegment,
  onToggleActive
}: SegmentManagerProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'dynamic' | 'static'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'contactCount' | 'createdAt' | 'updatedAt'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter and sort segments
  const filteredSegments = segments
    .filter(segment => {
      const matchesSearch = segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           segment.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || segment.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleCreateSegment = (segmentConfig: SegmentConfig) => {
    onCreateSegment(segmentConfig);
    setShowBuilder(false);
  };

  const handleEditSegment = (segment: Segment) => {
    setEditingSegment(segment);
    setShowBuilder(true);
  };

  const handleUpdateSegment = (segmentConfig: SegmentConfig) => {
    if (editingSegment) {
      onUpdateSegment(editingSegment.id, segmentConfig);
      setEditingSegment(null);
      setShowBuilder(false);
    }
  };

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setEditingSegment(null);
  };

  const toggleSegmentSelection = (segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const selectAllSegments = () => {
    setSelectedSegments(filteredSegments.map(s => s.id));
  };

  const clearSelection = () => {
    setSelectedSegments([]);
  };

  const handleBulkDelete = () => {
    selectedSegments.forEach(onDeleteSegment);
    clearSelection();
  };

  const handleBulkToggleActive = (active: boolean) => {
    selectedSegments.forEach(id => onToggleActive(id, active));
    clearSelection();
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

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contact Segments</h1>
          <p className="text-slate-600 mt-1">
            Create and manage dynamic contact segments for targeted campaigns
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 text-white rounded-lg transition-colors"
        >
          <LuPlus className="w-4 h-4" />
          Create Segment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2A8B8A]/10 rounded-lg">
              <LuUsers className="w-5 h-5 text-[#2A8B8A]" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Segments</p>
              <p className="text-xl font-bold text-slate-900">{segments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LuZap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Dynamic Segments</p>
              <p className="text-xl font-bold text-slate-900">
                {segments.filter(s => s.type === 'dynamic').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <LuClock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Static Segments</p>
              <p className="text-xl font-bold text-slate-900">
                {segments.filter(s => s.type === 'static').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <LuUsers className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Contacts</p>
              <p className="text-xl font-bold text-slate-900">
                {segments.reduce((sum, s) => sum + s.contactCount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search segments..."
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="dynamic">Dynamic</option>
              <option value="static">Static</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
            >
              <option value="updatedAt-desc">Recently Updated</option>
              <option value="createdAt-desc">Recently Created</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="contactCount-desc">Most Contacts</option>
              <option value="contactCount-asc">Least Contacts</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedSegments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                {selectedSegments.length} selected
              </span>
              <button
                onClick={() => handleBulkToggleActive(true)}
                className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkToggleActive(false)}
                className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
              >
                Deactivate
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="px-2 py-1 text-sm text-slate-500 hover:text-slate-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Segments Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-4 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedSegments.length === filteredSegments.length && filteredSegments.length > 0}
                    onChange={selectedSegments.length === filteredSegments.length ? clearSelection : selectAllSegments}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Segment</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">Type</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">Contacts</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">Status</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">Last Updated</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSegments.map((segment) => (
                <tr key={segment.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSegments.includes(segment.id)}
                      onChange={() => toggleSegmentSelection(segment.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{segment.name}</div>
                      {segment.description && (
                        <div className="text-sm text-slate-500 mt-1 max-w-md truncate">
                          {segment.description}
                        </div>
                      )}
                      {segment.tags && segment.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {segment.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-flex px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {segment.tags.length > 3 && (
                            <span className="inline-flex px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                              +{segment.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      {segment.type === 'dynamic' ? (
                        <>
                          <LuZap className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-blue-700">Dynamic</span>
                        </>
                      ) : (
                        <>
                          <LuClock className="w-4 h-4 text-amber-500" />
                          <span className="text-sm text-amber-700">Static</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">
                        {segment.contactCount.toLocaleString()}
                      </div>
                      {segment.lastCalculated && segment.type === 'dynamic' && (
                        <div className="text-xs text-slate-500">
                          Updated {formatRelativeTime(segment.lastCalculated)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <button
                      onClick={() => onToggleActive(segment.id, !segment.isActive)}
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        segment.isActive
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {segment.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="text-center px-6 py-4 text-sm text-slate-500">
                    {formatRelativeTime(segment.updatedAt)}
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {segment.type === 'dynamic' && (
                        <button
                          onClick={() => onRefreshSegment(segment.id)}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                          title="Refresh segment"
                        >
                          <LuRefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditSegment(segment)}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                        title="Edit segment"
                      >
                        <LuPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDuplicateSegment(segment.id)}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                        title="Duplicate segment"
                      >
                        <LuCopy className="w-4 h-4" />
                      </button>
                      <div className="relative group">
                        <button className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors">
                          <LuMenu className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => onExportSegment(segment.id, 'csv')}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-lg"
                          >
                            Export CSV
                          </button>
                          <button
                            onClick={() => onExportSegment(segment.id, 'xlsx')}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            Export Excel
                          </button>
                          <button
                            onClick={() => onDeleteSegment(segment.id)}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSegments.length === 0 && (
          <div className="text-center py-12">
            <LuUsers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No segments found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Create your first segment to get started.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowBuilder(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 text-white rounded-lg transition-colors"
              >
                <LuPlus className="w-4 h-4" />
                Create Segment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Segment Builder Modal */}
      <SegmentBuilder
        isOpen={showBuilder}
        onClose={handleCloseBuilder}
        onSave={editingSegment ? handleUpdateSegment : handleCreateSegment}
        initialSegment={editingSegment ? {
          name: editingSegment.name,
          description: editingSegment.description,
          type: editingSegment.type,
          groups: editingSegment.rules?.groups || []
        } : undefined}
      />
    </div>
  );
}
