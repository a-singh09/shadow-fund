import { useState, useCallback } from "react";
import { Send, Loader, AlertCircle, CheckCircle, Shield } from "lucide-react";
import { useEERC } from "@/hooks/useEERC";
import { useEERCBalance } from "@/hooks/useEERCBalance";
import { parseEther, formatEther, isAddress } from "viem";
import { EXPLORER_BASE_URL_TX } from "@/config/contracts";

interface PrivateTransferProps {
  mode?: "standalone" | "converter";
  recipientAddress?: string;
  recipientLabel?: string;
  messagePrefix?: string;
  onTransferComplete?: (txHash: string) => void;
  className?: string;
}

const PrivateTransfer = ({
  mode = "standalone",
  recipientAddress = "",
  recipientLabel = "Recipient",
  messagePrefix = "",
  onTransferComplete,
  className = "",
}: PrivateTransferProps) => {
  const { isRegistered } = useEERC(mode);
  const { decryptedBalance, privateTransfer, isLoading, error } =
    useEERCBalance(mode);

  const [recipient, setRecipient] = useState(recipientAddress);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const handleTransfer = useCallback(async () => {
    if (!recipient || !amount) {
      setTransferError("Please fill in all required fields");
      return;
    }

    if (!isAddress(recipient)) {
      setTransferError("Invalid recipient address");
      return;
    }

    let transferAmount: bigint;
    try {
      transferAmount = parseEther(amount);
    } catch {
      setTransferError("Invalid amount format");
      return;
    }

    if (transferAmount <= 0n) {
      setTransferError("Amount must be greater than 0");
      return;
    }

    if (decryptedBalance !== null && transferAmount > decryptedBalance) {
      setTransferError("Insufficient balance");
      return;
    }

    setIsTransferring(true);
    setTransferError(null);
    setTransferSuccess(null);

    try {
      const fullMessage = messagePrefix
        ? `${messagePrefix}:${message}`
        : message;
      const result = await privateTransfer(
        recipient,
        transferAmount,
        fullMessage,
      );

      setTransferSuccess(result.transactionHash);
      setAmount("");
      setMessage("");

      if (onTransferComplete) {
        onTransferComplete(result.transactionHash);
      }
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsTransferring(false);
    }
  }, [
    recipient,
    amount,
    message,
    messagePrefix,
    decryptedBalance,
    privateTransfer,
    onTransferComplete,
  ]);

  const formatBalance = (balance: bigint | null): string => {
    if (balance === null) return "0.00";
    return parseFloat(formatEther(balance)).toFixed(4);
  };

  const setMaxAmount = () => {
    if (decryptedBalance !== null) {
      // Leave a small amount for gas fees
      const maxTransfer =
        decryptedBalance > parseEther("0.01")
          ? decryptedBalance - parseEther("0.01")
          : decryptedBalance;
      setAmount(formatEther(maxTransfer));
    }
  };

  if (!isRegistered) {
    return (
      <div
        className={`glass-subtle p-4 rounded-xl border border-yellow-500/20 ${className}`}
      >
        <div className="flex items-center space-x-2 text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">
            Register with eERC20 to make transfers
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-subtle p-6 rounded-xl border border-red-500/20 ${className}`}
    >
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="w-5 h-5 text-red-400" />
        <h3 className="text-lg font-semibold text-white">Private Transfer</h3>
      </div>

      <div className="space-y-4">
        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {recipientLabel} Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            disabled={!!recipientAddress || isTransferring}
            className="w-full px-4 py-3 bg-black/20 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:border-red-500/50 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">
              Amount (eAVAX)
            </label>
            <div className="text-xs text-gray-400">
              Balance: {formatBalance(decryptedBalance)} eAVAX
              {decryptedBalance !== null && (
                <button
                  onClick={setMaxAmount}
                  className="ml-2 text-red-400 hover:text-red-300 underline"
                >
                  Max
                </button>
              )}
            </div>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.0001"
            min="0"
            disabled={isTransferring}
            className="w-full px-4 py-3 bg-black/20 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:border-red-500/50 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message (Optional)
          </label>
          {messagePrefix && (
            <div className="text-xs text-gray-400 mb-1">
              Prefix: {messagePrefix}:
            </div>
          )}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message..."
            rows={3}
            disabled={isTransferring}
            className="w-full px-4 py-3 bg-black/20 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:border-red-500/50 focus:outline-none resize-none disabled:opacity-50"
          />
        </div>

        {/* Transfer Button */}
        <button
          onClick={handleTransfer}
          disabled={isTransferring || isLoading || !recipient || !amount}
          className="w-full btn-primary py-3 font-semibold hover-lift flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTransferring ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Processing Transfer...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send Private Transfer</span>
            </>
          )}
        </button>

        {/* Error Display */}
        {(transferError || error) && (
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{transferError || error}</span>
          </div>
        )}

        {/* Success Display */}
        {transferSuccess && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Transfer successful!</span>
            </div>
            <div className="text-xs text-gray-400">
              Transaction:{" "}
              <a
                href={`${EXPLORER_BASE_URL_TX}${transferSuccess}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 underline"
              >
                {transferSuccess.slice(0, 10)}...{transferSuccess.slice(-8)}
              </a>
            </div>
          </div>
        )}

        {/* Transfer Info */}
        <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-600/20">
          <div>• Transfers are encrypted and private</div>
          <div>• Only the recipient can decrypt the amount</div>
          <div>• Messages are encrypted with the transfer</div>
          <div>• Gas fees are paid separately in AVAX</div>
        </div>
      </div>
    </div>
  );
};

export default PrivateTransfer;
