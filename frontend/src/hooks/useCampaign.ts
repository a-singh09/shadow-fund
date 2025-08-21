import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient, useConfig } from "wagmi";
import { writeContract, waitForTransactionReceipt } from "@wagmi/core";
import { AVALANCHE_FUJI } from "@/config/contracts";

// Campaign Contract ABI - minimal interface for donation registration
const CAMPAIGN_ABI = [
  {
    inputs: [{ name: "txHash", type: "bytes32" }],
    name: "registerDonation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "txHash", type: "bytes32" }],
    name: "registerWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
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
  {
    inputs: [],
    name: "getDonationHashes",
    outputs: [{ name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getWithdrawalHashes",
    outputs: [{ name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface CampaignInfo {
  creator: string;
  title: string;
  description: string;
  deadline: bigint;
  isActive: boolean;
  donationCount: bigint;
  withdrawalCount: bigint;
}

interface UseCampaignReturn {
  registerDonation: (txHash: string) => Promise<{ transactionHash: string }>;
  registerWithdrawal: (txHash: string) => Promise<{ transactionHash: string }>;
  getCampaignInfo: () => Promise<CampaignInfo | null>;
  getDonationHashes: () => Promise<string[]>;
  getWithdrawalHashes: () => Promise<string[]>;
  isLoading: boolean;
  error: string | null;
}

export function useCampaign(campaignAddress?: string): UseCampaignReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const config = useConfig();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerDonation = useCallback(
    async (txHash: string) => {
      if (!address || !campaignAddress) {
        throw new Error(
          "Wallet not connected or campaign address not provided",
        );
      }

      setIsLoading(true);
      setError(null);

      try {
        // Convert transaction hash to bytes32
        const txHashBytes32 = txHash as `0x${string}`;

        // Call the contract using wagmi core
        const hash = await writeContract(config, {
          address: campaignAddress as `0x${string}`,
          abi: CAMPAIGN_ABI,
          functionName: "registerDonation",
          args: [txHashBytes32],
          chainId: AVALANCHE_FUJI.id,
          chain: undefined,
          account: address,
        });

        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(config, { hash });

        return {
          transactionHash: hash,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to register donation";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [address, campaignAddress, config],
  );

  const registerWithdrawal = useCallback(
    async (txHash: string) => {
      if (!address || !campaignAddress) {
        throw new Error(
          "Wallet not connected or campaign address not provided",
        );
      }

      setIsLoading(true);
      setError(null);

      try {
        // Convert transaction hash to bytes32
        const txHashBytes32 = txHash as `0x${string}`;

        // Call the contract using wagmi core
        const hash = await writeContract(config, {
          address: campaignAddress as `0x${string}`,
          abi: CAMPAIGN_ABI,
          functionName: "registerWithdrawal",
          args: [txHashBytes32],
          chainId: AVALANCHE_FUJI.id,
          chain: undefined,
          account: address,
        });

        // Wait for transaction confirmation
        const receipt = await waitForTransactionReceipt(config, { hash });

        return {
          transactionHash: hash,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to register withdrawal";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [address, campaignAddress, config],
  );

  const getCampaignInfo = useCallback(async () => {
    if (!publicClient || !campaignAddress) {
      return null;
    }

    try {
      const info = await publicClient.readContract({
        address: campaignAddress as `0x${string}`,
        abi: CAMPAIGN_ABI,
        functionName: "getCampaignInfo",
      });

      return info as CampaignInfo;
    } catch (err) {
      console.error("Failed to fetch campaign info:", err);
      return null;
    }
  }, [publicClient, campaignAddress]);

  const getDonationHashes = useCallback(async () => {
    if (!publicClient || !campaignAddress) {
      return [];
    }

    try {
      const hashes = await publicClient.readContract({
        address: campaignAddress as `0x${string}`,
        abi: CAMPAIGN_ABI,
        functionName: "getDonationHashes",
      });

      return hashes as string[];
    } catch (err) {
      console.error("Failed to fetch donation hashes:", err);
      return [];
    }
  }, [publicClient, campaignAddress]);

  const getWithdrawalHashes = useCallback(async () => {
    if (!publicClient || !campaignAddress) {
      return [];
    }

    try {
      const hashes = await publicClient.readContract({
        address: campaignAddress as `0x${string}`,
        abi: CAMPAIGN_ABI,
        functionName: "getWithdrawalHashes",
      });

      return hashes as string[];
    } catch (err) {
      console.error("Failed to fetch withdrawal hashes:", err);
      return [];
    }
  }, [publicClient, campaignAddress]);

  return {
    registerDonation,
    registerWithdrawal,
    getCampaignInfo,
    getDonationHashes,
    getWithdrawalHashes,
    isLoading,
    error,
  };
}
