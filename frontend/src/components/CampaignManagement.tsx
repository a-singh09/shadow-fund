import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  Rocket,
  Users,
  Calendar,
  Eye,
  Edit,
  Download,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCampaignList, type CampaignData } from "@/hooks/useCampaignList";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import { formatEther } from "viem";

interface CampaignManagementProps {
  className?: string;
}

const CampaignManagement = ({ className = "" }: CampaignManagementProps) => {
  const { address } = useAccount();
  const { campaigns, loading, error, refetch } = useCampaignList();
  const { decryptedBalance } = useEERCWithKey("converter");

  const [creatorCampaigns, setCreatorCampaigns] = useState<CampaignData[]>([]);

  // Filter campaigns created by the current user
  useEffect(() => {
    if (address && campaigns.length > 0) {
      const userCampaigns = campaigns.filter(
        (campaign) => campaign.creator.toLowerCase() === address.toLowerCase(),
      );
      setCreatorCampaigns(userCampaigns);
    } else {
      setCreatorCampaigns([]);
    }
  }, [address, campaigns]);

  const getStatusBadge = (campaign: CampaignData) => {
    const now = Date.now() / 1000; // Current time in seconds
    const deadline = Number(campaign.deadline);

    if (!campaign.isActive) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full border bg-gray-500/20 text-gray-400 border-gray-500/30">
          Inactive
        </span>
      );
    }

    if (deadline < now) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full border bg-red-500/20 text-red-400 border-red-500/30">
          Ended
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-500/20 text-green-400 border-green-500/30">
        Active
      </span>
    );
  };

  const formatTimeLeft = (deadline: bigint) => {
    const now = Date.now() / 1000;
    const deadlineSeconds = Number(deadline);
    const timeLeft = deadlineSeconds - now;

    if (timeLeft <= 0) {
      return "Ended";
    }

    const days = Math.floor(timeLeft / (24 * 60 * 60));
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} left`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} left`;
    } else {
      return "Less than 1 hour left";
    }
  };

  const formatBalance = (balance: bigint | null): string => {
    if (balance === null) return "0.00";
    return parseFloat(formatEther(balance)).toFixed(4);
  };

  if (loading) {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-red-400" />
          <span className="ml-2 text-gray-400">Loading your campaigns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center space-x-2 text-red-400 mb-4">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={refetch}
          className="btn-secondary px-4 py-2 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (creatorCampaigns.length === 0) {
    return (
      <div
        className={`glass p-12 rounded-xl border border-red-500/20 text-center ${className}`}
      >
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No campaigns yet
          </h3>
          <p className="text-gray-400 mb-6">
            Create your first privacy-first crowdfunding campaign to start
            raising funds
          </p>
          <Link
            to="/create-campaign"
            className="btn-primary px-6 py-3 font-semibold hover-lift inline-flex items-center space-x-2"
          >
            <Rocket className="w-5 h-5" />
            <span>Create Your First Campaign</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass rounded-xl border border-red-500/20 overflow-hidden ${className}`}
    >
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Rocket className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-bold text-white">Your Campaigns</h2>
            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
              {creatorCampaigns.length}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-400">Total Balance</div>
              <div className="text-lg font-semibold text-white">
                {formatBalance(decryptedBalance)} eAVAX
              </div>
            </div>
            <Link
              to="/create-campaign"
              className="btn-primary px-4 py-2 text-sm font-semibold hover-lift"
            >
              New Campaign
            </Link>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-4 font-medium text-gray-400">
                Campaign
              </th>
              <th className="text-left p-4 font-medium text-gray-400">
                Status
              </th>
              <th className="text-left p-4 font-medium text-gray-400">
                Supporters
              </th>
              <th className="text-left p-4 font-medium text-gray-400">
                Time Left
              </th>
              <th className="text-left p-4 font-medium text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {creatorCampaigns.map((campaign) => (
              <tr
                key={campaign.address}
                className="border-b border-gray-800/50 hover:bg-glass-subtle transition-all duration-300"
              >
                <td className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white line-clamp-1 mb-1">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                        {campaign.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        {campaign.address.slice(0, 10)}...
                        {campaign.address.slice(-8)}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="p-4">{getStatusBadge(campaign)}</td>

                <td className="p-4">
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {Number(campaign.donationCount)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Private amounts
                  </div>
                </td>

                <td className="p-4">
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {formatTimeLeft(campaign.deadline)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(
                      Number(campaign.deadline) * 1000,
                    ).toLocaleDateString()}
                  </div>
                </td>

                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/campaign/${campaign.address}`}
                      className="p-2 glass rounded-lg border border-gray-700 hover:border-red-500/50 transition-all duration-300"
                      title="View Campaign"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </Link>

                    <button
                      className="p-2 glass rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
                      title="Edit Campaign"
                      onClick={() => {
                        // TODO: Implement edit functionality
                        console.log("Edit campaign:", campaign.address);
                      }}
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>

                    {campaign.isActive && (
                      <Link
                        to={`/dashboard/withdraw?campaign=${campaign.address}`}
                        className="p-2 glass rounded-lg border border-gray-700 hover:border-green-500/50 transition-all duration-300"
                        title="Withdraw Funds"
                      >
                        <Download className="w-4 h-4 text-gray-400" />
                      </Link>
                    )}

                    <button
                      className="p-2 glass rounded-lg border border-gray-700 hover:border-gray-500 transition-all duration-300"
                      title="More Options"
                      onClick={() => {
                        // TODO: Implement dropdown menu
                        console.log("More options for:", campaign.address);
                      }}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-800 bg-glass-subtle">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            Showing {creatorCampaigns.length} campaign
            {creatorCampaigns.length !== 1 ? "s" : ""}
          </div>
          <button
            onClick={refetch}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignManagement;
