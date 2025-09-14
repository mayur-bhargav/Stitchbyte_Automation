"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LuPlay, 
  LuPause, 
  LuPencil, 
  LuTrash2, 
  LuArrowLeft 
} from 'react-icons/lu';
import ProtectedRoute from "../../components/ProtectedRoute";
import { useUser } from "../../contexts/UserContext";
import { apiService } from "../../services/apiService";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const campaignResponse: any = await apiService.getCampaignDetails(campaignId);
      
      if (campaignResponse) {
        setCampaign(campaignResponse);
        
        if (campaignResponse.segments?.length > 0) {
          await loadSegments(campaignResponse.segments);
        }
      }
    } catch (err) {
      console.error("Error loading campaign details:", err);
      setError("Failed to load campaign details.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSegments = async (segmentIds: string[]) => {
    try {
      const segmentPromises = segmentIds.map((id: string) => 
        apiService.getSegments().catch(() => null)
      );
      
      const segmentResults = await Promise.all(segmentPromises);
      const validSegments = segmentResults.filter(Boolean);
      setSegments(validSegments);
    } catch (err) {
      console.error("Error loading segments:", err);
    }
  };

  // Campaign action handlers
  const handleStartCampaign = async () => {
    try {
      await apiService.startCampaign(campaignId);
      // Reload campaign data to get updated status
      await loadCampaignData();
    } catch (err) {
      console.error('Error starting campaign:', err);
      setError('Failed to start campaign. Please try again.');
    }
  };

  const handlePauseCampaign = async () => {
    try {
      await apiService.pauseCampaign(campaignId);
      // Reload campaign data to get updated status
      await loadCampaignData();
    } catch (err) {
      console.error('Error pausing campaign:', err);
      setError('Failed to pause campaign. Please try again.');
    }
  };

  const handleRestartCampaign = async () => {
    try {
      await apiService.startCampaign(campaignId);
      // Reload campaign data to get updated status
      await loadCampaignData();
    } catch (err) {
      console.error('Error restarting campaign:', err);
      setError('Failed to restart campaign. Please try again.');
    }
  };

  const handleEditCampaign = () => {
    // For now, show an alert. In the future, this could open an edit modal
    alert(`Editing "${campaign.name}" - Edit functionality will be implemented soon.`);
  };

  const handleDeleteCampaign = async () => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await apiService.deleteCampaign(campaignId);
      // Navigate back to campaigns list
      router.push('/campaigns');
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError('Failed to delete campaign. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A8B8A]"></div>
          <span className="ml-2 text-slate-600">Loading campaign details...</span>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !campaign) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Campaign Not Found</h2>
            <p className="text-slate-600 mb-4">{error || "The requested campaign could not be found."}</p>
            <Link 
              href="/campaigns"
              className="inline-flex items-center px-4 py-2 bg-[#2A8B8A] text-white rounded-lg hover:bg-[#2A8B8A]/90 transition-colors"
            >
              ← Back to Campaigns
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link 
                  href="/campaigns"
                  className="mr-4 p-2 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 text-slate-600 hover:text-slate-900"
                >
                  <LuArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{campaign.name}</h1>
                  <p className="text-slate-600 mt-1">
                    {campaign.description || "Campaign details and performance metrics"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  campaign.status?.toLowerCase() === 'running' ? 'bg-green-100 text-green-800' :
                  campaign.status?.toLowerCase() === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                  campaign.status?.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-800' :
                  campaign.status?.toLowerCase() === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-red-600 text-sm">{error}</div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Campaign Details Card */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-900">Campaign Details</h3>
                  <div className="flex items-center gap-2">
                    {/* Action buttons inline like campaigns table */}
                    {campaign.status?.toLowerCase() === 'draft' && (
                      <>
                        <button
                          onClick={handleStartCampaign}
                          className="text-green-600 hover:text-green-900"
                          title="Start Campaign"
                        >
                          <LuPlay className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleEditCampaign}
                          className="text-purple-600 hover:text-purple-900"
                          title="Edit Campaign"
                        >
                          <LuPencil className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {campaign.status?.toLowerCase() === 'running' && (
                      <button
                        onClick={handlePauseCampaign}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Pause Campaign"
                      >
                        <LuPause className="w-4 h-4" />
                      </button>
                    )}
                    {campaign.status?.toLowerCase() === 'paused' && (
                      <>
                        <button
                          onClick={handleRestartCampaign}
                          className="text-green-600 hover:text-green-900"
                          title="Restart Campaign"
                        >
                          <LuPlay className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleEditCampaign}
                          className="text-purple-600 hover:text-purple-900"
                          title="Edit Campaign"
                        >
                          <LuPencil className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleDeleteCampaign}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Campaign"
                    >
                      <LuTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Campaign Information Table */}
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Total Contacts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{campaign.name}</div>
                          <div className="text-sm text-slate-500">
                            {campaign.description || 'No description'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          campaign.status?.toLowerCase() === 'running' ? 'bg-green-100 text-green-800' :
                          campaign.status?.toLowerCase() === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          campaign.status?.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-800' :
                          campaign.status?.toLowerCase() === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {campaign.type?.charAt(0).toUpperCase() + campaign.type?.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {campaign.total_contacts || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Message Template */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-medium text-slate-900">Message Template</h3>
              </div>
              <div className="px-6 py-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">
                    {campaign.custom_message || campaign.message_template || campaign.messageTemplate || 'No message template configured'}
                  </p>
                </div>
                {campaign.template_id && (
                  <div className="mt-2 text-xs text-slate-500">
                    Template ID: {campaign.template_id}
                  </div>
                )}
              </div>
            </div>

            {/* Target Segments */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-medium text-slate-900">Target Segments</h3>
              </div>
              <div className="px-6 py-4">
                {campaign.segment_ids && campaign.segment_ids.length > 0 ? (
                  <div className="space-y-3">
                    {campaign.segment_ids.map((segmentId: string, index: number) => (
                      <div key={segmentId} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-slate-900">Segment {index + 1}</h4>
                          <p className="text-sm text-slate-600">ID: {segmentId}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-900">
                            {Math.floor(campaign.total_contacts / campaign.segment_ids.length)} contacts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No segments configured</p>
                )}
              </div>
            </div>

            {/* Campaign Metrics (if available) */}
            {(campaign.sent_count > 0 || campaign.delivered_count > 0) && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-medium text-slate-900">Campaign Metrics</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{campaign.sent_count || 0}</div>
                      <div className="text-sm text-slate-600">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{campaign.delivered_count || 0}</div>
                      <div className="text-sm text-slate-600">Delivered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{campaign.opened_count || 0}</div>
                      <div className="text-sm text-slate-600">Opened</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{campaign.replied_count || 0}</div>
                      <div className="text-sm text-slate-600">Replied</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
