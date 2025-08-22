import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Shield, Wallet, Send, Eye } from "lucide-react";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import EeRC20RegistrationFlow from "./EeRC20RegistrationFlow";
import EncryptedBalance from "./EncryptedBalance";
import PrivateTransfer from "./PrivateTransfer";

interface EERCDashboardProps {
  mode?: "standalone" | "converter";
  showTransfer?: boolean;
  transferRecipient?: string;
  transferLabel?: string;
  messagePrefix?: string;
  onTransferComplete?: (txHash: string) => void;
  className?: string;
}

const EERCDashboard = ({
  mode = "standalone",
  showTransfer = true,
  transferRecipient,
  transferLabel,
  messagePrefix,
  onTransferComplete,
  className = "",
}: EERCDashboardProps) => {
  const { isConnected } = useAccount();
  const { isRegistered, keyLoaded } = useEERCWithKey(mode);
  const isLoading = !keyLoaded;

  const [showRegistrationFlow, setShowRegistrationFlow] = useState(false);
  const [activeTab, setActiveTab] = useState<"balance" | "transfer">("balance");

  // Show registration flow if user is connected but not registered
  useEffect(() => {
    if (isConnected && !isRegistered && !isLoading) {
      setShowRegistrationFlow(true);
    }
  }, [isConnected, isRegistered, isLoading]);

  const handleRegistrationComplete = () => {
    setShowRegistrationFlow(false);
  };

  const handleRegistrationClose = () => {
    setShowRegistrationFlow(false);
  };

  if (!isConnected) {
    return (
      <div
        className={`glass-subtle p-6 rounded-xl border border-yellow-500/20 ${className}`}
      >
        <div className="text-center">
          <Wallet className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-400 text-sm">
            Connect your wallet to access eERC20 privacy features
          </p>
        </div>
      </div>
    );
  }

  if (!isRegistered && !showRegistrationFlow) {
    return (
      <div
        className={`glass-subtle p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            eERC20 Registration Required
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Register with the eERC20 system to access private balance and
            transfer features
          </p>
          <button
            onClick={() => setShowRegistrationFlow(true)}
            className="btn-primary px-6 py-2 font-semibold hover-lift"
          >
            Start Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${className}`}>
        {/* Tab Navigation */}
        {showTransfer && (
          <div className="flex space-x-1 bg-black/20 p-1 rounded-lg border border-gray-600/20">
            <button
              onClick={() => setActiveTab("balance")}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "balance"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Balance</span>
            </button>
            <button
              onClick={() => setActiveTab("transfer")}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "transfer"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>
        )}

        {/* Content */}
        {activeTab === "balance" && (
          <EncryptedBalance mode={mode} showTitle={!showTransfer} />
        )}

        {activeTab === "transfer" && showTransfer && (
          <PrivateTransfer
            mode={mode}
            recipientAddress={transferRecipient}
            recipientLabel={transferLabel}
            messagePrefix={messagePrefix}
            onTransferComplete={onTransferComplete}
          />
        )}
      </div>

      {/* Registration Flow Modal */}
      <EeRC20RegistrationFlow
        isOpen={showRegistrationFlow}
        onComplete={handleRegistrationComplete}
        onClose={handleRegistrationClose}
      />
    </>
  );
};

export default EERCDashboard;
