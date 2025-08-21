import { useEffect, useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useEERC as useEERCSDK } from "@avalabs/eerc-sdk";
import { CONTRACTS, CIRCUIT_CONFIG, type EERCMode } from "@/config/contracts";

interface UseEERCReturn {
  // Core SDK properties
  isInitialized: boolean;
  isAllDataFetched: boolean;
  isRegistered: boolean;
  isConverter: boolean;
  publicKey: bigint[] | null;
  auditorAddress: string | null;
  owner: string | null;
  auditorPublicKey: bigint[] | null;
  isAuditorKeySet: boolean;
  name: string | null;
  symbol: string | null;
  isDecryptionKeySet: boolean;
  areYouAuditor: boolean;
  hasBeenAuditor: { isChecking: boolean; isAuditor: boolean };

  // Actions
  generateDecryptionKey: () => Promise<string>;
  register: () => Promise<{ key: string; transactionHash: string }>;
  auditorDecrypt: () => Promise<any[]>;
  isAddressRegistered: (address: string) => {
    isRegistered: boolean;
    error: string;
  };
  useEncryptedBalance: (tokenAddress?: string) => any;
  refetchEercUser: () => void;
  refetchAuditor: () => void;
  setContractAuditorPublicKey: (
    address: string,
  ) => Promise<{ transactionHash: string }>;

  // Custom loading and error states
  isLoading: boolean;
  error: string | null;
}

export function useEERC(mode: EERCMode = "standalone"): UseEERCReturn {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decryptionKey, setDecryptionKey] = useState<string | undefined>(
    undefined,
  );

  // Get contract address based on mode
  const contractAddress =
    mode === "standalone"
      ? CONTRACTS.EERC_STANDALONE
      : CONTRACTS.EERC_CONVERTER;

  // Use the official eERC SDK hook
  const eercSDK = useEERCSDK(
    publicClient,
    walletClient,
    contractAddress,
    CIRCUIT_CONFIG,
    decryptionKey,
  );

  // Wrapper functions for enhanced functionality
  const enhancedGenerateDecryptionKey = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const key = await eercSDK.generateDecryptionKey();
      setDecryptionKey(key);
      return key;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate decryption key";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [eercSDK.generateDecryptionKey]);

  const enhancedRegister = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await eercSDK.register();
      setDecryptionKey(result.key);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [eercSDK.register]);

  const enhancedAuditorDecrypt = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await eercSDK.auditorDecrypt();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Auditor decrypt failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [eercSDK.auditorDecrypt]);

  const enhancedSetContractAuditorPublicKey = useCallback(
    async (address: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await eercSDK.setContractAuditorPublicKey(address);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to set auditor public key";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [eercSDK.setContractAuditorPublicKey],
  );

  return {
    // Core SDK properties
    isInitialized: eercSDK.isInitialized || false,
    isAllDataFetched: eercSDK.isAllDataFetched || false,
    isRegistered: eercSDK.isRegistered || false,
    isConverter: eercSDK.isConverter || false,
    publicKey: eercSDK.publicKey || null,
    auditorAddress: eercSDK.auditorAddress || null,
    owner: eercSDK.owner || null,
    auditorPublicKey: eercSDK.auditorPublicKey || null,
    isAuditorKeySet: eercSDK.isAuditorKeySet || false,
    name: eercSDK.name || null,
    symbol: eercSDK.symbol || null,
    isDecryptionKeySet: eercSDK.isDecryptionKeySet || false,
    areYouAuditor: eercSDK.areYouAuditor || false,
    hasBeenAuditor: eercSDK.hasBeenAuditor || {
      isChecking: false,
      isAuditor: false,
    },

    // Actions (enhanced with loading/error handling)
    generateDecryptionKey: enhancedGenerateDecryptionKey,
    register: enhancedRegister,
    auditorDecrypt: enhancedAuditorDecrypt,
    isAddressRegistered:
      eercSDK.isAddressRegistered ||
      (() => ({ isRegistered: false, error: "Not initialized" })),
    useEncryptedBalance: eercSDK.useEncryptedBalance || (() => null),
    refetchEercUser: eercSDK.refetchEercUser || (() => {}),
    refetchAuditor: eercSDK.refetchAuditor || (() => {}),
    setContractAuditorPublicKey: enhancedSetContractAuditorPublicKey,

    // Custom loading and error states
    isLoading,
    error,
  };
}
