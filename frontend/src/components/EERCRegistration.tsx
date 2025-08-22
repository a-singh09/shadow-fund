import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Key, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import { useAccount } from "wagmi";

interface EERCRegistrationProps {
  mode?: "standalone" | "converter";
  onRegistrationComplete?: () => void;
}

export function EERCRegistration({
  mode = "converter",
  onRegistrationComplete,
}: EERCRegistrationProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<
    "idle" | "generating" | "registering" | "success" | "error"
  >("idle");
  const [decryptionKey, setDecryptionKey] = useState<string>("");

  const { toast } = useToast();
  const { isConnected } = useAccount();
  const eercSDK = useEERCWithKey(mode);

  const { isInitialized, isRegistered, registerWithKey, hasStoredKey } =
    eercSDK;
  const hasKey = hasStoredKey();

  const handleRegistration = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!isInitialized) {
      toast({
        title: "eERC Not Initialized",
        description: "Please wait for the eERC system to initialize.",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    setRegistrationStep("generating");

    try {
      // Step 1: Generate key and register (handled internally by registerWithKey)
      if (!hasKey) {
        setRegistrationStep("generating");
        toast({
          title: "Generating Keys",
          description: "Creating your private decryption key...",
        });
      }

      setRegistrationStep("registering");
      toast({
        title: "Registering",
        description: "Registering with the eERC protocol...",
      });

      const result = await registerWithKey();
      setDecryptionKey(result.key);

      setRegistrationStep("success");

      toast({
        title: "Registration Successful!",
        description: "You can now make private donations using eERC.",
      });

      if (onRegistrationComplete) {
        onRegistrationComplete();
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setRegistrationStep("error");

      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  if (isRegistered) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center text-green-400">
            <CheckCircle className="w-5 h-5 mr-2" />
            eERC Registration Complete
          </CardTitle>
          <CardDescription>
            You're registered and ready to make private donations.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-400">
          <Shield className="w-5 h-5 mr-2" />
          eERC Registration Required
        </CardTitle>
        <CardDescription>
          Register with the eERC protocol to enable private, anonymous
          donations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Key className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">
              Generate secure encryption keys
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">
              Enable zero-knowledge donations
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">
              One-time setup per network
            </span>
          </div>
        </div>

        {registrationStep === "error" && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Registration failed. Please try again.</span>
            </div>
          </div>
        )}

        {registrationStep === "generating" && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating encryption keys...</span>
            </div>
          </div>
        )}

        {registrationStep === "registering" && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registering with protocol...</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleRegistration}
          disabled={!isConnected || !isInitialized || isRegistering}
          className="w-full"
        >
          {isRegistering ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {registrationStep === "generating"
                ? "Generating Keys..."
                : "Registering..."}
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Register for Private Donations
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
