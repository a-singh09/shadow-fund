import React, { useState } from "react";
import { AlertTriangle, RefreshCw, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import {
  clearAllEERCData,
  clearEERCDataForAddress,
  forceEERCReset,
} from "@/utils/eercDataManager";

interface EERCRecoveryProps {
  onRecoveryComplete?: () => void;
}

const EERCRecovery: React.FC<EERCRecoveryProps> = ({ onRecoveryComplete }) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const { address } = useAccount();

  const handleQuickFix = async () => {
    setIsRecovering(true);
    setRecoveryStep("Clearing corrupted data...");

    try {
      // Clear data for current address only
      if (address) {
        clearEERCDataForAddress(address, "converter");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setRecoveryStep("Recovery complete!");
      setIsComplete(true);

      setTimeout(() => {
        onRecoveryComplete?.();
      }, 1500);
    } catch (error) {
      console.error("Quick fix failed:", error);
      setRecoveryStep("Quick fix failed. Try full reset.");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleFullReset = async () => {
    setIsRecovering(true);
    setRecoveryStep("Performing full reset...");

    try {
      // Clear all eERC data
      forceEERCReset();
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setRecoveryStep("Full reset complete!");
      setIsComplete(true);

      setTimeout(() => {
        // Force page reload to ensure clean state
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Full reset failed:", error);
      setRecoveryStep("Reset failed. Please refresh the page manually.");
    } finally {
      setIsRecovering(false);
    }
  };

  const handlePageRefresh = () => {
    window.location.reload();
  };

  if (isComplete) {
    return (
      <div className="p-6 glass rounded-2xl border border-green-500/20">
        <div className="flex items-center space-x-2 text-green-400 mb-4">
          <CheckCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Recovery Complete</h3>
        </div>

        <p className="text-gray-300 text-sm mb-4">
          The eERC system has been reset successfully. You can now register and
          use the system normally.
        </p>

        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-xs">
            💡 You'll need to register with eERC20 again, but your wallet and
            ERC20 tokens are safe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 glass rounded-2xl border border-orange-500/20">
      <div className="flex items-center space-x-2 text-orange-400 mb-4">
        <AlertTriangle className="w-5 h-5" />
        <h3 className="text-lg font-semibold">eERC System Recovery</h3>
      </div>

      <div className="space-y-4">
        <p className="text-gray-300 text-sm">
          The eERC system has corrupted data that needs to be cleared. This
          happens when encrypted data gets malformed during storage or
          transmission.
        </p>

        {recoveryStep && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              {isRecovering && (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              )}
              <p className="text-blue-400 text-sm">{recoveryStep}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <h4 className="text-white font-medium mb-2">
              Recommended: Quick Fix
            </h4>
            <p className="text-gray-400 text-xs mb-3">
              Clears corrupted data for your current wallet only. Preserves
              other data.
            </p>
            <Button
              onClick={handleQuickFix}
              disabled={isRecovering}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isRecovering ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Quick Fix
                </>
              )}
            </Button>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Full Reset</h4>
            <p className="text-gray-400 text-xs mb-3">
              Clears all eERC data and reloads the page. Use if quick fix
              doesn't work.
            </p>
            <Button
              onClick={handleFullReset}
              disabled={isRecovering}
              variant="outline"
              className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Full Reset
            </Button>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Manual Refresh</h4>
            <p className="text-gray-400 text-xs mb-3">
              Simply refresh the page to start fresh.
            </p>
            <Button
              onClick={handlePageRefresh}
              disabled={isRecovering}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>

        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-xs">
            ⚠️ Your wallet and ERC20 tokens are safe. Only eERC20 registration
            data will be cleared.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EERCRecovery;
