import { useState } from 'react';
import { Wallet, Rocket, Users, TrendingUp, Eye, EyeOff } from 'lucide-react';

const DashboardStats = () => {
  const [showBalance, setShowBalance] = useState(false);

  const stats = [
    {
      title: "Total Balance",
      value: showBalance ? "2,847.52 eERC20" : "****** eERC20",
      change: showBalance ? "+12.3% this month" : "Encrypted",
      icon: Wallet,
      color: "red",
      encrypted: true
    },
    {
      title: "Active Campaigns",
      value: "3",
      change: "+1 this month",
      icon: Rocket,
      color: "blue"
    },
    {
      title: "Total Supporters",
      value: "127",
      change: "+23 this week",
      icon: Users,
      color: "green"
    },
    {
      title: "New Supporters",
      value: "18",
      change: "+45% vs last month",
      icon: TrendingUp,
      color: "purple"
    }
  ];

  const getColorClasses = (color: string, encrypted?: boolean) => {
    const colors = {
      red: encrypted 
        ? "border-red-500/30 bg-red-500/5" 
        : "border-red-500/20 bg-red-500/5",
      blue: "border-blue-500/20 bg-blue-500/5",
      green: "border-green-500/20 bg-green-500/5",
      purple: "border-purple-500/20 bg-purple-500/5"
    };
    return colors[color as keyof typeof colors] || colors.red;
  };

  const getIconColor = (color: string) => {
    const colors = {
      red: "text-red-400",
      blue: "text-blue-400", 
      green: "text-green-400",
      purple: "text-purple-400"
    };
    return colors[color as keyof typeof colors] || colors.red;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`glass p-6 rounded-2xl border ${getColorClasses(stat.color, stat.encrypted)} hover-lift transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color === 'red' ? 'bg-red-500/10' : 'bg-gray-800'} border ${stat.color === 'red' ? 'border-red-500/20' : 'border-gray-700'}`}>
                <Icon className={`w-6 h-6 ${getIconColor(stat.color)}`} />
              </div>
              {stat.encrypted && (
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 glass rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-all duration-300"
                  title={showBalance ? "Hide balance" : "Show balance"}
                >
                  {showBalance ? (
                    <EyeOff className="w-4 h-4 text-red-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-red-400" />
                  )}
                </button>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">{stat.title}</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{stat.change}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;