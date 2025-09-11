"use client";

import React, { useState, useEffect } from 'react';
import { 
  LuRocket, 
  LuUsers, 
  LuTestTube, 
  LuChart, 
  LuPlus,
  LuRefreshCw,
  LuDownload,
  LuPlay,
  LuPause,
  LuTrash2,
  LuEdit,
  LuCopy
} from 'react-icons/lu';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../services/apiService';

// Types
interface Segment {
  id: string;
  name: string;
  description?: string;
  criteria: Record<string, any>;
  contactCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  segments: string[];
  messageTemplate: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

interface ABTestResults {
  testId: string;
  testName: string;
  status: string;
  variations: Array<{
    id: string;
    name: string;
    trafficAllocation: number;
    metrics: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      converted: number;
    };
  }>;
  winner?: string;
  confidence?: number;
  startedAt: string;
  endedAt?: string;
}

interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue?: number;
  };
}

type TabType = 'campaigns' | 'segments' | 'abTests' | 'analytics';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [abTests, setABTests] = useState<ABTestResults[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics[]>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        loadCampaigns(),
        loadSegments(),
        loadABTests(),
        loadAnalytics()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load campaign data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await apiService.getCampaigns();
      setCampaigns(response.campaigns || []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
    }
  };

  const loadSegments = async () => {
    try {
      const response = await apiService.getSegments();
      setSegments(response.segments || []);
    } catch (err) {
      console.error('Error loading segments:', err);
    }
  };

  const loadABTests = async () => {
    try {
      const response = await apiService.getABTests();
      setABTests(response.tests || []);
    } catch (err) {
      console.error('Error loading A/B tests:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiService.getCampaignAnalytics();
      setCampaignAnalytics(response.analytics || []);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  // Campaign handlers
  const handleCreateCampaign = async (campaignData: Partial<Campaign>) => {
    try {
      await apiService.createCampaign(campaignData);
      await loadCampaigns();
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError('Failed to create campaign. Please try again.');
    }
  };

  const handleUpdateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      await apiService.updateCampaign(id, updates);
      await loadCampaigns();
    } catch (err) {
      console.error('Error updating campaign:', err);
      setError('Failed to update campaign. Please try again.');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await apiService.deleteCampaign(id);
      await loadCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError('Failed to delete campaign. Please try again.');
    }
  };

  // Segment handlers
  const handleCreateSegment = async (segmentData: Partial<Segment>) => {
    try {
      await apiService.createSegment(segmentData);
      await loadSegments();
    } catch (err) {
      console.error('Error creating segment:', err);
      setError('Failed to create segment. Please try again.');
    }
  };

  const handleDeleteSegment = async (id: string) => {
    try {
      await apiService.deleteSegment(id);
      await loadSegments();
    } catch (err) {
      console.error('Error deleting segment:', err);
      setError('Failed to delete segment. Please try again.');
    }
  };

  const tabs = [
    { id: 'campaigns', label: 'Campaigns', icon: <LuRocket className="w-4 h-4" /> },
    { id: 'segments', label: 'Segments', icon: <LuUsers className="w-4 h-4" /> },
    { id: 'abTests', label: 'A/B Tests', icon: <LuTestTube className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <LuChart className="w-4 h-4" /> }
  ];

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LuRefreshCw className="w-8 h-8 text-[#2A8B8A] animate-spin" />
          <span className="ml-2 text-slate-600">Loading...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'campaigns':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
                <p className="text-slate-600 mt-1">
                  Create and manage your marketing campaigns
                </p>
              </div>
              <button
                onClick={() => handleCreateCampaign({ name: 'New Campaign', type: 'whatsapp' })}
                className="flex items-center gap-2 px-4 py-2 bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 text-white rounded-lg transition-colors"
              >
                <LuPlus className="w-4 h-4" />
                Create Campaign
              </button>
            </div>

            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{campaign.name}</h3>
                      <p className="text-slate-600">{campaign.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span>Status: {campaign.status}</span>
                        <span>Type: {campaign.type}</span>
                        <span>Segments: {campaign.segments.length}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <LuTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {campaign.metrics && (
                    <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-slate-100">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900">{campaign.metrics.sent}</div>
                        <div className="text-xs text-slate-500">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900">{campaign.metrics.delivered}</div>
                        <div className="text-xs text-slate-500">Delivered</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900">{campaign.metrics.opened}</div>
                        <div className="text-xs text-slate-500">Opened</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900">{campaign.metrics.clicked}</div>
                        <div className="text-xs text-slate-500">Clicked</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-slate-900">{campaign.metrics.converted}</div>
                        <div className="text-xs text-slate-500">Converted</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {campaigns.length === 0 && (
                <div className="text-center py-12">
                  <LuRocket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No campaigns yet</h3>
                  <p className="text-slate-500 mb-4">
                    Create your first campaign to get started
                  </p>
                  <button
                    onClick={() => handleCreateCampaign({ name: 'New Campaign', type: 'whatsapp' })}
                    className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90"
                  >
                    Create Campaign
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'segments':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Segments</h1>
                <p className="text-slate-600 mt-1">
                  Create and manage customer segments
                </p>
              </div>
              <button
                onClick={() => handleCreateSegment({ name: 'New Segment', criteria: {}, contactCount: 0, isActive: true })}
                className="flex items-center gap-2 px-4 py-2 bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 text-white rounded-lg transition-colors"
              >
                <LuPlus className="w-4 h-4" />
                Create Segment
              </button>
            </div>

            <div className="grid gap-4">
              {segments.map((segment) => (
                <div key={segment.id} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{segment.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          segment.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {segment.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-slate-600">{segment.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span>Contacts: {segment.contactCount.toLocaleString()}</span>
                        <span>Updated: {new Date(segment.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteSegment(segment.id)}
                        className="p-2 text-slate-400 hover:text-red-600"
                      >
                        <LuTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {segments.length === 0 && (
                <div className="text-center py-12">
                  <LuUsers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No segments yet</h3>
                  <p className="text-slate-500 mb-4">
                    Create your first segment to target specific customers
                  </p>
                  <button
                    onClick={() => handleCreateSegment({ name: 'New Segment', criteria: {}, contactCount: 0, isActive: true })}
                    className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90"
                  >
                    Create Segment
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'abTests':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">A/B Tests</h1>
                <p className="text-slate-600 mt-1">
                  Test different campaign variations
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {abTests.map((test) => (
                <div key={test.testId} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{test.testName}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          test.status === 'running' 
                            ? 'bg-green-100 text-green-800'
                            : test.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {test.status}
                        </span>
                        <span>Started: {new Date(test.startedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {abTests.length === 0 && (
                <div className="text-center py-12">
                  <LuTestTube className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No A/B tests yet</h3>
                  <p className="text-slate-500 mb-4">
                    Create your first A/B test to optimize performance
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
                <p className="text-slate-600 mt-1">
                  Performance insights and campaign analytics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {campaignAnalytics.slice(0, 4).map((analytics) => (
                <div key={analytics.campaignId} className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-sm font-medium text-slate-900 mb-2">{analytics.campaignName}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Sent:</span>
                      <span className="font-medium">{analytics.metrics.sent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Delivered:</span>
                      <span className="font-medium">{analytics.metrics.delivered.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Opened:</span>
                      <span className="font-medium">{analytics.metrics.opened.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {campaignAnalytics.length === 0 && (
              <div className="text-center py-12">
                <LuChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No analytics data yet</h3>
                <p className="text-slate-500 mb-4">
                  Run some campaigns to see performance analytics
                </p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <LuRocket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Coming Soon</h3>
            <p className="text-slate-500">
              This feature is under development.
            </p>
          </div>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Advanced Campaign Management</h1>
            <p className="text-slate-600 mt-2">
              Powerful tools for segmentation, A/B testing, and analytics
            </p>
          </div>

          <div className="border-b border-slate-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#2A8B8A] text-[#2A8B8A]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="min-h-[600px]">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
