import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACTS } from "@/config/contracts";

// Campaign Factory ABI - minimal interface for campaign creation
const CAMPAIGN_FACTORY_ABI = [
  {
    inputs: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "deadline", type: "uint256" },
    ],
    name: "createCampaign",
    outputs: [{ name: "campaignAddress", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCampaigns",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "creator", type: "address" }],
    name: "getCampaignsByCreator",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCampaignCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface CreateCampaignParams {
  title: string;
  description: string;
  deadline: Date;
  imageHash?: string;
}

interface UseCampaignFactoryReturn {
  createCampaign: (params: CreateCampaignParams) => Promise<{
    campaignAddress: string;
    transactionHash: string;
  }>;
  getCampaigns: () => Promise<string[]>;
  getCampaignsByCreator: (creator: string) => Promise<string[]>;
  getCampaignCount: () => Promise<number>;
  isLoading: boolean;
  error: string | null;
}

export function useCampaignFactory(): UseCampaignFactoryReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = useCallback(
    async (params: CreateCampaignParams) => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      if (
        !CONTRACTS.CAMPAIGN_FACTORY ||
        CONTRACTS.CAMPAIGN_FACTORY ===
          "0x0000000000000000000000000000000000000000"
      ) {
        throw new Error(
          "Campaign factory contract not deployed yet. Please check back later.",
        );
      }

      setIsLoading(true);
      setError(null);

      try {
        // Validate inputs
        if (!params.title.trim()) {
          throw new Error("Campaign title is required");
        }
        if (!params.description.trim()) {
          throw new Error("Campaign description is required");
        }
        if (params.deadline <= new Date()) {
          throw new Error("Campaign deadline must be in the future");
        }

        // Convert deadline to Unix timestamp
        const deadlineTimestamp = Math.floor(params.deadline.getTime() / 1000);

        // Call the contract
        const hash = await walletClient.writeContract({
          address: CONTRACTS.CAMPAIGN_FACTORY as `0x${string}`,
          abi: CAMPAIGN_FACTORY_ABI,
          functionName: "createCampaign",
          args: [params.title, params.description, BigInt(deadlineTimestamp)],
        });

        // Wait for transaction confirmation
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });

        if (!receipt) {
          throw new Error("Transaction receipt not found");
        }

        // Extract campaign address from logs
        let campaignAddress = "";
        if (receipt.logs && receipt.logs.length > 0) {
          // The campaign address should be in the event logs
          // For now, we'll need to decode the logs properly
          // This is a simplified approach - in production, you'd decode the event properly
          campaignAddress = receipt.contractAddress || "";
        }

        // Store image hash temporarily using transaction hash as key
        // This will be updated once we have the proper campaign address
        if (params.imageHash) {
          const { storeCampaignImage } = await import("@/lib/campaignImages");
          storeCampaignImage(`temp_${hash}`, params.imageHash);
        }

        return {
          campaignAddress,
          transactionHash: hash,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create campaign";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, address, publicClient],
  );

  const getCampaigns = useCallback(async () => {
    if (
      !publicClient ||
      !CONTRACTS.CAMPAIGN_FACTORY ||
      CONTRACTS.CAMPAIGN_FACTORY ===
        "0x0000000000000000000000000000000000000000"
    ) {
      return [];
    }

    try {
      const campaigns = await publicClient.readContract({
        address: CONTRACTS.CAMPAIGN_FACTORY as `0x${string}`,
        abi: CAMPAIGN_FACTORY_ABI,
        functionName: "getCampaigns",
      });

      return campaigns as string[];
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
      return [];
    }
  }, [publicClient]);

  const getCampaignsByCreator = useCallback(
    async (creator: string) => {
      if (
        !publicClient ||
        !CONTRACTS.CAMPAIGN_FACTORY ||
        CONTRACTS.CAMPAIGN_FACTORY ===
          "0x0000000000000000000000000000000000000000"
      ) {
        return [];
      }

      try {
        const campaigns = await publicClient.readContract({
          address: CONTRACTS.CAMPAIGN_FACTORY as `0x${string}`,
          abi: CAMPAIGN_FACTORY_ABI,
          functionName: "getCampaignsByCreator",
          args: [creator as `0x${string}`],
        });

        return campaigns as string[];
      } catch (err) {
        console.error("Failed to fetch campaigns by creator:", err);
        return [];
      }
    },
    [publicClient],
  );

  const getCampaignCount = useCallback(async () => {
    if (
      !publicClient ||
      !CONTRACTS.CAMPAIGN_FACTORY ||
      CONTRACTS.CAMPAIGN_FACTORY ===
        "0x0000000000000000000000000000000000000000"
    ) {
      return 0;
    }

    try {
      const count = await publicClient.readContract({
        address: CONTRACTS.CAMPAIGN_FACTORY as `0x${string}`,
        abi: CAMPAIGN_FACTORY_ABI,
        functionName: "getCampaignCount",
      });

      return Number(count);
    } catch (err) {
      console.error("Failed to fetch campaign count:", err);
      return 0;
    }
  }, [publicClient]);

  return {
    createCampaign,
    getCampaigns,
    getCampaignsByCreator,
    getCampaignCount,
    isLoading,
    error,
  };
}
