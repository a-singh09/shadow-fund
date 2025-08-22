import { useState, useEffect } from "react";
import {
  Heart,
  Shield,
  Lock,
  Users,
  Gift,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

import { useCampaign } from "@/hooks/useCampaign";
import { useAccount } from "wagmi";
import { parseUnits, isAddress } from "viem";
import { CONTRACTS } from "@/config/contracts";

import DonationConfirmation from "./DonationConfirmation";
import FinalTokenConverter from "./FinalTokenConverter";

import { formatMessageForEERC, handleEERCError } from "@/utils/eercUtils";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";

interface Campaign {
  id: string;
  title: string;
  progressPercentage: number;
  supportersCount: number;
  daysLeft: number;
  raised: string;
  goal: string;
  creator?: string; // Campaign creator address
}

interface DonationSidebarProps {
  campaign: Campaign;
  campaignAddress?: string; // Contract address of the campaign
}

// Component that only renders when fully ready and calls useEncryptedBalance
const ReadyDonationSidebar: React.FC<{
  campaign: Campaign;
  campaignAddress?: string;
  eercSDK: any;
}> = ({ campaign, campaignAddress, eercSDK }) => {
  const [donationAmount, setDonationAmount] = useState("");
  const [donationMessage, setDonationMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [donationStep, setDonationStep] = useState<
    "form" | "processing" | "success" | "error"
  >("form");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { toast } = useToast();
  const { isConnected, address } = useAccount();
  const { registerDonation } = useCampaign(campaignAddress);

  const { useEncryptedBalance, isInitialized, isRegistered } = eercSDK;

  // Double-check that everything is ready before calling useEncryptedBalance
  if (!isInitialized || !isRegistered || !useEncryptedBalance) {
    return (
      <div className="sticky top-24">
        <div className="glass rounded-2xl p-8 border border-red-500/20">
          <div className="flex items-center space-x-2 text-yellow-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Finalizing eERC20 initialization...</span>
          </div>
        </div>
      </div>
    );
  }

  // Now it should be safe to call useEncryptedBalance
  let encryptedBalanceHook = null;
  let decryptedBalance = null;
  let privateTransfer = null;
  let decimals = null;

  try {
    encryptedBalanceHook = useEncryptedBalance(CONTRACTS.CONVERTER.ERC20);
    if (encryptedBalanceHook) {
      decryptedBalance = encryptedBalanceHook.decryptedBalance;
      privateTransfer = encryptedBalanceHook.privateTransfer;
      decimals = encryptedBalanceHook.decimals;
    }
  } catch (error) {
    console.error("Error calling useEncryptedBalance:", error);
    return (
      <div className="sticky top-24">
        <div className="glass rounded-2xl p-8 border border-red-500/20">
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>
              Error initializing eERC20 balance. Please refresh the page.
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </div>
      </div>
    );
  }

  const predefinedAmounts = [10, 25, 50, 100];

  // Format donation message according to spec: "DONATION:campaignAddr:message"
  const formatDonationMessage = (userMessage: string): string => {
    const cleanMessage = userMessage.trim() || "Anonymous donation";
    return `DONATION:${campaignAddress || campaign.id}:${cleanMessage}`;
  };

  const handleEnhancedDonate = async () => {
    // Validation
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to make a donation.",
        variant: "destructive",
      });
      return;
    }

    if (!isInitialized) {
      toast({
        title: "eERC20 Not Initialized",
        description: "eERC20 system is still initializing. Please wait.",
        variant: "destructive",
      });
      return;
    }

    if (!isRegistered) {
      toast({
        title: "eERC20 Registration Required",
        description:
          "Please register with eERC20 first to make private donations.",
        variant: "destructive",
      });
      return;
    }

    if (!privateTransfer) {
      toast({
        title: "Private Transfer Not Available",
        description: "Private transfer functionality is not available.",
        variant: "destructive",
      });
      return;
    }

    if (!campaign.creator) {
      toast({
        title: "Campaign Creator Unknown",
        description:
          "Cannot process donation - campaign creator address not found.",
        variant: "destructive",
      });
      return;
    }

    setIsDonating(true);
    setDonationStep("processing");

    try {
      // Convert amount to proper units (eERC20 standalone uses 2 decimals)
      const decimalPlaces = decimals ? Number(decimals) : 2;
      console.log(
        "Donation amount:",
        donationAmount,
        "Decimals:",
        decimalPlaces,
      );

      // Validate the donation amount
      if (!donationAmount || isNaN(parseFloat(donationAmount))) {
        throw new Error("Invalid donation amount format");
      }

      const amount = parseUnits(donationAmount, decimalPlaces);
      console.log("Converted amount:", amount.toString());

      // Validate amount is positive
      if (amount <= 0n) {
        throw new Error("Donation amount must be greater than zero");
      }

      // Check if user has sufficient balance
      console.log("Debug - Balance check:", {
        decryptedBalance,
        decryptedBalanceType: typeof decryptedBalance,
        isNull: decryptedBalance === null,
        isZero: decryptedBalance === 0n,
        decimals,
        isRegistered,
        isInitialized,
      });

      if (decryptedBalance === null) {
        throw new Error(
          "Unable to determine your eERC balance. Please ensure you're registered and have tokens.",
        );
      }

      if (decryptedBalance === 0n) {
        throw new Error(
          "You have no eERC tokens to donate. Please get some TEST tokens first.",
        );
      }

      if (decryptedBalance < amount) {
        const currentBalance =
          Number(decryptedBalance) / Math.pow(10, decimalPlaces);
        throw new Error(
          `Insufficient balance. You have ${currentBalance} TEST, but trying to send ${donationAmount} TEST`,
        );
      }

      // Validate creator address
      if (!campaign.creator) {
        throw new Error("Campaign creator address is missing");
      }

      // Validate address format
      if (!isAddress(campaign.creator)) {
        throw new Error("Invalid campaign creator address format");
      }

      console.log("Campaign creator:", campaign.creator);

      // Check if recipient is registered (optional check - the SDK will handle this)
      // Note: We can't easily check this without additional SDK methods

      // Format the donation message according to spec: "DONATION:campaignAddr:message"
      const donationMsg = formatDonationMessage(donationMessage);
      // Ensure the message is properly formatted for eERC SDK
      const formattedMessage = formatMessageForEERC(donationMsg);
      console.log("Formatted message:", formattedMessage);

      // Step 1: Execute eERC20 private transfer
      toast({
        title: "Processing Donation",
        description: "Initiating encrypted transfer...",
      });

      if (!privateTransfer) {
        throw new Error("Private transfer function not available");
      }

      console.log("Calling privateTransfer with:", {
        recipient: campaign.creator,
        amount: amount.toString(),
        message: formattedMessage,
      });

      const transferResult = await privateTransfer(
        campaign.creator,
        amount,
        formattedMessage,
      );

      console.log("Transfer result:", transferResult);

      setTransactionHash(transferResult.transactionHash);

      // Step 2: Register donation with campaign contract (if campaign address is available)
      if (campaignAddress && campaignAddress !== campaign.id) {
        try {
          toast({
            title: "Registering Donation",
            description: "Linking donation to campaign...",
          });

          await registerDonation(transferResult.transactionHash);

          toast({
            title: "Donation Registered!",
            description: `Your private donation of $${donationAmount} has been successfully registered with the campaign.`,
          });
        } catch (registrationError) {
          console.warn(
            "Failed to register donation with campaign:",
            registrationError,
          );
          // Don't fail the entire donation if registration fails
          toast({
            title: "Donation Sent (Registration Warning)",
            description: `Your donation was sent successfully, but couldn't be registered with the campaign contract.`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Donation Successful!",
          description: `Your private donation of $${donationAmount} has been sent successfully.`,
        });
      }

      setDonationStep("success");
      setShowConfirmation(true);

      // Reset form
      setDonationAmount("");
      setDonationMessage("");
    } catch (error) {
      console.error("Donation failed:", error);

      // Use the eERC error handler for better error messages
      const errorMsg = handleEERCError(error);
      setDonationStep("error");

      toast({
        title: "Donation Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsDonating(false);
    }
  };

  const resetDonationFlow = () => {
    setDonationStep("form");
    setTransactionHash("");
    setShowConfirmation(false);
  };

  // Show confirmation modal if donation was successful
  if (showConfirmation && transactionHash) {
    return (
      <DonationConfirmation
        transactionHash={transactionHash}
        amount={donationAmount}
        campaignTitle={campaign.title}
        onClose={resetDonationFlow}
      />
    );
  }

  return (
    <div className="sticky top-24">
      <div className="glass rounded-2xl p-8 border border-red-500/20">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-white">{campaign.raised}</h3>
            <span className="text-sm text-gray-400">of {campaign.goal}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full transition-all duration-300"
              style={{ width: `${campaign.progressPercentage}%` }}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-white">
                {campaign.supportersCount}
              </p>
              <p className="text-sm text-gray-400">supporters</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {campaign.daysLeft}
              </p>
              <p className="text-sm text-gray-400">days left</p>
            </div>
          </div>
        </div>

        {/* Privacy Features */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-white mb-4">
            Privacy Protection
          </h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-300">
                Zero-knowledge donations
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-300">
                Anonymous by default
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-300">
                Private supporter count
              </span>
            </div>
          </div>
        </div>

        {/* Token Converter - Show if registered so users can convert more tokens */}
        {isConnected && isRegistered && (
          <div className="mb-6">
            <FinalTokenConverter />
          </div>
        )}

        {/* Balance Display */}
        {isConnected &&
          isInitialized &&
          isRegistered &&
          decryptedBalance !== null &&
          decryptedBalance !== undefined && (
            <div className="mb-6 p-4 glass-subtle rounded-xl border border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Your eERC20 Balance:
                </span>
                <span className="text-white font-medium">
                  {(
                    Number(decryptedBalance) /
                    Math.pow(10, Number(decimals || 2n))
                  ).toFixed(2)}{" "}
                  TEST
                </span>
              </div>
            </div>
          )}

        {/* Donation Form */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white">
            Support this project
          </h4>

          {/* Predefined Amounts */}
          <div className="grid grid-cols-2 gap-2">
            {predefinedAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => setDonationAmount(amount.toString())}
                disabled={isDonating || donationStep === "processing"}
                className="border-gray-600 text-gray-300 hover:bg-red-500/10 hover:border-red-500/50 disabled:opacity-50"
              >
                ${amount}
              </Button>
            ))}
          </div>

          {/* Custom Amount */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                $
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                disabled={isDonating || donationStep === "processing"}
                className="pl-8 bg-gray-800/50 border-gray-600 text-white focus:border-red-500/50 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Donation Message */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message (optional)
            </label>
            <Textarea
              placeholder="Leave a message for the campaign creator..."
              value={donationMessage}
              onChange={(e) => setDonationMessage(e.target.value)}
              disabled={isDonating || donationStep === "processing"}
              className="bg-gray-800/50 border-gray-600 text-white focus:border-red-500/50 disabled:opacity-50 resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {donationMessage.length}/200 characters
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              disabled={isDonating || donationStep === "processing"}
              className="rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500/50 disabled:opacity-50"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-300">
              Make this donation anonymous
            </label>
          </div>

          {/* Donation Button */}
          <Button
            onClick={handleEnhancedDonate}
            disabled={
              isDonating ||
              donationStep === "processing" ||
              !isConnected ||
              !isInitialized ||
              !isRegistered ||
              !donationAmount ||
              parseFloat(donationAmount) <= 0 ||
              !privateTransfer
            }
            className="w-full btn-primary py-4 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDonating || donationStep === "processing" ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Donation...
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 mr-2" />
                Donate Privately
              </>
            )}
          </Button>

          {/* Processing Status */}
          {donationStep === "processing" && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="flex items-center space-x-2 text-blue-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Encrypting and sending your donation...</span>
              </div>
            </div>
          )}

          {/* Rewards Section */}
          <div className="pt-6 border-t border-gray-700">
            <h5 className="text-sm font-semibold text-white mb-3 flex items-center">
              <Gift className="w-4 h-4 mr-2 text-red-400" />
              Supporter Rewards
            </h5>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Early access to beta features</p>
              <p>• Private community membership</p>
              <p>• Exclusive project updates</p>
              <p>• Privacy-first digital badge</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component that uses the useEERCWithKey hook
const DonationSidebarContent: React.FC<{
  campaign: Campaign;
  campaignAddress?: string;
}> = ({ campaign, campaignAddress }) => {
  // Use the hook that properly handles key management
  const eercSDK = useEERCWithKey("converter");
  const { toast } = useToast();

  console.log("DonationSidebarContent - eERC SDK state:", {
    isInitialized: eercSDK.isInitialized,
    isRegistered: eercSDK.isRegistered,
    keyLoaded: eercSDK.keyLoaded,
    hasStoredKey: eercSDK.hasStoredKey(),
  });

  // Safety check for eercSDK
  if (!eercSDK) {
    return (
      <div className="sticky top-24">
        <div className="glass rounded-2xl p-8 border border-red-500/20">
          <div className="flex items-center space-x-2 text-yellow-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading eERC SDK...</span>
          </div>
        </div>
      </div>
    );
  }

  // If not initialized yet, show loading
  if (!eercSDK.keyLoaded) {
    return (
      <div className="sticky top-24">
        <div className="glass rounded-2xl p-8 border border-red-500/20">
          <div className="flex items-center space-x-2 text-yellow-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading eERC20 keys...</span>
          </div>
        </div>
      </div>
    );
  }

  // If no key is stored, show key generation
  if (!eercSDK.hasStoredKey()) {
    return (
      <div className="sticky top-24">
        <div className="glass rounded-2xl p-8 border border-red-500/20">
          <h3 className="text-xl font-bold text-white mb-4">
            Generate Decryption Key
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            You need to generate a decryption key to make private donations.
          </p>
          <Button
            onClick={async () => {
              try {
                await eercSDK.generateAndStoreKey();
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
            }}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Generate Key
          </Button>
        </div>
      </div>
    );
  }

  // If not registered, show registration
  if (!eercSDK.isRegistered) {
    return (
      <div className="sticky top-24">
        <div className="glass rounded-2xl p-8 border border-red-500/20">
          <h3 className="text-xl font-bold text-white mb-4">
            Register with eERC20
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            You need to register with the eERC20 system to make private
            donations.
          </p>
          <Button
            onClick={async () => {
              try {
                await eercSDK.registerWithKey();
                toast({
                  title: "Registration Successful",
                  description:
                    "You are now registered with eERC20 and can make private donations.",
                });
              } catch (error) {
                console.error("Registration failed:", error);
                toast({
                  title: "Registration Failed",
                  description:
                    error instanceof Error
                      ? error.message
                      : "Registration failed",
                  variant: "destructive",
                });
              }
            }}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Register
          </Button>
        </div>
      </div>
    );
  }

  // If everything is ready, show the full donation sidebar
  return (
    <ReadyDonationSidebar
      campaign={campaign}
      campaignAddress={campaignAddress}
      eercSDK={eercSDK}
    />
  );
};

// Main wrapper component
const DonationSidebar = ({
  campaign,
  campaignAddress,
}: DonationSidebarProps) => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="sticky top-24">
        <div className="glass rounded-2xl p-8 border border-red-500/20">
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-center space-x-2 text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Connect wallet to make donations</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DonationSidebarContent
      campaign={campaign}
      campaignAddress={campaignAddress}
    />
  );
};

export default DonationSidebar;
