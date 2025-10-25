"use client";
import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import { useUser } from "../contexts/UserContext";

export default function AnalyticsPage() {
  const { user } = useUser();
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    messagesSent: 0,
    messagesDelivered: 0,
    messagesRead: 0,
    messagesFailed: 0,
    automationsTriggered: 0,
    activeWorkflows: 0,
    responseRate: 0,
    averageResponseTime: 0,
    totalContacts: 0,
    activeContacts: 0,
    totalTemplates: 0,
    activeCampaigns: 0,
    totalCampaigns: 0
  });
  const [templatePerformance, setTemplatePerformance] = useState<any[]>([]);
  const [messageTimeline, setMessageTimeline] = useState<any[]>([]);
  const [campaignStats, setCampaignStats] = useState<any[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<any[]>([]);
  const [topContacts, setTopContacts] = useState<any[]>([]);
  const [automationBreakdown, setAutomationBreakdown] = useState<any[]>([]);
  const [responseTimeBreakdown, setResponseTimeBreakdown] = useState({
    fast: 0,    // ≤ 1 hour
    medium: 0,  // 1-4 hours
    slow: 0     // > 4 hours
  });
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all relevant data from backend
      const [
        logsResponse,
        contactsResponse,
        templatesResponse,
        campaignsResponse,
        automationsResponse
      ] = await Promise.allSettled([
        apiService.getOptional('/logs'),
        apiService.getOptional('/contacts'),
        apiService.getOptional('/templates'),
        apiService.getOptional('/campaigns'),
        apiService.getOptional('/automations')
      ]);

      // Process logs data
      let logs: any[] = [];
      if (logsResponse.status === 'fulfilled' && logsResponse.value) {
        logs = (logsResponse.value as any)?.logs || [];
      }

      // Process contacts data
      let contacts: any[] = [];
      if (contactsResponse.status === 'fulfilled' && contactsResponse.value) {
        contacts = (contactsResponse.value as any)?.contacts || [];
      }

      // Process templates data
      let templates: any[] = [];
      if (templatesResponse.status === 'fulfilled' && templatesResponse.value) {
        templates = (templatesResponse.value as any)?.templates || templatesResponse.value || [];
      }

      // Process campaigns data
      let campaigns: any[] = [];
      if (campaignsResponse.status === 'fulfilled' && campaignsResponse.value) {
        campaigns = (campaignsResponse.value as any)?.campaigns || [];
      }

      // Process automations data
      let automations: any[] = [];
      if (automationsResponse.status === 'fulfilled' && automationsResponse.value) {
        automations = Array.isArray(automationsResponse.value) ? automationsResponse.value : [];
      }

      // Calculate analytics from real data
      const now = new Date();
      const timeRangeMs = getTimeRangeMs(timeRange);
      const startDate = new Date(now.getTime() - timeRangeMs);

      // Filter logs by time range
      const filteredLogs = logs.filter((log: any) => {
        const logDate = new Date(log.sent_at || log.timestamp || log.created_at);
        return logDate >= startDate;
      });

      // Calculate message stats
      const sentMessages = filteredLogs.filter((log: any) => log.direction === 'outgoing');
      const deliveredMessages = sentMessages.filter((log: any) => log.success || log.status === 'delivered');
      const readMessages = sentMessages.filter((log: any) => log.status === 'read');
      const failedMessages = sentMessages.filter((log: any) => !log.success || log.status === 'failed');

      // Calculate contact stats
      const activeContacts = contacts.filter((c: any) => {
        const lastInteraction = new Date(c.last_interaction || c.created_at);
        return lastInteraction >= startDate;
      });

      // Calculate campaign stats
      const activeCampaigns = campaigns.filter((c: any) => c.status === 'active');

      // Calculate template performance
      const templateStats = templates.map((template: any) => {
        const templateLogs = sentMessages.filter((log: any) => 
          log.template_name === template.name || log.template === template.name
        );
        const delivered = templateLogs.filter((log: any) => log.success || log.status === 'delivered');
        const read = templateLogs.filter((log: any) => log.status === 'read');
        
        return {
          name: template.name,
          sent: templateLogs.length,
          delivered: delivered.length,
          read: read.length,
          rate: delivered.length > 0 ? (read.length / delivered.length) * 100 : 0
        };
      }).filter((t: any) => t.sent > 0)
        .sort((a: any, b: any) => b.rate - a.rate)
        .slice(0, 5);

      // Calculate hourly distribution
      const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const count = sentMessages.filter((log: any) => {
          const logDate = new Date(log.sent_at || log.timestamp);
          return logDate.getHours() === hour;
        }).length;
        return { hour, count };
      });

      // Calculate daily timeline
      const days = Math.min(getDaysFromRange(timeRange), 30);
      const dailyData = Array.from({ length: days }, (_, index) => {
        const date = new Date(now.getTime() - (days - 1 - index) * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const count = sentMessages.filter((log: any) => {
          const logDate = new Date(log.sent_at || log.timestamp);
          return logDate >= dayStart && logDate < dayEnd;
        }).length;
        
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          count,
          delivered: sentMessages.filter((log: any) => {
            const logDate = new Date(log.sent_at || log.timestamp);
            return logDate >= dayStart && logDate < dayEnd && (log.success || log.status === 'delivered');
          }).length
        };
      });

      // Calculate campaign performance
      const campaignPerformance = campaigns.map((campaign: any) => {
        const campaignLogs = sentMessages.filter((log: any) => log.campaign_id === campaign.id);
        return {
          name: campaign.name,
          status: campaign.status,
          sent: campaign.sent_count || campaignLogs.length,
          total: campaign.total_count || (campaign.recipients?.length || 0),
          success_rate: campaign.success_rate || 0
        };
      }).filter((c: any) => c.sent > 0)
        .sort((a: any, b: any) => b.sent - a.sent)
        .slice(0, 5);

      // Calculate top contacts by message count
      const contactMessageCount = new Map();
      sentMessages.forEach((log: any) => {
        const phone = log.to || log.phone;
        contactMessageCount.set(phone, (contactMessageCount.get(phone) || 0) + 1);
      });
      
      const topContactsList = Array.from(contactMessageCount.entries())
        .map(([phone, count]) => {
          const contact = contacts.find((c: any) => c.phone === phone);
          return {
            phone,
            name: contact?.name || phone,
            messageCount: count,
            lastMessage: sentMessages.filter((log: any) => (log.to || log.phone) === phone)
              .sort((a: any, b: any) => new Date(b.sent_at || b.timestamp).getTime() - new Date(a.sent_at || a.timestamp).getTime())[0]
          };
        })
        .sort((a: any, b: any) => b.messageCount - a.messageCount)
        .slice(0, 10);

      // Calculate response metrics
      const responseTimes: number[] = [];
      let fastResponses = 0;    // ≤ 1 hour
      let mediumResponses = 0;  // 1-4 hours
      let slowResponses = 0;    // > 4 hours
      
      sentMessages.forEach((log: any) => {
        if (log.response_time) {
          const hours = log.response_time / 3600; // Convert seconds to hours
          responseTimes.push(log.response_time);
          
          if (hours <= 1) {
            fastResponses++;
          } else if (hours <= 4) {
            mediumResponses++;
          } else {
            slowResponses++;
          }
        }
      });
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;
      
      const totalResponses = fastResponses + mediumResponses + slowResponses;
      const responseBreakdown = {
        fast: totalResponses > 0 ? (fastResponses / totalResponses) * 100 : 0,
        medium: totalResponses > 0 ? (mediumResponses / totalResponses) * 100 : 0,
        slow: totalResponses > 0 ? (slowResponses / totalResponses) * 100 : 0
      };

      // Calculate automation breakdown - count triggers per automation
      const automationTriggers = automations.map((automation: any) => {
        // Count messages sent by this automation (based on automation_id in logs)
        const automationMessages = sentMessages.filter((log: any) => 
          log.automation_id === automation.id || 
          log.automation_name === automation.name
        );
        
        return {
          name: automation.name || 'Unnamed Automation',
          triggers: automationMessages.length,
          status: automation.status,
          enabled: automation.enabled
        };
      }).filter((a: any) => a.triggers > 0) // Only show automations that have been triggered
        .sort((a: any, b: any) => b.triggers - a.triggers) // Sort by most triggered
        .slice(0, 5); // Top 5

      setAnalytics({
        messagesSent: sentMessages.length,
        messagesDelivered: deliveredMessages.length,
        messagesRead: readMessages.length,
        messagesFailed: failedMessages.length,
        automationsTriggered: automations.filter((a: any) => a.status === 'active').length,
        activeWorkflows: automations.filter((a: any) => a.enabled).length,
        responseRate: deliveredMessages.length > 0 ? (readMessages.length / deliveredMessages.length) * 100 : 0,
        averageResponseTime: avgResponseTime > 0 ? avgResponseTime / 3600 : 0, // Convert to hours
        totalContacts: contacts.length,
        activeContacts: activeContacts.length,
        totalTemplates: templates.length,
        activeCampaigns: activeCampaigns.length,
        totalCampaigns: campaigns.length
      });

      setTemplatePerformance(templateStats);
      setMessageTimeline(dailyData);
      setCampaignStats(campaignPerformance);
      setHourlyDistribution(hourlyData);
      setTopContacts(topContactsList);
      setAutomationBreakdown(automationTriggers);
      setResponseTimeBreakdown(responseBreakdown);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAsPDF = () => {
    // Create a blob with the HTML content for download
    const printContent = document.getElementById('report-preview')?.innerHTML || '';
    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .metric-card { border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #2A8B8A; color: white; }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `;
    
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTimeRangeMs = (range: string) => {
    switch (range) {
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      case '90d': return 90 * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  };

  const getDaysFromRange = (range: string) => {
    switch (range) {
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 7;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F6FF] p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Skeleton Header */}
          <div className="flex items-center justify-between animate-pulse">
            <div>
              <div className="h-9 bg-gray-200 rounded w-48 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 bg-gray-200 rounded-xl w-40"></div>
              <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
              <div className="h-10 bg-gray-200 rounded-xl w-32"></div>
            </div>
          </div>

          {/* Skeleton Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>

          {/* Skeleton Automation & Response Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg animate-pulse">
                <div className="p-6 border-b border-white/50">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                  </div>
                  <div className="pt-4 border-t border-white/50 space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Timeline Chart */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg animate-pulse">
            <div className="p-6 border-b border-white/50">
              <div className="h-6 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-end justify-between gap-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 rounded-t-lg" style={{height: `${Math.random() * 80 + 20}%`}}></div>
                    <div className="h-3 bg-gray-200 rounded w-8 mt-2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skeleton Template Performance */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg animate-pulse">
            <div className="p-6 border-b border-white/50">
              <div className="h-6 bg-gray-200 rounded w-56"></div>
            </div>
            <div className="divide-y divide-white/50">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-5 bg-gray-200 rounded w-40"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j}>
                        <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Analytics</h1>
          <p className="text-gray-600 mt-2">Monitor your WhatsApp automation performance</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            className="border border-white/50 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl focus:border-[#2A8B8A] focus:outline-none focus:ring-2 focus:ring-[#2A8B8A]/20 text-black transition-all duration-200"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
          </select>
          <button 
            onClick={() => fetchAnalyticsData()}
            disabled={loading}
            className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-2 rounded-xl font-medium hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-2 rounded-xl font-medium hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Messages Sent</p>
            <p className="text-2xl font-bold text-black">{analytics.messagesSent.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
              {analytics.messagesSent > 0 ? 
                `${((analytics.messagesDelivered / analytics.messagesSent) * 100).toFixed(1)}%` : 
                '0%'
              }
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-black">{analytics.messagesDelivered.toLocaleString()}</p>
            <p className="text-xs text-gray-500">
              {analytics.messagesSent > 0 ? 
                `${((analytics.messagesDelivered / analytics.messagesSent) * 100).toFixed(1)}% delivery rate` : 
                '0% delivery rate'
              }
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
              {analytics.messagesDelivered > 0 ? 
                `${((analytics.messagesRead / analytics.messagesDelivered) * 100).toFixed(1)}%` : 
                '0%'
              }
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Read</p>
            <p className="text-2xl font-bold text-black">{analytics.messagesRead.toLocaleString()}</p>
            <p className="text-xs text-gray-500">
              {analytics.messagesDelivered > 0 ? 
                `${((analytics.messagesRead / analytics.messagesDelivered) * 100).toFixed(1)}% read rate` : 
                '0% read rate'
              }
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-sm text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">
              {analytics.messagesSent > 0 ? 
                `${((analytics.messagesFailed / analytics.messagesSent) * 100).toFixed(1)}%` : 
                '0%'
              }
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Failed</p>
            <p className="text-2xl font-bold text-black">{analytics.messagesFailed.toLocaleString()}</p>
            <p className="text-xs text-gray-500">
              {analytics.messagesSent > 0 ? 
                `${((analytics.messagesFailed / analytics.messagesSent) * 100).toFixed(1)}% failure rate` : 
                '0% failure rate'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Automation Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="p-6 border-b border-white/50">
            <h3 className="text-lg font-semibold text-black">Automation Performance</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Automations Triggered</p>
                <p className="text-2xl font-bold text-black">{analytics.automationsTriggered}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold text-black">{analytics.activeWorkflows}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>

            <div className="pt-4 border-t border-white/50">
              <div className="space-y-3">
                {automationBreakdown.length > 0 ? (
                  automationBreakdown.map((automation, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{automation.name}</span>
                      <span className="font-medium text-[#2A8B8A]">
                        {automation.triggers} {automation.triggers === 1 ? 'trigger' : 'triggers'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-gray-500 py-2">
                    No automation activity in this time range
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="p-6 border-b border-white/50">
            <h3 className="text-lg font-semibold text-black">Response Analytics</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-2">Response Rate</p>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#2A8B8A"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - analytics.responseRate / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-black">{analytics.responseRate}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Response Time</span>
                <span className="text-lg font-semibold text-black">
                  {analytics.averageResponseTime > 0 ? `${analytics.averageResponseTime.toFixed(1)}h` : 'N/A'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">≤ 1 hour</span>
                  <span className="font-medium">{responseTimeBreakdown.fast.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] h-2 rounded-full transition-all duration-1000" style={{width: `${responseTimeBreakdown.fast}%`}}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">1-4 hours</span>
                  <span className="font-medium">{responseTimeBreakdown.medium.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] h-2 rounded-full transition-all duration-1000" style={{width: `${responseTimeBreakdown.medium}%`}}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">&gt; 4 hours</span>
                  <span className="font-medium">{responseTimeBreakdown.slow.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-1000" style={{width: `${responseTimeBreakdown.slow}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Timeline */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
        <div className="p-6 border-b border-white/50">
          <h3 className="text-lg font-semibold text-black">Message Timeline</h3>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-end justify-between gap-4">
            {/* Mock chart bars */}
            {[65, 78, 92, 84, 95, 88, 76].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-[#2A8B8A] to-[#238080] rounded-t-lg transition-all duration-1000 hover:from-[#238080] hover:to-[#1e6b6b]"
                  style={{height: `${height}%`}}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Template Performance */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
        <div className="p-6 border-b border-white/50">
          <h3 className="text-lg font-semibold text-black">Top Performing Templates</h3>
        </div>
        <div className="divide-y divide-white/50">
          {templatePerformance.map((template, index) => (
            <div key={index} className="p-6 hover:bg-white/50 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-black">{template.name}</h4>
                <span className="text-sm font-medium text-[#2A8B8A] bg-[#2A8B8A]/10 px-3 py-1 rounded-full">
                  {template.rate.toFixed(1)}% read rate
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Sent</p>
                  <p className="font-medium text-black">{template.sent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Delivered</p>
                  <p className="font-medium text-black">{template.delivered.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">
                    {template.sent > 0 ? `${((template.delivered / template.sent) * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Read</p>
                  <p className="font-medium text-black">{template.read.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">
                    {template.delivered > 0 ? `${((template.read / template.delivered) * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] h-2 rounded-full transition-all duration-1000" 
                  style={{width: `${Math.min(template.rate, 100)}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Analytics Report Preview</h2>
                <p className="text-white/80 mt-1">Review your report before exporting</p>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-8" style={{scrollbarWidth: 'thin'}}>
              <div id="report-preview">
                {/* Report Header */}
                <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Report</h1>
                  <p className="text-lg text-gray-600">WhatsApp Automation Performance</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Generated on {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    Time Range: <span className="font-semibold">
                      {timeRange === '24h' && 'Last 24 Hours'}
                      {timeRange === '7d' && 'Last 7 Days'}
                      {timeRange === '30d' && 'Last 30 Days'}
                      {timeRange === '90d' && 'Last 3 Months'}
                    </span>
                  </p>
                </div>

                {/* Key Metrics Summary */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                    📊 Key Metrics Summary
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Messages Sent</p>
                      <p className="text-3xl font-bold text-[#2A8B8A]">{analytics.messagesSent.toLocaleString()}</p>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Messages Delivered</p>
                      <p className="text-3xl font-bold text-green-600">{analytics.messagesDelivered.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {analytics.messagesSent > 0 ? 
                          `${((analytics.messagesDelivered / analytics.messagesSent) * 100).toFixed(1)}% delivery rate` : 
                          '0%'
                        }
                      </p>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Messages Read</p>
                      <p className="text-3xl font-bold text-blue-600">{analytics.messagesRead.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {analytics.messagesDelivered > 0 ? 
                          `${((analytics.messagesRead / analytics.messagesDelivered) * 100).toFixed(1)}% read rate` : 
                          '0%'
                        }
                      </p>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Messages Failed</p>
                      <p className="text-3xl font-bold text-red-600">{analytics.messagesFailed.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {analytics.messagesSent > 0 ? 
                          `${((analytics.messagesFailed / analytics.messagesSent) * 100).toFixed(1)}% failure rate` : 
                          '0%'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Automation Performance */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                    🤖 Automation Performance
                  </h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Automations Triggered</p>
                      <p className="text-3xl font-bold text-[#2A8B8A]">{analytics.automationsTriggered}</p>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Active Workflows</p>
                      <p className="text-3xl font-bold text-[#2A8B8A]">{analytics.activeWorkflows}</p>
                    </div>
                  </div>
                  {automationBreakdown.length > 0 && (
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="font-semibold text-gray-900 mb-3">Top Automations:</p>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-sm font-semibold text-gray-700">Automation Name</th>
                            <th className="text-right py-2 text-sm font-semibold text-gray-700">Triggers</th>
                          </tr>
                        </thead>
                        <tbody>
                          {automationBreakdown.map((automation, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-2 text-gray-800">{automation.name}</td>
                              <td className="text-right py-2 font-medium text-[#2A8B8A]">{automation.triggers}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Response Analytics */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                    💬 Response Analytics
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Response Rate</p>
                      <p className="text-3xl font-bold text-[#2A8B8A]">{analytics.responseRate.toFixed(1)}%</p>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Average Response Time</p>
                      <p className="text-3xl font-bold text-[#2A8B8A]">
                        {analytics.averageResponseTime > 0 ? `${analytics.averageResponseTime.toFixed(1)}h` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-4 mt-4">
                    <p className="font-semibold text-gray-900 mb-3">Response Time Distribution:</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">≤ 1 hour</span>
                          <span className="text-sm font-medium">{responseTimeBreakdown.fast.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] h-3 rounded-full" 
                            style={{width: `${responseTimeBreakdown.fast}%`}}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">1-4 hours</span>
                          <span className="text-sm font-medium">{responseTimeBreakdown.medium.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] h-3 rounded-full" 
                            style={{width: `${responseTimeBreakdown.medium}%`}}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">&gt; 4 hours</span>
                          <span className="text-sm font-medium">{responseTimeBreakdown.slow.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full" 
                            style={{width: `${responseTimeBreakdown.slow}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template Performance */}
                {templatePerformance.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                      📝 Top Performing Templates
                    </h2>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Template Name</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Sent</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Delivered</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Read</th>
                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Read Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {templatePerformance.map((template, index) => (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="py-3 px-4 text-gray-800">{template.name}</td>
                              <td className="text-right py-3 px-4 text-gray-700">{template.sent.toLocaleString()}</td>
                              <td className="text-right py-3 px-4 text-gray-700">
                                {template.delivered.toLocaleString()}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({template.sent > 0 ? ((template.delivered / template.sent) * 100).toFixed(1) : 0}%)
                                </span>
                              </td>
                              <td className="text-right py-3 px-4 text-gray-700">
                                {template.read.toLocaleString()}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({template.delivered > 0 ? ((template.read / template.delivered) * 100).toFixed(1) : 0}%)
                                </span>
                              </td>
                              <td className="text-right py-3 px-4">
                                <span className="inline-block bg-[#2A8B8A] text-white px-3 py-1 rounded-full text-sm font-medium">
                                  {template.rate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Contact Statistics */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                    👥 Contact Statistics
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Contacts</p>
                      <p className="text-3xl font-bold text-[#2A8B8A]">{analytics.totalContacts.toLocaleString()}</p>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Active Contacts</p>
                      <p className="text-3xl font-bold text-green-600">{analytics.activeContacts.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {analytics.totalContacts > 0 ? 
                          `${((analytics.activeContacts / analytics.totalContacts) * 100).toFixed(1)}% active` : 
                          '0%'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Campaign Statistics */}
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                    🎯 Campaign Statistics
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Campaigns</p>
                      <p className="text-3xl font-bold text-[#2A8B8A]">{analytics.totalCampaigns}</p>
                    </div>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
                      <p className="text-3xl font-bold text-green-600">{analytics.activeCampaigns}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Action Buttons */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-end gap-4">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handlePrint}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
              <button 
                onClick={handleSaveAsPDF}
                className="px-6 py-2.5 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white rounded-xl font-medium hover:from-[#238080] hover:to-[#1e6b6b] transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save to Computer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
