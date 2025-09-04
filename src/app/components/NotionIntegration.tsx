"use client";

import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { apiService } from '../services/apiService';
import Link from 'next/link';

// --- Re-usable Icon Components ---
const IconNotion = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.9999 3.75L4.09082 20.25H9.32832L10.3908 17.55H17.6083L18.6708 20.25H23.9083L16.0112 3.75H11.9999ZM11.4137 15.3L14.0012 8.38125L16.5887 15.3H11.4137Z" fill="currentColor"/>
  </svg>
);

const IconCheckCircle = () => (
  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const IconXCircle = () => (
    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

const IconDatabase = () => (
  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7a8 8 0 0116 0" />
  </svg>
);

const IconContacts = () => (
    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const IconProjects = () => (
    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const IconExternalLink = () => (
    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

// --- Prop and Type Interfaces ---
interface NotionIntegrationProps {
  onSuccessMessage: (message: string) => void;
  onDisconnectRequest?: () => void;
  onStatusChange?: (connected: boolean) => void;
  initialStatus?: boolean;
}

interface NotionStatus {
  connected: boolean;
  workspace_name?: string;
  workspace_id?: string;
  connected_at?: string;
  databases?: NotionDatabase[];
  databases_count?: number;
  local_contacts_count?: number;
}

interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  type?: 'contacts' | 'projects' | 'other';
}

interface SyncHistory {
  id?: string;
  action: string;
  database_type: string;
  database_name?: string;
  sync_type?: string;
  entries_synced?: number;
  created_at: string;
  timestamp?: string;
  status: 'completed' | 'failed' | 'in_progress';
  error?: string;
}

export default function NotionIntegration({ onSuccessMessage, onDisconnectRequest, onStatusChange, initialStatus }: NotionIntegrationProps) {
  const { user, isLoading: userLoading, isAuthenticated } = useUser();
  const [status, setStatus] = useState<NotionStatus>({ connected: false });
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [isLoading, setIsLoading] = useState(typeof initialStatus === 'undefined');
  const [error, setError] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    if (!userLoading) {
      // Use initialStatus if provided, otherwise fetch from API
      if (typeof initialStatus !== 'undefined') {
        setStatus({ connected: initialStatus });
        if (initialStatus && isAuthenticated) {
          // Only load additional data if connected
          loadDatabases();
          loadSyncHistory();
        }
      } else {
        // Fallback to API call if no initialStatus provided
        loadNotionStatus();
        if (isAuthenticated) {
          loadSyncHistory();
        }
      }
    }
  }, [isAuthenticated, userLoading, onStatusChange, initialStatus]);

  const setActionLoadingState = (action: string, loading: boolean) => {
    setActionLoading(prev => ({ ...prev, [action]: loading }));
  };

  const loadNotionStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = isAuthenticated ? '/notion/status' : '/notion/test';
      const response = await apiService.get(endpoint);
      
      if (endpoint === '/notion/test') {
        setStatus({ connected: false });
        onStatusChange?.(false);
        return;
      }
      
      setStatus(response);
      onStatusChange?.(response.connected);
      if (response.connected) {
        await loadDatabases();
      }
    } catch (err: any) {
      handleApiError(err, 'load Notion status', { connected: false });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDatabases = async () => {
    try {
      const response = await apiService.get('/notion/databases');
      setDatabases(response.databases || []);
    } catch (err: any) {
      console.error('Error loading databases:', err);
      setError('Could not load your Notion databases.');
    }
  };

  const loadSyncHistory = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await apiService.get('/notion/sync/history');
      setSyncHistory(response.history || []);
    } catch (err: any) {
      console.error('Error loading sync history:', err);
    }
  };

  const handleApiError = (err: any, context: string, fallbackState: any = {}) => {
    console.error(`Failed to ${context}:`, err);
    if (err.message.includes('Not Found') || err.message.includes('404')) {
        setStatus(fallbackState);
        onStatusChange?.(fallbackState.connected || false);
        console.log('Notion backend endpoints not yet implemented');
        setError(`Feature not available: The backend for this action is still under development.`);
    } else {
        setError(`Failed to ${context}: ${err.message}`);
        setStatus(fallbackState);
        onStatusChange?.(fallbackState.connected || false);
    }
  }

  const handleConnect = () => setShowTokenModal(true);

  const handleTokenSubmit = async () => {
    if (!tokenInput.trim()) {
        setError('Please enter a valid token');
        return;
    }
    setActionLoadingState('connect', true);
    setError(null);
    try {
      await apiService.post('/notion/save-token', { access_token: tokenInput.trim() });
      await loadNotionStatus();
      onSuccessMessage('Notion connected successfully!');
      onStatusChange?.(true);
      setShowTokenModal(false);
      setTokenInput('');
    } catch (err: any) {
      handleApiError(err, 'connect to Notion');
    } finally {
      setActionLoadingState('connect', false);
    }
  };
  
  const handleModalClose = () => {
    setShowTokenModal(false);
    setTokenInput('');
    setActionLoadingState('connect', false);
  };
  
  const handleCreateDatabase = async (type: 'contacts' | 'projects') => {
    const actionKey = `create${type.charAt(0).toUpperCase() + type.slice(1)}`;
    setActionLoadingState(actionKey, true);
    setError(null);
    try {
        await apiService.post(`/notion/databases/${type}`, { title: `Stitchbyte ${type.charAt(0).toUpperCase() + type.slice(1)}` });
        await loadDatabases();
        onSuccessMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} database created successfully!`);
    } catch (err: any) {
        handleApiError(err, `create ${type} database`);
    } finally {
        setActionLoadingState(actionKey, false);
    }
  };

  const handleManualSync = async () => {
    setActionLoadingState('sync', true);
    setError(null);
    try {
        await apiService.post('/notion/sync/manual');
        await loadSyncHistory();
        onSuccessMessage('Manual sync initiated successfully!');
    } catch (err: any) {
        handleApiError(err, 'perform manual sync');
    } finally {
        setActionLoadingState('sync', false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect Notion? This will remove all integration data.')) {
        setActionLoadingState('disconnect', true);
        setError(null);
        try {
            await apiService.delete('/notion/disconnect');
            setStatus({ connected: false });
            setDatabases([]);
            setSyncHistory([]);
            onSuccessMessage('Notion disconnected successfully!');
            onStatusChange?.(false);
        } catch (err: any) {
            handleApiError(err, 'disconnect Notion');
        } finally {
            setActionLoadingState('disconnect', false);
        }
    }
  };

  const getDatabaseIcon = (db: NotionDatabase) => {
    if (db.title.toLowerCase().includes('contacts')) return <IconContacts />;
    if (db.title.toLowerCase().includes('projects')) return <IconProjects />;
    return <IconDatabase />;
  };

  const renderLoadingState = (title: string, message: string) => (
    <div className="p-8 text-center">
      <div className="w-10 h-10 mx-auto mb-4 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  );

  if (userLoading) return renderLoadingState('Loading...', 'Checking authentication status...');
  
  // --- RESTORED: Unauthenticated view ---
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-6">
            Please sign in to your account to access Notion integration features.
          </p>
          <div className="space-y-3">
            <Link href="/auth/signin" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              Sign In
            </Link>
            <p className="text-xs text-gray-400">
              Don't have an account? <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-500">Sign up here</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoading) return renderLoadingState('Loading...', 'Fetching Notion integration status...');

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-full mx-auto space-y-8">
        {/* Token Input Modal */}
        {showTokenModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 mx-4 shadow-2xl transform transition-all" style={{ width: 'calc(100vw - 2rem)', maxWidth: 'none' }}>
              <div className='flex items-center space-x-3 mb-6'>
                <div className='bg-gray-100 p-2 rounded-lg'><IconNotion /></div>
                <h3 className="text-xl font-bold text-gray-900">Connect to Notion</h3>
              </div>
              <div className="mb-6 space-y-4 text-sm text-gray-600">
                <p>Follow these steps to get your integration token:</p>
                <ol className="list-decimal list-inside space-y-2 pl-1">
                  <li>Go to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">My Integrations</a>.</li>
                  <li>Click "New integration" and give it a name.</li>
                  <li>Copy the "Internal Integration Token" provided.</li>
                  <li>Paste the token below.</li>
                </ol>
              </div>
              <div>
                <label htmlFor="token-input" className="block text-sm font-medium text-gray-700 mb-1">Integration Token</label>
                <input id="token-input" type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="secret_..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button onClick={handleModalClose} disabled={actionLoading.connect} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200">Cancel</button>
                <button onClick={handleTokenSubmit} disabled={actionLoading.connect || !tokenInput.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50">
                  {actionLoading.connect ? 'Connecting...' : 'Connect Workspace'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <header className="flex items-center space-x-4">
          <div className="p-2 bg-white rounded-lg shadow-sm"><IconNotion /></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notion Integration</h1>
            <p className="text-gray-600 mt-1">Sync and manage your workspace contacts and projects seamlessly.</p>
          </div>
        </header>
        
        {/* --- RESTORED: Error Display --- */}
        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow" role="alert">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold">An error occurred</p>
                        <p>{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="p-1 text-red-600 hover:bg-red-200 rounded-full">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
        )}

        {/* --- Main Dashboard Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Status & Actions */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Connection Status</h2>
              {status.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center text-green-600 font-medium"><IconCheckCircle /> Connected</div>
                  <dl className="text-sm space-y-2 text-gray-600">
                    <div><dt className="font-medium text-gray-800">Workspace</dt><dd>{status.workspace_name || 'N/A'}</dd></div>
                    <div><dt className="font-medium text-gray-800">Local Contacts</dt><dd>{status.local_contacts_count || 0}</dd></div>
                  </dl>
                  <button onClick={handleDisconnect} disabled={actionLoading.disconnect} className="w-full mt-2 text-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50">{actionLoading.disconnect ? 'Disconnecting...' : 'Disconnect'}</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-red-600 font-medium"><IconXCircle /> Not Connected</div>
                  <p className="text-sm text-gray-600">Connect your workspace to begin syncing your data.</p>
                  <button onClick={handleConnect} disabled={actionLoading.connect} className="w-full mt-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{actionLoading.connect ? 'Connecting...' : 'Connect to Notion'}</button>
                </div>
              )}
            </div>
            {status.connected && (
              <div className="bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Sync Management</h2>
                <div className="flex flex-col space-y-3">
                  <button onClick={handleManualSync} disabled={actionLoading.sync} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">{actionLoading.sync ? 'Syncing...' : 'Run Manual Sync'}</button>
                  <button onClick={loadSyncHistory} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Refresh History</button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Databases & History */}
          <div className="lg:col-span-2 space-y-8">
            {status.connected && (
              <div className="bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Database Management</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <button onClick={() => handleCreateDatabase('contacts')} disabled={actionLoading.createContacts} className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"><IconContacts /><span>{actionLoading.createContacts ? 'Creating...' : 'Create Contacts DB'}</span></button>
                  <button onClick={() => handleCreateDatabase('projects')} disabled={actionLoading.createProjects} className="flex items-center justify-center space-x-2 bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 disabled:opacity-50"><IconProjects /><span>{actionLoading.createProjects ? 'Creating...' : 'Create Projects DB'}</span></button>
                </div>
                
                <h3 className="text-lg font-medium mb-3 text-gray-700">Available Databases ({databases.length})</h3>
                {databases.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg"><IconDatabase /><p className="mt-2 text-gray-500">No databases found or shared.</p><p className="text-xs text-gray-400 mt-1">Share a database with the integration in Notion to see it here.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {databases.map((db) => (
                      <div key={db.id} className="group bg-slate-50 border border-slate-200 rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:border-indigo-300">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">{getDatabaseIcon(db)}<h4 className="font-semibold text-gray-800 group-hover:text-indigo-600">{db.title}</h4></div>
                          <a href={db.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity"><IconExternalLink /></a>
                        </div>
                        <div className="mt-4 text-xs text-gray-500"><p>Last edited: {new Date(db.last_edited_time).toLocaleDateString()}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* --- RESTORED: Sync History Display --- */}
            {status.connected && (
              <div className="bg-white shadow-lg rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Sync History</h2>
                {syncHistory.length === 0 ? (
                  <p className="text-gray-500 italic">No sync history available.</p>
                ) : (
                  <div className="space-y-3">
                    {syncHistory.slice(0, 5).map((sync, index) => (
                      <div key={sync.id || index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-medium text-gray-800">{sync.database_name || sync.action}</p>
                            <p className="text-sm text-gray-600">Type: {sync.sync_type || sync.database_type}</p>
                            {sync.error && <p className="text-sm text-red-600">Error: {sync.error}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              sync.status === 'completed' ? 'bg-green-100 text-green-800' : sync.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>{sync.status}</span>
                            <p className="text-xs text-gray-500 mt-1">{new Date(sync.timestamp || sync.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}