import {
  Shield,
  User,
  Calendar,
  FileCheck,
  Award,
  TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CredibilityFactor {
  id: string;
  name: string;
  score: number;
  weight: number;
  icon: React.ComponentType<any>;
  description: string;
  status: "verified" | "pending" | "missing";
}

interface CredibilityBreakdownProps {
  overallScore: number;
  factors: CredibilityFactor[];
  className?: string;
}

const CredibilityBreakdown = ({
  overallScore,
  factors,
  className,
}: CredibilityBreakdownProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "missing":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
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
          <span className="text-2xl font-bold text-red-400">
            {overallScore}%
          </span>
        </div>
        <Progress value={overallScore} className="h-3 bg-gray-800" />
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Low Trust</span>
          <span>High Trust</span>
        </div>
      </div>

      {/* Individual Factors */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white mb-4">Trust Factors</h4>
        {factors.map((factor) => {
          const Icon = factor.icon;
          return (
            <div
              key={factor.id}
              className="glass-subtle rounded-xl p-4 border border-gray-700/50"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Icon
                    className={`w-5 h-5 ${getStatusColor(factor.status)}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-white">{factor.name}</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {factor.score}%
                      </span>
                      <span className="text-xs text-gray-400">
                        (weight: {factor.weight}%)
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    {factor.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={factor.score}
                      className="flex-1 h-2 bg-gray-800"
                    />
                    <span
                      className={`text-xs font-medium capitalize ${getStatusColor(factor.status)}`}
                    >
                      {factor.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Improvement Suggestions */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">
            Improvement Suggestions
          </span>
        </div>
        <ul className="text-sm text-gray-300 space-y-1">
          {factors
            .filter((f) => f.status !== "verified" || f.score < 80)
            .slice(0, 3)
            .map((factor, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>
                  {factor.status === "missing"
                    ? `Complete ${factor.name.toLowerCase()} to boost your score`
                    : `Improve ${factor.name.toLowerCase()} verification`}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

// Default factors for demo
export const defaultCredibilityFactors: CredibilityFactor[] = [
  {
    id: "identity",
    name: "Identity Verification",
    score: 85,
    weight: 25,
    icon: User,
    description: "KYC verification and identity documents validated",
    status: "verified",
  },
  {
    id: "organization",
    name: "Organization License",
    score: 70,
    weight: 30,
    icon: FileCheck,
    description: "NGO/charity registration and legal documentation",
    status: "pending",
  },
  {
    id: "history",
    name: "Account History",
    score: 60,
    weight: 20,
    icon: Calendar,
    description: "Account age and previous campaign performance",
    status: "verified",
  },
  {
    id: "reputation",
    name: "Community Reputation",
    score: 45,
    weight: 15,
    icon: Award,
    description: "Community endorsements and social proof",
    status: "missing",
  },
  {
    id: "transparency",
    name: "Financial Transparency",
    score: 90,
    weight: 10,
    icon: Shield,
    description: "Open financial records and impact reporting",
    status: "verified",
  },
];

export default CredibilityBreakdown;
