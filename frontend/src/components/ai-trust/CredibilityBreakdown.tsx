import {
  Shield,
  User,
  Calendar,
  FileCheck,
  Award,
  TrendingUp,
  Building,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  ScoreBreakdown,
  ScoreFactor,
  ImprovementSuggestion,
} from "@/types/aiTrust";

interface CredibilityBreakdownProps {
  breakdown: ScoreBreakdown;
  isOwner?: boolean;
  className?: string;
}

const CredibilityBreakdown = ({
  breakdown,
  isOwner = false,
  className,
}: CredibilityBreakdownProps) => {
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
        return "Government ID";
      case "NGO_LICENSE":
        return "NGO License";
      case "ACCOUNT_AGE":
        return "Account Age";
      case "SOCIAL_MEDIA":
        return "Social Media";
      case "HISTORY":
        return "Campaign History";
      default:
        return type;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
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
        return "text-red-400";
      case "MEDIUM":
        return "text-yellow-400";
      case "LOW":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div
      className={`glass rounded-2xl p-6 border border-red-500/20 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-red-400" />
        <h3 className="text-xl font-bold text-white">Credibility Analysis</h3>
      </div>

      {/* Overall Score */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold text-white">
            Overall Trust Score
          </span>
          <span
            className={`text-2xl font-bold ${getScoreColor(breakdown.totalScore)}`}
          >
            {breakdown.totalScore}%
          </span>
        </div>
        <Progress value={breakdown.totalScore} className="h-3 bg-gray-800" />
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Low Trust</span>
          <span>High Trust</span>
        </div>
      </div>

      {/* Individual Factors */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white mb-4">Trust Factors</h4>
        {breakdown.factors.map((factor, index) => {
          const Icon = getFactorIcon(factor.type);
          const factorName = getFactorName(factor.type);
          const weightPercentage = Math.round(factor.weight * 100);

          return (
            <div
              key={`${factor.type}-${index}`}
              className="glass-subtle rounded-xl p-4 border border-gray-700/50"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Icon className={`w-5 h-5 ${getScoreColor(factor.value)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-white">{factorName}</h5>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${getScoreColor(factor.value)}`}
                      >
                        {factor.value}%
                      </span>
                      <span className="text-xs text-gray-400">
                        (weight: {weightPercentage}%)
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    {factor.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={factor.value}
                      className="flex-1 h-2 bg-gray-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Improvement Suggestions */}
      {isOwner && breakdown.suggestions.length > 0 && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              Improvement Suggestions
            </span>
          </div>
          <div className="space-y-3">
            {breakdown.suggestions.map((suggestion, index) => {
              const PriorityIcon = getPriorityIcon(suggestion.priority);
              return (
                <div
                  key={`${suggestion.type}-${index}`}
                  className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
                >
                  <PriorityIcon
                    className={`w-4 h-4 mt-0.5 ${getPriorityColor(suggestion.priority)}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">
                        {getFactorName(suggestion.type)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400">
                          +{suggestion.impact}% potential
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            suggestion.priority === "HIGH"
                              ? "bg-red-500/20 text-red-400"
                              : suggestion.priority === "MEDIUM"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {suggestion.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to determine trust level from score
export const getTrustLevel = (
  score: number,
): "HIGH" | "MEDIUM" | "LOW" | "FLAGGED" => {
  if (score >= 80) return "HIGH";
  if (score >= 60) return "MEDIUM";
  if (score >= 40) return "LOW";
  return "FLAGGED";
};

export default CredibilityBreakdown;
