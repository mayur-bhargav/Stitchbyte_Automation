"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useThemeWatcher, getThemeColors } from '../hooks/useThemeToggle';
import ProtectedRoute from '../components/ProtectedRoute';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import IntegrationModal from '../components/IntegrationModal';
import ShopifyIntegration from '../components/ShopifyIntegration';
import WooCommerceIntegration from '../components/WooCommerceIntegration';
import DisconnectModal from '../components/DisconnectModal';
import { apiService } from '../services/apiService';

interface Integration {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  status: 'available' | 'coming-soon' | 'connected';
  color: string;
}

const integrations: Integration[] = [
  // E-commerce
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect your Shopify store for automated order notifications and customer updates.',
    image: '/integrations/shopify.svg',
    category: 'E-commerce',
    status: 'available',
    color: 'bg-green-500'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Integrate with WooCommerce to send order confirmations and shipping updates.',
    image: '/integrations/woocommerce.svg',
    category: 'E-commerce',
    status: 'available',
    color: 'bg-purple-500'
  },
  {
    id: 'magento',
    name: 'Magento',
    description: 'Sync Magento orders and customer data for personalized messaging campaigns.',
    image: '/integrations/magento.svg',
    category: 'E-commerce',
    status: 'available',
    color: 'bg-orange-500'
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    description: 'Connect BigCommerce for automated inventory alerts and customer communications.',
    image: '/integrations/bigcommerce.svg',
    category: 'E-commerce',
    status: 'available',
    color: 'bg-blue-600'
  },
  {
    id: 'prestashop',
    name: 'PrestaShop',
    description: 'Integrate PrestaShop for order management and customer engagement automation.',
    image: '/integrations/prestashop.svg',
    category: 'E-commerce',
    status: 'available',
    color: 'bg-pink-500'
  },
  {
    id: 'opencart',
    name: 'OpenCart',
    description: 'Connect OpenCart store for streamlined order processing and notifications.',
    image: '/integrations/opencart.svg',
    category: 'E-commerce',
    status: 'available',
    color: 'bg-cyan-500'
  },

  // CRM
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Integrate with Salesforce CRM to sync contacts and automate follow-ups.',
    image: '/integrations/salesforce.svg',
    category: 'CRM',
    status: 'available',
    color: 'bg-blue-500'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Connect HubSpot to manage leads and automate customer communication workflows.',
    image: '/integrations/hubspot.svg',
    category: 'CRM',
    status: 'available',
    color: 'bg-orange-600'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sync Pipedrive deals and contacts for targeted messaging and notifications.',
    image: '/integrations/pipedrive.svg',
    category: 'CRM',
    status: 'available',
    color: 'bg-green-600'
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Integrate Zoho CRM for comprehensive customer relationship management.',
    image: '/integrations/zoho.svg',
    category: 'CRM',
    status: 'available',
    color: 'bg-red-500'
  },
  {
    id: 'freshsales',
    name: 'Freshsales',
    description: 'Connect Freshsales CRM for lead management and automated follow-ups.',
    image: '/integrations/freshsales.svg',
    category: 'CRM',
    status: 'available',
    color: 'bg-green-500'
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Sync Airtable databases for flexible contact management and automation.',
    image: '/integrations/airtable.svg',
    category: 'CRM',
    status: 'available',
    color: 'bg-yellow-500'
  },

  // Productivity
  {
    id: 'excel',
    name: 'Microsoft Excel',
    description: 'Import contacts from Excel sheets and export message analytics data.',
    image: '/integrations/excel.svg',
    category: 'Productivity',
    status: 'available',
    color: 'bg-green-700'
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    description: 'Sync contact data with Google Sheets for easy management and updates.',
    image: '/integrations/sheets.svg',
    category: 'Productivity',
    status: 'available',
    color: 'bg-green-600'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 5000+ apps using Zapier to automate your workflows.',
    image: '/integrations/zapier.svg',
    category: 'Productivity',
    status: 'available',
    color: 'bg-orange-500'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Integrate Notion databases for organized contact and project management.',
    image: '/integrations/notion.svg',
    category: 'Productivity',
    status: 'available',
    color: 'bg-gray-800'
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Connect Trello boards for task-based messaging and project updates.',
    image: '/integrations/trello.svg',
    category: 'Productivity',
    status: 'available',
    color: 'bg-blue-600'
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Sync Asana projects for team communication and deadline notifications.',
    image: '/integrations/asana.svg',
    category: 'Productivity',
    status: 'available',
    color: 'bg-pink-600'
  },
  {
    id: 'monday',
    name: 'Monday.com',
    description: 'Integrate Monday.com for workflow automation and team collaboration.',
    image: '/integrations/monday.svg',
    category: 'Productivity',
    status: 'available',
    color: 'bg-purple-600'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect Slack for internal notifications and team messaging integration.',
    image: '/integrations/slack.svg',
    category: 'Productivity',
    status: 'available',
    color: 'bg-purple-500'
  },

  // Development
  {
    id: 'webhook',
    name: 'Custom Webhooks',
    description: 'Build custom integrations using webhooks and REST APIs for any platform.',
    image: '/integrations/webhook.svg',
    category: 'Development',
    status: 'available',
    color: 'bg-gray-600'
  },
  {
    id: 'api',
    name: 'REST API',
    description: 'Full REST API access for developers to build custom solutions.',
    image: '/integrations/api.svg',
    category: 'Development',
    status: 'available',
    color: 'bg-blue-600'
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Connect WordPress websites for form submissions and user notifications.',
    image: '/integrations/wordpress.svg',
    category: 'Development',
    status: 'available',
    color: 'bg-blue-800'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Integrate GitHub for repository notifications and developer team updates.',
    image: '/integrations/github.svg',
    category: 'Development',
    status: 'available',
    color: 'bg-gray-900'
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Connect GitLab for CI/CD notifications and development workflow alerts.',
    image: '/integrations/gitlab.svg',
    category: 'Development',
    status: 'available',
    color: 'bg-orange-600'
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Sync Jira tickets for issue tracking and project management notifications.',
    image: '/integrations/jira.svg',
    category: 'Development',
    status: 'available',
    color: 'bg-blue-700'
  },

  // Analytics
  {
    id: 'analytics',
    name: 'Google Analytics',
    description: 'Track message campaign performance and user engagement analytics.',
    image: '/integrations/analytics.svg',
    category: 'Analytics',
    status: 'available',
    color: 'bg-yellow-500'
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Advanced analytics integration for tracking user behavior and events.',
    image: '/integrations/mixpanel.svg',
    category: 'Analytics',
    status: 'available',
    color: 'bg-purple-600'
  },
  {
    id: 'segment',
    name: 'Segment',
    description: 'Centralize customer data from multiple sources for better targeting.',
    image: '/integrations/segment.svg',
    category: 'Analytics',
    status: 'available',
    color: 'bg-green-500'
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    description: 'Product analytics integration for understanding user journey and behavior.',
    image: '/integrations/amplitude.svg',
    category: 'Analytics',
    status: 'available',
    color: 'bg-blue-500'
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    description: 'User experience analytics for optimizing message engagement strategies.',
    image: '/integrations/hotjar.svg',
    category: 'Analytics',
    status: 'available',
    color: 'bg-red-600'
  },

  // Marketing
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Sync Mailchimp audiences for coordinated email and WhatsApp campaigns.',
    image: '/integrations/mailchimp.svg',
    category: 'Marketing',
    status: 'available',
    color: 'bg-yellow-600'
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'Integrate Klaviyo for advanced email marketing and customer segmentation.',
    image: '/integrations/klaviyo.svg',
    category: 'Marketing',
    status: 'available',
    color: 'bg-purple-700'
  },
  {
    id: 'constant-contact',
    name: 'Constant Contact',
    description: 'Connect Constant Contact for unified marketing campaign management.',
    image: '/integrations/constant-contact.svg',
    category: 'Marketing',
    status: 'available',
    color: 'bg-blue-600'
  },
  {
    id: 'sendinblue',
    name: 'Sendinblue',
    description: 'Integrate Sendinblue for comprehensive multi-channel marketing automation.',
    image: '/integrations/sendinblue.svg',
    category: 'Marketing',
    status: 'available',
    color: 'bg-green-600'
  },
  {
    id: 'facebook-ads',
    name: 'Facebook Ads',
    description: 'Connect Facebook Ads for lead generation and retargeting campaigns.',
    image: '/integrations/facebook-ads.svg',
    category: 'Marketing',
    status: 'available',
    color: 'bg-blue-700'
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Integrate Google Ads for conversion tracking and audience management.',
    image: '/integrations/google-ads.svg',
    category: 'Marketing',
    status: 'available',
    color: 'bg-green-600'
  },

  // Payment & Finance
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Connect Stripe for payment notifications and subscription management.',
    image: '/integrations/stripe.svg',
    category: 'Finance',
    status: 'available',
    color: 'bg-purple-600'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Integrate PayPal for transaction alerts and payment confirmations.',
    image: '/integrations/paypal.svg',
    category: 'Finance',
    status: 'available',
    color: 'bg-blue-600'
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    description: 'Connect Razorpay for Indian payment processing and notifications.',
    image: '/integrations/razorpay.svg',
    category: 'Finance',
    status: 'available',
    color: 'bg-blue-700'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync QuickBooks for invoice notifications and financial reporting.',
    image: '/integrations/quickbooks.svg',
    category: 'Finance',
    status: 'available',
    color: 'bg-green-600'
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Integrate Xero accounting for automated invoice and payment tracking.',
    image: '/integrations/xero.svg',
    category: 'Finance',
    status: 'available',
    color: 'bg-blue-500'
  },

  // Customer Support
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Connect Zendesk for ticket notifications and customer support automation.',
    image: '/integrations/zendesk.svg',
    category: 'Support',
    status: 'available',
    color: 'bg-green-700'
  },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    description: 'Integrate Freshdesk for helpdesk automation and customer communication.',
    image: '/integrations/freshdesk.svg',
    category: 'Support',
    status: 'available',
    color: 'bg-green-600'
  },
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Connect Intercom for unified customer messaging and support workflows.',
    image: '/integrations/intercom.svg',
    category: 'Support',
    status: 'available',
    color: 'bg-blue-600'
  },
  {
    id: 'crisp',
    name: 'Crisp',
    description: 'Integrate Crisp chat for seamless customer support across channels.',
    image: '/integrations/crisp.svg',
    category: 'Support',
    status: 'available',
    color: 'bg-purple-600'
  },

  // Social Media
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect Instagram for social media engagement and follower notifications.',
    image: '/integrations/instagram.svg',
    category: 'Social',
    status: 'available',
    color: 'bg-pink-600'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    description: 'Integrate Twitter for social listening and engagement automation.',
    image: '/integrations/twitter.svg',
    category: 'Social',
    status: 'available',
    color: 'bg-blue-500'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Connect LinkedIn for professional networking and B2B communication.',
    image: '/integrations/linkedin.svg',
    category: 'Social',
    status: 'available',
    color: 'bg-blue-700'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Integrate TikTok for creator marketing and audience engagement.',
    image: '/integrations/tiktok.svg',
    category: 'Social',
    status: 'available',
    color: 'bg-black'
  }
];

