/**
 * eERC Data Management Utilities
 * Handles cleaning up corrupted eERC data and reinitializing the system
 */

/**
 * Clears all eERC-related data from localStorage
 */
export function clearAllEERCData(): void {
  try {
    const keys = Object.keys(localStorage);
    const eercKeys = keys.filter(
      (key) =>
        key.includes("eerc") ||
        key.includes("eERC") ||
        key.includes("encrypted") ||
        key.includes("balance") ||
        key.includes("key-converter") ||
        key.includes("key-standalone"),
    );

    console.log("Clearing eERC keys:", eercKeys);

    eercKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log("Cleared all eERC data from localStorage");
  } catch (error) {
    console.warn("Error clearing eERC data:", error);
  }
}

/**
 * Clears eERC data for a specific address and mode
 */
export function clearEERCDataForAddress(
  address: string,
  mode: "converter" | "standalone",
): void {
  try {
    const keys = Object.keys(localStorage);
    const addressKeys = keys.filter(
      (key) => key.includes(address.toLowerCase()) && key.includes(mode),
    );

    console.log(
      `Clearing eERC keys for ${address} in ${mode} mode:`,
      addressKeys,
    );

    addressKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log(`Cleared eERC data for ${address} in ${mode} mode`);
  } catch (error) {
    console.warn("Error clearing eERC data for address:", error);
  }
}

/**
 * Checks if there's corrupted eERC data
 */
export function hasCorruptedEERCData(): boolean {
  try {
    const keys = Object.keys(localStorage);
    const eercKeys = keys.filter((key) => key.includes("eerc"));

    // Check for any keys that might contain corrupted data
    for (const key of eercKeys) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          // Try to parse if it's JSON
          if (value.startsWith("{") || value.startsWith("[")) {
            JSON.parse(value);
          }
        }
      } catch (error) {
        console.warn(`Corrupted data found in key: ${key}`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn("Error checking for corrupted data:", error);
    return true; // Assume corrupted if we can't check
  }
}

/**
 * Forces a complete reset of eERC state
 */
export function forceEERCReset(): void {
  console.log("Forcing complete eERC reset...");

  // Clear all localStorage data
  clearAllEERCData();

  // Clear any cached data in memory (if applicable)
  if (typeof window !== "undefined") {
    // Clear any window-level caches
    (window as any).eercCache = undefined;
    (window as any).eercSDKCache = undefined;
  }

  console.log("eERC reset complete");
}

/**
 * Validates encrypted data format
 */
export function validateEncryptedData(data: any): boolean {
  try {
    if (!data) return false;

    // For array format (encrypted balance data)
    if (Array.isArray(data)) {
      // Check if it's a valid encrypted array
      if (data.length === 0) return false;

      // For message arrays, last element should be 0
      if (data.every((item) => typeof item === "number")) {
        return data[data.length - 1] === 0;
      }

      return true;
    }

    // For string format
    if (typeof data === "string") {
      return data.endsWith("\0") || data.length > 0;
    }

    // For object format
    if (typeof data === "object") {
      return true; // Assume valid for now
    }

    return false;
  } catch (error) {
    console.warn("Error validating encrypted data:", error);
    return false;
  }
}
