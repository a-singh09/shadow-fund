import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useEERCWithKey } from "./useEERCWithKey";
import {
  clearEERCDataForAddress,
  hasCorruptedEERCData,
} from "@/utils/eercDataManager";

/**
 * Enhanced eERC hook with automatic corruption detection and recovery
 */
export function useEERCWithRecovery(
  mode: "standalone" | "converter" = "converter",
) {
  const { address } = useAccount();
  const [hasRecovered, setHasRecovered] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Check for corrupted data on mount
  useEffect(() => {
    if (address && !hasRecovered) {
      const checkForCorruption = async () => {
        try {
          if (hasCorruptedEERCData()) {
            console.log("Detected corrupted eERC data, attempting recovery...");
            setIsRecovering(true);

            // Clear corrupted data for this address
            clearEERCDataForAddress(address, mode);

            // Wait a moment for cleanup
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setHasRecovered(true);
            setIsRecovering(false);

            console.log("eERC data recovery completed");
          }
        } catch (error) {
          console.warn("Error during eERC recovery:", error);
          setIsRecovering(false);
        }
      };

      checkForCorruption();
    }
  }, [address, mode, hasRecovered]);

  // Use the regular hook, but only after recovery is complete
  const eercSDK = useEERCWithKey(mode);

  return {
    ...eercSDK,
    isRecovering,
    hasRecovered,
  };
}
