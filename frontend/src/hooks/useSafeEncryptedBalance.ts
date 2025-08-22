import { useMemo } from "react";
import { useEERCWithKey } from "./useEERCWithKey";

/**
 * A safe wrapper around useEncryptedBalance that handles errors gracefully
 */
export function useSafeEncryptedBalance(
  tokenAddress: string,
  mode: "standalone" | "converter" = "converter",
) {
  const eercSDK = useEERCWithKey(mode);
  const { isRegistered, isInitialized, keyLoaded, useEncryptedBalance } =
    eercSDK;

  const encryptedBalanceData = useMemo(() => {
    // Only try to use the hook if everything is ready
    if (!useEncryptedBalance || !isRegistered || !isInitialized || !keyLoaded) {
      return {
        deposit: null,
        decryptedBalance: null,
        decimals: null,
        error: null,
        isReady: false,
      };
    }

    try {
      const hook = useEncryptedBalance(tokenAddress);
      return {
        deposit: hook?.deposit || null,
        decryptedBalance: hook?.decryptedBalance || null,
        decimals: hook?.decimals || null,
        error: null,
        isReady: true,
      };
    } catch (error) {
      console.warn("Error in useEncryptedBalance:", error);
      return {
        deposit: null,
        decryptedBalance: null,
        decimals: null,
        error: error instanceof Error ? error.message : "Unknown error",
        isReady: false,
      };
    }
  }, [
    useEncryptedBalance,
    isRegistered,
    isInitialized,
    keyLoaded,
    tokenAddress,
  ]);

  return {
    ...eercSDK,
    ...encryptedBalanceData,
  };
}
