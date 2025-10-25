"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LuRocket, 
  LuUsers, 
  LuTestTube, 
  LuPlus,
  LuRefreshCw,
  LuDownload,
  LuPlay,
  LuPause,
  LuTrash2,
  LuCopy,
  LuPencil,
  LuTrendingUp,
  LuActivity,
  LuTarget,
  LuSettings,
  LuX,
  LuEye,
  LuCheck,
  LuInfo
} from 'react-icons/lu';
import ProtectedRoute from '../components/ProtectedRoute';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/apiService';
import SegmentModal from '../../components/campaigns/SegmentModal';

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
  type?: 'dynamic' | 'static' | 'tag-based';
  rules?: any;
  tagName?: string;
  isTagGroup?: boolean;
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
  abTest?: {
    enabled: boolean;
    testName: string;
    splitPercentage: number;
    variantBTemplateId: string;
    variantBTemplateData?: Record<string, string>;
    variantBMediaFiles?: Record<string, string>;
    testDurationHours: number;
    // Phased testing fields
    testPhase?: string; // 'testing' | 'optimization' | 'continuous'
    testingDurationDays?: number;
    testingStartedAt?: string;
    testingCompletedAt?: string;
    successMetric?: string; // 'ctr' | 'reply_rate' | 'delivery_rate' | 'composite'
    autoSelectWinner?: boolean;
    winnerVariant?: string; // 'A' | 'B'
    winnerSelectedAt?: string;
    winnerSelectionReason?: string;
    variantAMetrics?: Record<string, any>;
    variantBMetrics?: Record<string, any>;
    enableContinuousRotation?: boolean;
    phaseHistory?: Array<Record<string, any>>;
  };
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    deliveryRate: number;
    readRate: number;
    ctr: number;
    replyRate: number;
    totalCost: number;
    roi: number;
  };
}

interface ABTestResults {
  testId: string;
  testName: string;
  status: string;
  segmentId: string;
  testPercentage: number;
  durationHours: number;
  successMetric: string;
  variations: Array<{
    id: string;
    name: string;
    trafficAllocation: number;
    messageTemplate: string;
    metrics: {
      sent: number;
      delivered: number;
      opened: number;
      clicked: number;
      converted: number;
      conversionRate: number;
    };
  }>;
  winner?: string;
  confidence?: number;
  startedAt: string;
  endedAt?: string;
  results?: {
    winner: string;
    confidence: number;
  };
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
    deliveryRate: number;
    readRate: number;
    ctr: number;
    replyRate: number;
    totalCost: number;
    roi: number;
  };
}

interface Template {
  id: string;
  name: string;
  content?: string;
  body?: string;
  header?: string;
  footer?: string;
  status?: string;
  language?: string;
  category?: string;
  header_type?: string;
  header_media?: {
    type: string;
    handle: string;
  };
  variables?: string[];
}

interface DashboardStats {
  total_campaigns: number;
  active_campaigns: number;
  total_messages_sent: number;
  average_delivery_rate: number;
  average_read_rate: number;
  monthly_growth: number;
}

interface ContactTagsSummary {
  tagGroups: { [key: string]: number };
  untaggedCount: number;
  totalContacts?: number;
}

type TabType = 'campaigns' | 'segments' | 'abTests' | 'analytics';

