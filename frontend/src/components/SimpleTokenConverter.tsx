import React, { useState } from "react";
import { ArrowRightLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import EERCWithFallback from "./EERCWithFallback";

// Minimal component that doesn't call useEncryptedBalance until we're sure it's safe
const SimpleTokenConverter: React.FC = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();

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

  return (
    <EERCWithFallback mode="converter">
      {(eercSDK) => {
        if (!eercSDK) {
          return (
            <div className="p-6 glass rounded-2xl border border-gray-700">
              <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading eERC SDK...</span>
              </div>
            </div>
          );
        }

        const { isInitialized, isRegistered, generateDecryptionKey, register } =
          eercSDK;

        const getStoredKey = () => {
          if (!address) return false;
          const key = localStorage.getItem(`eerc-key-converter-${address}`);
          console.log(
            `Checking for key eerc-key-converter-${address}:`,
            key ? "found" : "not found",
          );
          return !!key;
        };

        const handleGenerateKey = async () => {
          if (!generateDecryptionKey) return;

          try {
            console.log("Generating decryption key...");
            const key = await generateDecryptionKey();
            console.log("Key generated successfully, type:", typeof key);

            if (address && key) {
              const keyString =
                typeof key === "string" ? key : JSON.stringify(key);
              localStorage.setItem(`eerc-key-converter-${address}`, keyString);
              console.log("Key stored in localStorage");
            }

            toast({
              title: "Key Generated",
              description:
                "Decryption key generated successfully. You can now register with eERC20.",
            });
          } catch (error) {
            console.error("Key generation failed:", error);
            toast({
              title: "Key Generation Failed",
              description:
                error instanceof Error
                  ? error.message
                  : "Failed to generate key",
              variant: "destructive",
            });
          }
        };

        const handleRegister = async () => {
          if (!register) return;

          try {
            console.log("Starting registration...");
            const result = await register();
            console.log("Registration result:", result);

            if (address && result?.key) {
              const keyString =
                typeof result.key === "string"
                  ? result.key
                  : JSON.stringify(result.key);
              localStorage.setItem(`eerc-key-converter-${address}`, keyString);
              console.log("Registration key stored in localStorage");
            }

            toast({
              title: "Registration Successful",
              description:
                "You are now registered with eERC20 and can convert tokens.",
            });
          } catch (error) {
            console.error("Registration failed:", error);
            toast({
              title: "Registration Failed",
              description:
                error instanceof Error ? error.message : "Registration failed",
              variant: "destructive",
            });
          }
        };

        console.log("SimpleTokenConverter render:", {
          isInitialized,
          isRegistered,
          hasStoredKey: getStoredKey(),
          address,
        });

        if (!isInitialized) {
          return (
            <div className="p-6 glass rounded-2xl border border-gray-700">
              <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initializing eERC20 system...</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Loading circuit files and initializing SDK...
              </div>
            </div>
          );
        }

        if (!getStoredKey()) {
          return (
            <div className="p-6 glass rounded-2xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                Generate Decryption Key
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                You need to generate a decryption key to use eERC20 features.
              </p>
              <Button
                onClick={handleGenerateKey}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Generate Key
              </Button>
            </div>
          );
        }

        if (!isRegistered) {
          return (
            <div className="p-6 glass rounded-2xl border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                Register with eERC20
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                You need to register with the eERC20 system to convert tokens.
              </p>
              <Button
                onClick={handleRegister}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Register
              </Button>
            </div>
          );
        }

        // If we get here, everything should be ready, but let's not call useEncryptedBalance yet
        // Just show a success message for now
        return (
          <div className="p-6 glass rounded-2xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <ArrowRightLeft className="w-5 h-5 mr-2 text-blue-400" />
              Convert to eERC20
            </h3>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">
                ✅ SDK Initialized: {isInitialized ? "Yes" : "No"}
              </p>
              <p className="text-green-400 text-sm">
                ✅ Key Generated: {getStoredKey() ? "Yes" : "No"}
              </p>
              <p className="text-green-400 text-sm">
                ✅ Registered: {isRegistered ? "Yes" : "No"}
              </p>
              <p className="text-white text-sm mt-2">
                Everything is ready! The converter functionality will be added
                next.
              </p>
            </div>
          </div>
        );
      }}
    </EERCWithFallback>
  );
};

export default SimpleTokenConverter;
