"use client";
import React, { useState, useEffect } from 'react';
import {
  LuCalendar,
  LuDownload,
  LuTrendingUp,
  LuTrendingDown,
  LuFilter,
  LuSearch,
  LuEye,
  LuMousePointer,
  LuMessageSquare,
  LuDollarSign,
  LuSend,
  LuUsers,
  LuTarget,
  LuActivity,
  LuX,
  LuRefreshCw
} from 'react-icons/lu';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export type AnalyticsMetrics = {
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  replied: number;
  converted: number;
  failed: number;
  totalCost: number;
  costPerMessage: number;
  costPerConversion: number;
  deliveryRate: number;
  readRate: number;
  ctr: number;
  replyRate: number;
  conversionRate: number;
  roi: number;
};

export type CampaignAnalytics = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  metrics: AnalyticsMetrics;
  segmentName?: string;
  tags?: string[];
};

export type TimeSeriesData = {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  replied: number;
  converted: number;
  cost: number;
};

export type SegmentPerformance = {
  segmentId: string;
  segmentName: string;
  contactCount: number;
  metrics: AnalyticsMetrics;
};

type AnalyticsDashboardProps = {
  campaigns: CampaignAnalytics[];
  timeSeriesData: TimeSeriesData[];
  segmentPerformance: SegmentPerformance[];
  onRefresh: () => void;
  onExport: (format: 'csv' | 'pdf', data: any) => void;
};

type MetricCardProps = {
  title: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  icon: React.ReactNode;
  color: string;
  format?: 'number' | 'percentage' | 'currency';
};