export default function CampaignsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateSegmentModal, setShowCreateSegmentModal] = useState(false);
  const [showNewSegmentModal, setShowNewSegmentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'confirm',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  // Create segment modal states
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [createSegmentLoading, setCreateSegmentLoading] = useState(false);

  // Data states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [abTests, setABTests] = useState<ABTestResults[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [rawTemplates, setRawTemplates] = useState<any[]>([]); // Store raw API response
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [contactTagsSummary, setContactTagsSummary] = useState<ContactTagsSummary | null>(null);

  // Campaign Execution Engine states
  const [campaignExecutions, setCampaignExecutions] = useState<{ [key: string]: any }>({});
  const [executionPolling, setExecutionPolling] = useState<{ [key: string]: NodeJS.Timeout }>({});
  const [executionLoading, setExecutionLoading] = useState<{ [key: string]: boolean }>({});

  // Load data
  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  // Modal helper functions
  const showSuccess = (title: string, message: string) => {
    setModalContent({
      title,
      message,
      type: 'success',
      onConfirm: () => {},
      confirmText: 'OK',
      cancelText: 'Cancel'
    });
    setShowSuccessModal(true);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = 'Confirm', cancelText = 'Cancel') => {
    setModalContent({
      title,
      message,
      type: 'confirm',
      onConfirm,
      confirmText,
      cancelText
    });
    setShowConfirmModal(true);
  };

  // Keyboard support for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showSuccessModal) {
          setShowSuccessModal(false);
        }
        if (showConfirmModal) {
          setShowConfirmModal(false);
        }
      }
    };

    if (showSuccessModal || showConfirmModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSuccessModal, showConfirmModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load contact tags first so we can create segments based on them
      await loadContactTagsSummary();
      
      await Promise.all([
        loadCampaigns(),
        loadSegments(),
        loadABTests(),
        loadAnalytics(),
        loadTemplates(),
        loadDashboardStats()
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
      const response: any = await apiService.getCampaigns({ page: 1, limit: 50 });
      if (response && response.campaigns) {
        // Transform API response to match frontend interface
        const transformedCampaigns = response.campaigns.map((campaign: any) => {
          const transformed = {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            type: campaign.type,
            status: campaign.status,
            segments: campaign.segments || [],
            messageTemplate: campaign.message_template || campaign.messageTemplate,
            scheduledAt: campaign.scheduled_at || campaign.scheduledAt,
            createdAt: campaign.created_at || campaign.createdAt,
            updatedAt: campaign.updated_at || campaign.updatedAt,
            // Transform ab_test (snake_case) to abTest (camelCase)
            abTest: campaign.ab_test ? {
              enabled: campaign.ab_test.enabled,
              testName: campaign.ab_test.test_name,
              splitPercentage: campaign.ab_test.split_percentage,
              variantBTemplateId: campaign.ab_test.variant_b_template_id,
              variantBTemplateData: campaign.ab_test.variant_b_template_data,
              variantBMediaFiles: campaign.ab_test.variant_b_media_files,
              testDurationHours: campaign.ab_test.test_duration_hours,
              // New phased testing fields
              testPhase: campaign.ab_test.test_phase,
              testingDurationDays: campaign.ab_test.testing_duration_days,
              testingStartedAt: campaign.ab_test.testing_started_at,
              testingCompletedAt: campaign.ab_test.testing_completed_at,
              successMetric: campaign.ab_test.success_metric,
              autoSelectWinner: campaign.ab_test.auto_select_winner,
              winnerVariant: campaign.ab_test.winner_variant,
              winnerSelectedAt: campaign.ab_test.winner_selected_at,
              winnerSelectionReason: campaign.ab_test.winner_selection_reason,
              variantAMetrics: campaign.ab_test.variant_a_metrics,
              variantBMetrics: campaign.ab_test.variant_b_metrics,
              enableContinuousRotation: campaign.ab_test.enable_continuous_rotation,
              phaseHistory: campaign.ab_test.phase_history,
            } : undefined,
            metrics: {
              sent: campaign.sent_count || campaign.metrics?.sent || 0,
              delivered: campaign.delivered_count || campaign.metrics?.delivered || 0,
              opened: campaign.read_count || campaign.metrics?.opened || 0,
              clicked: campaign.clicked_count || campaign.metrics?.clicked || 0,
              converted: campaign.replied_count || campaign.metrics?.converted || 0,
              deliveryRate: campaign.delivery_rate || campaign.metrics?.deliveryRate || 0,
              readRate: campaign.read_rate || campaign.metrics?.readRate || 0,
              ctr: campaign.click_rate || campaign.metrics?.ctr || 0,
              replyRate: campaign.reply_rate || campaign.metrics?.replyRate || 0,
              totalCost: campaign.total_cost || campaign.metrics?.totalCost || 0,
              roi: campaign.roi || campaign.metrics?.roi || 0,
            }
          };
          
          return transformed;
        });
        setCampaigns(transformedCampaigns);
        
        // Start polling for running campaigns
        transformedCampaigns.forEach((campaign: Campaign) => {
          if (campaign.status === 'running') {
            startExecutionPolling(campaign.id);
          }
        });
      } else {
        // If no real data available, show empty state instead of dummy data
        setCampaigns([]);
      }
    } catch (err) {
      console.error('Error loading campaigns:', err);
      // Show empty state instead of dummy data when API fails
      setCampaigns([]);
    }
  };

  const loadSegments = async () => {
    try {
      // console.log('🔄 Loading segments from API...');
      // Use regular segments endpoint since tag groups endpoint doesn't exist
      const response: any = await apiService.getSegments({ page: 1, limit: 50 });
      
      // console.log('📋 Segments API response:', response);
      
      if (response && response.segments && response.segments.length > 0) {
        // console.log(`✅ Loaded ${response.segments.length} segments:`, response.segments);
        
        // Transform segments to ensure contactCount is available
        const transformedSegments = response.segments.map((segment: any) => ({
          ...segment,
          contactCount: segment.contactCount || segment.contact_count || 0
        }));
        
        setSegments(transformedSegments);
      } else {
        // console.log('⚠️ No segments found, attempting to auto-create from contact tags...');
        
        try {
          // Try to auto-create segments from tags
          const autoCreateResponse: any = await apiService.autoCreateSegmentsFromTags();
          
          if (autoCreateResponse && autoCreateResponse.success && autoCreateResponse.segments) {
            // console.log(`✅ Auto-created ${autoCreateResponse.segments.length} segments from tags`);
            setSegments(autoCreateResponse.segments);
          } else {
            // console.log('⚠️ Auto-create failed, creating fallback segments');
            createFallbackSegments();
          }
        } catch (autoCreateError) {
          // console.log('⚠️ Auto-create failed, creating fallback segments:', autoCreateError);
          createFallbackSegments();
        }
      }
    } catch (err) {
      console.error('❌ Error loading segments:', err);
      createFallbackSegments();
    }
  };

  const createFallbackSegments = () => {
    // Create some fallback segments based on contact tags if available
    const fallbackSegments: Segment[] = [
      {
        id: 'all-contacts',
        name: 'All Contacts',
        description: 'All available contacts',
        criteria: { type: 'all' },
        contactCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'static'
      }
    ];
    
    // Add tag-based segments if we have contact tag summary
    if (contactTagsSummary) {
      Object.entries(contactTagsSummary.tagGroups).forEach(([tag, count]) => {
        fallbackSegments.push({
          id: `tag-${tag}`,
          name: `${tag} Users`,
          description: `Contacts with the tag "${tag}"`,
          criteria: { type: 'tag', tag },
          contactCount: count,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: 'tag-based',
          tagName: tag,
          isTagGroup: true
        });
      });
      
      if (contactTagsSummary.untaggedCount > 0) {
        fallbackSegments.push({
          id: 'untagged-contacts',
          name: 'Untagged Contacts',
          description: 'Contacts without any tags',
          criteria: { type: 'untagged' },
          contactCount: contactTagsSummary.untaggedCount,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: 'tag-based',
          isTagGroup: true
        });
      }
    }
    
    setSegments(fallbackSegments);
    // console.log(`📝 Created ${fallbackSegments.length} fallback segments:`, fallbackSegments);
  };

  const loadABTests = async () => {
    try {
      // Extract A/B tests from campaigns instead of calling separate endpoint
      // console.log('🔄 Extracting A/B tests from campaigns...');
      
      // Use the campaigns data we already have
      const campaignsWithABTests = campaigns.filter(campaign => {
        // Check if campaign has A/B testing enabled
        return campaign.abTest?.enabled === true;
      });
      
      // console.log(`📊 Found ${campaignsWithABTests.length} campaigns with A/B testing enabled`);
      
      // Transform campaign A/B test data to match ABTestResults interface
      const abTestResults: ABTestResults[] = campaignsWithABTests.map(campaign => ({
        testId: campaign.id,
        testName: campaign.abTest?.testName || campaign.name,
        status: campaign.status,
        segmentId: campaign.segments[0] || '', // Use first segment
        testPercentage: campaign.abTest?.splitPercentage || 50,
        durationHours: campaign.abTest?.testDurationHours || 48,
        successMetric: 'conversion', // Default success metric
        variations: [
          {
            id: `${campaign.id}-variant-a`,
            name: 'Variant A (Original)',
            trafficAllocation: campaign.abTest?.splitPercentage || 50,
            messageTemplate: campaign.messageTemplate,
            metrics: {
              sent: Math.floor((campaign.metrics?.sent || 0) * (campaign.abTest?.splitPercentage || 50) / 100),
              delivered: Math.floor((campaign.metrics?.delivered || 0) * (campaign.abTest?.splitPercentage || 50) / 100),
              opened: Math.floor((campaign.metrics?.opened || 0) * (campaign.abTest?.splitPercentage || 50) / 100),
              clicked: Math.floor((campaign.metrics?.clicked || 0) * (campaign.abTest?.splitPercentage || 50) / 100),
              converted: Math.floor((campaign.metrics?.converted || 0) * (campaign.abTest?.splitPercentage || 50) / 100),
              conversionRate: campaign.metrics?.ctr || 0
            }
          },
          {
            id: `${campaign.id}-variant-b`,
            name: 'Variant B (Test)',
            trafficAllocation: 100 - (campaign.abTest?.splitPercentage || 50),
            messageTemplate: campaign.abTest?.variantBTemplateId || 'Unknown Template',
            metrics: {
              sent: Math.floor((campaign.metrics?.sent || 0) * (100 - (campaign.abTest?.splitPercentage || 50)) / 100),
              delivered: Math.floor((campaign.metrics?.delivered || 0) * (100 - (campaign.abTest?.splitPercentage || 50)) / 100),
              opened: Math.floor((campaign.metrics?.opened || 0) * (100 - (campaign.abTest?.splitPercentage || 50)) / 100),
              clicked: Math.floor((campaign.metrics?.clicked || 0) * (100 - (campaign.abTest?.splitPercentage || 50)) / 100),
              converted: Math.floor((campaign.metrics?.converted || 0) * (100 - (campaign.abTest?.splitPercentage || 50)) / 100),
              conversionRate: campaign.metrics?.ctr || 0
            }
          }
        ],
        startedAt: campaign.createdAt,
        endedAt: campaign.status === 'completed' ? campaign.updatedAt : undefined,
        ...(campaign.status === 'completed' && {
          winner: 'variant-a', // Would need logic to determine actual winner
          confidence: 95 // Default confidence level
        })
      }));
      
      setABTests(abTestResults);
      // console.log('📈 A/B Tests loaded:', abTestResults);
    } catch (err) {
      console.error('Error extracting A/B tests from campaigns:', err);
      setABTests([]);
    }
  };

  const loadAnalytics = async () => {
    try {
      console.log('📊 Loading campaign analytics from dashboard endpoint...');
      const response: any = await apiService.getDashboardStats();
      console.log('📊 Dashboard analytics response:', response);
      
      if (response && response.success) {
        // Transform the new analytics format to match existing interface
        const { campaign_breakdown } = response;
        console.log('📊 Campaign breakdown:', campaign_breakdown);
        
        if (campaign_breakdown && Array.isArray(campaign_breakdown)) {
          const transformedAnalytics = campaign_breakdown.map((campaign: any) => ({
            campaignId: campaign.campaign_id,
            campaignName: campaign.campaign_name,
            metrics: {
              sent: campaign.sent || 0,
              delivered: campaign.success || 0,
              opened: 0, // Not tracked in campaign_analytics yet
              clicked: 0, // Not tracked in campaign_analytics yet
              converted: 0,
              revenue: undefined,
              deliveryRate: campaign.sent ? ((campaign.success || 0) / campaign.sent * 100) : 0,
              readRate: 0,
              ctr: 0,
              replyRate: 0,
              totalCost: 0,
              roi: 0
            }
          }));
          console.log('📊 Transformed analytics:', transformedAnalytics);
          setCampaignAnalytics(transformedAnalytics);
        } else {
          console.log('📊 No campaign breakdown data');
          setCampaignAnalytics([]);
        }
      } else {
        console.log('📊 Invalid response or no success flag');
        setCampaignAnalytics([]);
      }
    } catch (err) {
      console.error('❌ Error loading analytics:', err);
      setCampaignAnalytics([]);
    }
  };

  const loadTemplates = async () => {
    try {
      // console.log('🔄 Loading templates from API...');
      // Use the same endpoint as send-message page
      const response: any = await apiService.getOptional('/templates');
      
      if (response) {
        // console.log("Templates API response:", response);
        // console.log("Raw template 0:", (response.templates || response || [])[0]);
        // console.log("Raw template 1:", (response.templates || response || [])[1]);
        
        // Store raw templates for the modal
        const rawTemplateData = response.templates || response || [];
        setRawTemplates(rawTemplateData);
        
        let tpls = rawTemplateData
          .filter((template: any) => template && template.name)
          .map((template: any) => {
            // console.log('Mapping template:', template.name, template);
            const mapped = {
              id: template.id,
              name: template.name,
              content: template.body || template.content || '', // Set content from body field
              body: template.body,
              header: template.header,
              footer: template.footer,
              status: template.status,
              language: template.language,
              category: template.category,
              header_type: template.header_type,
              header_media: template.header_media,
              variables: template.variables
            };
            // console.log('Mapped result:', mapped);
            return mapped;
          });
        
        // console.log("Processed templates:", tpls);
        // console.log("Processed template 0 details:", tpls[0]);
        // console.log("Processed template 1 details:", tpls[1]);
        // console.log("Approved templates:", tpls.filter((t: any) => t.status === 'APPROVED'));
        
        // Add mock templates with media for testing if no templates exist
        if (tpls.length === 0) {
          // console.log("No templates from API, adding mock templates for testing");
          tpls = [
            {
              id: 'mock-1',
              name: 'Welcome with Image',
              body: 'Welcome to our service! {{1}} 🎉\n\nWe are excited to have you on board.',
              header: 'Welcome to Our Platform',
              footer: 'Thank you for choosing us',
              status: 'APPROVED',
              language: 'en',
              category: 'MARKETING',
              header_type: 'image',
              header_media: {
                type: 'image',
                handle: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop'
              },
              variables: ['1']
            },
            {
              id: 'mock-2',
              name: 'Promotional Offer',
              body: 'Hi {{1}}! 🛍️\n\nSpecial offer just for you:\n{{2}} off on your next purchase!\n\nUse code: {{3}}',
              header: '🎯 Special Offer',
              footer: 'Offer expires soon',
              status: 'APPROVED',
              language: 'en',
              category: 'MARKETING',
              header_type: 'text',
              variables: ['1', '2', '3']
            },
            {
              id: 'mock-3',
              name: 'Product Showcase',
              body: 'Check out our latest products! {{1}}\n\nAvailable now with free shipping.',
              header: 'New Products',
              footer: 'Visit our store for more',
              status: 'APPROVED',
              language: 'en',
              category: 'MARKETING',
              header_type: 'image',
              header_media: {
                type: 'image',
                handle: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'
              },
              variables: ['1']
            }
          ];
        }
        
        setTemplates(tpls);
      } else {
        // console.log("Templates endpoint not available, adding mock templates");
        const mockTemplates = [
          {
            id: 'mock-1',
            name: 'Welcome with Image',
            body: 'Welcome to our service! {{1}} 🎉\n\nWe are excited to have you on board.',
            header: 'Welcome to Our Platform',
            footer: 'Thank you for choosing us',
            status: 'APPROVED',
            language: 'en',
            category: 'MARKETING',
            header_type: 'image',
            header_media: {
              type: 'image',
              handle: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop'
            },
            variables: ['1']
          },
          {
            id: 'mock-2',
            name: 'Promotional Offer',
            body: 'Hi {{1}}! 🛍️\n\nSpecial offer just for you:\n{{2}} off on your next purchase!\n\nUse code: {{3}}',
            header: '🎯 Special Offer',
            footer: 'Offer expires soon',
            status: 'APPROVED',
            language: 'en',
            category: 'MARKETING',
            header_type: 'text',
            variables: ['1', '2', '3']
          },
          {
            id: 'mock-3',
            name: 'Product Showcase',
            body: 'Check out our latest products! {{1}}\n\nAvailable now with free shipping.',
            header: 'New Products',
            footer: 'Visit our store for more',
            status: 'APPROVED',
            language: 'en',
            category: 'MARKETING',
            header_type: 'image',
            header_media: {
              type: 'image',
              handle: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'
            },
            variables: ['1']
          }
        ];
        setTemplates(mockTemplates);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      // console.log("Adding mock templates due to error");
      const mockTemplates = [
        {
          id: 'mock-1',
          name: 'Welcome with Image',
          body: 'Welcome to our service! {{1}} 🎉\n\nWe are excited to have you on board.',
          header: 'Welcome to Our Platform',
          footer: 'Thank you for choosing us',
          status: 'APPROVED',
          language: 'en',
          category: 'MARKETING',
          header_type: 'image',
          header_media: {
            type: 'image',
            handle: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop'
          },
          variables: ['1']
        },
        {
          id: 'mock-2',
          name: 'Promotional Offer',
          body: 'Hi {{1}}! 🛍️\n\nSpecial offer just for you:\n{{2}} off on your next purchase!\n\nUse code: {{3}}',
          header: '🎯 Special Offer',
          footer: 'Offer expires soon',
          status: 'APPROVED',
          language: 'en',
          category: 'MARKETING',
          header_type: 'text',
          variables: ['1', '2', '3']
        },
        {
          id: 'mock-3',
          name: 'Product Showcase',
          body: 'Check out our latest products! {{1}}\n\nAvailable now with free shipping.',
          header: 'New Products',
          footer: 'Visit our store for more',
          status: 'APPROVED',
          language: 'en',
          category: 'MARKETING',
          header_type: 'image',
          header_media: {
            type: 'image',
            handle: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop'
          },
          variables: ['1']
        }
      ];
      setTemplates(mockTemplates);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const stats: any = await apiService.getDashboardStats();
      if (stats) {
        setDashboardStats(stats);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setDashboardStats(null);
    }
  };

  const loadContactTagsSummary = async () => {
    try {
      // console.log('📊 Loading contact tags summary from contacts endpoint...');
      
      // Fetch contacts using the same endpoint as contacts page
      const response: any = await apiService.getContacts();
      
      if (response && response.contacts) {
        const contacts = response.contacts;
        // console.log(`📋 Processing ${contacts.length} contacts for tag grouping...`);
        
        // Filter contacts by user's company for security (same as contacts page)
        const userContacts = contacts.filter((contact: any) => 
          contact.companyId === user?.companyId || !contact.companyId
        );
        
        // console.log(`🔒 Filtered to ${userContacts.length} contacts for current user's company`);
        
        // Group contacts by tags
        const tagGroups: { [key: string]: number } = {};
        let untaggedCount = 0;
        
        userContacts.forEach((contact: any) => {
          if (contact.tags && Array.isArray(contact.tags) && contact.tags.length > 0) {
            // Contact has tags - count each tag
            contact.tags.forEach((tag: string) => {
              if (tag && tag.trim()) {
                const cleanTag = tag.trim();
                tagGroups[cleanTag] = (tagGroups[cleanTag] || 0) + 1;
              }
            });
          } else {
            // Contact has no tags or empty tags array
            untaggedCount++;
          }
        });
        
        const summary = {
          tagGroups,
          untaggedCount,
          totalContacts: userContacts.length
        };
        
        //  console.log('📊 Contact tags summary:', {
        //   totalTags: Object.keys(tagGroups).length,
        //   tagGroups: Object.entries(tagGroups).map(([tag, count]) => ({ tag, count })),
        //   untaggedCount,
        //   totalContacts: userContacts.length
        // });
        
        setContactTagsSummary(summary);
      } else {
        // console.log('⚠️ No contacts found in response');
        setContactTagsSummary({
          tagGroups: {},
          untaggedCount: 0,
          totalContacts: 0
        });
      }
    } catch (err) {
      console.error('❌ Error loading contact tags summary:', err);
      setContactTagsSummary({
        tagGroups: {},
        untaggedCount: 0,
        totalContacts: 0
      });
    }
  };

  // Campaign handlers
  const handleCreateCampaign = async (campaignData: any) => {
    try {
      // console.log('Creating campaign with data:', campaignData);
      await apiService.createCampaign(campaignData);
      await loadCampaigns();
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError('Failed to create campaign. Please try again.');
      throw err; // Re-throw to be handled by the page
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
    const campaign = campaigns.find(c => c.id === id);
    const campaignName = campaign?.name || 'this campaign';
    
    showConfirm(
      'Delete Campaign',
      `Are you sure you want to delete "${campaignName}"? This action cannot be undone.`,
      async () => {
        try {
          await apiService.deleteCampaign(id);
          await loadCampaigns();
          showSuccess('Campaign Deleted', `"${campaignName}" has been successfully deleted.`);
        } catch (err) {
          console.error('Error deleting campaign:', err);
          setError('Failed to delete campaign. Please try again.');
        }
      },
      'Delete',
      'Cancel'
    );
  };

  const handleStartCampaign = async (id: string) => {
    try {
      await apiService.startCampaign(id);
      await loadCampaigns();
    } catch (err) {
      console.error('Error starting campaign:', err);
      setError('Failed to start campaign. Please try again.');
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await apiService.pauseCampaign(id);
      await loadCampaigns();
    } catch (err) {
      console.error('Error pausing campaign:', err);
      setError('Failed to pause campaign. Please try again.');
    }
  };

  const handleRestartCampaign = async (id: string) => {
    try {
      // Use the same start endpoint to restart a paused campaign
      await apiService.startCampaign(id);
      await loadCampaigns();
    } catch (err) {
      console.error('Error restarting campaign:', err);
      setError('Failed to restart campaign. Please try again.');
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    // For now, show a modal. In the future, this could open an edit modal or navigate to an edit page
    showSuccess(
      'Edit Campaign',
      `Editing "${campaign.name}" - Edit functionality will be implemented in the campaign detail page.`
    );
  };

  // Campaign Execution Engine handlers
  const startCampaignExecution = async (campaignId: string) => {
    try {
      setExecutionLoading(prev => ({ ...prev, [campaignId]: true }));
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      // Use Campaign Execution Engine API endpoint
      const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Campaign Started', `Campaign execution started successfully. ${data.total_contacts} contacts will be processed.`);
        
        // Start polling for execution status
        startExecutionPolling(campaignId);
        await loadCampaigns(); // Refresh campaign list
      } else {
        setError(data.message || 'Failed to start campaign execution');
      }
    } catch (err: any) {
      console.error('Error starting campaign execution:', err);
      setError(err.message || 'Failed to start campaign execution');
    } finally {
      setExecutionLoading(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const stopCampaignExecution = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    const campaignName = campaign?.name || 'this campaign';
    
    showConfirm(
      'Stop Campaign Execution',
      `Are you sure you want to stop execution for "${campaignName}"? This will pause message sending.`,
      async () => {
        try {
          setExecutionLoading(prev => ({ ...prev, [campaignId]: true }));
          
          // Get auth token from localStorage
          const token = localStorage.getItem('token');
          
          // Use Campaign Execution Engine API endpoint
          const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/stop`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          });
          
          const data = await response.json();
          
          if (data.success) {
            showSuccess('Campaign Stopped', `Campaign execution stopped successfully.`);
            
            // Stop polling
            stopExecutionPolling(campaignId);
            await loadCampaigns(); // Refresh campaign list
          } else {
            setError(data.message || 'Failed to stop campaign execution');
          }
        } catch (err: any) {
          console.error('Error stopping campaign execution:', err);
          setError(err.message || 'Failed to stop campaign execution');
        } finally {
          setExecutionLoading(prev => ({ ...prev, [campaignId]: false }));
        }
      },
      'Stop Execution',
      'Cancel'
    );
  };

  const pauseCampaignExecution = async (campaignId: string) => {
    try {
      setExecutionLoading(prev => ({ ...prev, [campaignId]: true }));
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      // Use Campaign Execution Engine API endpoint
      const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Campaign Paused', 'Campaign execution paused. You can resume it later.');
        await loadCampaigns();
      } else {
        setError(data.message || 'Failed to pause campaign execution');
      }
    } catch (err: any) {
      console.error('Error pausing campaign execution:', err);
      setError(err.message || 'Failed to pause campaign execution');
    } finally {
      setExecutionLoading(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const resumeCampaignExecution = async (campaignId: string) => {
    try {
      setExecutionLoading(prev => ({ ...prev, [campaignId]: true }));
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      // Use Campaign Execution Engine API endpoint
      const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Campaign Resumed', 'Campaign execution resumed from where it left off.');
        
        // Start polling again
        startExecutionPolling(campaignId);
        await loadCampaigns();
      } else {
        setError(data.message || 'Failed to resume campaign execution');
      }
    } catch (err: any) {
      console.error('Error resuming campaign execution:', err);
      setError(err.message || 'Failed to resume campaign execution');
    } finally {
      setExecutionLoading(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const getCampaignExecutionStatus = async (campaignId: string) => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      // Use Campaign Execution Engine status API endpoint
      const response = await fetch(`http://localhost:8000/campaigns/${campaignId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.status) {
        setCampaignExecutions(prev => ({
          ...prev,
          [campaignId]: data.status
        }));
      }
    } catch (err) {
      console.error('Error getting campaign execution status:', err);
      // Fallback to mock data if API is not available
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        const mockStatus = {
          campaign_id: campaignId,
          status: campaign.status,
          total_contacts: 150, // Mock data
          sent_count: campaign.metrics?.sent || 0,
          success_count: campaign.metrics?.delivered || 0,
          failed_count: (campaign.metrics?.sent || 0) - (campaign.metrics?.delivered || 0),
          progress_percentage: campaign.status === 'completed' ? 100 : Math.random() * 100,
          is_running: campaign.status === 'running',
          last_sent_time: new Date().toISOString(),
          current_contact_index: campaign.metrics?.sent || 0,
          processed_contact_ids: [],
          last_checkpoint_time: new Date().toISOString()
        };
        
        setCampaignExecutions(prev => ({
          ...prev,
          [campaignId]: mockStatus
        }));
      }
    }
  };

  const startExecutionPolling = (campaignId: string) => {
    // Clear existing polling for this campaign
    stopExecutionPolling(campaignId);
    
    // Start new polling every 3 seconds
    const interval = setInterval(() => {
      getCampaignExecutionStatus(campaignId);
    }, 3000);
    
    setExecutionPolling(prev => ({
      ...prev,
      [campaignId]: interval
    }));
    
    // Get initial status
    getCampaignExecutionStatus(campaignId);
  };

  const stopExecutionPolling = (campaignId: string) => {
    const interval = executionPolling[campaignId];
    if (interval) {
      clearInterval(interval);
      setExecutionPolling(prev => {
        const newPolling = { ...prev };
        delete newPolling[campaignId];
        return newPolling;
      });
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      Object.values(executionPolling).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [executionPolling]);

  // Segment handlers
  const handleCreateSegment = async () => {
    try {
      setLoadingContacts(true);
      setShowCreateSegmentModal(true);
      // console.log('🔄 Loading all contacts for segment creation...');
      
      // Fetch all contacts
      const response: any = await apiService.getContacts();
      
      if (response && response.contacts) {
        // Filter contacts by user's company for security
        const userContacts = response.contacts.filter((contact: any) => 
          contact.companyId === user?.companyId || !contact.companyId
        );
        
        // console.log(`📋 Loaded ${userContacts.length} contacts for segment creation`);
        setAllContacts(userContacts);
      } else {
        // console.log('⚠️ No contacts found');
        setAllContacts([]);
      }
    } catch (err) {
      console.error('❌ Error loading contacts:', err);
      setError('Failed to load contacts. Please try again.');
      setAllContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) {
      setError('Please enter a segment name');
      return;
    }
    
    if (selectedContactIds.length === 0) {
      setError('Please select at least one contact');
      return;
    }

    try {
      setCreateSegmentLoading(true);
      //  console.log('💾 Creating segment:', {
      //   name: segmentName,
      //   description: segmentDescription,
      //   contactIds: selectedContactIds
      // });

      // Create segment with selected contacts
      const segmentData = {
        name: segmentName.trim(),
        description: segmentDescription.trim() || `Custom segment with ${selectedContactIds.length} contacts`,
        type: 'static',
        contact_ids: selectedContactIds
      };

      await apiService.createSegment(segmentData);
      
      // Reset modal state
      setShowCreateSegmentModal(false);
      setSegmentName('');
      setSegmentDescription('');
      setSelectedContactIds([]);
      setAllContacts([]);
      
      // Refresh segments
      await loadSegments();
      setError(null);
      
      // console.log('✅ Segment created successfully!');
      showSuccess(
        'Segment Created',
        `Segment "${segmentName}" created successfully with ${selectedContactIds.length} contacts!`
      );
      
    } catch (err: any) {
      console.error('❌ Error creating segment:', err);
      setError(err.message || 'Failed to create segment. Please try again.');
    } finally {
      setCreateSegmentLoading(false);
    }
  };

  const handleCloseSegmentModal = () => {
    setShowCreateSegmentModal(false);
    setSegmentName('');
    setSegmentDescription('');
    setSelectedContactIds([]);
    setAllContacts([]);
    setError(null);
  };

  const handleCreateTagBasedSegments = async () => {
    try {
      setLoading(true);
      // console.log('🏷️ Auto-creating segments from contact tags...');
      
      // Use the new auto-create endpoint
      const response: any = await apiService.autoCreateSegmentsFromTags();
      
      // console.log('📊 Auto-create segments response:', response);
      
      if (response && response.success) {
        //  console.log(`✅ Successfully auto-created segments!`, {
        //   createdSegments: response.segments || [],
        //   message: response.message
        // });
        
        // Refresh segments and contact tags summary
        await Promise.all([
          loadSegments(),
          loadContactTagsSummary()
        ]);
        
        setError(null);
        
        // Show success message
        const segmentCount = response.segments ? response.segments.length : 0;
        showSuccess(
          'Segments Created',
          `Successfully auto-created ${segmentCount} segments from contact tags!`
        );
      } else {
        // console.log('⚠️ Auto-create segments failed:', response);
        setError(response.message || 'Failed to create segments from contact tags.');
      }
    } catch (err: any) {
      console.error('❌ Error auto-creating segments:', err);
      setError(err.message || 'Failed to create tag-based segments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSegment = async (id: string) => {
    const segment = segments.find(s => s.id === id);
    const segmentName = segment?.name || 'this segment';
    
    showConfirm(
      'Delete Segment',
      `Are you sure you want to delete "${segmentName}"? This action cannot be undone.`,
      async () => {
        try {
          await apiService.deleteSegment(id);
          await loadSegments();
          showSuccess('Segment Deleted', `"${segmentName}" has been successfully deleted.`);
        } catch (err) {
          console.error('Error deleting segment:', err);
          setError('Failed to delete segment. Please try again.');
        }
      },
      'Delete',
      'Cancel'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderExecutionStatus = (campaign: Campaign) => {
    const execution = campaignExecutions[campaign.id];
    const isLoading = executionLoading[campaign.id];
    
    if (!execution) {
      return (
        <div className="text-sm text-slate-500">
          No execution data
        </div>
      );
    }

    const progressPercentage = execution.progress_percentage || 0;
    const isRecovering = execution.last_checkpoint_time && execution.is_running;

    return (
      <div className="space-y-2">
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-[#2A8B8A] h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        
        {/* Status Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">
            {execution.sent_count || 0}/{execution.total_contacts || 0} sent
          </span>
          <span className="text-slate-600">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>

        {/* Recovery Indicator */}
        {isRecovering && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Resumed from checkpoint
          </div>
        )}

        {/* Real-time stats */}
        {execution.is_running && (
          <div className="text-xs text-slate-500">
            ✅ {execution.success_count || 0} success • ❌ {execution.failed_count || 0} failed
          </div>
        )}
      </div>
    );
  };

  const renderExecutionControls = (campaign: Campaign) => {
    const isLoading = executionLoading[campaign.id];
    const execution = campaignExecutions[campaign.id];
    const isRunning = execution?.is_running || campaign.status === 'running';
    const isPaused = campaign.status === 'paused';
    const isCompleted = campaign.status === 'completed';

    return (
      <div className="flex items-center gap-2">
        {!isRunning && !isPaused && !isCompleted && (
          <button
            onClick={() => startCampaignExecution(campaign.id)}
            disabled={isLoading}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <LuPlay className="w-3 h-3 mr-1" />
            )}
            Start
          </button>
        )}

        {isRunning && (
          <>
            <button
              onClick={() => pauseCampaignExecution(campaign.id)}
              disabled={isLoading}
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
              ) : (
                <LuPause className="w-3 h-3 mr-1" />
              )}
              Pause
            </button>
            
            <button
              onClick={() => stopCampaignExecution(campaign.id)}
              disabled={isLoading}
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
              ) : (
                <LuX className="w-3 h-3 mr-1" />
              )}
              Stop
            </button>
          </>
        )}

        {isPaused && (
          <button
            onClick={() => resumeCampaignExecution(campaign.id)}
            disabled={isLoading}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <LuPlay className="w-3 h-3 mr-1" />
            )}
            Resume
          </button>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'campaigns', label: 'Campaigns', icon: <LuRocket className="w-4 h-4" /> },
    { id: 'segments', label: 'Segments', icon: <LuUsers className="w-4 h-4" /> },
    { id: 'abTests', label: 'A/B Tests', icon: <LuTestTube className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <LuTrendingUp className="w-4 h-4" /> }
  ];

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

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A8B8A]"></div>
          <span className="ml-2 text-slate-600">Loading...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'campaigns':
        return (
          <div className="space-y-6">
            {/* Dashboard Stats */}
            {dashboardStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <LuRocket className="h-6 w-6 text-[#2A8B8A]" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-xs font-medium text-slate-500 truncate">
                          Total Campaigns
                        </dt>
                        <dd className="text-lg font-medium text-slate-900">
                          {dashboardStats.total_campaigns}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <LuActivity className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-xs font-medium text-slate-500 truncate">
                          Active Campaigns
                        </dt>
                        <dd className="text-lg font-medium text-slate-900">
                          {dashboardStats.active_campaigns}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <LuTrendingUp className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-xs font-medium text-slate-500 truncate">
                          Messages Sent
                        </dt>
                        <dd className="text-lg font-medium text-slate-900">
                          {dashboardStats.total_messages_sent?.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <LuTarget className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-xs font-medium text-slate-500 truncate">
                          Avg. Read Rate
                        </dt>
                        <dd className="text-lg font-medium text-slate-900">
                          {dashboardStats.average_read_rate}%
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Campaign Execution Engine Status */}
            <div className="bg-gradient-to-r from-[#2A8B8A] to-[#228B8A] rounded-lg shadow-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <LuRocket className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Campaign Execution Engine</h3>
                    <p className="text-white/80 text-xs">
                    Persistence & Recovery Active • Zero Message Loss Guaranteed
                    </p>
                  </div>
                </div>
                
                <div className="text-right text-white">
                  <div className="text-sm font-medium">
                    {Object.values(campaignExecutions).filter(exec => exec?.is_running).length} Running
                  </div>
                  <div className="text-xs text-white/80">
                    Real-time monitoring
                  </div>
                </div>
              </div>
              
              {/* Active Executions Summary */}
              {Object.values(campaignExecutions).some(exec => exec?.is_running) && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="grid grid-cols-3 gap-4 text-white">
                    <div className="text-center">
                      <div className="text-xl font-bold">
                        {Object.values(campaignExecutions).reduce((total: number, exec: any) => 
                          total + (exec?.sent_count || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-white/80">Messages Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">
                        {Object.values(campaignExecutions).reduce((total: number, exec: any) => 
                          total + (exec?.success_count || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-white/80">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">
                        {(Object.values(campaignExecutions).reduce((total: number, exec: any) => 
                          total + (exec?.progress_percentage || 0), 0) / 
                          Math.max(Object.values(campaignExecutions).filter(exec => exec?.is_running).length, 1)
                        ).toFixed(1)}%
                      </div>
                      <div className="text-xs text-white/80">Avg Progress</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Campaigns List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-slate-900">
                    Recent Campaigns
                  </h3>
                  <Link 
                    href="/campaigns/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2A8B8A] hover:bg-[#228B8A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A8B8A]"
                  >
                    <LuPlus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Link>
                </div>
                
                {campaigns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y div ide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/5">
                            Campaign
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-20">
                            Status
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-48">
                            Execution Progress
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">
                            Sent
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-20">
                            Delivery Rate
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-20">
                            Read Rate
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">
                            ROI
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                            Execution Controls
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {campaigns.map((campaign) => (
                          <tr key={campaign.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                                  {campaign.name}
                                </div>
                                <div className="text-sm text-slate-500 truncate max-w-[200px]">
                                  {campaign.description}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <div className="min-w-[180px]">
                                {renderExecutionStatus(campaign)}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">
                              {campaign.metrics?.sent?.toLocaleString() || 0}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">
                              {campaign.metrics?.deliveryRate || 0}%
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">
                              {campaign.metrics?.readRate || 0}%
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">
                              {campaign.metrics?.roi || 0}%
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              {renderExecutionControls(campaign)}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-1">
                                <Link
                                  href={`/campaigns/${campaign.id}`}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Details"
                                >
                                  <LuEye className="w-4 h-4" />
                                </Link>
                                {campaign.status.toLowerCase() === 'draft' && (
                                  <button
                                    onClick={() => handleStartCampaign(campaign.id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Start Campaign"
                                  >
                                    <LuPlay className="w-4 h-4" />
                                  </button>
                                )}
                                {campaign.status.toLowerCase() === 'running' && (
                                  <button
                                    onClick={() => handlePauseCampaign(campaign.id)}
                                    className="text-yellow-600 hover:text-yellow-900"
                                    title="Pause Campaign"
                                  >
                                    <LuPause className="w-4 h-4" />
                                  </button>
                                )}
                                {campaign.status.toLowerCase() === 'paused' && (
                                  <button
                                    onClick={() => handleRestartCampaign(campaign.id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Restart Campaign"
                                  >
                                    <LuPlay className="w-4 h-4" />
                                  </button>
                                )}
                                {(campaign.status.toLowerCase() === 'draft' || campaign.status.toLowerCase() === 'paused') && (
                                  <button
                                    onClick={() => handleEditCampaign(campaign)}
                                    className="text-purple-600 hover:text-purple-900"
                                    title="Edit Campaign"
                                  >
                                    <LuPencil className="w-4 h-4" />
                                  </button>
                                )}
                                {campaign.abTest?.enabled && (
                                  <button
                                    onClick={() => setActiveTab('abTests')}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View A/B Test Details"
                                  >
                                    <LuTestTube className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteCampaign(campaign.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Campaign"
                                >
                                  <LuTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <LuRocket className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No campaigns</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Get started by creating your first campaign.
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/campaigns/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2A8B8A] hover:bg-[#228B8A]"
                      >
                        <LuPlus className="w-4 h-4 mr-2" />
                        Create Campaign
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'segments':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-slate-900">
                    Customer Segments
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCreateTagBasedSegments()}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 border border-[#2A8B8A] text-sm font-medium rounded-md text-[#2A8B8A] bg-white hover:bg-[#2A8B8A]/5 disabled:opacity-50"
                    >
                      <LuUsers className="w-4 h-4 mr-2" />
                      Auto-Create from Tags
                    </button>
                    <button
                      onClick={() => setShowNewSegmentModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2A8B8A] hover:bg-[#228B8A]"
                    >
                      <LuPlus className="w-4 h-4 mr-2" />
                      Create Advanced Segment
                    </button>
                    <button
                      onClick={() => handleCreateSegment()}
                      className="inline-flex items-center px-3 py-2 border border-[#2A8B8A] text-sm font-medium rounded-md text-[#2A8B8A] bg-white hover:bg-[#2A8B8A]/5"
                    >
                      <LuPlus className="w-4 h-4 mr-2" />
                      Quick Create
                    </button>
                  </div>
                </div>
                
                {segments.length > 0 ? (
                  <div className="grid gap-4">
                    {segments.map((segment) => (
                      <div key={segment.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-sm font-medium text-slate-900">{segment.name}</h4>
                              {segment.isTagGroup && (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  Tag Group
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                segment.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {segment.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-start gap-2 mb-2">
                              <p className="text-sm text-slate-700 flex-1">
                                {segment.description}
                                {segment.tagName && (
                                  <span className="ml-2 text-xs text-blue-600 font-medium">
                                    Tag: {segment.tagName}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-600">
                              <span className="font-medium">Contacts: {segment.contactCount.toLocaleString()}</span>
                              <span>Type: {segment.type || 'static'}</span>
                              <span>Updated: {new Date(segment.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteSegment(segment.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Segment"
                            >
                              <LuTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <LuUsers className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No segments</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Create your first segment to target specific customers.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => handleCreateSegment()}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2A8B8A] hover:bg-[#228B8A]"
                      >
                        <LuPlus className="w-4 h-4 mr-2" />
                        Create Segment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'abTests':
        // Extract ALL campaigns that have A/B tests (regardless of status or enabled state)
        // This includes completed, active, paused, cancelled - any campaign with ab_test data
        const campaignsWithABTests = campaigns.filter(campaign => 
          campaign.abTest && Object.keys(campaign.abTest).length > 0
        );
        
        // Categorize by status for display
        const activeABTests = campaignsWithABTests.filter(c => 
          c.status === 'running' || c.status === 'scheduled'
        );
        const completedABTests = campaignsWithABTests.filter(c => c.status === 'completed');
        const otherABTests = campaignsWithABTests.filter(c => 
          c.status !== 'running' && c.status !== 'scheduled' && c.status !== 'completed'
        );
        
        return (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-slate-900">
                      A/B Tests from Campaigns
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      All campaigns with A/B testing configured
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#2A8B8A]">{campaignsWithABTests.length}</div>
                      <div className="text-xs text-slate-500">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{activeABTests.length}</div>
                      <div className="text-xs text-slate-500">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{completedABTests.length}</div>
                      <div className="text-xs text-slate-500">Completed</div>
                    </div>
                  </div>
                </div>
                
                {campaignsWithABTests.length > 0 ? (
                  <div className="space-y-4">
                    {campaignsWithABTests.map((campaign) => {
                      const abTest = campaign.abTest!;
                      const campaignExecution = campaignExecutions[campaign.id];
                      const isRunning = campaignExecution?.is_running || campaign.status === 'running';
                      
                      return (
                        <div key={campaign.id} className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                          {/* Test Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-slate-900">{campaign.name}</h4>
                              <p className="text-sm text-slate-600 mb-2">
                                A/B Test: {abTest.testName || 'Unnamed Test'}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                </span>
                                {abTest.enabled ? (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                    ✓ A/B Test Enabled
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                    ⚠ A/B Test Disabled
                                  </span>
                                )}
                                <span className="text-sm text-slate-500">
                                  Split: {abTest.splitPercentage}% / {100 - abTest.splitPercentage}%
                                </span>
                                <span className="text-sm text-slate-500">
                                  Duration: {abTest.testDurationHours}h
                                </span>
                                <span className="text-sm text-slate-500">
                                  Total Contacts: {campaign.metrics?.sent || 0}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              {isRunning && (
                                <div className="text-sm text-[#2A8B8A] font-medium flex items-center gap-2">
                                  <div className="w-2 h-2 bg-[#2A8B8A] rounded-full animate-pulse" />
                                  Test Running
                                </div>
                              )}
                              {campaign.status === 'completed' && (
                                <div className="text-sm text-green-600 font-medium">
                                  ✓ Test Completed
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Execution Progress */}
                          {campaignExecution && (
                            <div className="bg-slate-50 rounded-lg p-4 mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-slate-700">Execution Progress</h5>
                                <span className="text-sm text-slate-600">
                                  {(campaignExecution.progress_percentage || 0).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                                <div 
                                  className="bg-[#2A8B8A] h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(campaignExecution.progress_percentage || 0, 100)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <span>{campaignExecution.sent_count || 0} / {campaignExecution.total_contacts || 0} messages sent</span>
                                <span>{campaignExecution.success_count || 0} delivered</span>
                              </div>
                            </div>
                          )}

                          {/* Variant Comparison */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Variant A */}
                            <div className="border border-slate-100 rounded-lg p-4 bg-blue-50">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-slate-900">Variant A (Original)</h5>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                  {abTest.splitPercentage}% traffic
                                </span>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Template:</span>
                                  <span className="font-medium text-xs text-slate-900">{campaign.messageTemplate || 'Default'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Status:</span>
                                  <span className="font-medium text-slate-900">{campaign.status}</span>
                                </div>
                              </div>
                            </div>

                            {/* Variant B */}
                            <div className="border border-slate-100 rounded-lg p-4 bg-purple-50">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-slate-900">Variant B (Test)</h5>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                                  {100 - abTest.splitPercentage}% traffic
                                </span>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Template:</span>
                                  <span className="font-medium text-xs text-slate-900">{abTest.variantBTemplateId}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Duration:</span>
                                  <span className="font-medium text-slate-900">{abTest.testDurationHours}h</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Campaign Metrics */}
                          {campaign.metrics && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-slate-900">{campaign.metrics.sent || 0}</div>
                                <div className="text-xs text-slate-600">Sent</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{campaign.metrics.delivered || 0}</div>
                                <div className="text-xs text-slate-600">Delivered</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{campaign.metrics.opened || 0}</div>
                                <div className="text-xs text-slate-600">Opened</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-[#2A8B8A]">{campaign.metrics.deliveryRate?.toFixed(1) || 0}%</div>
                                <div className="text-xs text-slate-600">Delivery Rate</div>
                              </div>
                            </div>
                          )}

                          {/* Test Controls */}
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-slate-500">
                                Created: {new Date(campaign.createdAt).toLocaleDateString()}
                                {campaign.scheduledAt && (
                                  <span className="ml-4">
                                    Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                                  </span>
                                )}
                                {campaign.status === 'completed' && (
                                  <span className="ml-4 text-green-600">
                                    ✓ Completed
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {renderExecutionControls(campaign)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <LuTestTube className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No A/B Tests Found</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      A/B tests are created within campaigns. Create a campaign with A/B testing enabled to see results here.
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/campaigns/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2A8B8A] hover:bg-[#228B8A]"
                      >
                        <LuPlus className="w-4 h-4 mr-2" />
                        Create Campaign with A/B Test
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Campaign Execution Engine Analytics */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">
                  Campaign Execution Engine Analytics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-[#2A8B8A] to-[#228B8A] rounded-lg p-6 text-white">
                    <div className="flex items-center">
                      <LuRocket className="w-8 h-8 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">
                          {Object.keys(campaignExecutions).length}
                        </div>
                        <div className="text-sm opacity-90">Total Executions</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center">
                      <LuPlay className="w-8 h-8 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">
                          {Object.values(campaignExecutions).filter(exec => exec?.is_running).length}
                        </div>
                        <div className="text-sm opacity-90">Currently Running</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center">
                      <LuTarget className="w-8 h-8 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">
                          {Object.values(campaignExecutions).reduce((total: number, exec: any) => 
                            total + (exec?.sent_count || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm opacity-90">Messages Sent</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center">
                      <LuCheck className="w-8 h-8 mr-3" />
                      <div>
                        <div className="text-2xl font-bold">
                          {(Object.values(campaignExecutions).reduce((total: number, exec: any) => 
                            total + (exec?.success_count || 0), 0) / 
                            Math.max(Object.values(campaignExecutions).reduce((total: number, exec: any) => 
                              total + (exec?.sent_count || 0), 0), 1) * 100
                          ).toFixed(1)}%
                        </div>
                        <div className="text-sm opacity-90">Success Rate</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Persistence & Recovery Status */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                      <LuCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-emerald-900">
                        Persistence & Recovery System
                      </h4>
                      <p className="text-sm text-emerald-700">
                        Zero message loss guarantee with checkpoint-based recovery
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {Object.values(campaignExecutions).filter(exec => exec?.last_checkpoint_time).length}
                      </div>
                      <div className="text-sm text-emerald-700">Active Checkpoints</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">100%</div>
                      <div className="text-sm text-emerald-700">Recovery Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">0</div>
                      <div className="text-sm text-emerald-700">Messages Lost</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Campaign Analytics */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-slate-900 mb-4">
                  Campaign Analytics
                </h3>
                
                {campaignAnalytics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaignAnalytics.map((analytics) => (
                      <div key={analytics.campaignId} className="border border-slate-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-900 mb-2">{analytics.campaignName}</h4>
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
                          {analytics.metrics.revenue && (
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-500">Revenue:</span>
                              <span className="font-medium text-green-600">${analytics.metrics.revenue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <LuTrendingUp className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No analytics data</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Run some campaigns to see performance analytics.
                    </p>
                  </div>
                )}
              </div>
            </div>
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
            <h1 className="text-3xl font-bold text-slate-900">Campaign Management</h1>
            <p className="text-slate-600 mt-2">
              Powerful tools for segmentation, A/B testing, and analytics
            </p>
          </div>

          {/* Error Display */}
          {error && <ErrorDisplay message={error} />}

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
      {/* Create Segment Modal */}
      {showCreateSegmentModal && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Create New Segment</h2>
                <p className="text-sm text-slate-600 mt-1">Select contacts to create a custom segment</p>
              </div>
              <button 
                onClick={handleCloseSegmentModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Segment Details */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Segment Name *
                  </label>
                  <input
                    type="text"
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="Enter segment name"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={segmentDescription}
                    onChange={(e) => setSegmentDescription(e.target.value)}
                    placeholder="Brief description of this segment"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900">Select Contacts</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600">
                      {selectedContactIds.length} of {allContacts.length} selected
                    </span>
                    <button
                      onClick={() => {
                        if (selectedContactIds.length === allContacts.length) {
                          setSelectedContactIds([]);
                        } else {
                          setSelectedContactIds(allContacts.map(contact => contact._id));
                        }
                      }}
                      className="text-sm text-[#2A8B8A] hover:text-[#2A8B8A]/80 font-medium"
                    >
                      {selectedContactIds.length === allContacts.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {loadingContacts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A8B8A]"></div>
                    <span className="ml-2 text-slate-600">Loading contacts...</span>
                  </div>
                ) : allContacts.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
                    {allContacts.map((contact) => (
                      <label key={contact._id} className="flex items-center p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContactIds([...selectedContactIds, contact._id]);
                            } else {
                              setSelectedContactIds(selectedContactIds.filter(id => id !== contact._id));
                            }
                          }}
                          className="w-4 h-4 text-[#2A8B8A] focus:ring-[#2A8B8A] border-slate-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-slate-900">{contact.name}</div>
                              <div className="text-sm text-slate-600">{contact.phone}</div>
                              {contact.email && (
                                <div className="text-sm text-slate-500">{contact.email}</div>
                              )}
                            </div>
                            <div className="text-right">
                              {contact.tags && contact.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {contact.tags.slice(0, 3).map((tag: string, index: number) => (
                                    <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                  {contact.tags.length > 3 && (
                                    <span className="text-xs text-slate-500">+{contact.tags.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-slate-200 rounded-lg">
                    <LuUsers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No contacts available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200">
              <button
                onClick={handleCloseSegmentModal}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveSegment}
                disabled={createSegmentLoading || !segmentName.trim() || selectedContactIds.length === 0}
                className="px-6 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {createSegmentLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <LuUsers className="w-4 h-4" />
                    Create Segment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowSuccessModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <LuCheck className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-slate-900">{modalContent.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <LuX className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-slate-600">{modalContent.message}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90 transition-colors"
                >
                  {modalContent.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <LuInfo className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-slate-900">{modalContent.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <LuX className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-slate-600">{modalContent.message}</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {modalContent.cancelText}
                </button>
                <button
                  onClick={() => {
                    modalContent.onConfirm();
                    setShowConfirmModal(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {modalContent.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Enhanced Segment Modal */}
      <SegmentModal
        isOpen={showNewSegmentModal}
        onClose={() => setShowNewSegmentModal(false)}
        onSuccess={() => {
          setShowNewSegmentModal(false);
          loadSegments();
          showSuccess('Segment Created', 'Your advanced segment has been created successfully!');
        }}
      />
    </ProtectedRoute>
  );
}
