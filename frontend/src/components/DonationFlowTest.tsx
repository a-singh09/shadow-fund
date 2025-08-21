import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DonationFlowTest = () => {
  const [campaignAddress, setCampaignAddress] = useState(
    "0x1234567890123456789012345678901234567890",
  );
  const [userMessage, setUserMessage] = useState(
    "Supporting this amazing project!",
  );
  const [formattedMessage, setFormattedMessage] = useState("");

  // Format donation message according to spec: "DONATION:campaignAddr:message"
  const formatDonationMessage = (
    campaignAddr: string,
    userMsg: string,
  ): string => {
    const cleanMessage = userMsg.trim() || "Anonymous donation";
    return `DONATION:${campaignAddr}:${cleanMessage}`;
  };

  const handleFormatMessage = () => {
    const formatted = formatDonationMessage(campaignAddress, userMessage);
    setFormattedMessage(formatted);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="glass border-red-500/20">
        <CardHeader>
          <CardTitle className="text-white">
            Donation Message Formatting Test
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Test the donation message formatting according to the spec:
            "DONATION:campaignAddr:message"
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Campaign Address
            </label>
            <Input
              value={campaignAddress}
              onChange={(e) => setCampaignAddress(e.target.value)}
              placeholder="0x..."
              className="bg-gray-800/50 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              User Message
            </label>
            <Textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Enter your donation message..."
              className="bg-gray-800/50 border-gray-600 text-white resize-none"
              rows={3}
            />
          </div>

          <Button onClick={handleFormatMessage} className="btn-primary">
            Format Message
          </Button>

          {formattedMessage && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <h4 className="text-green-400 font-medium mb-2">
                Formatted Message:
              </h4>
              <code className="text-white text-sm break-all">
                {formattedMessage}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white">Donation Flow Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="text-white font-medium">
                  eERC20 Private Transfer
                </h4>
                <p className="text-gray-400 text-sm">
                  Execute privateTransfer(creatorAddress, amount,
                  formattedMessage)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="text-white font-medium">
                  Campaign Registration
                </h4>
                <p className="text-gray-400 text-sm">
                  Call campaign.registerDonation(transactionHash) to link the
                  donation
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-white font-medium">
                  Confirmation & Tracking
                </h4>
                <p className="text-gray-400 text-sm">
                  Show transaction confirmation with explorer link and privacy
                  notice
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Message Format Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-400">Simple donation:</span>
              <code className="block text-white bg-gray-800 p-2 rounded mt-1">
                DONATION:0x1234...7890:Supporting this project!
              </code>
            </div>
            <div>
              <span className="text-gray-400">Anonymous donation:</span>
              <code className="block text-white bg-gray-800 p-2 rounded mt-1">
                DONATION:0x1234...7890:Anonymous donation
              </code>
            </div>
            <div>
              <span className="text-gray-400">With special characters:</span>
              <code className="block text-white bg-gray-800 p-2 rounded mt-1">
                DONATION:0x1234...7890:Great work! Keep it up 🚀
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DonationFlowTest;
