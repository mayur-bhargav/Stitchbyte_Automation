"use client";
import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import ProtectedRoute from "../components/ProtectedRoute";
import SegmentManager, { Segment } from "./components/SegmentManager";
import { ABTestBuilder, ABTestMonitor, ABTestConfig, ABTestResults } from "./components/ABTestFramework";
import AnalyticsDashboard, { CampaignAnalytics, TimeSeriesData, SegmentPerformance } from "./components/AnalyticsDashboard";
import { SegmentConfig } from "./components/SegmentBuilder";
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

  // Mock data - In real implementation, these would be API calls
  useEffect(() => {
    if (!user) return;
    loadMockData();
  }, [user]);

  const loadMockData = () => {
    // Mock segments
    setSegments([
      {
        id: 'seg1',
        name: 'VIP Customers',
        description: 'Customers who spent more than $500 in last 60 days',
        type: 'dynamic',
        contactCount: 1247,
        rules: { groups: [] },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        lastCalculated: '2024-01-20T14:30:00Z',
        tags: ['high-value', 'engaged'],
        isActive: true
      },
      {
        id: 'seg2',
        name: 'New Subscribers',
        description: 'Users who signed up in the last 30 days',
        type: 'dynamic',
        contactCount: 892,
        rules: { groups: [] },
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-19T16:45:00Z',
        lastCalculated: '2024-01-19T16:45:00Z',
        tags: ['new', 'onboarding'],
        isActive: true
      },
      {
        id: 'seg3',
        name: 'Holiday Campaign 2023',
        description: 'Static list from December holiday campaign',
        type: 'static',
        contactCount: 3542,
        rules: { groups: [] },
        createdAt: '2023-12-01T12:00:00Z',
        updatedAt: '2023-12-01T12:00:00Z',
        tags: ['holiday', 'campaign'],
        isActive: false
      }
    ]);

    // Mock campaigns
    setCampaigns([
      {
        id: 'camp1',
        name: 'Holiday Sale A/B Test',
        status: 'completed',
        createdAt: '2024-01-15T10:00:00Z',
        segmentName: 'VIP Customers',
        metrics: {
          sent: 1247,
          delivered: 1215,
          read: 952,
          clicked: 308,
          replied: 45,
          converted: 41,
          failed: 32,
          totalCost: 187.05,
          costPerMessage: 0.15,
          costPerConversion: 4.56,
          deliveryRate: 97.4,
          readRate: 78.4,
          ctr: 25.4,
          replyRate: 3.7,
          conversionRate: 3.3,
          roi: 8.2
        }
      },
      {
        id: 'camp2',
        name: 'Welcome Series',
        status: 'active',
        createdAt: '2024-01-10T14:00:00Z',
        segmentName: 'New Subscribers',
        metrics: {
          sent: 892,
          delivered: 876,
          read: 658,
          clicked: 165,
          replied: 28,
          converted: 18,
          failed: 16,
          totalCost: 133.80,
          costPerMessage: 0.15,
          costPerConversion: 7.43,
          deliveryRate: 98.2,
          readRate: 75.1,
          ctr: 18.9,
          replyRate: 3.2,
          conversionRate: 2.1,
          roi: 5.4
        }
      }
    ]);

    // Mock time series data
    setTimeSeriesData([
      { date: '2024-01-14', sent: 450, delivered: 441, read: 335, clicked: 89, replied: 12, converted: 8, cost: 67.50 },
      { date: '2024-01-15', sent: 623, delivered: 608, read: 478, clicked: 124, replied: 18, converted: 15, cost: 93.45 },
      { date: '2024-01-16', sent: 389, delivered: 382, read: 301, clicked: 76, replied: 9, converted: 7, cost: 58.35 },
      { date: '2024-01-17', sent: 512, delivered: 498, read: 394, clicked: 102, replied: 14, converted: 11, cost: 76.80 },
      { date: '2024-01-18', sent: 445, delivered: 435, read: 339, clicked: 87, replied: 13, converted: 9, cost: 66.75 },
      { date: '2024-01-19', sent: 678, delivered: 661, read: 521, clicked: 135, replied: 19, converted: 16, cost: 101.70 },
      { date: '2024-01-20', sent: 534, delivered: 521, read: 412, clicked: 108, replied: 15, converted: 12, cost: 80.10 }
    ]);

    // Mock segment performance
    setSegmentPerformance([
      { segmentId: 'seg1', segmentName: 'VIP Customers', contactCount: 1247, metrics: { ctr: 25.4 } as any },
      { segmentId: 'seg2', segmentName: 'New Subscribers', contactCount: 892, metrics: { ctr: 18.9 } as any },
      { segmentId: 'seg3', segmentName: 'Holiday Campaign 2023', contactCount: 3542, metrics: { ctr: 12.3 } as any }
    ]);

    // Mock A/B Tests
    setAbTests([
      {
        testId: 'test1',
        status: 'running',
        successMetric: 'ctr',
        startedAt: '2024-01-20T10:00:00Z',
        timeRemaining: 2.5,
        variations: [
          {
            id: 'var1',
            name: 'Variation A',
            sent: 125,
            delivered: 123,
            read: 95,
            clicked: 23,
            replied: 3,
            converted: 2,
            metrics: {
              deliveryRate: 0.984,
              readRate: 0.772,
              ctr: 0.187,
              replyRate: 0.024,
              conversionRate: 0.016
            }
          },
          {
            id: 'var2',
            name: 'Variation B',
            sent: 124,
            delivered: 122,
            read: 108,
            clicked: 31,
            replied: 4,
            converted: 3,
            metrics: {
              deliveryRate: 0.984,
              readRate: 0.885,
              ctr: 0.254,
              replyRate: 0.033,
              conversionRate: 0.025
            },
            isWinner: true,
            confidenceLevel: 95
          }
        ]
      }
    ]);
  };

  // Segment Management Functions
  const handleCreateSegment = async (segmentConfig: SegmentConfig) => {
    // API call to create segment
    console.log('Creating segment:', segmentConfig);
    // Mock implementation
    const newSegment: Segment = {
      id: `seg${Date.now()}`,
      name: segmentConfig.name,
      description: segmentConfig.description,
      type: segmentConfig.type,
      contactCount: Math.floor(Math.random() * 2000) + 100,
      rules: { groups: segmentConfig.groups },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    setSegments(prev => [...prev, newSegment]);
  };

  const handleUpdateSegment = async (segmentId: string, segmentConfig: SegmentConfig) => {
    console.log('Updating segment:', segmentId, segmentConfig);
    setSegments(prev => prev.map(seg => 
      seg.id === segmentId 
        ? { ...seg, ...segmentConfig, updatedAt: new Date().toISOString() }
        : seg
    ));
  };

  const handleDeleteSegment = async (segmentId: string) => {
    console.log('Deleting segment:', segmentId);
    setSegments(prev => prev.filter(seg => seg.id !== segmentId));
  };

  const handleDuplicateSegment = async (segmentId: string) => {
    console.log('Duplicating segment:', segmentId);
    const originalSegment = segments.find(seg => seg.id === segmentId);
    if (originalSegment) {
      const duplicatedSegment: Segment = {
        ...originalSegment,
        id: `seg${Date.now()}`,
        name: `${originalSegment.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSegments(prev => [...prev, duplicatedSegment]);
    }
  };

  const handleRefreshSegment = async (segmentId: string) => {
    console.log('Refreshing segment:', segmentId);
    setSegments(prev => prev.map(seg => 
      seg.id === segmentId 
        ? { 
            ...seg, 
            contactCount: Math.floor(Math.random() * 2000) + 100,
            lastCalculated: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : seg
    ));
  };

  const handleExportSegment = async (segmentId: string, format: 'csv' | 'xlsx') => {
    console.log('Exporting segment:', segmentId, format);
    // Mock export functionality
    alert(`Exporting segment in ${format.toUpperCase()} format...`);
  };

  const handleToggleSegmentActive = async (segmentId: string, isActive: boolean) => {
    console.log('Toggling segment active:', segmentId, isActive);
    setSegments(prev => prev.map(seg => 
      seg.id === segmentId ? { ...seg, isActive } : seg
    ));
  };

  // A/B Test Functions
  const handleCreateABTest = async (testConfig: ABTestConfig) => {
    console.log('Creating A/B test:', testConfig);
    // Mock implementation - in real app, this would start the test
    alert('A/B Test created and started successfully!');
    setShowABTestBuilder(false);
  };

  const handleStartABTest = async (testId: string) => {
    console.log('Starting A/B test:', testId);
  };

  const handleDeclareWinner = async (testId: string, variationId: string) => {
    console.log('Declaring winner:', testId, variationId);
    setAbTests(prev => prev.map(test => 
      test.testId === testId 
        ? { 
            ...test, 
            status: 'completed',
            winner: variationId,
            endedAt: new Date().toISOString(),
            variations: test.variations.map(v => ({
              ...v,
              isWinner: v.id === variationId
            }))
          }
        : test
    ));
  };

  const handleStopABTest = async (testId: string) => {
    console.log('Stopping A/B test:', testId);
    setAbTests(prev => prev.map(test => 
      test.testId === testId 
        ? { ...test, status: 'paused' }
        : test
    ));
  };

  // Analytics Functions
  const handleRefreshAnalytics = async () => {
    console.log('Refreshing analytics...');
    setLoading(true);
    // Mock refresh
    setTimeout(() => {
      setLoading(false);
      alert('Analytics refreshed!');
    }, 1000);
  };

  const handleExportAnalytics = async (format: 'csv' | 'pdf', data: any) => {
    console.log('Exporting analytics:', format, data);
    alert(`Exporting analytics in ${format.toUpperCase()} format...`);
  };

  const tabs = [
    { id: 'campaigns', label: 'Campaigns', icon: <LuRocket className="w-4 h-4" /> },
    { id: 'segments', label: 'Segments', icon: <LuUsers className="w-4 h-4" /> },
    { id: 'abTests', label: 'A/B Tests', icon: <LuTestTube className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <LuChart className="w-4 h-4" /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'segments':
        return (
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
        );
      
      case 'abTests':
        return (
          <div className="space-y-6">
            {/* A/B Tests Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">A/B Tests</h1>
                <p className="text-slate-600 mt-1">
                  Test different campaign variations to optimize performance
                </p>
              </div>
              <button
                onClick={() => setShowABTestBuilder(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2A8B8A] hover:bg-[#2A8B8A]/90 text-white rounded-lg transition-colors"
              >
                <LuPlus className="w-4 h-4" />
                Create A/B Test
              </button>
            </div>

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
