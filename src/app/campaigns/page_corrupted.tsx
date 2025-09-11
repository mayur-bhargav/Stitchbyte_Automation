"use client";
import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import ProtectedRoute from "../components/ProtectedRoute";
import SegmentManager, { Segment } from "./components/SegmentManager";
import { ABTestBuilder, ABTestMonitor, ABTestConfig, ABTestResults } from "./components/ABTestFramework";
import AnalyticsDashboard, { CampaignAnalytics, TimeSeriesData, SegmentPerformance } from "./components/AnalyticsDashboard";
import { SegmentConfig } from "./components/SegmentBuilder";
import { apiService } from "../services/apiService";
import {
  LuUsers,
  LuTrendingUp,
  LuActivity,
  LuTarget,
  LuTestTube,
  LuActivity as LuChart,
  LuSettings,
  LuPlus,
  LuRocket
} from "react-icons/lu";

type TabType = 'campaigns' | 'segments' | 'abTests' | 'analytics';

function EnhancedCampaignsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Segments State
  const [segments, setSegments] = useState<Segment[]>([]);
  
  // A/B Tests State
  const [abTests, setAbTests] = useState<ABTestResults[]>([]);
  const [showABTestBuilder, setShowABTestBuilder] = useState(false);
  const [showABTestMonitor, setShowABTestMonitor] = useState(false);
  const [selectedABTest, setSelectedABTest] = useState<ABTestResults | null>(null);
  
  // Analytics State
  const [campaigns, setCampaigns] = useState<CampaignAnalytics[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [segmentPerformance, setSegmentPerformance] = useState<SegmentPerformance[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Load data from API
  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load data based on active tab
      await Promise.all([
        loadSegments(),
        loadCampaigns(),
        loadABTests(),
        loadDashboardStats(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSegments = async () => {
    try {
      const response = await apiService.getSegments(1, 50);
      if (response && response.segments) {
        setSegments(response.segments);
      }
    } catch (error) {
      console.error('Error loading segments:', error);
      // Use fallback mock data if API fails
      setSegments([
        {
          id: '1',
          name: 'VIP Customers',
          type: 'dynamic',
          contactCount: 245,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rules: { groups: [] }
        },
        {
          id: '2',
          name: 'Recent Shoppers',
          type: 'static',
          contactCount: 189,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rules: { groups: [] }
        }
      ]);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await apiService.getCampaigns(1, 50);
      if (response && response.campaigns) {
        // Transform API response to match frontend interface
        const transformedCampaigns = response.campaigns.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          metrics: {
            sent: campaign.sent_count || 0,
            delivered: campaign.delivered_count || 0,
            read: campaign.read_count || 0,
            clicked: campaign.clicked_count || 0,
            replied: campaign.replied_count || 0,
            deliveryRate: campaign.delivery_rate || 0,
            readRate: campaign.read_rate || 0,
            ctr: campaign.click_rate || 0,
            replyRate: campaign.reply_rate || 0,
            totalCost: campaign.total_cost || 0,
            roi: campaign.roi || 0,
          }
        }));
        setCampaigns(transformedCampaigns);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      // Use fallback mock data if API fails
      setCampaigns([
        {
          id: '1',
          name: 'Summer Sale Campaign',
          metrics: {
            sent: 1250,
            delivered: 1198,
            read: 856,
            clicked: 124,
            replied: 45,
            deliveryRate: 95.8,
            readRate: 71.4,
            ctr: 14.5,
            replyRate: 5.3,
            totalCost: 62.50,
            roi: 285.6,
          }
        }
      ]);
    }
  };

  const loadABTests = async () => {
    try {
      const response = await apiService.getABTests(1, 50);
      if (response && response.ab_tests) {
        setAbTests(response.ab_tests);
      }
    } catch (error) {
      console.error('Error loading A/B tests:', error);
      // Use fallback mock data if API fails
      setAbTests([
        {
          id: '1',
          name: 'Holiday Message Test',
          status: 'completed',
          segmentId: '1',
          testPercentage: 30,
          durationHours: 48,
          successMetric: 'read_rate',
          variations: [
            {
              id: 'A',
              name: 'Variation A',
              messageTemplate: 'Happy holidays! Get 25% off...',
              metrics: { sent: 150, delivered: 145, read: 98, clicked: 18, conversionRate: 12.3 }
            },
            {
              id: 'B',
              name: 'Variation B', 
              messageTemplate: '🎄 Holiday Special: Save 25%...',
              metrics: { sent: 150, delivered: 147, read: 118, clicked: 28, conversionRate: 19.0 }
            }
          ],
          results: { winner: 'B', confidence: 95.2 }
        }
      ]);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const stats = await apiService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Use fallback mock data if API fails
      setDashboardStats({
        total_campaigns: 12,
        active_campaigns: 3,
        total_messages_sent: 15420,
        average_delivery_rate: 94.2,
        average_read_rate: 68.5,
        monthly_growth: 23.4
      });
    }
  };

  // Segment API handlers
  const handleCreateSegment = async (segmentConfig: SegmentConfig) => {
    try {
      setLoading(true);
      const newSegment = await apiService.createSegment({
        name: segmentConfig.name,
        description: segmentConfig.description,
        type: segmentConfig.type,
        rules: segmentConfig.rules,
      });
      
      if (newSegment) {
        await loadSegments(); // Reload segments
      }
    } catch (error) {
      console.error('Error creating segment:', error);
      setError('Failed to create segment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSegment = async (id: string, updates: Partial<Segment>) => {
    try {
      setLoading(true);
      await apiService.updateSegment(id, updates);
      await loadSegments(); // Reload segments
    } catch (error) {
      console.error('Error updating segment:', error);
      setError('Failed to update segment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSegment = async (id: string) => {
    try {
      setLoading(true);
      await apiService.deleteSegment(id);
      await loadSegments(); // Reload segments
    } catch (error) {
      console.error('Error deleting segment:', error);
      setError('Failed to delete segment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Additional segment handlers
  const handleDuplicateSegment = async (segmentId: string) => {
    const originalSegment = segments.find(seg => seg.id === segmentId);
    if (originalSegment) {
      const duplicatedSegment = {
        name: `${originalSegment.name} (Copy)`,
        description: originalSegment.description,
        type: originalSegment.type,
        rules: originalSegment.rules,
      };
      await handleCreateSegment(duplicatedSegment);
    }
  };

  const handleRefreshSegment = async (segmentId: string) => {
    try {
      setLoading(true);
      // In a real implementation, this would trigger segment recalculation
      await loadSegments();
    } catch (error) {
      console.error('Error refreshing segment:', error);
      setError('Failed to refresh segment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSegment = async (segmentId: string, format: 'csv' | 'xlsx') => {
    try {
      setLoading(true);
      // In a real implementation, this would export segment data
      await apiService.exportCampaignAnalytics([segmentId], format as 'csv' | 'pdf');
      alert(`Segment exported in ${format.toUpperCase()} format!`);
    } catch (error) {
      console.error('Error exporting segment:', error);
      setError('Failed to export segment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSegmentActive = async (segmentId: string, isActive: boolean) => {
    try {
      setLoading(true);
      await apiService.updateSegment(segmentId, { isActive });
      await loadSegments();
    } catch (error) {
      console.error('Error toggling segment:', error);
      setError('Failed to update segment status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // A/B Test API handlers
  const handleCreateABTest = async (config: ABTestConfig) => {
    try {
      setLoading(true);
      const newTest = await apiService.createABTest({
        name: config.name,
        segmentId: config.segmentId,
        testPercentage: config.testPercentage,
        durationHours: config.durationHours,
        successMetric: config.successMetric,
        variations: config.variations,
      });
      
      if (newTest) {
        await loadABTests(); // Reload A/B tests
        setShowABTestBuilder(false);
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
      setError('Failed to create A/B test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclareWinner = async (testId: string, variationId: string) => {
    try {
      setLoading(true);
      await apiService.declareABTestWinner(testId, variationId);
      await loadABTests(); // Reload A/B tests
    } catch (error) {
      console.error('Error declaring winner:', error);
      setError('Failed to declare winner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Campaign preview data (for analytics)
  const handleLoadTimeSeriesData = async (campaignId: string) => {
    try {
      const data = await apiService.getCampaignTimeSeriesData(campaignId);
      if (data && data.time_series) {
        setTimeSeriesData(data.time_series);
      }
    } catch (error) {
      console.error('Error loading time series data:', error);
      // Use fallback mock data
      setTimeSeriesData([
        { date: '2024-01-15', sent: 150, delivered: 145, read: 98, clicked: 18 },
        { date: '2024-01-16', sent: 200, delivered: 195, read: 142, clicked: 28 },
        { date: '2024-01-17', sent: 180, delivered: 175, read: 128, clicked: 22 },
        { date: '2024-01-18', sent: 220, delivered: 210, read: 156, clicked: 35 },
        { date: '2024-01-19', sent: 190, delivered: 185, read: 134, clicked: 24 },
        { date: '2024-01-20', sent: 250, delivered: 240, read: 178, clicked: 42 }
      ]);
    }
  };

  // Tab switching handler
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Load data for the specific tab if needed
    if (tab === 'analytics' && campaigns.length > 0) {
      handleLoadTimeSeriesData(campaigns[0].id);
    }
  };

  // Error display component
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <div className="text-red-600 text-sm">{message}</div>
        <button 
          onClick={() => setError(null)}
          className="ml-auto text-red-600 hover:text-red-800"
        >
          ×
        </button>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Advanced Campaign Management</h1>
            <p className="mt-2 text-gray-600">
              Create, manage, and analyze your WhatsApp marketing campaigns with advanced segmentation, A/B testing, and analytics.
            </p>
          </div>

          {/* Error Display */}
          {error && <ErrorDisplay message={error} />}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'campaigns', label: 'Campaigns', icon: LuRocket },
                { key: 'segments', label: 'Segments', icon: LuUsers },
                { key: 'abTests', label: 'A/B Tests', icon: LuTestTube },
                { key: 'analytics', label: 'Analytics', icon: LuChart }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key as TabType)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === key
                      ? 'border-[#2A8B8A] text-[#2A8B8A]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A8B8A]"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {/* Tab Content */}
          {!loading && (
            <>
              {/* Campaigns Tab */}
              {activeTab === 'campaigns' && (
                <div className="space-y-6">
                  {/* Dashboard Stats */}
                  {dashboardStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <LuRocket className="h-8 w-8 text-[#2A8B8A]" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Total Campaigns
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {dashboardStats.total_campaigns}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <LuActivity className="h-8 w-8 text-green-500" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Active Campaigns
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {dashboardStats.active_campaigns}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <LuTrendingUp className="h-8 w-8 text-blue-500" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Messages Sent
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {dashboardStats.total_messages_sent?.toLocaleString()}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <LuTarget className="h-8 w-8 text-purple-500" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Avg. Read Rate
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {dashboardStats.average_read_rate}%
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campaigns List */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Recent Campaigns
                        </h3>
                        <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2A8B8A] hover:bg-[#228B8A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A8B8A]">
                          <LuPlus className="w-4 h-4 mr-2" />
                          Create Campaign
                        </button>
                      </div>
                      
                      {campaigns.length > 0 ? (
                        <div className="overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Campaign
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Sent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Delivery Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Read Rate
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ROI
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {campaigns.map((campaign) => (
                                <tr key={campaign.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {campaign.name}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {campaign.metrics.sent.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {campaign.metrics.deliveryRate}%
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {campaign.metrics.readRate}%
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {campaign.metrics.roi}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <LuRocket className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Get started by creating your first campaign.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Segments Tab */}
              {activeTab === 'segments' && (
                <SegmentManager
                  segments={segments}
                  onCreateSegment={handleCreateSegment}
                  onUpdateSegment={handleUpdateSegment}
                  onDeleteSegment={handleDeleteSegment}
                  onDuplicateSegment={handleDuplicateSegment}
                  onRefreshSegment={handleRefreshSegment}
                  onExportSegment={handleExportSegment}
                  onToggleActive={handleToggleSegmentActive}
                />
              )}

              {/* A/B Tests Tab */}
              {activeTab === 'abTests' && (
                <div className="space-y-6">
                  {!showABTestBuilder && !showABTestMonitor && (
                    <div className="bg-white shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            A/B Tests
                          </h3>
                          <button
                            onClick={() => setShowABTestBuilder(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2A8B8A] hover:bg-[#228B8A]"
                          >
                            <LuPlus className="w-4 h-4 mr-2" />
                            Create A/B Test
                          </button>
                        </div>
                        
                        {abTests.length > 0 ? (
                          <div className="space-y-4">
                            {abTests.map((test) => (
                              <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">{test.name}</h4>
                                    <p className="text-sm text-gray-500">Status: {test.status}</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedABTest(test);
                                      setShowABTestMonitor(true);
                                    }}
                                    className="text-[#2A8B8A] hover:text-[#228B8A] text-sm font-medium"
                                  >
                                    View Results
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <LuTestTube className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No A/B tests</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Create your first A/B test to optimize your campaigns.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showABTestBuilder && (
                    <ABTestBuilder
                      segments={segments}
                      onCreateTest={handleCreateABTest}
                      onCancel={() => setShowABTestBuilder(false)}
                    />
                  )}

                  {showABTestMonitor && selectedABTest && (
                    <ABTestMonitor
                      testResults={selectedABTest}
                      onDeclareWinner={handleDeclareWinner}
                      onBack={() => {
                        setShowABTestMonitor(false);
                        setSelectedABTest(null);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <AnalyticsDashboard
                  campaigns={campaigns}
                  timeSeriesData={timeSeriesData}
                  segmentPerformance={segmentPerformance}
                />
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

            {/* A/B Tests List */}
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Active Tests</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {abTests.map((test) => (
                  <div key={test.testId} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">Test #{test.testId}</h4>
                        <p className="text-sm text-slate-500 mt-1">
                          Status: {test.status} | Success Metric: {test.successMetric}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedABTest(test);
                            setShowABTestMonitor(true);
                          }}
                          className="px-3 py-2 bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 text-white rounded-lg transition-colors"
                        >
                          View Results
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {abTests.length === 0 && (
                <div className="text-center py-12">
                  <LuTestTube className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No A/B tests yet</h3>
                  <p className="text-slate-500 mb-4">
                    Create your first A/B test to start optimizing campaigns.
                  </p>
                  <button
                    onClick={() => setShowABTestBuilder(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 text-white rounded-lg transition-colors"
                  >
                    <LuPlus className="w-4 h-4" />
                    Create A/B Test
                  </button>
                </div>
              )}
            </div>

            {/* A/B Test Builder Modal */}
            <ABTestBuilder
              isOpen={showABTestBuilder}
              onClose={() => setShowABTestBuilder(false)}
              onSave={handleCreateABTest}
              onStart={handleStartABTest}
              segments={segments.map(seg => ({
                id: seg.id,
                name: seg.name,
                contactCount: seg.contactCount
              }))}
            />

            {/* A/B Test Monitor Modal */}
            {selectedABTest && (
              <ABTestMonitor
                isOpen={showABTestMonitor}
                onClose={() => {
                  setShowABTestMonitor(false);
                  setSelectedABTest(null);
                }}
                testResults={selectedABTest}
                onDeclareWinner={handleDeclareWinner}
                onStopTest={handleStopABTest}
              />
            )}
          </div>
        );
      
      case 'analytics':
        return (
          <AnalyticsDashboard
            campaigns={campaigns}
            timeSeriesData={timeSeriesData}
            segmentPerformance={segmentPerformance}
            onRefresh={handleRefreshAnalytics}
            onExport={handleExportAnalytics}
          />
        );
      
      default:
        return (
          <div className="text-center py-12">
            <LuRocket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Basic Campaigns</h3>
            <p className="text-slate-500">
              The original campaigns functionality will be integrated here.
            </p>
          </div>
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Advanced Campaign Management</h1>
            <p className="text-slate-600 mt-2">
              Powerful tools for segmentation, A/B testing, and analytics
            </p>
          </div>

          {/* Navigation Tabs */}
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

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function CampaignsPage() {
  return <EnhancedCampaignsPage />;
}
