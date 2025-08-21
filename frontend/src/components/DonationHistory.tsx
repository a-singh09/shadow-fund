import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  Heart,
  MessageSquare,
  Clock,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
} from "lucide-react";
import { useEERCBalance } from "@/hooks/useEERCBalance";
import { useCampaign } from "@/hooks/useCampaign";
import { EXPLORER_BASE_URL_TX } from "@/config/contracts";

interface DecryptedDonation {
  txHash: string;
  donor: string;
  message: string;
  timestamp: number;
  campaignAddress?: string;
}

interface DonationHistoryProps {
  campaignAddress?: string;
  className?: string;
}

const DonationHistory = ({
  campaignAddress,
  className = "",
}: DonationHistoryProps) => {
  const { address } = useAccount();
  const { decryptMessage } = useEERCBalance("standalone");
  const { getDonationHashes } = useCampaign(campaignAddress);

  const [donations, setDonations] = useState<DecryptedDonation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMessages, setShowMessages] = useState(false);

  const fetchDonationHistory = useCallback(async () => {
    if (!campaignAddress) return;

    setLoading(true);
    setError(null);

    try {
      // Get donation transaction hashes from campaign contract
      const donationHashes = await getDonationHashes();

      if (donationHashes.length === 0) {
        setDonations([]);
        return;
      }

      // Decrypt messages for each donation
      const decryptedDonations: DecryptedDonation[] = [];

      for (const txHash of donationHashes) {
        try {
          const decryptedData = await decryptMessage(txHash);

          // Parse the donation message format: "DONATION:campaignAddr:message"
          const messageParts = decryptedData.decryptedMessage.split(":");
          let userMessage = "";
          let donationCampaignAddr = "";

          if (messageParts[0] === "DONATION" && messageParts.length >= 3) {
            donationCampaignAddr = messageParts[1];
            userMessage = messageParts.slice(2).join(":"); // Rejoin in case message contains colons
          } else {
            userMessage = decryptedData.decryptedMessage;
          }

          decryptedDonations.push({
            txHash,
            donor: decryptedData.messageFrom,
            message: userMessage,
            timestamp: Date.now(), // In real implementation, get from blockchain
            campaignAddress: donationCampaignAddr,
          });
        } catch (err) {
          console.error(`Failed to decrypt message for tx ${txHash}:`, err);
          // Add entry with error message
          decryptedDonations.push({
            txHash,
            donor: "Unknown",
            message: "Failed to decrypt message",
            timestamp: Date.now(),
          });
        }
      }

      // Sort by timestamp (newest first)
      decryptedDonations.sort((a, b) => b.timestamp - a.timestamp);
      setDonations(decryptedDonations);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load donation history",
      );
    } finally {
      setLoading(false);
    }
  }, [campaignAddress, getDonationHashes, decryptMessage]);

  useEffect(() => {
    if (campaignAddress) {
      fetchDonationHistory();
    }
  }, [fetchDonationHistory]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      return "Less than an hour ago";
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-red-400" />
          <span className="ml-2 text-gray-400">
            Loading donation history...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass rounded-xl border border-red-500/20 ${className}`}>
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">
              Donation History
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMessages(!showMessages)}
              className="flex items-center space-x-1 px-3 py-1 glass rounded-lg border border-gray-600/20 hover:border-red-500/50 transition-all duration-300"
              title={showMessages ? "Hide messages" : "Show messages"}
            >
              {showMessages ? (
                <EyeOff className="w-4 h-4 text-red-400" />
              ) : (
                <Eye className="w-4 h-4 text-red-400" />
              )}
              <span className="text-sm text-gray-400">
                {showMessages ? "Hide" : "Show"} Messages
              </span>
            </button>
            <button
              onClick={fetchDonationHistory}
              className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {donations.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-400 mb-2">
              No donations yet
            </h4>
            <p className="text-sm text-gray-500">
              Donations will appear here once supporters contribute to your
              campaign
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map((donation, index) => (
              <div
                key={donation.txHash}
                className="glass-subtle p-4 rounded-lg border border-gray-700/30 hover:border-red-500/20 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <Heart className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white">
                          Anonymous Donation
                        </span>
                        <span className="text-xs text-gray-500">
                          #{donations.length - index}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                        <span>From: {formatAddress(donation.donor)}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(donation.timestamp)}</span>
                        </div>
                      </div>

                      {showMessages && donation.message && (
                        <div className="mt-3 p-3 bg-black/20 border border-gray-600/20 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5" />
                            <div>
                              <div className="text-xs text-blue-400 mb-1">
                                Message from supporter:
                              </div>
                              <p className="text-sm text-gray-300 italic">
                                "{donation.message}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Amount</div>
                    <div className="text-lg font-semibold text-red-400">
                      Private
                    </div>
                    <div className="text-xs text-gray-500">Encrypted</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700/30">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Transaction Hash:</span>
                    <a
                      href={`${EXPLORER_BASE_URL_TX}${donation.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 underline"
                    >
                      {formatAddress(donation.txHash)}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationHistory;
