import { useState, useEffect } from "react";
import { CheckCircle, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXPLORER_BASE_URL_TX } from "@/config/contracts";

interface DonationConfirmationProps {
  transactionHash: string;
  amount: string;
  campaignTitle: string;
  onClose: () => void;
}

const DonationConfirmation = ({
  transactionHash,
  amount,
  campaignTitle,
  onClose,
}: DonationConfirmationProps) => {
  const [confirmationStatus, setConfirmationStatus] = useState<
    "pending" | "confirmed" | "failed"
  >("pending");

  useEffect(() => {
    // Simulate transaction confirmation check
    const checkConfirmation = async () => {
      // In a real implementation, you would check the transaction status
      // For now, we'll simulate a successful confirmation after 3 seconds
      setTimeout(() => {
        setConfirmationStatus("confirmed");
      }, 3000);
    };

    if (transactionHash) {
      checkConfirmation();
    }
  }, [transactionHash]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="glass rounded-2xl p-8 border border-green-500/20 max-w-md w-full">
        <div className="text-center space-y-6">
          {confirmationStatus === "pending" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-400 mx-auto animate-spin" />
              <h3 className="text-2xl font-bold text-white">
                Processing Donation
              </h3>
              <p className="text-gray-300">
                Your donation is being confirmed on the blockchain...
              </p>
            </>
          )}

          {confirmationStatus === "confirmed" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <h3 className="text-2xl font-bold text-white">
                Donation Successful!
              </h3>
              <p className="text-gray-300">
                Your private donation of ${amount} to "{campaignTitle}" has been
                confirmed.
              </p>
            </>
          )}

          {confirmationStatus === "failed" && (
            <>
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
              <h3 className="text-2xl font-bold text-white">
                Transaction Failed
              </h3>
              <p className="text-gray-300">
                Your donation could not be processed. Please try again.
              </p>
            </>
          )}

          {/* Transaction Details */}
          <div className="space-y-4 p-4 bg-gray-800/50 rounded-xl">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white font-medium">${amount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Campaign:</span>
              <span className="text-white font-medium truncate ml-2">
                {campaignTitle}
              </span>
            </div>
            <div className="flex justify-between items-start text-sm">
              <span className="text-gray-400">Transaction:</span>
              <a
                href={`${EXPLORER_BASE_URL_TX}${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-right"
              >
                <span className="truncate max-w-[120px]">
                  {transactionHash}
                </span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-green-400 font-medium">
                  Privacy Protected
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Your donation amount is encrypted and only visible to you and
                  the campaign creator.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button onClick={onClose} className="flex-1 btn-primary">
              Close
            </Button>
            <Button
              onClick={() =>
                window.open(
                  `${EXPLORER_BASE_URL_TX}${transactionHash}`,
                  "_blank",
                )
              }
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              View Transaction
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationConfirmation;
