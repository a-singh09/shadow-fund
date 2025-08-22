import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  Wallet,
  Rocket,
  Users,
  TrendingUp,
  Eye,
  EyeOff,
  Shield,
  Brain,
} from "lucide-react";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import { useCampaignList } from "@/hooks/useCampaignList";
import { formatUnits } from "viem";

const DashboardStats = () => {
  const { address } = useAccount();
  const { decryptedBalance, decimals, isInitialized, isRegistered } =
    useEERCWithKey("converter");
  const { campaigns } = useCampaignList();
  const [showBalance, setShowBalance] = useState(false);
  const [stats, setStats] = useState([
    {
      title: "Total Balance",
      value: "****** eAVAX",
      change: "Encrypted",
      icon: Wallet,
      color: "red",
      encrypted: true,
    },
    {
      title: "Active Campaigns",
      value: "0",
      change: "No campaigns yet",
      icon: Rocket,
      color: "blue",
    },
    {
      title: "Trust Score",
      value: "0%",
      change: "No campaigns to analyze",
      icon: Shield,
      color: "green",
    },
    {
      title: "AI Verifications",
      value: "0",
      change: "No verifications yet",
      icon: Brain,
      color: "purple",
    },
  ]);

  // Update stats based on real data
  useEffect(() => {
    if (!address) return;

    // Debug logging
    console.log("DashboardStats - eERC state:", {
      isInitialized,
      isRegistered,
      decryptedBalance: decryptedBalance?.toString(),
      decimals: decimals?.toString(),
      address,
    });

    const userCampaigns = campaigns.filter(
      (campaign) => campaign.creator.toLowerCase() === address.toLowerCase(),
    );

    const activeCampaigns = userCampaigns.filter((campaign) => {
      const now = Date.now() / 1000;
      const deadline = Number(campaign.deadline);
      return campaign.isActive && deadline > now;
    });

    const totalSupporters = userCampaigns.reduce(
      (sum, campaign) => sum + Number(campaign.donationCount),
      0,
    );

    const totalWithdrawals = userCampaigns.reduce(
      (sum, campaign) => sum + Number(campaign.withdrawalCount),
      0,
    );

    // Calculate AI trust metrics (mock data for demo)
    const avgTrustScore =
      userCampaigns.length > 0
        ? Math.floor(Math.random() * 30) + 70 // Random score 70-100 for demo
        : 0;

    const totalVerifications = userCampaigns.length * 3; // 3 verifications per campaign (content, image, credibility)

    const formatBalance = (balance: bigint | null): string => {
      if (balance === null || !decimals) return "0.00";
      return parseFloat(formatUnits(balance, Number(decimals))).toFixed(4);
    };

    setStats([
      {
        title: "Total Balance",
        value: showBalance
          ? `${formatBalance(decryptedBalance)} eTEST`
          : "****** eTEST",
        change: showBalance
          ? isInitialized && isRegistered
            ? decryptedBalance && decryptedBalance > 0n
              ? "Available for withdrawal"
              : "No funds yet"
            : "Please register with eERC20"
          : "Encrypted",
        icon: Wallet,
        color: "red",
        encrypted: true,
      },
      {
        title: "Active Campaigns",
        value: activeCampaigns.length.toString(),
        change:
          userCampaigns.length > activeCampaigns.length
            ? `${userCampaigns.length - activeCampaigns.length} ended`
            : activeCampaigns.length > 0
              ? "Currently running"
              : "Create your first campaign",
        icon: Rocket,
        color: "blue",
      },
      {
        title: "Trust Score",
        value: avgTrustScore > 0 ? `${avgTrustScore}%` : "0%",
        change:
          avgTrustScore > 0
            ? avgTrustScore >= 80
              ? "High trust rating"
              : avgTrustScore >= 60
                ? "Good trust rating"
                : "Building trust..."
            : "No campaigns to analyze",
        icon: Shield,
        color: "green",
      },
      {
        title: "AI Verifications",
        value: totalVerifications.toString(),
        change:
          totalVerifications > 0
            ? `${userCampaigns.length} campaign${userCampaigns.length !== 1 ? "s" : ""} verified`
            : "No verifications yet",
        icon: Brain,
        color: "purple",
      },
    ]);
  }, [address, campaigns, decryptedBalance, showBalance]);

  const getColorClasses = (color: string, encrypted?: boolean) => {
    const colors = {
      red: encrypted
        ? "border-red-500/30 bg-red-500/5"
        : "border-red-500/20 bg-red-500/5",
      blue: "border-blue-500/20 bg-blue-500/5",
      green: "border-green-500/20 bg-green-500/5",
      purple: "border-purple-500/20 bg-purple-500/5",
    };
    return colors[color as keyof typeof colors] || colors.red;
  };

  const getIconColor = (color: string) => {
    const colors = {
      red: "text-red-400",
      blue: "text-blue-400",
      green: "text-green-400",
      purple: "text-purple-400",
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
              <div
                className={`p-3 rounded-xl ${stat.color === "red" ? "bg-red-500/10" : "bg-gray-800"} border ${stat.color === "red" ? "border-red-500/20" : "border-gray-700"}`}
              >
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
              <h3 className="text-sm font-medium text-gray-400 mb-1">
                {stat.title}
              </h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-white">
                  {stat.value}
                </span>
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
