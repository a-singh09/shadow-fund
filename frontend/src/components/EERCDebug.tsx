import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function EERCDebug() {
  const { address, isConnected } = useAccount();
  const eercSDK = useEERCWithKey("standalone");
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    isInitialized,
    isRegistered,
    isDecryptionKeySet,
    publicKey,
    name,
    symbol,
    decimals,
    generateAndStoreKey,
    hasStoredKey,
    decryptionKey,
  } = eercSDK;

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      await generateAndStoreKey();
    } catch (error) {
      console.error("Failed to generate key:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const storedKey = hasStoredKey();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>eERC Debug Information</CardTitle>
        <CardDescription>
          Debug information for eERC integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Wallet Connected:</strong> {isConnected ? "Yes" : "No"}
          </div>
          <div>
            <strong>Address:</strong> {address || "N/A"}
          </div>
          <div>
            <strong>eERC Initialized:</strong> {isInitialized ? "Yes" : "No"}
          </div>
          <div>
            <strong>User Registered:</strong> {isRegistered ? "Yes" : "No"}
          </div>
          <div>
            <strong>Decryption Key Set:</strong>{" "}
            {isDecryptionKeySet ? "Yes" : "No"}
          </div>
          <div>
            <strong>Stored Key:</strong> {storedKey ? "Yes" : "No"}
          </div>
          <div>
            <strong>Token Name:</strong> {name || "N/A"}
          </div>
          <div>
            <strong>Token Symbol:</strong> {symbol || "N/A"}
          </div>
        </div>

        {publicKey && (
          <div>
            <strong>Public Key:</strong>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(publicKey, null, 2)}
            </pre>
          </div>
        )}

        {decryptionKey && (
          <div>
            <strong>Stored Decryption Key:</strong>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 break-all">
              {decryptionKey.substring(0, 50)}...
            </pre>
          </div>
        )}

        {isConnected && !storedKey && (
          <Button
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate Decryption Key"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
