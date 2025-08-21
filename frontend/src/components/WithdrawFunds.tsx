import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  ArrowUpRight,
  Loader,
  AlertCircle,
  CheckCircle,
  Shield,
} from "lucide-react";
import { useEERC } from "@/hooks/useEERC";
import { useEERCBalance } from "@/hooks/useEERCBalance";
import { parseEther, formatEther } from "viem";
import { EXPLORER_BASE_URL_TX } from "@/config/contracts";

interface WithdrawFundsProps {
  campaignAddress?: string;
  mode?: "standalone" | "converter";
  onWithdrawComplete?: (txHash: string) => void;
  className?: string;
}

const WithdrawFunds = ({
  campaignAddress,
  mode = "standalone",
  onWithdrawComplete,
  className = "",
}: WithdrawFundsProps) => {
  const { address } = useAccount();
  const { isRegistered } = useEERC(mode);
  const { decryptedBalance, withdraw, isLoading, error } = useEERCBalance(mode);

  const [amount, setAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const handleWithdraw = useCallback(async () => {
    if (!address) {
      setWithdrawError("Wallet not connected");
      return;
    }

    if (!amount) {
      setWithdrawError("Please enter an amount");
      return;
    }

    let withdrawAmount: bigint;
    try {
      withdrawAmount = parseEther(amount);
    } catch {
      setWithdrawError("Invalid amount format");
      return;
    }

    if (withdrawAmount <= 0n) {
      setWithdrawError("Amount must be greater than 0");
      return;
    }

    if (decryptedBalance !== null && withdrawAmount > decryptedBalance) {
      setWithdrawError("Insufficient balance");
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);

    try {
      // Create withdrawal message
      const withdrawalMessage = campaignAddress
        ? `WITHDRAWAL:${campaignAddress}`
        : "WITHDRAWAL";

      // Withdraw funds using SDK
      const result = await withdraw(withdrawAmount, withdrawalMessage);

      setWithdrawSuccess(result.transactionHash);
      setAmount("");

      if (onWithdrawComplete) {
        onWithdrawComplete(result.transactionHash);
      }
    } catch (err) {
      setWithdrawError(
        err instanceof Error ? err.message : "Withdrawal failed",
      );
    } finally {
      setIsWithdrawing(false);
    }
  }, [
    address,
    amount,
    campaignAddress,
    decryptedBalance,
    withdraw,
    onWithdrawComplete,
  ]);

  const formatBalance = (balance: bigint | null): string => {
    if (balance === null) return "0.00";
    return parseFloat(formatEther(balance)).toFixed(4);
  };

  const setMaxAmount = () => {
    if (decryptedBalance !== null) {
      // Leave a small amount for gas fees
      const maxWithdraw =
        decryptedBalance > parseEther("0.01")
          ? decryptedBalance - parseEther("0.01")
          : decryptedBalance;
      setAmount(formatEther(maxWithdraw));
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
            Register with eERC20 to withdraw funds
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
        <h3 className="text-lg font-semibold text-white">Withdraw Funds</h3>
      </div>

      <div className="space-y-4">
        {/* Available Balance */}
        <div className="glass p-4 rounded-lg border border-gray-600/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Available Balance</span>
            <span className="text-lg font-semibold text-white">
              {formatBalance(decryptedBalance)} eAVAX
            </span>
          </div>
        </div>

        {/* Withdrawal Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">
              Withdrawal Amount (eAVAX)
            </label>
            {decryptedBalance !== null && (
              <button
                onClick={setMaxAmount}
                className="text-xs text-red-400 hover:text-red-300 underline"
              >
                Withdraw Max
              </button>
            )}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.0001"
            min="0"
            disabled={isWithdrawing}
            className="w-full px-4 py-3 bg-black/20 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:border-red-500/50 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Withdrawal Info */}
        <div className="glass-subtle p-4 rounded-lg border border-blue-500/10">
          <div className="text-sm text-blue-400 mb-2">Withdrawal Process</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>• Funds are transferred to your wallet privately</div>
            <div>• Transaction is recorded for campaign tracking</div>
            <div>• Small gas fee required for transaction</div>
            {campaignAddress && (
              <div>
                • Withdrawal linked to campaign: {campaignAddress.slice(0, 10)}
                ...
              </div>
            )}
          </div>
        </div>

        {/* Withdraw Button */}
        <button
          onClick={handleWithdraw}
          disabled={isWithdrawing || isLoading || !amount}
          className="w-full btn-primary py-3 font-semibold hover-lift flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isWithdrawing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Processing Withdrawal...</span>
            </>
          ) : (
            <>
              <ArrowUpRight className="w-5 h-5" />
              <span>Withdraw Funds</span>
            </>
          )}
        </button>

        {/* Error Display */}
        {(withdrawError || error) && (
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{withdrawError || error}</span>
          </div>
        )}

        {/* Success Display */}
        {withdrawSuccess && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Withdrawal successful!</span>
            </div>
            <div className="text-xs text-gray-400">
              Transaction:{" "}
              <a
                href={`${EXPLORER_BASE_URL_TX}${withdrawSuccess}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 underline"
              >
                {withdrawSuccess.slice(0, 10)}...{withdrawSuccess.slice(-8)}
              </a>
            </div>
            <div className="text-xs text-gray-400">
              Remember to register this withdrawal with your campaign contract
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawFunds;
