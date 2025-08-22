import { useState, useEffect } from "react";
import { Eye, EyeOff, RefreshCw, Shield, AlertCircle } from "lucide-react";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import { formatEther } from "viem";

interface EncryptedBalanceProps {
  mode?: "standalone" | "converter";
  showTitle?: boolean;
  className?: string;
}

const EncryptedBalance = ({
  mode = "standalone",
  showTitle = true,
  className = "",
}: EncryptedBalanceProps) => {
  const { isRegistered, decryptedBalance, encryptedBalance, refetchBalance } =
    useEERCWithKey(mode);

  const isLoading = false; // useEERCWithKey doesn't have separate loading state
  const error = null; // useEERCWithKey doesn't have separate error state

  const [showDecrypted, setShowDecrypted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      refetchBalance();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatBalance = (balance: bigint | bigint[] | null): string => {
    if (balance === null) return "0.00";
    if (Array.isArray(balance)) {
      // For encrypted balance array, show as encrypted
      return "••••••••";
    }
    return parseFloat(formatEther(balance)).toFixed(4);
  };

  if (!isRegistered) {
    return (
      <div
        className={`glass-subtle p-4 rounded-xl border border-yellow-500/20 ${className}`}
      >
        <div className="flex items-center space-x-2 text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Register with eERC20 to view balance</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-subtle p-6 rounded-xl border border-red-500/20 ${className}`}
    >
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-400" />
            <span>Private Balance</span>
          </h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Encrypted Balance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Encrypted Balance</label>
            <div className="text-xs text-gray-500">Always visible</div>
          </div>
          <div className="glass p-3 rounded-lg border border-gray-600/20">
            <div className="font-mono text-white">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                `${formatBalance(encryptedBalance)} eAVAX`
              )}
            </div>
          </div>
        </div>

        {/* Decrypted Balance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">Decrypted Balance</label>
            <button
              onClick={() => setShowDecrypted(!showDecrypted)}
              className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              {showDecrypted ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>
          <div className="glass p-3 rounded-lg border border-gray-600/20">
            <div className="font-mono text-white">
              {showDecrypted ? (
                isLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Decrypting...</span>
                  </div>
                ) : decryptedBalance !== null ? (
                  `${formatBalance(decryptedBalance)} eAVAX`
                ) : (
                  <span className="text-gray-400">Unable to decrypt</span>
                )
              ) : (
                <span className="text-gray-400">••••••••</span>
              )}
            </div>
          </div>
        </div>

        {/* Balance Info */}
        <div className="text-xs text-gray-400 space-y-1">
          <div>• Encrypted balance is visible to everyone</div>
          <div>• Decrypted balance is only visible to you</div>
          <div>• Balances update after transactions are confirmed</div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EncryptedBalance;
