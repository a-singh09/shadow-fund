import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { useCampaignFactory } from "./useCampaignFactory";
import { CONTRACTS } from "@/config/contracts";

// Campaign Contract ABI for reading campaign info
const CAMPAIGN_ABI = [
  {
    inputs: [],
    name: "getCampaignInfo",
    outputs: [
      {
        components: [
          { name: "creator", type: "address" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "deadline", type: "uint256" },
          { name: "isActive", type: "bool" },
          { name: "donationCount", type: "uint256" },
          { name: "withdrawalCount", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface CampaignData {
  address: string;
  creator: string;
  title: string;
  description: string;
  deadline: bigint;
  isActive: boolean;
  donationCount: bigint;
  withdrawalCount: bigint;
}

interface UseCampaignListReturn {
  campaigns: CampaignData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCampaignList(): UseCampaignListReturn {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicClient = usePublicClient();
  const { getCampaigns } = useCampaignFactory();

  const fetchCampaignInfo = useCallback(
    async (address: string): Promise<CampaignData | null> => {
      if (!publicClient) return null;

      try {
        const info = await publicClient.readContract({
          address: address as `0x${string}`,
          abi: CAMPAIGN_ABI,
          functionName: "getCampaignInfo",
        });

        return {
          address,
          creator: info.creator,
          title: info.title,
          description: info.description,
          deadline: info.deadline,
          isActive: info.isActive,
          donationCount: info.donationCount,
          withdrawalCount: info.withdrawalCount,
        };
      } catch (err) {
        console.error(`Failed to fetch info for campaign ${address}:`, err);
        return null;
      }
    },
    [publicClient],
  );

  const fetchCampaigns = useCallback(async () => {
    if (!publicClient) return;

    try {
      setLoading(true);
      setError(null);

      // Check if campaign factory is deployed
      if (
        !CONTRACTS.CAMPAIGN_FACTORY ||
        CONTRACTS.CAMPAIGN_FACTORY ===
          "0x0000000000000000000000000000000000000000"
      ) {
        setCampaigns([]);
        return;
      }

      const campaignAddresses = await getCampaigns();

      if (campaignAddresses.length === 0) {
        setCampaigns([]);
        return;
      }

      // Fetch campaign info for each address
      const campaignPromises = campaignAddresses.map(fetchCampaignInfo);
      const campaignResults = await Promise.all(campaignPromises);

      const validCampaigns = campaignResults.filter(
        (campaign): campaign is CampaignData => campaign !== null,
      );

      setCampaigns(validCampaigns);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [publicClient, getCampaigns, fetchCampaignInfo]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchCampaigns,
  };
}
