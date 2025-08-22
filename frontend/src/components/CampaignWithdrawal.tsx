import { useState, useCallback, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  Rocket,
  Users,
  Clock,
  ArrowDownLeft,
} from "lucide-react";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import { useCampaign } from "@/hooks/useCampaign";
import { useCampaignList } from "@/hooks/useCampaignList";
import { parseUnits, formatUnits } from "viem";
import { EXPLORER_BASE_URL_TX, CONTRACTS } from "@/config/contracts";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface CampaignWithdrawalProps {
  className?: string;
}

// Component that only renders when fully ready and calls useEncryptedBalance
const ReadyCampaignWithdrawal: React.FC<{
  className?: string;
  campaignParam: string | null;
  eercSDK: any;
}> = ({ className = "", campaignParam, eercSDK }) => {
  const { address } = useAccount();
  const { toast } = useToast();

  const { registerWithdrawal, getCampaignInfo } = useCampaign(
    campaignParam || undefined,
  );
  const { campaigns } = useCampaignList();

  const { useEncryptedBalance, isInitialized, isRegistered } = eercSDK;

  // Double-check that everything is ready before calling useEncryptedBalance
  if (!isInitialized || !isRegistered || !useEncryptedBalance) {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Finalizing eERC20 initialization...</span>
        </div>
      </div>
    );
  }

  // Now it should be safe to call useEncryptedBalance
  let encryptedBalanceHook = null;
  let decryptedBalance = null;
  let withdraw = null;
  let decimals = null;
  let refetchBalance = null;

  try {
    encryptedBalanceHook = useEncryptedBalance(CONTRACTS.CONVERTER.ERC20);
    if (encryptedBalanceHook) {
      decryptedBalance = encryptedBalanceHook.decryptedBalance;
      withdraw = encryptedBalanceHook.withdraw;
      decimals = encryptedBalanceHook.decimals;
      refetchBalance = encryptedBalanceHook.refetchBalance;
    }
  } catch (error) {
    console.error("Error calling useEncryptedBalance:", error);
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
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
    );
  }

  // Read ERC20 balance to show what user will receive
  const { data: erc20Balance } = useReadContract({
    address: CONTRACTS.CONVERTER.ERC20 as `0x${string}`,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ],
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Read ERC20 symbol
  const { data: erc20Symbol } = useReadContract({
    address: CONTRACTS.CONVERTER.ERC20 as `0x${string}`,
    abi: [
      {
        name: "symbol",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
      },
    ],
    functionName: "symbol",
  });

  // Read ERC20 decimals
  const { data: erc20Decimals } = useReadContract({
    address: CONTRACTS.CONVERTER.ERC20 as `0x${string}`,
    abi: [
      {
        name: "decimals",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
      },
    ],
    functionName: "decimals",
  });

  const [selectedCampaign, setSelectedCampaign] = useState<string>(
    campaignParam || "",
  );
  const [campaignInfo, setCampaignInfo] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<
    "select" | "amount" | "confirm" | "processing" | "complete"
  >("select");

  // Filter campaigns created by the current user
  const creatorCampaigns = campaigns.filter(
    (campaign) => campaign.creator.toLowerCase() === address?.toLowerCase(),
  );

  // Load campaign info when campaign is selected
  useEffect(() => {
    const loadCampaignInfo = async () => {
      if (selectedCampaign) {
        try {
          const info = await getCampaignInfo();
          setCampaignInfo(info);
          if (campaignParam) {
            setStep("amount");
          }
        } catch (err) {
          console.error("Failed to load campaign info:", err);
        }
      }
    };

    loadCampaignInfo();
  }, [selectedCampaign, getCampaignInfo, campaignParam]);

  const handleCampaignSelect = (campaignAddress: string) => {
    setSelectedCampaign(campaignAddress);
    setStep("amount");
    setWithdrawError(null);
    setWithdrawSuccess(null);
  };

  const handleAmountNext = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }

    if (!decimals) {
      setWithdrawError("Token decimals not loaded");
      return;
    }

    try {
      const eercDecimals = Number(decimals);
      const withdrawAmount = parseUnits(amount, eercDecimals);

      if (decryptedBalance !== null && withdrawAmount > decryptedBalance) {
        setWithdrawError("Insufficient balance");
        return;
      }
      setStep("confirm");
      setWithdrawError(null);
    } catch {
      setWithdrawError("Invalid amount format");
    }
  };

  const handleWithdraw = useCallback(async () => {
    if (!address || !selectedCampaign || !amount) {
      setWithdrawError("Missing required information");
      return;
    }

    if (!withdraw) {
      setWithdrawError("Withdraw function not available");
      return;
    }

    let withdrawAmount: bigint;
    try {
      // Use the eERC decimals for the withdrawal amount
      const eercDecimals = decimals ? Number(decimals) : 18;
      withdrawAmount = parseUnits(amount, eercDecimals);

      console.log("Withdrawal details:", {
        amount,
        eercDecimals,
        withdrawAmount: withdrawAmount.toString(),
        decryptedBalance: decryptedBalance?.toString(),
      });
    } catch (error) {
      console.error("Amount parsing error:", error);
      setWithdrawError("Invalid amount format");
      return;
    }

    // Check if user has sufficient balance
    if (decryptedBalance === null) {
      setWithdrawError("Unable to determine your eERC balance");
      return;
    }

    if (decryptedBalance === 0n) {
      setWithdrawError("You have no eERC tokens to withdraw");
      return;
    }

    if (decryptedBalance < withdrawAmount) {
      const currentBalance = decimals
        ? Number(decryptedBalance) / Math.pow(10, Number(decimals))
        : 0;
      setWithdrawError(
        `Insufficient balance. You have ${currentBalance} e${erc20Symbol || "TOKEN"}, but trying to withdraw ${amount}`,
      );
      return;
    }

    setStep("processing");
    setIsWithdrawing(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);

    try {
      // Step 1: Perform the actual withdrawal using eERC withdraw function
      // This converts encrypted tokens back to regular ERC20 tokens
      const withdrawalMessage = `WITHDRAWAL:${selectedCampaign}`;

      console.log("Calling withdraw with:", {
        amount: withdrawAmount.toString(),
        message: withdrawalMessage,
      });

      const withdrawResult = await withdraw(withdrawAmount, withdrawalMessage);
      console.log("Withdraw result:", withdrawResult);

      // Step 2: Register the withdrawal with the campaign contract
      try {
        await registerWithdrawal(withdrawResult.transactionHash);
        toast({
          title: "Withdrawal Registered",
          description:
            "Withdrawal has been registered with the campaign contract.",
        });
      } catch (regError) {
        console.warn("Failed to register withdrawal with campaign:", regError);
        // Continue anyway as the actual withdrawal succeeded
        toast({
          title: "Withdrawal Successful (Registration Warning)",
          description:
            "Withdrawal completed but couldn't register with campaign contract.",
          variant: "default",
        });
      }

      // Step 3: Refresh balances to show updated amounts
      setTimeout(() => {
        if (refetchBalance) {
          refetchBalance();
        }
      }, 2000);

      setWithdrawSuccess(withdrawResult.transactionHash);
      setAmount("");
      setStep("complete");

      toast({
        title: "Withdrawal Successful!",
        description: `Successfully withdrew ${amount} e${erc20Symbol || "TOKEN"} to ${amount} ${erc20Symbol || "TOKEN"}`,
      });
    } catch (err) {
      console.error("Withdrawal failed:", err);
      const errorMsg = err instanceof Error ? err.message : "Withdrawal failed";
      setWithdrawError(errorMsg);
      setStep("confirm");

      toast({
        title: "Withdrawal Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  }, [
    address,
    selectedCampaign,
    amount,
    withdraw,
    registerWithdrawal,
    decimals,
    refetchBalance,
    decryptedBalance,
    erc20Symbol,
    toast,
  ]);

  const formatBalance = (balance: bigint | null): string => {
    if (balance === null || !decimals) return "0.00";
    return parseFloat(formatUnits(balance, Number(decimals))).toFixed(4);
  };

  const formatERC20Balance = (balance: bigint | undefined): string => {
    if (!balance || !erc20Decimals) return "0.00";
    return parseFloat(formatUnits(balance, erc20Decimals)).toFixed(4);
  };

  const setMaxAmount = () => {
    if (decryptedBalance !== null && decimals) {
      // Use the full balance for withdrawal since we're converting to ERC20
      setAmount(formatUnits(decryptedBalance, Number(decimals)));
    }
  };

  const resetFlow = () => {
    setStep("select");
    setSelectedCampaign("");
    setCampaignInfo(null);
    setAmount("");
    setWithdrawError(null);
    setWithdrawSuccess(null);
  };

  // Step 1: Campaign Selection
  if (step === "select") {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">
            Withdraw Campaign Funds
          </h3>
        </div>

        {creatorCampaigns.length === 0 ? (
          <div className="text-center py-8">
            <Rocket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-400 mb-2">
              No campaigns found
            </h4>
            <p className="text-sm text-gray-500">
              Create a campaign first to withdraw funds
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              Select a campaign to withdraw funds from:
            </p>
            {creatorCampaigns.map((campaign) => (
              <button
                key={campaign.address}
                onClick={() => handleCampaignSelect(campaign.address)}
                className="w-full p-4 glass-subtle rounded-lg border border-gray-700/30 hover:border-red-500/50 transition-all duration-300 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">
                        {campaign.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {Number(campaign.donationCount)} supporters
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {campaign.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 2: Amount Entry
  if (step === "amount") {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">
              Withdrawal Amount
            </h3>
          </div>
          <button
            onClick={() => setStep("select")}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            Change Campaign
          </button>
        </div>

        {campaignInfo && (
          <div className="glass-subtle p-4 rounded-lg border border-gray-600/20 mb-6">
            <h4 className="font-medium text-white mb-1">
              {campaignInfo.title}
            </h4>
            <div className="text-sm text-gray-400">
              {Number(campaignInfo.donationCount)} supporters •{" "}
              {Number(campaignInfo.withdrawalCount)} withdrawals
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Balance Display */}
          <div className="grid grid-cols-1 gap-3">
            <div className="glass p-4 rounded-lg border border-gray-600/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">eERC20 Balance</span>
                <span className="text-lg font-semibold text-white">
                  {formatBalance(decryptedBalance)} e{erc20Symbol || "TOKEN"}
                </span>
              </div>
            </div>

            <div className="glass p-4 rounded-lg border border-gray-600/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">ERC20 Balance</span>
                <span className="text-lg font-semibold text-white">
                  {formatERC20Balance(erc20Balance)} {erc20Symbol || "TOKEN"}
                </span>
              </div>
            </div>
          </div>

          {/* Withdrawal Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Withdrawal Amount (e{erc20Symbol || "TOKEN"})
              </label>
              {decryptedBalance !== null && (
                <button
                  onClick={setMaxAmount}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Withdraw Max
                </button>
              )}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.0001"
              min="0"
              className="w-full px-4 py-3 bg-black/20 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:border-red-500/50 focus:outline-none"
            />
            <div className="mt-2 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <ArrowDownLeft className="w-3 h-3" />
                <span>
                  You will receive {amount || "0"} {erc20Symbol || "TOKEN"}{" "}
                  tokens
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {withdrawError && (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{withdrawError}</span>
            </div>
          )}

          {/* Next Button */}
          <Button
            onClick={handleAmountNext}
            disabled={!amount}
            className="w-full btn-primary py-3 font-semibold hover-lift flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Continue</span>
            <ArrowUpRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  if (step === "confirm") {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">
            Confirm Withdrawal
          </h3>
        </div>

        <div className="space-y-4">
          {/* Campaign Info */}
          {campaignInfo && (
            <div className="glass-subtle p-4 rounded-lg border border-gray-600/20">
              <div className="text-sm text-gray-400 mb-1">Campaign</div>
              <div className="font-medium text-white">{campaignInfo.title}</div>
            </div>
          )}

          {/* Withdrawal Details */}
          <div className="glass-subtle p-4 rounded-lg border border-gray-600/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Withdrawal Amount</span>
              <span className="text-lg font-semibold text-white">
                {amount} e{erc20Symbol || "TOKEN"}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">You will receive</span>
              <span className="text-sm text-green-400">
                {amount} {erc20Symbol || "TOKEN"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Remaining eERC20 Balance
              </span>
              <span className="text-sm text-gray-300">
                {decryptedBalance && decimals && amount
                  ? formatBalance(
                      decryptedBalance - parseUnits(amount, Number(decimals)),
                    )
                  : formatBalance(decryptedBalance)}{" "}
                e{erc20Symbol || "TOKEN"}
              </span>
            </div>
          </div>

          {/* Process Info */}
          <div className="glass-subtle p-4 rounded-lg border border-blue-500/10">
            <div className="text-sm text-blue-400 mb-2">Withdrawal Process</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>
                • Encrypted tokens will be converted back to regular ERC20
                tokens
              </div>
              <div>
                • Zero-knowledge proof will be generated to verify the
                withdrawal
              </div>
              <div>• Withdrawal will be registered with campaign contract</div>
              <div>
                • Regular ERC20 tokens will be transferred to your wallet
              </div>
            </div>
          </div>

          {/* Error Display */}
          {withdrawError && (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{withdrawError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={() => setStep("amount")}
              variant="outline"
              className="flex-1 py-3 font-semibold"
            >
              Back
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="flex-1 btn-primary py-3 font-semibold hover-lift flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-5 h-5" />
                  <span>Confirm Withdrawal</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Complete
  if (step === "complete") {
    return (
      <div
        className={`glass p-6 rounded-xl border border-green-500/20 ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Withdrawal Successful!
          </h3>
          <p className="text-gray-400 mb-6">
            Your funds have been withdrawn and the transaction has been
            recorded.
          </p>

          {withdrawSuccess && (
            <div className="glass-subtle p-4 rounded-lg border border-gray-600/20 mb-6">
              <div className="text-sm text-gray-400 mb-1">Transaction Hash</div>
              <a
                href={`${EXPLORER_BASE_URL_TX}${withdrawSuccess}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 underline text-sm break-all"
              >
                {withdrawSuccess}
              </a>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={resetFlow}
              variant="outline"
              className="flex-1 py-3 font-semibold"
            >
              Make Another Withdrawal
            </Button>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="flex-1 btn-primary py-3 font-semibold hover-lift"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Wrapper component that uses the useEERCWithKey hook
const CampaignWithdrawalContent: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [searchParams] = useSearchParams();
  const campaignParam = searchParams.get("campaign");

  // Use the hook that properly handles key management
  const eercSDK = useEERCWithKey("converter");
  const { toast } = useToast();

  console.log("CampaignWithdrawalContent - eERC SDK state:", {
    isInitialized: eercSDK.isInitialized,
    isRegistered: eercSDK.isRegistered,
    keyLoaded: eercSDK.keyLoaded,
    hasStoredKey: eercSDK.hasStoredKey(),
  });

  // Safety check for eercSDK
  if (!eercSDK) {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading eERC SDK...</span>
        </div>
      </div>
    );
  }

  // If not initialized yet, show loading
  if (!eercSDK.keyLoaded) {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading eERC20 keys...</span>
        </div>
      </div>
    );
  }

  // If no key is stored, show key generation
  if (!eercSDK.hasStoredKey()) {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <h3 className="text-xl font-bold text-white mb-4">
          Generate Decryption Key
        </h3>
        <p className="text-gray-300 text-sm mb-4">
          You need to generate a decryption key to withdraw funds.
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
    );
  }

  // If not registered, show registration
  if (!eercSDK.isRegistered) {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <h3 className="text-xl font-bold text-white mb-4">
          Register with eERC20
        </h3>
        <p className="text-gray-300 text-sm mb-4">
          You need to register with the eERC20 system to withdraw funds.
        </p>
        <Button
          onClick={async () => {
            try {
              await eercSDK.registerWithKey();
              toast({
                title: "Registration Successful",
                description:
                  "You are now registered with eERC20 and can withdraw funds.",
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
    );
  }

  // If everything is ready, show the withdrawal component
  return (
    <ReadyCampaignWithdrawal
      className={className}
      campaignParam={campaignParam}
      eercSDK={eercSDK}
    />
  );
};

// Main wrapper component
const CampaignWithdrawal = ({ className }: CampaignWithdrawalProps) => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div
        className={`glass p-6 rounded-xl border border-red-500/20 ${className}`}
      >
        <div className="flex items-center space-x-2 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Connect wallet to withdraw funds</span>
        </div>
      </div>
    );
  }

  return <CampaignWithdrawalContent className={className} />;
};

export default CampaignWithdrawal;
