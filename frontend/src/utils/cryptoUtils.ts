/**
 * Utility functions for handling cryptographic operations safely
 */

/**
 * Validates if encrypted balance data is properly formatted
 * @param encryptedData - The encrypted data to validate
 * @returns boolean indicating if the data is valid
 */
export function validateEncryptedData(encryptedData: any): boolean {
  try {
    if (!encryptedData) return false;

    // Basic validation - check if it's an array or buffer-like object
    if (Array.isArray(encryptedData)) {
      // For array format, check if last element is 0 (as required by the error message)
      return (
        encryptedData.length > 0 &&
        encryptedData[encryptedData.length - 1] === 0
      );
    }

    // For other formats, just check if it exists
    return true;
  } catch (error) {
    console.warn("Error validating encrypted data:", error);
    return false;
  }
}

/**
 * Safely attempts to decrypt balance data
 * @param decryptFn - The decryption function to call
 * @param fallbackValue - Value to return if decryption fails
 * @returns The decrypted value or fallback
 */
export function safeDecrypt<T>(decryptFn: () => T, fallbackValue: T): T {
  try {
    return decryptFn();
  } catch (error) {
    console.warn("Decryption failed, using fallback:", error);
    return fallbackValue;
  }
}

/**
 * Clears all eERC related data from localStorage
 * @param address - Optional specific address to clear, if not provided clears all
 */
export function clearEERCData(address?: string): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.includes("eerc-key")) {
        if (!address || key.includes(address)) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn("Error clearing eERC data:", error);
  }
}

/**
 * Checks if the error is related to cryptographic operations
 * @param error - The error to check
 * @returns boolean indicating if it's a crypto error
 */
export function isCryptographicError(error: any): boolean {
  if (!error) return false;

  const message = error.message || error.toString();
  const cryptoErrorPatterns = [
    "last element of the message must be 0",
    "decrypt",
    "cipher",
    "encryption",
    "invalid ciphertext",
    "malformed",
    "corrupt",
  ];

  return cryptoErrorPatterns.some((pattern) =>
    message.toLowerCase().includes(pattern.toLowerCase()),
  );
}
