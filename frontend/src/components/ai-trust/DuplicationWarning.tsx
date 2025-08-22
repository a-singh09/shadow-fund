import { AlertTriangle, Eye, Flag, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SimilarCampaign {
  id: string;
  title: string;
  creator: string;
  similarity: number;
  matchedSegments: string[];
  status: "active" | "completed" | "flagged";
}

interface DuplicationWarningProps {
  similarCampaigns: SimilarCampaign[];
  confidence: number;
  onDismiss?: () => void;
  onReport?: (campaignId: string) => void;
  onViewDetails?: (campaignId: string) => void;
  className?: string;
}

const DuplicationWarning = ({
  similarCampaigns,
  confidence,
  onDismiss,
  onReport,
  onViewDetails,
  className,
}: DuplicationWarningProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityColor = () => {
    if (confidence >= 80) return "border-red-500/50 bg-red-500/10";
    if (confidence >= 60) return "border-orange-500/50 bg-orange-500/10";
    return "border-yellow-500/50 bg-yellow-500/10";
  };

  const getSeverityText = () => {
    if (confidence >= 80) return "High Risk";
    if (confidence >= 60) return "Medium Risk";
    return "Low Risk";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "completed":
        return "text-blue-400";
      case "flagged":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div
      className={`glass rounded-2xl border p-6 ${getSeverityColor()} ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-400" />
          <div>
            <h3 className="text-lg font-bold text-white">
              Potential Duplicate Detected
            </h3>
            <p className="text-sm text-gray-400">
              AI analysis found {similarCampaigns.length} similar campaign(s) -{" "}
              {getSeverityText()} ({confidence}% confidence)
            </p>
          </div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
          <div className="text-sm text-gray-400">Similarity Score</div>
          <div className="text-xl font-bold text-white">{confidence}%</div>
        </div>
        <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
          <div className="text-sm text-gray-400">Similar Campaigns</div>
          <div className="text-xl font-bold text-white">
            {similarCampaigns.length}
          </div>
        </div>
        <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
          <div className="text-sm text-gray-400">Risk Level</div>
          <div className="text-xl font-bold text-orange-400">
            {getSeverityText()}
          </div>
        </div>
      </div>

      {/* Similar Campaigns List */}
      <div className="space-y-3">
        {similarCampaigns
          .slice(0, isExpanded ? undefined : 2)
          .map((campaign) => (
            <div
              key={campaign.id}
              className="glass-subtle rounded-xl p-4 border border-gray-700/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">
                    {campaign.title}
                  </h4>
                  <p className="text-sm text-gray-400">
                    by {campaign.creator} •{" "}
                    <span className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm font-semibold text-orange-400">
                    {campaign.similarity}% match
                  </span>
                </div>
              </div>

              {/* Matched Segments */}
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-2">
                  Similar text segments:
                </div>
                <div className="space-y-1">
                  {campaign.matchedSegments
                    .slice(0, 2)
                    .map((segment, index) => (
                      <div
                        key={index}
                        className="text-sm text-gray-300 bg-gray-800/50 rounded p-2 border-l-2 border-orange-500/50"
                      >
                        "{segment}"
                      </div>
                    ))}
                  {campaign.matchedSegments.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{campaign.matchedSegments.length - 2} more segments
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {onViewDetails && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(campaign.id)}
                    className="text-gray-400 border-gray-600 hover:bg-gray-800"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                )}
                {onReport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReport(campaign.id)}
                    className="text-red-400 border-red-600 hover:bg-red-800/20"
                  >
                    <Flag className="w-3 h-3 mr-1" />
                    Report
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Compare
                </Button>
              </div>
            </div>
          ))}
      </div>

      {/* Expand/Collapse */}
      {similarCampaigns.length > 2 && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded
              ? "Show Less"
              : `Show ${similarCampaigns.length - 2} More`}
          </Button>
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="mt-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <p className="text-xs text-gray-400">
          <strong>AI Analysis:</strong> This detection is powered by Google
          Gemini's semantic analysis. Results are probabilistic and should be
          reviewed by human moderators. False positives may occur for campaigns
          in similar categories or with common language patterns.
        </p>
      </div>
    </div>
  );
};

export default DuplicationWarning;
