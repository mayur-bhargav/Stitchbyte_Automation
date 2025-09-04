"use client";

import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface IntegrationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: {
    id: string;
    name: string;
    status: string;
  } | null;
}

interface SyncHistory {
  action: string;
  direction?: string;
  contacts_synced?: number;
  new_contacts?: number;
  updated_contacts?: number;
  created_at: string;
  status: string;
  error?: string;
  shop_domain?: string;
  store_url?: string;
  spreadsheet_id?: string;
}

interface ConnectionDetails {
  connected: boolean;
  shop_domain?: string;
  store_url?: string;
  spreadsheet_title?: string;
  spreadsheet_url?: string;
  connected_at?: string;
  created_at?: string;
  last_sync?: string;
  webhook_id?: string;
  sync_enabled?: boolean;
  is_active?: boolean;
}

export default function IntegrationDetailsModal({
  isOpen,
  onClose,
  integration
}: IntegrationDetailsModalProps) {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncType, setSyncType] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && integration) {
      fetchConnectionDetails();
      fetchSyncHistory();
    }
  }, [isOpen, integration]);

  const fetchConnectionDetails = async () => {
    if (!integration) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = '';
      switch (integration.id) {
        case 'shopify':
          endpoint = '/connectors/shopify/status';
          break;
        case 'woocommerce':
          endpoint = '/connectors/woocommerce/status';
          break;
        case 'magento':
          endpoint = '/connectors/magento/status';
          break;
        case 'sheets':
          endpoint = '/google-sheets/status';
          break;
        case 'notion':
          endpoint = '/notion/status';
          break;
        default:
          return;
      }
      
      const response = await apiService.get(endpoint);
      setConnectionDetails(response);
    } catch (error: any) {
      console.error('Failed to fetch connection details:', error);
      setError('Failed to load connection details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSyncHistory = async () => {
    if (!integration) return;
    
    try {
      let endpoint = '';
      switch (integration.id) {
        case 'shopify':
          endpoint = '/connectors/shopify/sync/history';
          break;
        case 'woocommerce':
          endpoint = '/connectors/woocommerce/sync/history';
          break;
        case 'magento':
          endpoint = '/connectors/magento/sync/history';
          break;
        case 'sheets':
          endpoint = '/google-sheets/sync/history';
          break;
        case 'notion':
          endpoint = '/notion/sync/history';
          break;
        default:
          return;
      }
      
      const response = await apiService.get(endpoint);
      setSyncHistory(response.history || []);
    } catch (error) {
      console.error('Failed to fetch sync history:', error);
      // Don't show error for history, just leave it empty
    }
  };

  const performSync = async (type: string) => {
    if (!integration) return;
    
    try {
      setIsSyncing(true);
      setSyncType(type);
      setError(null);
      
      let endpoint = '';
      let payload: any = {};
      
      switch (integration.id) {
        case 'shopify':
          endpoint = '/connectors/shopify/sync';
          payload = { type };
          break;
        case 'woocommerce':
          endpoint = '/connectors/woocommerce/sync';
          payload = { type };
          break;
        case 'magento':
          endpoint = '/connectors/magento/sync';
          payload = { type };
          break;
        case 'sheets':
          if (type === 'bidirectional') {
            endpoint = '/google-sheets/sync/bidirectional';
          } else if (type === 'to-sheets') {
            endpoint = '/google-sheets/sync/to-sheets';
          } else if (type === 'from-sheets') {
            endpoint = '/google-sheets/sync/from-sheets';
          }
          break;
        case 'notion':
          if (type === 'sync-contacts-to-local') {
            endpoint = '/notion/sync/contacts-to-local';
          } else if (type === 'sync-projects-to-local') {
            endpoint = '/notion/sync/projects-to-local';
          } else if (type === 'add-sample-contact') {
            endpoint = '/notion/add-contact';
          } else if (type === 'add-sample-project') {
            endpoint = '/notion/add-project';
          }
          break;
        default:
          return;
      }
      
      const response = await apiService.post(endpoint, payload);
      
      // Refresh data after sync
      await fetchConnectionDetails();
      await fetchSyncHistory();
      
    } catch (error: any) {
      console.error('Sync failed:', error);
      setError(error.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
      setSyncType(null);
    }
  };

  const testConnection = async () => {
    if (!integration) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = '';
      switch (integration.id) {
        case 'shopify':
          endpoint = '/connectors/shopify/test';
          break;
        case 'woocommerce':
          endpoint = '/connectors/woocommerce/test';
          break;
        case 'magento':
          endpoint = '/connectors/magento/test';
          break;
        case 'sheets':
          endpoint = '/google-sheets/test';
          break;
        case 'notion':
          endpoint = '/notion/test';
          break;
        default:
          return;
      }
      
      await apiService.post(endpoint);
      
      // Refresh connection details
      await fetchConnectionDetails();
      
    } catch (error: any) {
      console.error('Test connection failed:', error);
      setError(error.message || 'Test connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    if (!integration) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let endpoint = '';
      switch (integration.id) {
        case 'shopify':
          endpoint = '/connectors/shopify/disconnect';
          break;
        case 'woocommerce':
          endpoint = '/connectors/woocommerce/disconnect';
          break;
        case 'magento':
          endpoint = '/connectors/magento/disconnect';
          break;
        case 'sheets':
          endpoint = '/google-sheets/disconnect';
          break;
        case 'notion':
          endpoint = '/notion/disconnect';
          break;
        default:
          return;
      }
      
      await apiService.delete(endpoint);
      
      // Refresh connection details
      await fetchConnectionDetails();
      
    } catch (error: any) {
      console.error('Disconnect failed:', error);
      setError(error.message || 'Disconnect failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActionDisplayName = (action: string) => {
    switch (action) {
      case 'sync_to_sheets':
      case 'export_contacts':
        return 'To Sheets';
      case 'sync_from_sheets':
      case 'import_contacts':
        return 'From Sheets';
      case 'order_sync':
        return 'Order Sync';
      case 'customer_sync':
        return 'Customer Sync';
      case 'product_sync':
        return 'Product Sync';
      case 'webhook_received':
        return 'Webhook Event';
      case 'disconnect':
        return 'Disconnected';
      case 'connect':
        return 'Connected';
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (!isOpen || !integration) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header - matching IntegrationModal style */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {integration.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{integration.name}</h2>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                Integration Details
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Connection Details */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Connection Details</h4>
                
                {connectionDetails ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        connectionDetails.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {connectionDetails.connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    
                    {connectionDetails.connected_at && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Connected:</span>
                        <span className="text-sm text-gray-900">{formatDate(connectionDetails.connected_at)}</span>
                      </div>
                    )}
                    
                    {connectionDetails.last_sync && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Last synced:</span>
                        <span className="text-sm text-gray-900">{formatDate(connectionDetails.last_sync)}</span>
                      </div>
                    )}
                    
                    {connectionDetails.shop_domain && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Shop:</span>
                        <span className="text-sm text-gray-900">{connectionDetails.shop_domain}</span>
                      </div>
                    )}
                    
                    {connectionDetails.store_url && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Store:</span>
                        <span className="text-sm text-gray-900">{connectionDetails.store_url}</span>
                      </div>
                    )}
                    
                    {connectionDetails.spreadsheet_title && (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Spreadsheet:</span>
                          <span className="text-sm text-gray-900">{connectionDetails.spreadsheet_title}</span>
                        </div>
                        {connectionDetails.spreadsheet_url && (
                          <a
                            href={connectionDetails.spreadsheet_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                            </svg>
                            Open in Google Sheets
                          </a>
                        )}
                      </div>
                    )}
                    
                    {connectionDetails.webhook_id && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Webhook ID:</span>
                        <span className="text-sm text-gray-900 font-mono">{connectionDetails.webhook_id}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No connection details available</p>
                )}
              </div>

              {/* Sync Controls - only show if connected */}
              {connectionDetails?.connected && (
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Sync Controls</h4>
                  
                  <div className="space-y-3">
                    {/* For Google Sheets - show all sync options */}
                    {integration.id === 'sheets' && (
                      <>
                        <button
                          onClick={() => performSync('bidirectional')}
                          disabled={isSyncing}
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSyncing && syncType === 'bidirectional' ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Syncing...
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                                <path d="M12,20V22A10,10 0 0,1 2,12H4A8,8 0 0,0 12,20Z" />
                                <path d="M22,12A10,10 0 0,1 12,22V20A8,8 0 0,0 20,12H22Z" />
                                <path d="M22,12A10,10 0 0,0 12,2V4A8,8 0 0,1 20,12H22Z" />
                              </svg>
                              Bidirectional Sync
                            </>
                          )}
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => performSync('to-sheets')}
                            disabled={isSyncing}
                            className="flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSyncing && syncType === 'to-sheets' ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                Syncing...
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" />
                                </svg>
                                To Sheets
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => performSync('from-sheets')}
                            disabled={isSyncing}
                            className="flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSyncing && syncType === 'from-sheets' ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                Syncing...
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M14,12L10,8V11H2V13H10V16M20,18V6C20,4.89 19.1,4 18,4H6A2,2 0 0,0 4,6V9H6V6H18V18H6V15H4V18A2,2 0 0,0 6,20H18A2,2 0 0,0 20,18Z" />
                                </svg>
                                From Sheets
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-600 space-y-1">
                          <p><strong>Bidirectional:</strong> Sync both ways (recommended)</p>
                          <p><strong>To Sheets:</strong> Push your contacts to Google Sheets</p>
                          <p><strong>From Sheets:</strong> Pull contacts from Google Sheets</p>
                        </div>
                      </>
                    )}
                    
                    {/* For E-commerce platforms - show sync and test options */}
                    {(integration.id === 'shopify' || integration.id === 'woocommerce' || integration.id === 'magento') && (
                      <>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => performSync('customers')}
                            disabled={isSyncing}
                            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSyncing && syncType === 'customers' ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Syncing...
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M16,4C18.11,4 20,5.89 20,8A4,4 0 0,1 16,12A4,4 0 0,1 12,8A4,4 0 0,1 16,4M16,14C20.42,14 24,15.79 24,18V20H8V18C8,15.79 11.58,14 16,14Z" />
                                </svg>
                                Sync Customers
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => performSync('orders')}
                            disabled={isSyncing}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSyncing && syncType === 'orders' ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                Syncing...
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19,7H18V6A2,2 0 0,0 16,4H8A2,2 0 0,0 6,6V7H5A1,1 0 0,0 4,8V19A3,3 0 0,0 7,22H17A3,3 0 0,0 20,19V8A1,1 0 0,0 19,7M8,6H16V7H8V6M18,19A1,1 0 0,1 17,20H7A1,1 0 0,1 6,19V9H8V11H10V9H14V11H16V9H18V19Z" />
                                </svg>
                                Sync Orders
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-600 space-y-1">
                          <p><strong>Sync Customers:</strong> Import customer data and contacts</p>
                          <p><strong>Sync Orders:</strong> Import recent orders and update order status</p>
                        </div>
                      </>
                    )}
                    
                    {/* Universal controls for all connected integrations */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={testConnection}
                          disabled={isLoading || isSyncing}
                          className="flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Testing...
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z" />
                              </svg>
                              Test Connection
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={disconnect}
                          disabled={isLoading || isSyncing}
                          className="flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                              Disconnecting...
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
                              </svg>
                              Disconnect
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sync History */}
              <div className="bg-white">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity History</h4>
                
                {syncHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No activity history available</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {syncHistory.slice(0, 10).map((log, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {getActionDisplayName(log.action)}
                            </span>
                            <span className={`text-xs font-medium ${getSyncStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        
                        {log.contacts_synced !== undefined && (
                          <p className="text-xs text-gray-600">
                            {log.direction === 'sheets_to_database' || log.direction === 'platform_to_database' ? (
                              <>
                                Processed {log.contacts_synced} contacts
                                {log.new_contacts !== undefined && ` (${log.new_contacts} new, ${log.updated_contacts} updated)`}
                              </>
                            ) : (
                              `Synced ${log.contacts_synced} contacts`
                            )}
                          </p>
                        )}
                        
                        {log.error && (
                          <p className="text-xs text-red-600 mt-1">Error: {log.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}