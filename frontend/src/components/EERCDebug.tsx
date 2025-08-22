import React from "react";
import { useAccount } from "wagmi";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import { CONTRACTS } from "@/config/contracts";

interface EERCDebugProps {
  mode: "standalone" | "converter";
}

export const EERCDebug: React.FC<EERCDebugProps> = ({ mode }) => {
  const { address, isConnected } = useAccount();
  const eercSDK = useEERCWithKey(mode);

  const {
    isInitialized,
    isRegistered,
    keyLoaded,
    decryptionKey,
    decryptedBalance,
    encryptedBalance,
    decimals,
  } = eercSDK;

  const contractAddress =
    mode === "standalone"
      ? CONTRACTS.STANDALONE.ENCRYPTED_ERC
      : CONTRACTS.CONVERTER.ENCRYPTED_ERC;

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-600 text-sm">
      <h3 className="text-lg font-bold text-white mb-4">
        eERC Debug Info ({mode})
      </h3>

      <div className="space-y-2 text-gray-300">
        <div>
          <strong>Wallet Connected:</strong> {isConnected ? "Yes" : "No"}
        </div>
        <div>
          <strong>Address:</strong> {address || "Not connected"}
        </div>
        <div>
          <strong>Contract Address:</strong> {contractAddress}
        </div>
        <div>
          <strong>Key Loaded:</strong> {keyLoaded ? "Yes" : "No"}
        </div>
        <div>
          <strong>Has Decryption Key:</strong> {decryptionKey ? "Yes" : "No"}
        </div>
        <div>
          <strong>SDK Initialized:</strong> {isInitialized ? "Yes" : "No"}
        </div>
        <div>
          <strong>Is Registered:</strong> {isRegistered ? "Yes" : "No"}
        </div>
        <div>
          <strong>Decimals:</strong> {decimals?.toString() || "null"}
        </div>
        <div>
          <strong>Encrypted Balance:</strong>{" "}
          {encryptedBalance
            ? Array.isArray(encryptedBalance)
              ? `[${encryptedBalance.length} items]`
              : encryptedBalance.toString()
            : "null"}
        </div>
        <div>
          <strong>Decrypted Balance:</strong>{" "}
          {decryptedBalance !== null
            ? `${decryptedBalance.toString()} (${Number(decryptedBalance) / Math.pow(10, Number(decimals || 2))} TEST)`
            : "null"}
        </div>

        {address && (
          <div>
            <strong>Stored Key:</strong>{" "}
            {localStorage.getItem(`eerc-key-${mode}-${address}`) ? "Yes" : "No"}
          </div>
        )}
      </div>
    </div>
  );
};