function MetricCard({ title, value, trend, icon, color, format = 'number' }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-emerald-600';
      case 'down': return 'text-red-600';
      default: return 'text-slate-500';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <LuTrendingUp className="w-3 h-3" />;
      case 'down': return <LuTrendingDown className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatValue(value)}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor(trend.direction)}`}>
              {getTrendIcon(trend.direction)}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard({
  campaigns,
  timeSeriesData,
  segmentPerformance,
  onRefresh,
  onExport
}: AnalyticsDashboardProps) {
  const [selectedDateRange, setSelectedDateRange] = useState('30d');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState(['deliveryRate', 'readRate', 'ctr']);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate aggregate metrics
  const aggregateMetrics = campaigns.reduce((acc, campaign) => {
    acc.sent += campaign.metrics.sent;
    acc.delivered += campaign.metrics.delivered;
    acc.read += campaign.metrics.read;
    acc.clicked += campaign.metrics.clicked;
    acc.replied += campaign.metrics.replied;
    acc.converted += campaign.metrics.converted;
    acc.failed += campaign.metrics.failed;
    acc.totalCost += campaign.metrics.totalCost;
    return acc;
  }, {
    sent: 0,
    delivered: 0,
    read: 0,
    clicked: 0,
    replied: 0,
    converted: 0,
    failed: 0,
    totalCost: 0
  });

  const derivedMetrics = {
    deliveryRate: aggregateMetrics.sent > 0 ? (aggregateMetrics.delivered / aggregateMetrics.sent) * 100 : 0,
    readRate: aggregateMetrics.delivered > 0 ? (aggregateMetrics.read / aggregateMetrics.delivered) * 100 : 0,
    ctr: aggregateMetrics.delivered > 0 ? (aggregateMetrics.clicked / aggregateMetrics.delivered) * 100 : 0,
    replyRate: aggregateMetrics.delivered > 0 ? (aggregateMetrics.replied / aggregateMetrics.delivered) * 100 : 0,
    conversionRate: aggregateMetrics.delivered > 0 ? (aggregateMetrics.converted / aggregateMetrics.delivered) * 100 : 0,
    costPerMessage: aggregateMetrics.sent > 0 ? aggregateMetrics.totalCost / aggregateMetrics.sent : 0,
    costPerConversion: aggregateMetrics.converted > 0 ? aggregateMetrics.totalCost / aggregateMetrics.converted : 0
  };

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.segmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart configurations
  const timeSeriesChartData = {
    labels: timeSeriesData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Delivery Rate',
        data: timeSeriesData.map(d => d.sent > 0 ? (d.delivered / d.sent) * 100 : 0),
        borderColor: '#2A8B8A',
        backgroundColor: '#2A8B8A20',
        tension: 0.4,
        hidden: !selectedMetrics.includes('deliveryRate')
      },
      {
        label: 'Read Rate',
        data: timeSeriesData.map(d => d.delivered > 0 ? (d.read / d.delivered) * 100 : 0),
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F620',
        tension: 0.4,
        hidden: !selectedMetrics.includes('readRate')
      },
      {
        label: 'Click Rate',
        data: timeSeriesData.map(d => d.delivered > 0 ? (d.clicked / d.delivered) * 100 : 0),
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B20',
        tension: 0.4,
        hidden: !selectedMetrics.includes('ctr')
      },
      {
        label: 'Reply Rate',
        data: timeSeriesData.map(d => d.delivered > 0 ? (d.replied / d.delivered) * 100 : 0),
        borderColor: '#EF4444',
        backgroundColor: '#EF444420',
        tension: 0.4,
        hidden: !selectedMetrics.includes('replyRate')
      }
    ]
  };

  const campaignComparisonData = {
    labels: filteredCampaigns.slice(0, 10).map(c => c.name),
    datasets: [
      {
        label: 'CTR (%)',
        data: filteredCampaigns.slice(0, 10).map(c => c.metrics.ctr),
        backgroundColor: '#2A8B8A',
      },
      {
        label: 'Conversion Rate (%)',
        data: filteredCampaigns.slice(0, 10).map(c => c.metrics.conversionRate),
        backgroundColor: '#3B82F6',
      }
    ]
  };

  const segmentPerformanceData = {
    labels: segmentPerformance.map(s => s.segmentName),
    datasets: [{
      data: segmentPerformance.map(s => s.metrics.ctr),
      backgroundColor: [
        '#2A8B8A',
        '#3B82F6',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#EC4899'
      ],
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaign Analytics</h1>
          <p className="text-slate-600 mt-1">Track performance, measure ROI, and optimize campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <LuFilter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <LuRefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <div className="relative">
            <select
              onChange={(e) => onExport(e.target.value as 'csv' | 'pdf', { campaigns, timeSeriesData })}
              className="appearance-none bg-[#2A8B8A] text-white px-4 py-2 rounded-lg cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>Export</option>
              <option value="csv">Export CSV</option>
              <option value="pdf">Export PDF</option>
            </select>
            <LuDownload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Status</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A]">
                <option value="all">All campaigns</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Metrics to Show</label>
              <div className="space-y-2">
                {[
                  { id: 'deliveryRate', label: 'Delivery Rate' },
                  { id: 'readRate', label: 'Read Rate' },
                  { id: 'ctr', label: 'Click Rate' },
                  { id: 'replyRate', label: 'Reply Rate' }
                ].map(metric => (
                  <label key={metric.id} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMetrics([...selectedMetrics, metric.id]);
                        } else {
                          setSelectedMetrics(selectedMetrics.filter(m => m !== metric.id));
                        }
                      }}
                      className="mr-2"
                    />
                    {metric.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search Campaigns</label>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search campaigns..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2A8B8A]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sent"
          value={aggregateMetrics.sent}
          icon={<LuSend className="w-6 h-6 text-white" />}
          color="bg-[#2A8B8A]"
          trend={{ direction: 'up', value: '+12.5% vs last period' }}
        />
        <MetricCard
          title="Delivery Rate"
          value={derivedMetrics.deliveryRate}
          format="percentage"
          icon={<LuTarget className="w-6 h-6 text-white" />}
          color="bg-blue-500"
          trend={{ direction: 'up', value: '+2.1% vs last period' }}
        />
        <MetricCard
          title="Read Rate"
          value={derivedMetrics.readRate}
          format="percentage"
          icon={<LuEye className="w-6 h-6 text-white" />}
          color="bg-amber-500"
          trend={{ direction: 'neutral', value: '-0.3% vs last period' }}
        />
        <MetricCard
          title="Click-Through Rate"
          value={derivedMetrics.ctr}
          format="percentage"
          icon={<LuMousePointer className="w-6 h-6 text-white" />}
          color="bg-emerald-500"
          trend={{ direction: 'up', value: '+5.2% vs last period' }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Reply Rate"
          value={derivedMetrics.replyRate}
          format="percentage"
          icon={<LuMessageSquare className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          trend={{ direction: 'up', value: '+1.8% vs last period' }}
        />
        <MetricCard
          title="Conversion Rate"
          value={derivedMetrics.conversionRate}
          format="percentage"
          icon={<LuTrendingUp className="w-6 h-6 text-white" />}
          color="bg-pink-500"
          trend={{ direction: 'up', value: '+3.4% vs last period' }}
        />
        <MetricCard
          title="Total Cost"
          value={aggregateMetrics.totalCost}
          format="currency"
          icon={<LuDollarSign className="w-6 h-6 text-white" />}
          color="bg-red-500"
          trend={{ direction: 'down', value: '-8.2% vs last period' }}
        />
        <MetricCard
          title="Cost per Conversion"
          value={derivedMetrics.costPerConversion}
          format="currency"
          icon={<LuTarget className="w-6 h-6 text-white" />}
          color="bg-indigo-500"
          trend={{ direction: 'down', value: '-15.1% vs last period' }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Performance Trends</h3>
            <LuActivity className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-80">
            <Line data={timeSeriesChartData} options={chartOptions} />
          </div>
        </div>

        {/* Campaign Comparison */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Top Performing Campaigns</h3>
            <LuTrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-80">
            <Bar data={campaignComparisonData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segment Performance */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Segment Performance</h3>
            <LuTarget className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-64">
            <Doughnut 
              data={segmentPerformanceData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Campaign List */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Recent Campaigns</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {filteredCampaigns.length} campaigns
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-700">Campaign</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">Status</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">Sent</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">CTR</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">Conv Rate</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-700">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCampaigns.slice(0, 10).map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">{campaign.name}</div>
                        {campaign.segmentName && (
                          <div className="text-sm text-slate-500">{campaign.segmentName}</div>
                        )}
                      </div>
                    </td>
                    <td className="text-center px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        campaign.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        campaign.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="text-center px-6 py-4 text-slate-600">
                      {campaign.metrics.sent.toLocaleString()}
                    </td>
                    <td className="text-center px-6 py-4 text-slate-600">
                      {campaign.metrics.ctr.toFixed(1)}%
                    </td>
                    <td className="text-center px-6 py-4 text-slate-600">
                      {campaign.metrics.conversionRate.toFixed(1)}%
                    </td>
                    <td className="text-center px-6 py-4">
                      <span className={`font-medium ${
                        campaign.metrics.roi > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {campaign.metrics.roi > 0 ? '+' : ''}{campaign.metrics.roi.toFixed(1)}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
