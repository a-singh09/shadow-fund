import { useState } from "react";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { X, Shield, Wallet, CheckCircle, Loader2 } from "lucide-react";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletConnectionModal = ({
  isOpen,
  onClose,
}: WalletConnectionModalProps) => {
  const { connect, connectors, isPending } = useConnect();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isRegistered, registerWithKey, keyLoaded } =
    useEERCWithKey("converter");

  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(
    null,
  );

  if (!isOpen) return null;

  const handleConnect = async (connector: any) => {
    setSelectedConnector(connector.uid);
    try {
      await connect({ connector });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setSelectedConnector(null);
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await registerWithKey();
      onClose();
    } catch (error) {
      console.error("Failed to register with eERC20:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative glass max-w-md w-full rounded-2xl border border-red-500/20 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isConnected ? "Wallet Connected" : "Connect Your Wallet"}
          </h2>
          <p className="text-gray-400">
            {isConnected
              ? "Complete your setup to start using ShadowFlow"
              : "Choose your preferred wallet to start using ShadowFlow"}
          </p>
        </div>

        {!isConnected ? (
          <div className="space-y-3 mb-6">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => handleConnect(connector)}
                disabled={isPending}
                className={`w-full p-4 rounded-xl border transition-all duration-300 text-left ${
                  selectedConnector === connector.uid && isPending
                    ? "border-red-500 bg-red-500/10"
                    : "border-gray-700 glass hover:border-red-500/50"
                } ${isPending ? "opacity-50 cursor-not-allowed" : "hover-lift"}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400 font-bold text-sm">
                      {connector.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {connector.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Connect using {connector.name}
                    </p>
                  </div>
                  {selectedConnector === connector.uid && isPending && (
                    <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {!isRegistered ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-400">
                  Register with eERC20 to enable private transactions
                </p>
                <button
                  onClick={handleRegister}
                  disabled={isRegistering || !keyLoaded}
                  className="w-full p-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  {isRegistering || !keyLoaded ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Registering...
                    </>
                  ) : (
                    "Register with eERC20"
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Ready for private transactions!
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="w-full p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                  Continue to ShadowFlow
                </button>
              </div>
            )}

            <button
              onClick={handleDisconnect}
              className="w-full p-3 border border-gray-700 hover:border-red-500/50 text-white rounded-xl font-medium transition-colors"
            >
              Disconnect Wallet
            </button>
          </div>
        )}

        <div className="glass-subtle p-4 rounded-xl border border-red-500/10">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-white text-sm mb-1">
                Privacy Features
              </h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>• Encrypted donation amounts</div>
                <div>• Zero-knowledge proofs</div>
                <div>• Anonymous contributions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectionModal;
