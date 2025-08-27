import React from "react";
import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Building,
  Clock,
  Users,
  Calendar,
  Shield,
  ArrowRight,
  Star,
} from "lucide-react";
import { ImprovementSuggestion } from "@/types/aiTrust";
import { Button } from "@/components/ui/button";

interface ImprovementSuggestionsProps {
  suggestions: ImprovementSuggestion[];
  currentScore: number;
  onActionClick?: (suggestion: ImprovementSuggestion) => void;
  className?: string;
}

const ImprovementSuggestions: React.FC<ImprovementSuggestionsProps> = ({
  suggestions,
  currentScore,
  onActionClick,
  className,
}) => {
  const getFactorIcon = (type: string) => {
    switch (type) {
      case "GOVERNMENT_ID":
        return User;
      case "NGO_LICENSE":
        return Building;
      case "ACCOUNT_AGE":
        return Clock;
      case "SOCIAL_MEDIA":
        return Users;
      case "HISTORY":
        return Calendar;
      default:
        return Shield;
    }
  };

  const getFactorName = (type: string) => {
    switch (type) {
      case "GOVERNMENT_ID":
        return "Government ID Verification";
      case "NGO_LICENSE":
        return "NGO License Validation";
      case "ACCOUNT_AGE":
        return "Account Age";
      case "SOCIAL_MEDIA":
        return "Social Media Verification";
      case "HISTORY":
        return "Campaign History";
      default:
        return type;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return AlertCircle;
      case "MEDIUM":
        return CheckCircle;
      case "LOW":
        return XCircle;
      default:
        return CheckCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return {
          icon: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          badge: "bg-red-500/20 text-red-400",
        };
      case "MEDIUM":
        return {
          icon: "text-yellow-400",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
          badge: "bg-yellow-500/20 text-yellow-400",
        };
      case "LOW":
        return {
          icon: "text-blue-400",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          badge: "bg-blue-500/20 text-blue-400",
        };
      default:
        return {
          icon: "text-gray-400",
          bg: "bg-gray-500/10",
          border: "border-gray-500/20",
          badge: "bg-gray-500/20 text-gray-400",
        };
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case "GOVERNMENT_ID":
        return "Verify ID";
      case "NGO_LICENSE":
        return "Upload License";
      case "ACCOUNT_AGE":
        return "Keep Active";
      case "SOCIAL_MEDIA":
        return "Link Accounts";
      case "HISTORY":
        return "Complete Campaigns";
      default:
        return "Take Action";
    }
  };

  const potentialScore =
    currentScore + suggestions.reduce((sum, s) => sum + s.impact, 0);
  const maxPotentialScore = Math.min(100, potentialScore);

  if (suggestions.length === 0) {
    return (
      <div
        className={`glass rounded-2xl p-6 border border-green-500/20 ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Star className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">
            Excellent Trust Score!
          </h3>
        </div>
        <p className="text-gray-300">
          Your credibility score is already high. Keep maintaining your
          excellent track record!
        </p>
      </div>
    );
  }

  return (
    <div
      className={`glass rounded-2xl p-6 border border-blue-500/20 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">
            Boost Your Trust Score
          </h3>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Potential Score</div>
          <div className="text-lg font-bold text-green-400">
            {currentScore}% → {maxPotentialScore}%
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => {
          const FactorIcon = getFactorIcon(suggestion.type);
          const PriorityIcon = getPriorityIcon(suggestion.priority);
          const colors = getPriorityColor(suggestion.priority);
          const factorName = getFactorName(suggestion.type);
          const actionText = getActionText(suggestion.type);

          return (
            <div
              key={`${suggestion.type}-${index}`}
              className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <FactorIcon className={`w-6 h-6 ${colors.icon}`} />
                    <PriorityIcon
                      className={`w-3 h-3 absolute -top-1 -right-1 ${colors.icon}`}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{factorName}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-400 font-medium">
                        +{suggestion.impact}%
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${colors.badge}`}
                      >
                        {suggestion.priority}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-3">
                    {suggestion.description}
                  </p>

                  {onActionClick && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onActionClick(suggestion)}
                      className="group border-gray-600 hover:border-blue-400 hover:bg-blue-500/10"
                    >
                      <span>{actionText}</span>
                      <ArrowRight className="w-3 h-3 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white mb-1">
                Complete all suggestions to reach
              </div>
              <div className="text-2xl font-bold text-green-400">
                {maxPotentialScore}% Trust Score
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Total Impact</div>
              <div className="text-lg font-bold text-green-400">
                +
                {Math.min(
                  suggestions.reduce((sum, s) => sum + s.impact, 0),
                  100 - currentScore,
                )}
                %
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovementSuggestions;
