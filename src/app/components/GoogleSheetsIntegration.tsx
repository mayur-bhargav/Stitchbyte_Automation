"use client";

import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface GoogleSheetsIntegrationProps {
  onStatusChange?: (connected: boolean) => void;
  onDisconnectRequest?: () => void;
  onSuccessMessage: (message: string) => void;
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
}

interface IntegrationStatus {
  connected: boolean;
  spreadsheet_id?: string;
  spreadsheet_url?: string;
  spreadsheet_title?: string;
  sync_enabled?: boolean;
  last_sync?: string;
  created_at?: string;
  is_active?: boolean;
}

export default function GoogleSheetsIntegration({ 
  onStatusChange, 
  onDisconnectRequest, 
  onSuccessMessage 
}: GoogleSheetsIntegrationProps) {
  const [status, setStatus] = useState<IntegrationStatus>({ connected: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncType, setSyncType] = useState<'to-sheets' | 'from-sheets' | 'bidirectional'>('bidirectional');

  useEffect(() => {
    checkConnectionStatus();
    fetchSyncHistory();

    // Listen for retry messages from error page
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.action === 'retry-connection') {
        connectGoogleSheets();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    onStatusChange?.(status.connected);
  }, [status.connected, onStatusChange]);

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/google-sheets/status');
      setStatus(response);
      setError(null);
    } catch (error: any) {
      console.error('Failed to check Google Sheets status:', error);
      setStatus({ connected: false });
      setError('Failed to check connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSyncHistory = async () => {
    try {
      const response = await apiService.get('/google-sheets/sync/history');
      setSyncHistory(response.history || []);
    } catch (error) {
      console.error('Failed to fetch sync history:', error);
    }
  };

  const connectGoogleSheets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.get('/google-sheets/connect');
      
      if (response.auth_url) {
        // Open OAuth popup
        const popup = window.open(
          response.auth_url,
          'google-sheets-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check connection status after popup closes
            setTimeout(() => {
              checkConnectionStatus();
              fetchSyncHistory();
            }, 1000);
          }
        }, 1000);

        // Set timeout to close popup if it takes too long
        setTimeout(() => {
          if (popup && !popup.closed) {
            popup.close();
            clearInterval(checkClosed);
            setError('Connection timeout. Please try again.');
          }
        }, 300000); // 5 minutes timeout
      }
    } catch (error: any) {
      console.error('Google Sheets connection failed:', error);
      setError(error.message || 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const performSync = async (type: 'to-sheets' | 'from-sheets' | 'bidirectional') => {
    try {
      setIsSyncing(true);
      setError(null);
      
      const endpoint = `/google-sheets/sync/${type}`;
      const response = await apiService.post(endpoint, {});
      
      if (response.success) {
        let message = '';
        if (type === 'to-sheets') {
          message = `Successfully synced ${response.contacts_synced} contacts to Google Sheets`;
        } else if (type === 'from-sheets') {
          message = `Successfully synced contacts from Google Sheets (${response.new_contacts} new, ${response.updated_contacts} updated)`;
        } else {
          message = 'Bidirectional sync completed successfully';
        }
        
        onSuccessMessage(message);
        await checkConnectionStatus();
        await fetchSyncHistory();
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      setError(error.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await apiService.delete('/google-sheets/disconnect');
      
      setStatus({ connected: false });
      setSyncHistory([]);
      onSuccessMessage('Google Sheets integration disconnected successfully');
      
      if (onDisconnectRequest) {
        onDisconnectRequest();
      }
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
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading && !status.connected) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connect Google Sheets
          </h3>
          <p className="text-gray-500 mb-6">
            Sync your contacts with Google Sheets for easy management and collaboration
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <button
            onClick={connectGoogleSheets}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                Connect Google Sheets
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Google Sheets Connected</h3>
            <p className="text-sm text-gray-500">
              Connected to: {status.spreadsheet_title}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
            <button
              onClick={disconnect}
              disabled={isLoading}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Disconnect
            </button>
          </div>
        </div>
        
        {status.spreadsheet_url && (
          <div className="mt-2">
            <a
              href={status.spreadsheet_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
              </svg>
              Open in Google Sheets
            </a>
          </div>
        )}
        
        {status.last_sync && (
          <p className="text-xs text-gray-500 mt-1">
            Last synced: {formatDate(status.last_sync)}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Sync Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Sync Options</h4>
        
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => performSync('bidirectional')}
            disabled={isSyncing}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
        
        <div className="mt-3 text-xs text-gray-600">
          <p><strong>Bidirectional:</strong> Sync both ways (recommended)</p>
          <p><strong>To Sheets:</strong> Push your contacts to Google Sheets</p>
          <p><strong>From Sheets:</strong> Pull contacts from Google Sheets</p>
        </div>
      </div>

      {/* Sync History */}
      <div className="bg-white">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Sync History</h4>
        
        {syncHistory.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No sync history available</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {syncHistory.slice(0, 10).map((log, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {log.action === 'sync_to_sheets' ? 'To Sheets' : 
                       log.action === 'sync_from_sheets' ? 'From Sheets' : 
                       log.action === 'disconnect' ? 'Disconnected' : log.action}
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
                    {log.direction === 'sheets_to_database' ? (
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
    </div>
  );
}
