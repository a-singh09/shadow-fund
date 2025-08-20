import { BarChart3, TrendingUp, Users, Calendar, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const DashboardAnalytics = () => {
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);

  const analyticsData = {
    overview: {
      totalViews: 1247,
      uniqueVisitors: 892,
      conversionRate: 7.6,
      avgSessionTime: '2m 34s'
    },
    campaigns: [
      {
        id: 1,
        name: 'Privacy-First Social Network',
        views: 567,
        supporters: 67,
        conversionRate: 11.8,
        trend: '+23%'
      },
      {
        id: 2,
        name: 'Sustainable Energy Initiative', 
        views: 423,
        supporters: 43,
        conversionRate: 10.2,
        trend: '+15%'
      },
      {
        id: 3,
        name: 'Open Source Privacy Tools',
        views: 257,
        supporters: 127,
        conversionRate: 49.4,
        trend: '+8%'
      }
    ],
    timeData: [
      { period: 'Last 7 days', views: 234, supporters: 18 },
      { period: 'Last 30 days', views: 891, supporters: 67 },
      { period: 'Last 90 days', views: 1247, supporters: 127 }
    ]
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Privacy-safe insights into your campaign performance</p>
        </div>
        <button
          onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
          className="flex items-center space-x-2 btn-secondary px-4 py-2"
        >
          {showDetailedMetrics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showDetailedMetrics ? 'Hide' : 'Show'} Detailed Metrics</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Views',
            value: analyticsData.overview.totalViews.toLocaleString(),
            icon: Eye,
            color: 'blue',
            change: '+12.5%'
          },
          {
            title: 'Unique Visitors',
            value: analyticsData.overview.uniqueVisitors.toLocaleString(),
            icon: Users,
            color: 'green',
            change: '+8.3%'
          },
          {
            title: 'Conversion Rate',
            value: `${analyticsData.overview.conversionRate}%`,
            icon: TrendingUp,
            color: 'purple',
            change: '+2.1%'
          },
          {
            title: 'Avg. Session Time',
            value: analyticsData.overview.avgSessionTime,
            icon: Calendar,
            color: 'red',
            change: '+0.5%'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass p-6 rounded-2xl border border-red-500/20 hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl border ${
                  stat.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' :
                  stat.color === 'green' ? 'bg-green-500/10 border-green-500/20' :
                  stat.color === 'purple' ? 'bg-purple-500/10 border-purple-500/20' :
                  'bg-red-500/10 border-red-500/20'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    stat.color === 'blue' ? 'text-blue-400' :
                    stat.color === 'green' ? 'text-green-400' :
                    stat.color === 'purple' ? 'text-purple-400' :
                    'text-red-400'
                  }`} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">{stat.title}</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  <span className="text-sm text-green-400">{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaign Performance */}
      <div className="glass rounded-2xl border border-red-500/20 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Campaign Performance</h2>
          <p className="text-gray-400 text-sm mt-1">Individual campaign analytics</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 font-medium text-gray-400">Campaign</th>
                <th className="text-left p-4 font-medium text-gray-400">Views</th>
                <th className="text-left p-4 font-medium text-gray-400">Supporters</th>
                <th className="text-left p-4 font-medium text-gray-400">Conversion</th>
                <th className="text-left p-4 font-medium text-gray-400">Trend</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-gray-800/50 hover:bg-glass-subtle transition-all duration-300">
                  <td className="p-4">
                    <div className="font-medium text-white">{campaign.name}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-300">{campaign.views.toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-300">{campaign.supporters}</span>
                    {!showDetailedMetrics && (
                      <div className="text-xs text-gray-500">Amounts private</div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-gray-300">{campaign.conversionRate}%</span>
                  </td>
                  <td className="p-4">
                    <span className="text-green-400">{campaign.trend}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time-based Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-6 rounded-2xl border border-red-500/20">
          <h3 className="text-lg font-bold text-white mb-4">Performance Over Time</h3>
          <div className="space-y-4">
            {analyticsData.timeData.map((data, index) => (
              <div key={index} className="flex items-center justify-between p-3 glass-subtle rounded-lg border border-gray-800">
                <span className="text-gray-300">{data.period}</span>
                <div className="text-right">
                  <div className="text-white font-medium">{data.views} views</div>
                  <div className="text-sm text-gray-400">{data.supporters} supporters</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-red-500/20">
          <h3 className="text-lg font-bold text-white mb-4">Privacy Notice</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <span>Individual donation amounts remain encrypted and private</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <span>Supporter identity is protected by zero-knowledge proofs</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <span>Only aggregate, anonymized metrics are displayed</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <span>All data complies with privacy-first principles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;