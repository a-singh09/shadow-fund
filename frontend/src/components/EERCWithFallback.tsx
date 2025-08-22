import React, { useState } from "react";
import { AlertCircle, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useEERC } from "@avalabs/eerc-sdk";
import { CONTRACTS } from "@/config/contracts";

interface EERCWithFallbackProps {
  children: (eercSDK: any) => React.ReactNode;
  mode?: "converter" | "standalone";
}

const EERCWithFallback: React.FC<EERCWithFallbackProps> = ({
  children,
  mode = "converter",
}) => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [circuitError, setCircuitError] = useState<string | null>(null);

  // Circuit URLs - try to load from public folder
  const circuitURLs = {
    register: {
      wasm: "/circuits/RegistrationCircuit.wasm",
      zkey: "/circuits/RegistrationCircuit.groth16.zkey",
    },
    transfer: {
      wasm: "/circuits/TransferCircuit.wasm",
      zkey: "/circuits/TransferCircuit.groth16.zkey",
    },
    mint: {
      wasm: "/circuits/MintCircuit.wasm",
      zkey: "/circuits/MintCircuit.groth16.zkey",
    },
    withdraw: {
      wasm: "/circuits/WithdrawCircuit.wasm",
      zkey: "/circuits/WithdrawCircuit.groth16.zkey",
    },
    burn: {
      wasm: "/circuits/TransferCircuit.wasm",
      zkey: "/circuits/TransferCircuit.groth16.zkey",
    },
  };

  // The SDK handles decryption key storage internally

  const contractAddress =
    mode === "standalone"
      ? CONTRACTS.STANDALONE.ENCRYPTED_ERC
      : CONTRACTS.CONVERTER.ENCRYPTED_ERC;

  // Always call the useEERC hook to maintain hook order
  // Don't pass the stored key - let the SDK handle it internally like 3dent does
  let eercSDK;
  try {
    eercSDK = useEERC(publicClient, walletClient, contractAddress, circuitURLs);
    console.log("eERC SDK initialized:", {
      isInitialized: eercSDK?.isInitialized,
      isRegistered: eercSDK?.isRegistered,
      hasUseEncryptedBalance: !!eercSDK?.useEncryptedBalance,
    });
  } catch (error) {
    console.error("Error initializing eERC SDK:", error);
    setCircuitError(
      error instanceof Error ? error.message : "SDK initialization failed",
    );
    eercSDK = null;
  }

  // Check if SDK initialization failed or circuit files are missing
  const hasError = circuitError || !eercSDK;

  if (hasError) {
    return (
      <div className="p-6 glass rounded-2xl border border-orange-500/20">
        <div className="flex items-center space-x-2 text-orange-400 mb-4">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">eERC Circuit Files Missing</h3>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            The eERC SDK requires circuit files for zero-knowledge proof
            generation. These files are not included in the repository due to
            their size.
          </p>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-xs mb-2">
              💡 To get the circuit files:
            </p>
            <ul className="text-blue-400 text-xs space-y-1">
              <li>• Download from the eERC protocol repository</li>
              <li>• Copy from the 3dent example project</li>
              <li>• Generate using the eERC build process</li>
            </ul>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() =>
                window.open("https://github.com/ava-labs/eerc-sdk", "_blank")
              }
              variant="outline"
              size="sm"
              className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              eERC SDK Repo
            </Button>

            <Button
              onClick={() =>
                window.open("https://github.com/BeratOz01/3dent", "_blank")
              }
              variant="outline"
              size="sm"
              className="border-green-500 text-green-400 hover:bg-green-500/10"
            >
              <Download className="w-4 h-4 mr-2" />
              3dent Example
            </Button>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 text-xs">
              ⚠️ Without circuit files, eERC20 functionality will be limited to
              token approval only.
            </p>
          </div>

          {circuitError && (
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer">
                Error Details
              </summary>
              <pre className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded overflow-auto">
                {circuitError}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <>{children(eercSDK)}</>;
};

export default EERCWithFallback;
