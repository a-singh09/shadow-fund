import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  Heart,
  Target,
  Share,
  MessageSquare,
  Clock,
  Download,
  Rocket,
} from "lucide-react";
import { useCampaignList } from "@/hooks/useCampaignList";

interface Activity {
  id: string;
  type:
    | "donation_received"
    | "campaign_created"
    | "withdrawal_made"
    | "campaign_milestone";
  title: string;
  description: string;
  time: string;
  icon: any;
  color: string;
  campaignAddress?: string;
}

const RecentActivity = () => {
  const { address } = useAccount();
  const { campaigns } = useCampaignList();
  const [activities, setActivities] = useState<Activity[]>([]);

  // Generate activities based on user's campaigns
  useEffect(() => {
    if (!address || campaigns.length === 0) {
      setActivities([]);
      return;
    }

    const userCampaigns = campaigns.filter(
      (campaign) => campaign.creator.toLowerCase() === address.toLowerCase(),
    );

    const generatedActivities: Activity[] = [];

    userCampaigns.forEach((campaign, index) => {
      // Campaign creation activity
      generatedActivities.push({
        id: `campaign-${campaign.address}`,
        type: "campaign_created",
        title: "Campaign created",
        description: `You launched "${campaign.title}"`,
        time: `${index + 1} week${index > 0 ? "s" : ""} ago`,
        icon: Rocket,
        color: "blue",
        campaignAddress: campaign.address,
      });

      // Donation activities based on donation count
      const donationCount = Number(campaign.donationCount);
      if (donationCount > 0) {
        generatedActivities.push({
          id: `donations-${campaign.address}`,
          type: "donation_received",
          title: "Private donations received",
          description: `${donationCount} supporter${donationCount > 1 ? "s" : ""} contributed to "${campaign.title}"`,
          time: `${Math.floor(Math.random() * 5) + 1} day${Math.floor(Math.random() * 5) > 0 ? "s" : ""} ago`,
          icon: Heart,
          color: "red",
          campaignAddress: campaign.address,
        });
      }

      // Withdrawal activities based on withdrawal count
      const withdrawalCount = Number(campaign.withdrawalCount);
      if (withdrawalCount > 0) {
        generatedActivities.push({
          id: `withdrawals-${campaign.address}`,
          type: "withdrawal_made",
          title: "Funds withdrawn",
          description: `You made ${withdrawalCount} withdrawal${withdrawalCount > 1 ? "s" : ""} from "${campaign.title}"`,
          time: `${Math.floor(Math.random() * 3) + 1} day${Math.floor(Math.random() * 3) > 0 ? "s" : ""} ago`,
          icon: Download,
          color: "green",
          campaignAddress: campaign.address,
        });
      }

      // Milestone activities for campaigns with donations
      if (donationCount >= 5) {
        generatedActivities.push({
          id: `milestone-${campaign.address}`,
          type: "campaign_milestone",
          title: "Campaign milestone reached",
          description: `"${campaign.title}" reached ${donationCount} supporters`,
          time: `${Math.floor(Math.random() * 7) + 1} day${Math.floor(Math.random() * 7) > 0 ? "s" : ""} ago`,
          icon: Target,
          color: "purple",
          campaignAddress: campaign.address,
        });
      }
    });

    // Sort by most recent (simulate with random but consistent ordering)
    generatedActivities.sort((a, b) => {
      const timeA = parseInt(a.time.split(" ")[0]);
      const timeB = parseInt(b.time.split(" ")[0]);
      return timeA - timeB;
    });

    // Limit to 5 most recent activities
    setActivities(generatedActivities.slice(0, 5));
  }, [address, campaigns]);

  const getColorClasses = (color: string) => {
    const colors = {
      red: "bg-red-500/10 border-red-500/20 text-red-400",
      green: "bg-green-500/10 border-green-500/20 text-green-400",
      blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
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
            <div
              key={activity.id}
              className="flex items-start space-x-4 p-4 glass-subtle rounded-xl border border-glass-border hover:border-red-500/20 transition-all duration-300"
            >
              <div
                className={`p-2 rounded-lg border ${getColorClasses(activity.color)}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white mb-1">
                  {activity.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {activity.description}
                </p>
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
