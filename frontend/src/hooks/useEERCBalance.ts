import { useCallback, useState } from "react";
import { useEERC } from "./useEERC";

interface UseEERCBalanceReturn {
  // Balance data
  decryptedBalance: bigint | null;
  parsedDecryptedBalance: string | null;
  encryptedBalance: bigint[] | null;
  auditorPublicKey: bigint[] | null;
  decimals: bigint | null;

  // Actions
  privateMint: (
    recipient: string,
    amount: bigint,
    message?: string,
  ) => Promise<{ transactionHash: string }>;
  privateBurn: (
    amount: bigint,
    message?: string,
  ) => Promise<{ transactionHash: string }>;
  privateTransfer: (
    to: string,
    amount: bigint,
    message?: string,
  ) => Promise<{
    transactionHash: string;
    receiverEncryptedAmount: string[];
    senderEncryptedAmount: string[];
  }>;
  withdraw: (
    amount: bigint,
    message?: string,
  ) => Promise<{ transactionHash: string }>;
  deposit: (
    amount: bigint,
    message?: string,
  ) => Promise<{ transactionHash: string }>;
  decryptMessage: (transactionHash: string) => Promise<{
    decryptedMessage: string;
    messageType: string;
    messageFrom: string;
    messageTo: string;
  }>;
  refetchBalance: () => void;

  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

export function useEERCBalance(
  mode: "standalone" | "converter" = "standalone",
  tokenAddress?: string,
): UseEERCBalanceReturn {
  const { useEncryptedBalance, isRegistered } = useEERC(mode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the encrypted balance hook from the SDK
  const encryptedBalanceHook = useEncryptedBalance
    ? useEncryptedBalance(tokenAddress)
    : null;

  // Enhanced wrapper functions with loading/error handling
  const enhancedPrivateMint = useCallback(
    async (recipient: string, amount: bigint, message?: string) => {
      if (!encryptedBalanceHook?.privateMint) {
        throw new Error("Private mint not available");
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await encryptedBalanceHook.privateMint(
          recipient,
          amount,
          message,
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Private mint failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [encryptedBalanceHook?.privateMint],
  );

  const enhancedPrivateBurn = useCallback(
    async (amount: bigint, message?: string) => {
      if (!encryptedBalanceHook?.privateBurn) {
        throw new Error("Private burn not available");
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await encryptedBalanceHook.privateBurn(amount, message);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Private burn failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [encryptedBalanceHook?.privateBurn],
  );

  const enhancedPrivateTransfer = useCallback(
    async (to: string, amount: bigint, message?: string) => {
      if (!encryptedBalanceHook?.privateTransfer) {
        throw new Error("Private transfer not available");
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await encryptedBalanceHook.privateTransfer(
          to,
          amount,
          message,
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Private transfer failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [encryptedBalanceHook?.privateTransfer],
  );

  const enhancedWithdraw = useCallback(
    async (amount: bigint, message?: string) => {
      if (!encryptedBalanceHook?.withdraw) {
        throw new Error("Withdraw not available");
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await encryptedBalanceHook.withdraw(amount, message);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Withdraw failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [encryptedBalanceHook?.withdraw],
  );

  const enhancedDeposit = useCallback(
    async (amount: bigint, message?: string) => {
      if (!encryptedBalanceHook?.deposit) {
        throw new Error("Deposit not available");
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await encryptedBalanceHook.deposit(amount, message);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Deposit failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [encryptedBalanceHook?.deposit],
  );

  const enhancedDecryptMessage = useCallback(
    async (transactionHash: string) => {
      if (!encryptedBalanceHook?.decryptMessage) {
        throw new Error("Decrypt message not available");
      }

      setIsLoading(true);
      setError(null);
      try {
        const result =
          await encryptedBalanceHook.decryptMessage(transactionHash);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Message decryption failed";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [encryptedBalanceHook?.decryptMessage],
  );

  return {
    // Balance data
    decryptedBalance: encryptedBalanceHook?.decryptedBalance || null,
    parsedDecryptedBalance:
      encryptedBalanceHook?.parsedDecryptedBalance || null,
    encryptedBalance: encryptedBalanceHook?.encryptedBalance || null,
    auditorPublicKey: encryptedBalanceHook?.auditorPublicKey || null,
    decimals: encryptedBalanceHook?.decimals || null,

    // Actions
    privateMint: enhancedPrivateMint,
    privateBurn: enhancedPrivateBurn,
    privateTransfer: enhancedPrivateTransfer,
    withdraw: enhancedWithdraw,
    deposit: enhancedDeposit,
    decryptMessage: enhancedDecryptMessage,
    refetchBalance: encryptedBalanceHook?.refetchBalance || (() => {}),

    // Loading and error states
    isLoading: isLoading || false,
    error,
  };
}
