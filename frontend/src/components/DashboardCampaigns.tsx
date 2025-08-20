import { useState } from 'react';
import { Eye, Edit, Share, Download, Clock, Users, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardCampaigns = () => {
  const [campaigns] = useState([
    {
      id: "1",
      title: "Privacy-First Social Network",
      status: "active",
      thumbnail: "/api/placeholder/100/60",
      supporters: 67,
      created: "2 weeks ago",
      daysLeft: 23,
      progress: 68
    },
    {
      id: "2", 
      title: "Sustainable Energy Initiative",
      status: "active",
      thumbnail: "/api/placeholder/100/60",
      supporters: 43,
      created: "1 month ago",
      daysLeft: 12,
      progress: 45
    },
    {
      id: "3",
      title: "Open Source Privacy Tools",
      status: "completed",
      thumbnail: "/api/placeholder/100/60",
      supporters: 127,
      created: "3 months ago",
      daysLeft: 0,
      progress: 100
    }
  ]);

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (campaigns.length === 0) {
    return (
      <div className="glass p-12 rounded-2xl border border-red-500/20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No campaigns yet</h3>
          <p className="text-gray-400 mb-6">
            Create your first privacy-first crowdfunding campaign
          </p>
          <Link 
            to="/create-campaign"
            className="btn-primary px-6 py-3 font-semibold hover-lift inline-flex items-center space-x-2"
          >
            <span>Create Your First Campaign</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-red-500/20 overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Your Campaigns</h2>
          <Link 
            to="/create-campaign"
            className="btn-primary px-4 py-2 text-sm font-semibold hover-lift"
          >
            New Campaign
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-4 font-medium text-gray-400">Campaign</th>
              <th className="text-left p-4 font-medium text-gray-400">Supporters</th>
              <th className="text-left p-4 font-medium text-gray-400">Created</th>
              <th className="text-left p-4 font-medium text-gray-400">Time Left</th>
              <th className="text-left p-4 font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b border-gray-800/50 hover:bg-glass-subtle transition-all duration-300">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={campaign.thumbnail} 
                      alt={campaign.title}
                      className="w-16 h-10 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-medium text-white line-clamp-1">{campaign.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(campaign.status)}
                        <div className="text-xs text-gray-500">
                          {campaign.progress}% funded
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{campaign.supporters}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Amounts private
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-gray-300">{campaign.created}</span>
                </td>
                <td className="p-4">
                  {campaign.status === 'active' ? (
                    <div className="flex items-center space-x-1 text-gray-300">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{campaign.daysLeft} days</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Ended</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/campaign/${campaign.id}`}
                      className="p-2 glass rounded-lg border border-gray-700 hover:border-red-500/50 transition-all duration-300"
                      title="View Campaign"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </Link>
                    <button 
                      className="p-2 glass rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
                      title="Edit Campaign"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                    <button 
                      className="p-2 glass rounded-lg border border-gray-700 hover:border-green-500/50 transition-all duration-300"
                      title="Share Campaign"
                    >
                      <Share className="w-4 h-4 text-gray-400" />
                    </button>
                    {campaign.status === 'active' && (
                      <button 
                        className="p-2 glass rounded-lg border border-gray-700 hover:border-yellow-500/50 transition-all duration-300"
                        title="Withdraw Funds"
                      >
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    <button className="p-2 glass rounded-lg border border-gray-700 hover:border-gray-500 transition-all duration-300">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardCampaigns;