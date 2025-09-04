"use client";

import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';

interface ExcelIntegrationProps {
  onStatusChange?: (connected: boolean) => void;
  onDisconnectRequest?: () => void;
  onSuccessMessage: (message: string) => void;
  initialStatus?: boolean;
}

interface ImportHistory {
  action: string;
  filename: string;
  total_rows: number;
  inserted_contacts?: number;
  duplicate_contacts?: number;
  created_at: string;
  status: string;
}

export default function ExcelIntegration({ 
  onStatusChange, 
  onDisconnectRequest, 
  onSuccessMessage,
  initialStatus 
}: ExcelIntegrationProps) {
  const [isConnected, setIsConnected] = useState(true); // Excel is always "connected"
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Excel integration is always considered "connected"
    const connected = typeof initialStatus !== 'undefined' ? initialStatus : true;
    setIsConnected(connected);
    onStatusChange?.(connected);
    fetchImportHistory();
  }, [onStatusChange, initialStatus]);

  const fetchImportHistory = async () => {
    try {
      const response = await apiService.get('/excel/import/history');
      if (response.success) {
        setImportHistory(response.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch import history:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      setAnalysisResult(null);
    }
  };

  const analyzeFile = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await apiService.postFormData('/excel/import/contacts/analyze', formData);
      
      if (response.success) {
        setAnalysisResult(response);
        onSuccessMessage('File analyzed successfully! Review the preview below.');
      } else {
        setError(response.detail || 'Failed to analyze file');
      }
    } catch (error: any) {
      console.error('File analysis failed:', error);
      setError(error?.response?.data?.detail || error?.message || 'Failed to analyze file');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const importContacts = async () => {
    if (!selectedFile || !analysisResult) return;

    setIsImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await apiService.postFormData('/excel/import/contacts/process', formData);
      
      if (response.success) {
        onSuccessMessage(`Successfully imported ${response.summary.new_contacts} contacts!`);
        setSelectedFile(null);
        setAnalysisResult(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchImportHistory();
      } else {
        setError(response.detail || 'Failed to import contacts');
      }
    } catch (error: any) {
      console.error('Contact import failed:', error);
      setError(error?.response?.data?.detail || error?.message || 'Failed to import contacts');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiService.baseURL}/excel/template/contacts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contacts_import_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        onSuccessMessage('Template downloaded successfully!');
      } else {
        throw new Error('Failed to download template');
      }
    } catch (error) {
      console.error('Template download failed:', error);
      setError('Failed to download template');
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      setIsExporting(true);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(`${apiService.baseURL}/excel/export/analytics?start_date=${startDate}&end_date=${endDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stitchbyte_analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        onSuccessMessage('Analytics exported successfully!');
        fetchImportHistory();
      } else {
        throw new Error('Failed to export analytics');
      }
    } catch (error) {
      console.error('Analytics export failed:', error);
      setError('Failed to export analytics');
    } finally {
      setIsExporting(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">E</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Microsoft Excel Integration
        </h2>
        <p className="text-gray-600">
          Import contacts from Excel sheets and export message analytics data
        </p>
      </div>

      {/* Main Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Contacts */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Import Contacts</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Upload Excel files to import contacts into your StitchByte account
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {selectedFile && !analysisResult && (
              <button
                onClick={analyzeFile}
                disabled={isAnalyzing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze File'}
              </button>
            )}

            <button
              onClick={downloadTemplate}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Downloading...' : 'Download Template'}
            </button>
          </div>
        </div>

        {/* Export Analytics */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Export Analytics</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Export your message analytics and campaign data to Excel format
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>• Messages overview</div>
              <div>• Campaign performance</div>
              <div>• Contact data</div>
              <div>• Delivery metrics</div>
            </div>

            <button
              onClick={exportAnalytics}
              disabled={isExporting}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export Analytics (Last 30 Days)'}
            </button>
          </div>
        </div>
      </div>

      {/* File Analysis Results */}
      {analysisResult && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">File Analysis Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{analysisResult.total_rows}</div>
              <div className="text-sm text-blue-700">Total Rows</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{analysisResult.validation.valid_rows}</div>
              <div className="text-sm text-green-700">Valid Contacts</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{analysisResult.validation.invalid_rows}</div>
              <div className="text-sm text-red-700">Invalid Rows</div>
            </div>
          </div>

          {analysisResult.validation.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {analysisResult.validation.errors.map((error: string, index: number) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {analysisResult.validation.warnings?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {analysisResult.validation.warnings.slice(0, 5).map((warning: string, index: number) => (
                  <li key={index}>• {warning}</li>
                ))}
                {analysisResult.validation.warnings.length > 5 && (
                  <li>• ... and {analysisResult.validation.warnings.length - 5} more warnings</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview Data */}
          {analysisResult.preview && analysisResult.preview.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Preview (First 5 rows):</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {analysisResult.columns.map((column: string) => (
                        <th key={column} className="text-left py-2 px-3 font-medium text-gray-700">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.preview.slice(0, 5).map((row: any, index: number) => (
                      <tr key={index} className="border-b border-gray-100">
                        {analysisResult.columns.map((column: string) => (
                          <td key={column} className="py-2 px-3 text-gray-600">
                            {row[column] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {analysisResult.validation.valid && analysisResult.validation.valid_rows > 0 && (
            <button
              onClick={importContacts}
              disabled={isImporting}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : `Import ${analysisResult.validation.valid_rows} Contacts`}
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Import History */}
      {importHistory.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {importHistory.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.action === 'excel_import' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {item.action === 'excel_import' ? (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.action === 'excel_import' ? 'Contact Import' : 'Analytics Export'}
                    </p>
                    <p className="text-xs text-gray-500">{item.filename}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'success' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Excel Integration Features:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
              <span>Import contacts from .xlsx and .xls files</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
              <span>Automatic data validation and cleaning</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
              <span>Duplicate contact detection</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
              <span>Export comprehensive analytics reports</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
              <span>Multiple sheet support</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
              <span>Flexible column mapping</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-100">
        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Your Excel files are processed securely and are not stored on our servers.
      </div>
    </div>
  );
}
