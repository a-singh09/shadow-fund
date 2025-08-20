import { Heart, Target, Share, MessageSquare, Clock } from 'lucide-react';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'donation_received',
      title: 'New private donation received',
      description: 'Someone supported your "Privacy-First Social Network" campaign',
      time: '2 minutes ago',
      icon: Heart,
      color: 'red'
    },
    {
      id: 2,
      type: 'campaign_milestone',
      title: 'Campaign reached milestone',
      description: 'Your campaign has reached 50% of its supporter goal',
      time: '1 hour ago',
      icon: Target,
      color: 'green'
    },
    {
      id: 3,
      type: 'campaign_shared',
      title: 'Campaign shared on social media',
      description: 'Your campaign was shared 5 times today',
      time: '3 hours ago',
      icon: Share,
      color: 'blue'
    },
    {
      id: 4,
      type: 'update_posted',
      title: 'Campaign update published',
      description: 'You posted an update to "Sustainable Energy Initiative"',
      time: '1 day ago',
      icon: MessageSquare,
      color: 'purple'
    },
    {
      id: 5,
      type: 'donation_received',
      title: 'New private donation received',
      description: 'Anonymous supporter donated to "Open Source Privacy Tools"',
      time: '2 days ago',
      icon: Heart,
      color: 'red'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      red: 'bg-red-500/10 border-red-500/20 text-red-400',
      green: 'bg-green-500/10 border-green-500/20 text-green-400',
      blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400'
    };
    return colors[color as keyof typeof colors] || colors.red;
  };

  return (
    <div className="glass rounded-2xl border border-red-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start space-x-4 p-4 glass-subtle rounded-xl border border-glass-border hover:border-red-500/20 transition-all duration-300">
              <div className={`p-2 rounded-lg border ${getColorClasses(activity.color)}`}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white mb-1">{activity.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">{activity.description}</p>
                <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-400">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;