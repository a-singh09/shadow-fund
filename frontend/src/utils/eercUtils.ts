/**
 * Utility functions for eERC SDK message formatting
 */

/**
 * Formats a message for eERC SDK by ensuring it's null-terminated
 * The eERC SDK requires messages to end with 0 (null terminator)
 */
export function formatMessageForEERC(message: string): string {
  // If message is empty, return just the null terminator
  if (!message) {
    return "\0";
  }

  // If message already ends with null terminator, return as is
  if (message.endsWith("\0")) {
    return message;
  }

  // Add null terminator
  return message + "\0";
}

/**
 * Validates if encrypted data is properly formatted for eERC
 */
export function validateEERCMessage(data: any): boolean {
  try {
    if (!data) return false;

    // For string messages, check if they end with null terminator
    if (typeof data === "string") {
      return data.endsWith("\0");
    }

    // For array format, check if last element is 0
    if (Array.isArray(data)) {
      return data.length > 0 && data[data.length - 1] === 0;
    }

    return true;
  } catch (error) {
    console.warn("Error validating eERC message:", error);
    return false;
  }
}

/**
 * Handles eERC SDK errors gracefully
 */
export function handleEERCError(error: any): string {
  if (!error) return "Unknown error";

  const message = error.message || error.toString();

  // Handle specific eERC errors
  if (message.includes("last element of the message must be 0")) {
    return "Message formatting error. Please try again.";
  }

  if (message.includes("Token address is not set")) {
    return "Token not registered with eERC20 contract.";
  }

  if (message.includes("UserNotRegistered")) {
    return "Please register with eERC20 first.";
  }

  if (message.includes("insufficient allowance")) {
    return "Token approval failed. Please try again.";
  }

  if (message.includes("User rejected")) {
    return "Transaction was rejected.";
  }

  return message;
}
