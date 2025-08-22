import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  Loader,
  AlertCircle,
  CheckCircle,
  Shield,
  Rocket,
  Users,
  Clock,
} from "lucide-react";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import { useCampaign } from "@/hooks/useCampaign";
import { useCampaignList } from "@/hooks/useCampaignList";
import { parseEther, formatEther } from "viem";
import { EXPLORER_BASE_URL_TX } from "@/config/contracts";

interface CampaignWithdrawalProps {
  className?: string;
}

const CampaignWithdrawal = ({ className = "" }: CampaignWithdrawalProps) => {
  const { address } = useAccount();
  const [searchParams] = useSearchParams();
  const campaignParam = searchParams.get("campaign");

  const { decryptedBalance, withdraw, privateTransfer } =
    useEERCWithKey("standalone");
  const { registerWithdrawal, getCampaignInfo } = useCampaign(
    campaignParam || undefined,
  );
  const { campaigns } = useCampaignList();

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

    try {
      const withdrawAmount = parseEther(amount);
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

    let withdrawAmount: bigint;
    try {
      withdrawAmount = parseEther(amount);
    } catch {
      setWithdrawError("Invalid amount format");
      return;
    }

    setStep("processing");
    setIsWithdrawing(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);

    try {
      // Step 1: Perform the withdrawal using eERC20 privateTransfer to self
      const withdrawalMessage = `WITHDRAWAL:${selectedCampaign}`;

      const transferResult = await privateTransfer(
        address, // Transfer to self (withdrawal)
        withdrawAmount,
        withdrawalMessage,
      );

      // Step 2: Register the withdrawal with the campaign contract
      try {
        await registerWithdrawal(transferResult.transactionHash);
      } catch (regError) {
        console.warn("Failed to register withdrawal with campaign:", regError);
        // Continue anyway as the actual withdrawal succeeded
      }

      setWithdrawSuccess(transferResult.transactionHash);
      setAmount("");
      setStep("complete");
    } catch (err) {
      setWithdrawError(
        err instanceof Error ? err.message : "Withdrawal failed",
      );
      setStep("confirm");
    } finally {
      setIsWithdrawing(false);
    }
  }, [address, selectedCampaign, amount, privateTransfer, registerWithdrawal]);

  const formatBalance = (balance: bigint | null): string => {
    if (balance === null) return "0.00";
    return parseFloat(formatEther(balance)).toFixed(4);
  };

  const setMaxAmount = () => {
    if (decryptedBalance !== null) {
      // Leave a small amount for gas fees
      const maxWithdraw =
        decryptedBalance > parseEther("0.01")
          ? decryptedBalance - parseEther("0.01")
          : decryptedBalance;
      setAmount(formatEther(maxWithdraw));
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
          {/* Available Balance */}
          <div className="glass p-4 rounded-lg border border-gray-600/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Available Balance</span>
              <span className="text-lg font-semibold text-white">
                {formatBalance(decryptedBalance)} eAVAX
              </span>
            </div>
          </div>

          {/* Withdrawal Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Withdrawal Amount (eAVAX)
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
          </div>

          {/* Error Display */}
          {withdrawError && (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{withdrawError}</span>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={handleAmountNext}
            disabled={!amount}
            className="w-full btn-primary py-3 font-semibold hover-lift flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Continue</span>
            <ArrowUpRight className="w-5 h-5" />
          </button>
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
                {amount} eAVAX
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Remaining Balance</span>
              <span className="text-sm text-gray-300">
                {decryptedBalance
                  ? formatBalance(decryptedBalance - parseEther(amount))
                  : "0.00"}{" "}
                eAVAX
              </span>
            </div>
          </div>

          {/* Process Info */}
          <div className="glass-subtle p-4 rounded-lg border border-blue-500/10">
            <div className="text-sm text-blue-400 mb-2">Withdrawal Process</div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• Funds will be transferred privately using eERC20</div>
              <div>• Withdrawal will be registered with campaign contract</div>
              <div>• Transaction will be recorded for tracking</div>
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
            <button
              onClick={() => setStep("amount")}
              className="flex-1 btn-secondary py-3 font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="flex-1 btn-primary py-3 font-semibold hover-lift flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWithdrawing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-5 h-5" />
                  <span>Confirm Withdrawal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Processing (handled by confirm step)
  // Step 5: Complete
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
            <button
              onClick={resetFlow}
              className="flex-1 btn-secondary py-3 font-semibold"
            >
              Make Another Withdrawal
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="flex-1 btn-primary py-3 font-semibold hover-lift"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CampaignWithdrawal;
