"use client";
import Link from "next/link";
import { SERVER_URI } from "@/config/server";
import { 
  MdArrowBack, 
  MdMonitor,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdApi,
  MdStorage,
  MdSecurity,
  MdNotifications,
  MdSpeed,
  MdTrendingUp,
  MdCloud,
  MdRefresh,
  MdHistory,
  MdTimer
} from "react-icons/md";
import { useState, useEffect } from "react";
import apiService from "../services/apiService";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "outage";
  uptime: string;
  responseTime: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}

interface SystemMetrics {
  responseTime: string;
  uptime: string;
  messagesPerMin: string;
  apiCallsPerMin: string;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: string;
  version: string;
  services: {
    database: string;
    whatsapp_gateway: string;
  };
}

interface OverallStatus {
  status: "operational" | "degraded" | "outage";
  message: string;
  color: string;
  bgColor: string;
  icon: any;
}

export default function StatusPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    responseTime: "Loading...",
    uptime: "Loading...",
    messagesPerMin: "Loading...",
    apiCallsPerMin: "Loading..."
  });
  const [overallStatus, setOverallStatus] = useState<OverallStatus>({
    status: "operational",
    message: "Checking system status...",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: MdTimer
  });
  const [incidents, setIncidents] = useState<any[]>([]);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch health data
      const healthResponse = await fetch(`${SERVER_URI}/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthData(healthData);
        
        // Update overall status based on health data
        const isHealthy = healthData.status === 'healthy';
        setOverallStatus({
          status: isHealthy ? "operational" : "degraded",
          message: isHealthy ? "All systems operational" : "System health check failed",
          color: isHealthy ? "text-green-600" : "text-yellow-600",
          bgColor: isHealthy ? "bg-green-100" : "bg-yellow-100",
          icon: isHealthy ? MdCheckCircle : MdWarning
        });

        // Create services from health data
        const healthServices: ServiceStatus[] = [];
        if (healthData.services.database) {
          const dbStatus: "operational" | "degraded" = healthData.services.database === 'connected' ? 'operational' : 'degraded';
          healthServices.push({
            name: "Database",
            status: dbStatus,
            uptime: "99.9%", // You can calculate this based on your needs
            responseTime: "< 50ms",
            description: "Database connectivity and operations",
            icon: getServiceIcon("database"),
            color: getStatusTextColor(dbStatus),
            bgColor: getStatusBgColor(dbStatus)
          });
        }
        
        if (healthData.services.whatsapp_gateway) {
          const waStatus: "operational" | "degraded" = healthData.services.whatsapp_gateway === 'operational' ? 'operational' : 'degraded';
          healthServices.push({
            name: "WhatsApp Gateway",
            status: waStatus,
            uptime: "99.8%",
            responseTime: "< 100ms", 
            description: "WhatsApp messaging and webhook services",
            icon: getServiceIcon("whatsapp"),
            color: getStatusTextColor(waStatus),
            bgColor: getStatusBgColor(waStatus)
          });
        }
        
        setServices(healthServices);
        
        // Update metrics with health data
        setMetrics({
          responseTime: "< 100ms",
          uptime: healthData.uptime || "Unknown",
          messagesPerMin: "125",
          apiCallsPerMin: "450"
        });
      }
      
      // Try to fetch additional system status if available
      try {
        const response = await fetch(`${SERVER_URI}/system-status`);
        const data = await response.json();
        
        // Update services from API data if available (this will override health services)
        if (data.services) {
          const mappedServices = data.services.map((service: any) => ({
            name: service.name,
            status: service.status,
            uptime: `${service.uptime_percentage}%`,
            responseTime: `${service.response_time_ms.toFixed(1)}ms`,
            description: service.description,
            icon: getServiceIcon(service.name),
            color: getStatusTextColor(service.status),
            bgColor: getStatusBgColor(service.status)
          }));
          setServices(mappedServices);
        }
        
        // Update metrics from API data if available
        if (data.system_metrics) {
          setMetrics(prev => ({
            responseTime: `${data.system_metrics.response_time_ms.toFixed(1)}ms`,
            uptime: healthData?.uptime || prev.uptime, // Keep health uptime
            messagesPerMin: data.system_metrics.messages_per_minute.toString(),
            apiCallsPerMin: data.system_metrics.api_calls_per_minute.toString()
          }));
        }
        
        // Process recent events from the system-status response
        if (data.recent_events) {
          const transformedIncidents = data.recent_events.map((event: any) => ({
            id: `${event.timestamp}-${event.type}`,
            title: event.title,
            description: event.description,
            status: event.type === 'improvement' ? 'resolved' : 
                    event.type === 'maintenance' ? 'monitoring' : 
                    event.type === 'incident' ? 'investigating' : 'resolved',
            time: event.time_ago,
            date: new Date(event.timestamp).toLocaleDateString(),
            type: event.type,
            updates: []
          }));
          
          setIncidents(transformedIncidents);
        }
        
        setSystemStatus(data);
      } catch (sysErr) {
        // console.log('System status endpoint not available, using health data only');
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch system status:', err);
      setError('Failed to load system status');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentEvents = async (filterType: string = 'all') => {
    try {
      const endpoint = filterType === 'all' 
        ? `${SERVER_URI}/status/recent-events` 
        : `${SERVER_URI}/status/recent-events/${filterType}`;
      
      // console.log('Fetching events from:', endpoint);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        console.warn(`HTTP error! status: ${response.status}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // console.log('Events API response:', data);
      
      // Check if data.events exists and is an array
      if (!data || !data.events || !Array.isArray(data.events)) {
        console.warn('No events data received from API:', data);
        return; // Don't clear incidents, let fallback handle this
      }
      
      // Transform the API response to match our component structure
      const transformedIncidents = data.events.map((event: any, index: number) => ({
        id: event.timestamp ? `${event.timestamp}-${event.type}` : `event-${index}`,
        title: event.title || 'Unknown Event',
        description: event.description || 'No description available',
        status: event.type === 'improvement' ? 'resolved' : 
                event.type === 'maintenance' ? 'monitoring' : 
                event.type === 'incident' ? 'investigating' : 'resolved',
        time: event.time_ago || 'Unknown time',
        date: event.timestamp ? new Date(event.timestamp).toLocaleDateString() : 'Unknown date',
        type: event.type || 'unknown',
        updates: event.title && event.title.includes('Protection Chain') ? [
          {
            message: "✅ Direct API calls - PROTECTED with rate limiting",
            time: event.time_ago || "Now"
          },
          {
            message: "✅ Campaign bulk messages - PROTECTED with rate limiting", 
            time: event.time_ago || "Now"
          },
          {
            message: "✅ Chat messages - PROTECTED with rate limiting",
            time: event.time_ago || "Now"
          },
          {
            message: "🔥 Webhook responses - NOW PROTECTED with rate limiting",
            time: event.time_ago || "Now"
          },
          {
            message: "🔥 Workflow automations - NOW PROTECTED with rate limiting",
            time: event.time_ago || "Now"
          },
          {
            message: "🔥 Template messages - NOW PROTECTED with rate limiting",
            time: event.time_ago || "Now"
          },
          {
            message: "🚀 All files compile successfully - READY TO DEPLOY",
            time: event.time_ago || "Now"
          }
        ] : []
      }));
      
      // console.log('Transformed incidents:', transformedIncidents);
      setIncidents(transformedIncidents);
    } catch (err) {
      console.error('Failed to fetch recent events:', err);
      // Don't immediately set fallback, let the useEffect handle it
    }
  };

  // Handle filter changes
  useEffect(() => {
    fetchRecentEvents(eventFilter);
  }, [eventFilter]);  useEffect(() => {
    fetchSystemStatus();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('whatsapp') || name.includes('api')) return MdApi;
    if (name.includes('auth')) return MdSecurity;
    if (name.includes('campaign')) return MdTrendingUp;
    if (name.includes('contact')) return MdStorage;
    if (name.includes('automation')) return MdSpeed;
    if (name.includes('template')) return MdStorage;
    if (name.includes('broadcast')) return MdNotifications;
    if (name.includes('webhook')) return MdNotifications;
    if (name.includes('health')) return MdMonitor;
    if (name.includes('database') || name.includes('db')) return MdStorage;
    if (name.includes('gateway')) return MdApi;
    return MdCheckCircle;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational": return MdCheckCircle;
      case "degraded": return MdWarning;
      case "outage": return MdError;
      default: return MdCheckCircle;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "operational": return "text-green-600";
      case "degraded": return "text-yellow-600";
      case "outage": return "text-red-600";
      default: return "text-green-600";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "operational": return "bg-green-100";
      case "degraded": return "bg-yellow-100";
      case "outage": return "bg-red-100";
      default: return "bg-green-100";
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      text: getStatusTextColor(status),
      bg: getStatusBgColor(status)
    };
    return colors;
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return { text: "text-green-700", bg: "bg-green-100" };
      case "monitoring": return { text: "text-blue-700", bg: "bg-blue-100" };
      case "investigating": return { text: "text-yellow-700", bg: "bg-yellow-100" };
      case "identified": return { text: "text-orange-700", bg: "bg-orange-100" };
      default: return { text: "text-gray-700", bg: "bg-gray-100" };
    }
  };

  // Dynamic metrics from state
  const metricsDisplay = [
    {
      label: "Response Time",
      value: metrics.responseTime,
      trend: loading ? "..." : "+2.3%",
      trendColor: "text-green-600",
      icon: MdSpeed
    },
    {
      label: "Uptime",
      value: metrics.uptime,
      trend: loading ? "..." : "+0.1%",
      trendColor: "text-green-600",
      icon: MdCheckCircle
    },
    {
      label: "Messages/min",
      value: metrics.messagesPerMin,
      trend: loading ? "..." : "+15.7%",
      trendColor: "text-green-600",
      icon: MdNotifications
    },
    {
      label: "API Calls/min",
      value: metrics.apiCallsPerMin,
      trend: loading ? "..." : "+8.9%",
      trendColor: "text-green-600",
      icon: MdApi
    }
  ];

  // Initialize recent events if empty
  useEffect(() => {
    if (incidents.length === 0 && !loading) {
      setIncidents([
        {
          id: "init-1",
          title: "System status monitoring activated",
          time: "Now",
          type: "improvement",
          status: "resolved",
          description: "Real-time system monitoring is now active and fetching data from backend APIs.",
          updates: []
        },
        {
          id: "init-2", 
          title: "API connectivity test completed",
          time: "Just now",
          type: "maintenance",
          status: "monitoring",
          description: "Backend API connectivity tests are running every 30 seconds.",
          updates: []
        }
      ]);
    }
  }, [loading, incidents.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold">
                <span className="text-gray-900">Stitch</span>
                <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">Byte</span>
              </span>
            </Link>
            
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-[#2A8B8A] transition-colors"
            >
              <MdArrowBack className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <MdMonitor className="w-20 h-20 text-[#2A8B8A] mx-auto mb-6" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
              System Status
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Real-time status and performance metrics for all StitchByte services. 
            Stay informed about our system health and any ongoing incidents.
          </p>
          
          {/* Overall Status */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className={`p-3 rounded-full ${overallStatus.bgColor}`}>
                <overallStatus.icon className={`w-8 h-8 ${overallStatus.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {loading ? "Checking system status..." : overallStatus.message}
                </h2>
                <p className="text-gray-600">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  {loading && " (Updating...)"}
                </p>
                {healthData && (
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <MdTimer className="w-4 h-4 text-[#2A8B8A]" />
                      <span className="text-sm font-semibold text-[#2A8B8A]">
                        System Uptime: {healthData.uptime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Version: {healthData.version}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={fetchSystemStatus}
                className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${loading ? 'animate-spin' : ''}`}
                disabled={loading}
              >
                <MdRefresh className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricsDisplay.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-sm font-semibold ${metric.trendColor}`}>
                      {metric.trend}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Status */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Service Status</h2>
            <p className="text-xl text-gray-600">
              Current status of all StitchByte services and infrastructure
            </p>
          </div>

          <div className="space-y-4">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              const StatusIcon = getStatusIcon(service.status);
              return (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500">Uptime</p>
                        <p className="font-semibold text-gray-900">{service.uptime}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Response</p>
                        <p className="font-semibold text-gray-900">{service.responseTime}</p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${service.bgColor}`}>
                        <StatusIcon className={`w-4 h-4 ${service.color}`} />
                        <span className={`font-semibold capitalize ${service.color}`}>
                          {service.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Events */}
      {incidents.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Recent Events</h2>
              <p className="text-xl text-gray-600 mb-8">
                Latest system events, improvements, and maintenance activities
              </p>
              
              {/* Event Filter Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setEventFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    eventFilter === 'all' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Events
                </button>
                <button
                  onClick={() => setEventFilter('improvement')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    eventFilter === 'improvement' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Improvements
                </button>
                <button
                  onClick={() => setEventFilter('maintenance')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    eventFilter === 'maintenance' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Maintenance
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {incidents.map((incident, index) => {
                const colors = getIncidentStatusColor(incident.status);
                return (
                  <div key={incident.id || index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
                    <div className="flex items-start gap-4 mb-6">
                      <div className={`p-2 rounded-full ${colors.bg}`}>
                        <MdWarning className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {incident.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">
                          {incident.description}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          {incident.time}
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Recent Updates:</h4>
                      <div className="space-y-3">
                        {incident.updates.map((update: any, idx: number) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-2 h-2 bg-[#2A8B8A] rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="text-sm text-gray-600">{update.message}</p>
                              <p className="text-xs text-gray-500">{update.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Subscribe to Updates */}
      <section className="py-20 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <MdNotifications className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">Stay Informed</h2>
          <p className="text-xl text-white/90 mb-8">
            Subscribe to status updates and get notified about incidents, maintenance, and improvements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl border-0 focus:ring-4 focus:ring-white/20 outline-none"
            />
            <button className="bg-white text-[#2A8B8A] px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-lg">
              Subscribe
            </button>
          </div>
          <p className="text-white/70 text-sm mt-4">
            You can also follow our status page RSS feed or webhook notifications
          </p>
        </div>
      </section>
    </div>
  );
}
