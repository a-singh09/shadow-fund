import { useEffect, useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { EERC } from "@avalabs/eerc-sdk";
import { CONTRACTS, CIRCUIT_CONFIG, type EERCMode } from "@/config/contracts";

interface UseEERCReturn {
  eerc: EERC | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  register: () => Promise<void>;
  checkRegistration: () => Promise<void>;
}

export function useEERC(mode: EERCMode = "standalone"): UseEERCReturn {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [eerc, setEerc] = useState<EERC | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize EERC SDK
  useEffect(() => {
    if (!publicClient || !walletClient || !isConnected) {
      setEerc(null);
      return;
    }

    try {
      const contractAddress =
        mode === "standalone"
          ? CONTRACTS.EERC_STANDALONE
          : CONTRACTS.EERC_CONVERTER;

      const eercInstance = new EERC(
        publicClient,
        walletClient,
        contractAddress,
        CIRCUIT_CONFIG,
      );

      setEerc(eercInstance);
      setError(null);
    } catch (err) {
      console.error("Failed to initialize EERC SDK:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initialize EERC SDK",
      );
    }
  }, [publicClient, walletClient, isConnected, mode]);

  // Check registration status
  const checkRegistration = useCallback(async () => {
    if (!eerc || !address) {
      setIsRegistered(false);
      return;
    }

    setIsLoading(true);
    try {
      const registered = await eerc.isRegistered(address);
      setIsRegistered(registered);
      setError(null);
    } catch (err) {
      console.error("Failed to check registration:", err);
      setError(
        err instanceof Error ? err.message : "Failed to check registration",
      );
      setIsRegistered(false);
    } finally {
      setIsLoading(false);
    }
  }, [eerc, address]);

  // Register user with eERC20 system
  const register = useCallback(async () => {
    if (!eerc || !address) {
      throw new Error("EERC not initialized or wallet not connected");
    }

    setIsLoading(true);
    setError(null);

    try {
      await eerc.register();
      setIsRegistered(true);
    } catch (err) {
      console.error("Registration failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [eerc, address]);

  // Check registration when EERC is initialized
  useEffect(() => {
    if (eerc && address) {
      checkRegistration();
    }
  }, [eerc, address, checkRegistration]);

  return {
    eerc,
    isRegistered,
    isLoading,
    error,
    register,
    checkRegistration,
  };
}
