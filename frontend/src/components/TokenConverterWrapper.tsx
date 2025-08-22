import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import { useAccount } from "wagmi";
import TokenConverterContent from "./TokenConverterContent";

const TokenConverterWrapper: React.FC = () => {
  const { isConnected } = useAccount();
  const eercSDK = useEERCWithKey("converter");
  const { isRegistered, isInitialized, keyLoaded, useEncryptedBalance } =
    eercSDK;

  if (!isConnected) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Connect wallet to convert tokens</span>
        </div>
      </div>
    );
  }

  if (!keyLoaded || !isInitialized) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Initializing eERC20 system...</span>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Please register with eERC20 first to convert tokens</span>
        </div>
      </div>
    );
  }

  if (!useEncryptedBalance) {
    return (
      <div className="p-6 glass rounded-2xl border border-gray-700">
        <div className="flex items-center space-x-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Encrypted balance functionality not available</span>
        </div>
      </div>
    );
  }

  // Only render the content component when everything is ready
  // This ensures useEncryptedBalance is only called when it's safe to do so
  return <TokenConverterContent useEncryptedBalance={useEncryptedBalance} />;
};

export default TokenConverterWrapper;