export default function IntegrationsPage() {
  const { user } = useUser();
  const { darkMode } = useThemeWatcher();
  const colors = getThemeColors(darkMode);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyDetails, setShopifyDetails] = useState<{shop_domain?: string; connected_at?: string} | null>(null);
  const [wooCommerceConnected, setWooCommerceConnected] = useState(false);
  const [wooCommerceDetails, setWooCommerceDetails] = useState<{store_url?: string; connected_at?: string; webhook_id?: string} | null>(null);
  const [integrationsList, setIntegrationsList] = useState<Integration[]>(integrations);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectingIntegration, setDisconnectingIntegration] = useState<Integration | null>(null);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const { toast, showInfo, hideToast } = useToast();

  const categories = ['all', 'E-commerce', 'CRM', 'Productivity', 'Development', 'Analytics', 'Marketing', 'Finance', 'Support', 'Social'];

  // Handle search icon click
  const handleSearchIconClick = () => {
    setShowSearchBar(true);
    setIsSearchActive(true);
  };

  // Handle search close
  const handleSearchClose = () => {
    setShowSearchBar(false);
    setIsSearchActive(false);
    setSearchTerm('');
    setSelectedCategory('all');
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsSearchActive(value.length > 0);
  };

  // Check Shopify and WooCommerce status on page load
  useEffect(() => {
    const checkIntegrationsStatus = async () => {
      try {
        // Check Shopify status
        const shopifyResponse = await apiService.get('/connectors/shopify/status');
        const shopifyIsConnected = shopifyResponse.connected || false;
        setShopifyConnected(shopifyIsConnected);

        if (shopifyIsConnected) {
          setShopifyDetails({
            shop_domain: shopifyResponse.shop_domain,
            connected_at: shopifyResponse.connected_at
          });
        } else {
          setShopifyDetails(null);
        }

        // Check WooCommerce status
        const wooCommerceResponse = await apiService.get('/connectors/woocommerce/status');
        const wooCommerceIsConnected = wooCommerceResponse.connected || false;
        setWooCommerceConnected(wooCommerceIsConnected);

        if (wooCommerceIsConnected) {
          setWooCommerceDetails({
            store_url: wooCommerceResponse.store_url,
            connected_at: wooCommerceResponse.connected_at,
            webhook_id: wooCommerceResponse.webhook_id
          });
        } else {
          setWooCommerceDetails(null);
        }

        // Update the integration status in the list
        setIntegrationsList(prevIntegrations => 
          prevIntegrations.map(integration => {
            if (integration.id === 'shopify') {
              return { ...integration, status: shopifyIsConnected ? 'connected' as const : 'available' as const };
            }
            if (integration.id === 'woocommerce') {
              return { ...integration, status: wooCommerceIsConnected ? 'connected' as const : 'available' as const };
            }
            return integration;
          })
        );
      } catch (error) {
        console.error('Failed to check integrations status:', error);
        // Keep default status as available if status check fails
      }
    };

    checkIntegrationsStatus();
  }, []);

  const filteredIntegrations = integrationsList.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = !isSearchActive || 
                         integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnect = (integration: Integration) => {
    if (integration.id === 'shopify' || integration.id === 'woocommerce') {
      // Open integration modal
      setSelectedIntegration(integration);
      setIsModalOpen(true);
    } else {
      // Show toast notification for other integrations
      showInfo(`${integration.name} integration is coming soon! We'll notify you via your registered email (${user?.email || 'your email'}) when it's available.`);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIntegration(null);
  };

  const handleShopifyStatusChange = (connected: boolean) => {
    setShopifyConnected(connected);
    // Update the integration status in the list
    setIntegrationsList(prevIntegrations => 
      prevIntegrations.map(integration => 
        integration.id === 'shopify' 
          ? { ...integration, status: connected ? 'connected' as const : 'available' as const }
          : integration
      )
    );
    
    // Update shopify details
    if (connected) {
      // Fetch latest status to get updated details
      const fetchLatestStatus = async () => {
        try {
          const response = await apiService.get('/connectors/shopify/status');
          if (response.connected) {
            setShopifyDetails({
              shop_domain: response.shop_domain,
              connected_at: response.connected_at
            });
          }
        } catch (error) {
          console.error('Failed to fetch latest Shopify status:', error);
        }
      };
      fetchLatestStatus();
    } else {
      setShopifyDetails(null);
    }
  };

  const handleWooCommerceStatusChange = (connected: boolean) => {
    setWooCommerceConnected(connected);
    // Update the integration status in the list
    setIntegrationsList(prevIntegrations => 
      prevIntegrations.map(integration => 
        integration.id === 'woocommerce' 
          ? { ...integration, status: connected ? 'connected' as const : 'available' as const }
          : integration
      )
    );
    
    // Update WooCommerce details
    if (connected) {
      // Fetch latest status to get updated details
      const fetchLatestStatus = async () => {
        try {
          const response = await apiService.get('/connectors/woocommerce/status');
          if (response.connected) {
            setWooCommerceDetails({
              store_url: response.store_url,
              connected_at: response.connected_at,
              webhook_id: response.webhook_id
            });
          }
        } catch (error) {
          console.error('Failed to fetch latest WooCommerce status:', error);
        }
      };
      fetchLatestStatus();
    } else {
      setWooCommerceDetails(null);
    }
  };

  const handleDisconnect = (integration: Integration) => {
    setDisconnectingIntegration(integration);
    setDisconnectModalOpen(true);
  };

  const handleDisconnectConfirm = async () => {
    if (!disconnectingIntegration) return;

    setDisconnectLoading(true);

    try {
      if (disconnectingIntegration.id === 'shopify') {
        await apiService.delete('/connectors/shopify/disconnect');
        handleShopifyStatusChange(false);
        showInfo('Shopify integration disconnected successfully');
      } else if (disconnectingIntegration.id === 'woocommerce') {
        await apiService.delete('/connectors/woocommerce/disconnect');
        handleWooCommerceStatusChange(false);
        showInfo('WooCommerce integration disconnected successfully');
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
      showInfo(`Failed to disconnect ${disconnectingIntegration.name} integration. Please try again.`);
    } finally {
      setDisconnectLoading(false);
      setDisconnectModalOpen(false);
      setDisconnectingIntegration(null);
    }
  };

  const handleDisconnectCancel = () => {
    if (!disconnectLoading) {
      setDisconnectModalOpen(false);
      setDisconnectingIntegration(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6">
        {/* Combined Header and Filter Container */}
        <div className="rounded-xl border overflow-hidden" 
             style={{ 
               backgroundColor: colors.background,
               borderColor: colors.border
             }}>
          
          {/* Header Section */}
          <div className="p-8 border-b" 
               style={{ borderColor: colors.border }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#2A8B8A] to-[#1e6b6b] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2A8B8A] to-[#1e6b6b] bg-clip-text text-transparent">
                    Integrations Marketplace
                  </h1>
                  <p className="text-lg mt-1" style={{ color: colors.textMuted }}>
                    Connect StitchByte with your favorite tools and platforms
                  </p>
                </div>
              </div>
              
              {/* Stats Badge */}
              <div className="hidden md:flex items-center gap-4">
                <div className="text-center px-4 py-2 rounded-lg" 
                     style={{ backgroundColor: colors.backgroundSecondary }}>
                  <div className="text-2xl font-bold" style={{ color: colors.text }}>
                    {integrationsList.length}
                  </div>
                  <div className="text-xs font-medium" style={{ color: colors.textMuted }}>
                    Available
                  </div>
                </div>
                <div className="text-center px-4 py-2 rounded-lg" 
                     style={{ backgroundColor: colors.backgroundSecondary }}>
                  <div className="text-2xl font-bold text-green-500">
                    {integrationsList.filter(i => i.status === 'connected').length}
                  </div>
                  <div className="text-xs font-medium" style={{ color: colors.textMuted }}>
                    Connected
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter/Search Section */}
          <div className="p-6" 
               style={{ backgroundColor: colors.backgroundSecondary }}>
            
            {/* Show search bar when active, otherwise show filters with search icon */}
            {showSearchBar ? (
              /* Search Bar */
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5" style={{ color: colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search integrations..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    autoFocus
                    className="block w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-0 focus:border-[#2A8B8A] text-base font-medium transition-colors"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                  />
                </div>
                <button
                  onClick={handleSearchClose}
                  className="px-6 py-4 rounded-xl border-2 transition-all text-sm font-semibold hover:scale-105"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textSecondary
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background;
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              /* Filters with Search Icon */
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                  {/* Category Filters */}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-semibold py-3 pr-3" style={{ color: colors.text }}>
                        Categories:
                      </span>
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: selectedCategory === category ? '#2A8B8A' : colors.background,
                            color: selectedCategory === category ? '#ffffff' : colors.textSecondary,
                            border: `2px solid ${selectedCategory === category ? '#2A8B8A' : colors.border}`
                          }}
                          onMouseEnter={(e) => {
                            if (selectedCategory !== category) {
                              e.currentTarget.style.backgroundColor = colors.hover;
                              e.currentTarget.style.borderColor = '#2A8B8A';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedCategory !== category) {
                              e.currentTarget.style.backgroundColor = colors.background;
                              e.currentTarget.style.borderColor = colors.border;
                            }
                          }}
                        >
                          {category === 'all' ? 'All Categories' : category}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Search Icon Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={handleSearchIconClick}
                      className="p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 group"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.hover;
                        e.currentTarget.style.borderColor = '#2A8B8A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.background;
                        e.currentTarget.style.borderColor = colors.border;
                      }}
                      title="Search integrations"
                    >
                      <svg 
                        className="h-6 w-6 transition-colors group-hover:scale-110" 
                        style={{ color: colors.textMuted }}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Filter Summary */}
                {selectedCategory !== 'all' && (
                  <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: colors.border }}>
                    <span className="text-sm font-medium" style={{ color: colors.textMuted }}>
                      Showing {filteredIntegrations.length} {selectedCategory} integration{filteredIntegrations.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="text-xs px-2 py-1 rounded-md hover:scale-105 transition-all"
                      style={{
                        backgroundColor: colors.hover,
                        color: colors.textSecondary
                      }}
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Search Results Info */}
            {isSearchActive && searchTerm && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: colors.text }}>
                    <span className="text-[#2A8B8A] font-bold">{filteredIntegrations.length}</span> integration{filteredIntegrations.length !== 1 ? 's' : ''} found for 
                    <span className="font-bold"> "{searchTerm}"</span>
                  </p>
                  {filteredIntegrations.length > 0 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-[#2A8B8A] text-white font-medium">
                      {Math.round((filteredIntegrations.length / integrationsList.length) * 100)}% match
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="rounded-xl border overflow-hidden" 
             style={{ 
               backgroundColor: colors.background,
               borderColor: colors.border
             }}>
          
          {filteredIntegrations.length > 0 ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="group p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer relative overflow-hidden"
                    style={{
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2A8B8A';
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(42, 139, 138, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border;
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Status indicator overlay */}
                    {integration.status === 'connected' && (
                      <div className="absolute top-0 right-0 w-0 h-0 border-l-[30px] border-l-transparent border-t-[30px] border-t-green-500">
                        <div className="absolute -top-7 -right-1 text-white text-xs font-bold transform rotate-45">
                          ✓
                        </div>
                      </div>
                    )}

                    {/* Integration Image */}
                    <div className="flex items-center justify-center mb-6">
                      <div className={`w-16 h-16 ${integration.color} rounded-xl flex items-center justify-center relative shadow-lg border-2`}
                           style={{ borderColor: colors.border }}>
                        <span className="text-white font-bold text-xl">
                          {integration.name.charAt(0)}
                        </span>
                        {/* Connected indicator */}
                        {integration.status === 'connected' && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Integration Name */}
                    <h3 className="text-xl font-bold text-center mb-3 group-hover:text-[#2A8B8A] transition-colors" 
                        style={{ color: colors.text }}>
                      {integration.name}
                    </h3>

                    {/* Integration Description */}
                    <p className="text-sm text-center mb-6 line-clamp-3 leading-relaxed" 
                       style={{ color: colors.textMuted }}>
                      {integration.description}
                    </p>

                    {/* Connected Details for Shopify */}
                    {integration.id === 'shopify' && integration.status === 'connected' && shopifyDetails && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 shadow-sm">
                        <div className="text-xs text-green-700 space-y-2">
                          {shopifyDetails.shop_domain && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">{shopifyDetails.shop_domain}</span>
                            </div>
                          )}
                          {shopifyDetails.connected_at && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Connected {new Date(shopifyDetails.connected_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Connected Details for WooCommerce */}
                    {integration.id === 'woocommerce' && integration.status === 'connected' && wooCommerceDetails && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 shadow-sm">
                        <div className="text-xs text-green-700 space-y-2">
                          {wooCommerceDetails.store_url && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                              </svg>
                              <span className="font-medium">{wooCommerceDetails.store_url}</span>
                            </div>
                          )}
                          {wooCommerceDetails.connected_at && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Connected {new Date(wooCommerceDetails.connected_at).toLocaleDateString()}</span>
                            </div>
                          )}
                          {wooCommerceDetails.webhook_id && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>Webhook ID: {wooCommerceDetails.webhook_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Category Badge and Action Button */}
                    <div className="flex items-center justify-between pt-4 border-t" 
                         style={{ borderColor: colors.border }}>
                      <span className="px-3 py-2 text-xs rounded-lg font-medium"
                            style={{
                              backgroundColor: colors.hover,
                              color: colors.textSecondary
                            }}>
                        {integration.category}
                      </span>

                      {/* Action Button */}
                      <div className="flex flex-col items-center gap-2">
                        {(integration.status === 'available' || integration.status === 'coming-soon') && (
                          <button
                            onClick={() => handleConnect(integration)}
                            className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-bold hover:scale-105 shadow-sm border-2 ${
                              integration.status === 'available'
                                ? 'bg-[#2A8B8A] text-white border-[#2A8B8A] hover:bg-[#238080]'
                                : 'bg-gray-400 text-white border-gray-400 cursor-not-allowed'
                            }`}
                            disabled={integration.status !== 'available'}
                          >
                            {integration.status === 'available' ? 'Connect' : 'Coming Soon'}
                          </button>
                        )}
                        {integration.status === 'connected' && (
                          <div className="flex flex-col items-center gap-2">
                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold border-2 border-green-200 shadow-sm">
                              Connected
                            </span>
                            {(integration.id === 'shopify' || integration.id === 'woocommerce') && (
                              <button
                                onClick={() => handleDisconnect(integration)}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium hover:scale-105 shadow-sm"
                              >
                                Disconnect
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* No Results */
            <div className="text-center py-20 px-6">
              <div className="mx-auto w-32 h-32 mb-8 rounded-2xl flex items-center justify-center shadow-lg"
                   style={{ backgroundColor: colors.backgroundSecondary }}>
                <svg className="w-16 h-16" style={{ color: colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
                {isSearchActive && searchTerm 
                  ? `No integrations found` 
                  : `No ${selectedCategory} integrations available`
                }
              </h3>
              <p className="text-lg mb-8 max-w-md mx-auto leading-relaxed" style={{ color: colors.textMuted }}>
                {isSearchActive && searchTerm 
                  ? `We couldn't find any integrations matching "${searchTerm}". Try different keywords or browse our categories.` 
                  : 'Explore other categories or search for specific integrations to find what you need.'
                }
              </p>
              {(isSearchActive || selectedCategory !== 'all') && (
                <div className="flex gap-4 justify-center">
                  {isSearchActive && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setShowSearchBar(false);
                      }}
                      className="px-8 py-4 rounded-xl border-2 transition-all font-bold hover:scale-105 shadow-sm"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.textSecondary
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.hover;
                        e.currentTarget.style.borderColor = '#2A8B8A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.background;
                        e.currentTarget.style.borderColor = colors.border;
                      }}
                    >
                      Clear search
                    </button>
                  )}
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#2A8B8A] to-[#1e6b6b] text-white transition-all font-bold hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      View all categories
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="rounded-lg p-4 border"
             style={{
               backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#dbeafe',
               borderColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#bfdbfe'
             }}>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5" 
                 style={{ color: darkMode ? '#60a5fa' : '#3b82f6' }} 
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium mb-1" 
                  style={{ color: darkMode ? '#93c5fd' : '#1e40af' }}>
                Need a custom integration?
              </h4>
              <p className="text-sm" 
                 style={{ color: darkMode ? '#60a5fa' : '#1d4ed8' }}>
                Contact our support team or use our REST API and webhooks to build custom integrations for your specific needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={6000}
      />

      {/* Integration Modal */}
      <IntegrationModal
        integration={selectedIntegration}
        isOpen={isModalOpen}
        onClose={closeModal}
      >
        {selectedIntegration?.id === 'shopify' && (
          <ShopifyIntegration
            onStatusChange={handleShopifyStatusChange}
            onDisconnectRequest={() => handleDisconnect(selectedIntegration)}
            onSuccessMessage={showInfo}
          />
        )}
        {selectedIntegration?.id === 'woocommerce' && (
          <WooCommerceIntegration
            onStatusChange={handleWooCommerceStatusChange}
            onDisconnectRequest={() => handleDisconnect(selectedIntegration)}
            onSuccessMessage={showInfo}
          />
        )}
      </IntegrationModal>

      {/* Disconnect Confirmation Modal */}
      <DisconnectModal
        isOpen={disconnectModalOpen}
        onClose={handleDisconnectCancel}
        onConfirm={handleDisconnectConfirm}
        integration={disconnectingIntegration}
        isLoading={disconnectLoading}
      />
    </ProtectedRoute>
  );
}
