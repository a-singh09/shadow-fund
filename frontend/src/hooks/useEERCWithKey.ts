import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useEERC as useEERCSDK } from "@avalabs/eerc-sdk";
import {
  CONTRACTS,
  CIRCUIT_CONFIG,
  getEncryptedERCAddress,
} from "@/config/contracts";

export function useEERCWithKey(
  mode: "standalone" | "converter" = "standalone",
) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [decryptionKey, setDecryptionKey] = useState<string | undefined>(
    undefined,
  );
  const [keyLoaded, setKeyLoaded] = useState(false);

  // Load stored key when wallet connects
  useEffect(() => {
    if (address && isConnected) {
      const storedKey = localStorage.getItem(`eerc-key-${mode}-${address}`);
      setDecryptionKey(storedKey || undefined);
      setKeyLoaded(true);
    } else {
      setDecryptionKey(undefined);
      setKeyLoaded(false);
    }
  }, [address, isConnected, mode]);

  // Initialize eERC SDK
  const contractAddress = getEncryptedERCAddress(mode);

  // Always initialize the SDK (with or without key) so we can generate keys
  const eercSDK = useEERCSDK(
    publicClient,
    walletClient,
    contractAddress,
    CIRCUIT_CONFIG,
    decryptionKey,
  );

  // Always call useEncryptedBalance - this must be called unconditionally
  // according to the Rules of Hooks
  let encryptedBalanceHook = null;
  try {
    encryptedBalanceHook = eercSDK.useEncryptedBalance
      ? eercSDK.useEncryptedBalance()
      : null;
  } catch (error) {
    console.warn("Error initializing encrypted balance hook:", error);
    // Continue with null - this will be handled gracefully by the component
    encryptedBalanceHook = null;
  }

  // Generate and store decryption key
  const generateAndStoreKey = useCallback(async (): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (!walletClient) {
      throw new Error("Wallet client not available");
    }

    // Wait for SDK to be initialized (it should be initialized without a key)
    let attempts = 0;
    while (!eercSDK.isInitialized && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!eercSDK.isInitialized) {
      throw new Error("Failed to initialize eERC SDK");
    }

    const key = await eercSDK.generateDecryptionKey();

    // Store the key
    localStorage.setItem(`eerc-key-${mode}-${address}`, key);

    // Update state to trigger re-initialization
    setDecryptionKey(key);

    return key;
  }, [address, walletClient, eercSDK, mode]);

  // Register with eERC protocol
  const registerWithKey = useCallback(async (): Promise<{
    key: string;
    transactionHash: string;
  }> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    let key = decryptionKey;

    // Generate key if not present
    if (!key) {
      key = await generateAndStoreKey();

      // Give the SDK a moment to reinitialize with the new key
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Wait for SDK to be ready
    let attempts = 0;
    while (!eercSDK.isInitialized && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!eercSDK.isInitialized) {
      throw new Error("eERC SDK not initialized");
    }

    // Now register
    const result = await eercSDK.register();

    return {
      key: key,
      transactionHash: result.transactionHash,
    };
  }, [address, decryptionKey, generateAndStoreKey, eercSDK]);

  const hasStoredKey = useCallback((): boolean => {
    if (!address) return false;
    return !!localStorage.getItem(`eerc-key-${mode}-${address}`);
  }, [address, mode]);

  // The encryptedBalanceHook was already called at the top level

  return {
    ...eercSDK,
    generateAndStoreKey,
    registerWithKey,
    hasStoredKey,
    keyLoaded,
    decryptionKey,

    // Balance functionality with safe access
    decryptedBalance: (() => {
      try {
        return encryptedBalanceHook?.decryptedBalance || null;
      } catch (error) {
        console.warn("Error accessing decrypted balance:", error);
        return null;
      }
    })(),
    parsedDecryptedBalance: (() => {
      try {
        return encryptedBalanceHook?.parsedDecryptedBalance || null;
      } catch (error) {
        console.warn("Error accessing parsed decrypted balance:", error);
        return null;
      }
    })(),
    encryptedBalance: encryptedBalanceHook?.encryptedBalance || null,
    auditorPublicKey: encryptedBalanceHook?.auditorPublicKey || null,
    decimals: encryptedBalanceHook?.decimals || null,

    // Balance actions
    privateMint:
      encryptedBalanceHook?.privateMint ||
      (async () => {
        throw new Error("Private mint not available");
      }),
    privateBurn:
      encryptedBalanceHook?.privateBurn ||
      (async () => {
        throw new Error("Private burn not available");
      }),
    privateTransfer:
      encryptedBalanceHook?.privateTransfer ||
      (async () => {
        throw new Error("Private transfer not available");
      }),
    withdraw:
      encryptedBalanceHook?.withdraw ||
      (async () => {
        throw new Error("Withdraw not available");
      }),
    deposit:
      encryptedBalanceHook?.deposit ||
      (async () => {
        throw new Error("Deposit not available");
      }),

    refetchBalance: encryptedBalanceHook?.refetchBalance || (() => {}),
  };
}
