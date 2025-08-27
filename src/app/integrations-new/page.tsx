"use client";

import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';

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
    status: 'coming-soon',
    color: 'bg-orange-500'
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
    status: 'coming-soon',
    color: 'bg-green-600'
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

  // Analytics
  {
    id: 'analytics',
    name: 'Google Analytics',
    description: 'Track message campaign performance and user engagement analytics.',
    image: '/integrations/analytics.svg',
    category: 'Analytics',
    status: 'coming-soon',
    color: 'bg-yellow-500'
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Advanced analytics integration for tracking user behavior and events.',
    image: '/integrations/mixpanel.svg',
    category: 'Analytics',
    status: 'coming-soon',
    color: 'bg-purple-600'
  },
  {
    id: 'segment',
    name: 'Segment',
    description: 'Centralize customer data from multiple sources for better targeting.',
    image: '/integrations/segment.svg',
    category: 'Analytics',
    status: 'coming-soon',
    color: 'bg-green-500'
  }
];

export default function IntegrationsPage() {
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = ['all', 'E-commerce', 'CRM', 'Productivity', 'Development', 'Analytics'];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnect = (integration: Integration) => {
    // Placeholder for integration connection logic
    alert(`Connecting to ${integration.name}... (Feature coming soon!)`);
  };

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="border border-gray-200 p-8 rounded-lg bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#2A8B8A] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
              <p className="text-gray-600">Connect StitchByte with your favorite tools and platforms</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-[#2A8B8A] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
            >
              {/* Integration Image */}
              <div className="flex items-center justify-center mb-4">
                <div className={`w-16 h-16 ${integration.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-xl">
                    {integration.name.charAt(0)}
                  </span>
                </div>
              </div>

              {/* Integration Name */}
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                {integration.name}
              </h3>

              {/* Integration Description */}
              <p className="text-gray-600 text-sm text-center mb-4 line-clamp-3">
                {integration.description}
              </p>

              {/* Category Badge */}
              <div className="flex justify-center mb-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {integration.category}
                </span>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                {integration.status === 'available' && (
                  <button
                    onClick={() => handleConnect(integration)}
                    className="px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#238080] transition-colors text-sm font-medium"
                  >
                    Connect
                  </button>
                )}
                {integration.status === 'coming-soon' && (
                  <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                    Coming Soon
                  </span>
                )}
                {integration.status === 'connected' && (
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                    Connected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Footer Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Need a custom integration?</h4>
              <p className="text-sm text-blue-700">
                Contact our support team or use our REST API and webhooks to build custom integrations for your specific needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
