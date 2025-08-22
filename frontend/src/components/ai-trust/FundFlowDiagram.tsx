import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ImpactData {
  category: string;
  amount: number;
  percentage: number;
  verified: boolean;
  description: string;
  location?: string;
  beneficiaries?: number;
  evidence?: string[];
}

interface FundFlowData {
  totalRaised: number;
  totalDonors: number;
  impactAreas: ImpactData[];
  verificationLevel: "ai-verified" | "self-declared" | "unverified";
  lastUpdated: string;
}

interface FundFlowDiagramProps {
  data: FundFlowData;
  showPrivacyMode?: boolean;
  className?: string;
}

const FundFlowDiagram = ({
  data,
  showPrivacyMode = true,
  className,
}: FundFlowDiagramProps) => {
  const [selectedArea, setSelectedArea] = useState<ImpactData | null>(null);
  const [viewMode, setViewMode] = useState<"flow" | "impact" | "geographic">(
    "flow",
  );

  const getVerificationColor = () => {
    switch (data.verificationLevel) {
      case "ai-verified":
        return "text-green-400";
      case "self-declared":
        return "text-yellow-400";
      case "unverified":
        return "text-gray-400";
    }
  };

  const getVerificationLabel = () => {
    switch (data.verificationLevel) {
      case "ai-verified":
        return "AI Verified";
      case "self-declared":
        return "Self Declared";
      case "unverified":
        return "Unverified";
    }
  };

  // Calculate flow positions for Sankey-style diagram
  const calculateFlowPositions = () => {
    let currentY = 0;
    return data.impactAreas.map((area) => {
      const height = (area.percentage / 100) * 300; // Scale to diagram height
      const position = { y: currentY, height };
      currentY += height + 10; // Add spacing
      return { ...area, ...position };
    });
  };

  const flowPositions = calculateFlowPositions();

  return (
    <div
      className={`glass rounded-2xl p-6 border border-red-500/20 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-white">Fund Flow & Impact</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getVerificationColor()}`}>
            {getVerificationLabel()}
          </span>
          {data.verificationLevel === "ai-verified" && (
            <Shield className="w-4 h-4 text-green-400" />
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      {showPrivacyMode && (
        <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">
              Privacy Protected
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Individual donation amounts are encrypted. Only aggregated impact
            data is shown.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-subtle rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Total Impact</span>
          </div>
          <div className="text-xl font-bold text-white">
            {showPrivacyMode
              ? "Private Amount"
              : `$${data.totalRaised.toLocaleString()}`}
          </div>
        </div>
        <div className="glass-subtle rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Contributors</span>
          </div>
          <div className="text-xl font-bold text-white">{data.totalDonors}</div>
        </div>
        <div className="glass-subtle rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-400">Impact Areas</span>
          </div>
          <div className="text-xl font-bold text-white">
            {data.impactAreas.length}
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center gap-2 mb-6">
        {["flow", "impact", "geographic"].map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(mode as any)}
            className={
              viewMode === mode
                ? "btn-primary"
                : "text-gray-400 border-gray-600"
            }
          >
            {mode === "flow" && "Flow Diagram"}
            {mode === "impact" && "Impact View"}
            {mode === "geographic" && "Geographic"}
          </Button>
        ))}
      </div>

      {/* Flow Diagram */}
      {viewMode === "flow" && (
        <div className="relative">
          <svg width="100%" height="400" className="overflow-visible">
            {/* Source Node */}
            <rect
              x="20"
              y="150"
              width="120"
              height="100"
              rx="10"
              className="fill-red-500/20 stroke-red-500/50"
              strokeWidth="2"
            />
            <text
              x="80"
              y="190"
              textAnchor="middle"
              className="fill-white text-sm font-medium"
            >
              Donations
            </text>
            <text
              x="80"
              y="210"
              textAnchor="middle"
              className="fill-gray-400 text-xs"
            >
              {data.totalDonors} donors
            </text>

            {/* Flow Lines */}
            {flowPositions.map((area, index) => {
              const startY = 200;
              const endY = 50 + area.y + area.height / 2;
              const midX = 250;

              return (
                <g key={index}>
                  {/* Flow Path */}
                  <path
                    d={`M 140 ${startY} Q ${midX} ${startY} ${midX} ${endY} L 380 ${endY}`}
                    fill="none"
                    stroke={area.verified ? "#10b981" : "#f59e0b"}
                    strokeWidth={Math.max(2, area.height / 10)}
                    opacity="0.6"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => setSelectedArea(area)}
                  />

                  {/* Impact Node */}
                  <rect
                    x="380"
                    y={endY - 25}
                    width="150"
                    height="50"
                    rx="8"
                    className={`${area.verified ? "fill-green-500/20 stroke-green-500/50" : "fill-yellow-500/20 stroke-yellow-500/50"} cursor-pointer hover:opacity-80`}
                    strokeWidth="2"
                    onClick={() => setSelectedArea(area)}
                  />
                  <text
                    x="455"
                    y={endY - 5}
                    textAnchor="middle"
                    className="fill-white text-xs font-medium"
                  >
                    {area.category}
                  </text>
                  <text
                    x="455"
                    y={endY + 10}
                    textAnchor="middle"
                    className="fill-gray-400 text-xs"
                  >
                    {area.percentage}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Impact View */}
      {viewMode === "impact" && (
        <div className="space-y-4">
          {data.impactAreas.map((area, index) => (
            <div
              key={index}
              className={`glass-subtle rounded-xl p-4 border cursor-pointer transition-all duration-300 hover:border-red-500/50 ${
                selectedArea?.category === area.category
                  ? "border-red-500/50 bg-red-500/5"
                  : "border-gray-700/50"
              }`}
              onClick={() =>
                setSelectedArea(
                  selectedArea?.category === area.category ? null : area,
                )
              }
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">
                      {area.category}
                    </h4>
                    {area.verified && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{area.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {area.percentage}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {showPrivacyMode
                      ? "Private"
                      : `$${area.amount.toLocaleString()}`}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    area.verified ? "bg-green-500" : "bg-yellow-500"
                  }`}
                  style={{ width: `${area.percentage}%` }}
                />
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {area.location && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{area.location}</span>
                  </div>
                )}
                {area.beneficiaries && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{area.beneficiaries} beneficiaries</span>
                  </div>
                )}
              </div>

              {/* Evidence (if expanded) */}
              {selectedArea?.category === area.category && area.evidence && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="text-sm font-medium text-white mb-2">
                    Verification Evidence
                  </div>
                  <div className="space-y-1">
                    {area.evidence.map((evidence, evidenceIndex) => (
                      <div
                        key={evidenceIndex}
                        className="text-sm text-gray-300 bg-gray-800/50 rounded p-2"
                      >
                        {evidence}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Geographic View */}
      {viewMode === "geographic" && (
        <div className="space-y-4">
          <div className="glass-subtle rounded-lg p-4 border border-gray-700/50 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400">
              Geographic visualization coming soon
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Interactive map showing impact distribution by location
            </p>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Last updated: {data.lastUpdated}</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          <span>Powered by AI verification</span>
        </div>
      </div>
    </div>
  );
};

// Demo data generator
export const generateMockFundFlowData = (): FundFlowData => ({
  totalRaised: 125000,
  totalDonors: 342,
  verificationLevel: "ai-verified",
  lastUpdated: "2024-01-20",
  impactAreas: [
    {
      category: "Medical Supplies",
      amount: 50000,
      percentage: 40,
      verified: true,
      description: "Emergency medical equipment and supplies for rural clinics",
      location: "Kenya, Tanzania",
      beneficiaries: 2500,
      evidence: [
        "Purchase receipts verified through blockchain",
        "Delivery confirmation from partner NGOs",
        "Photo evidence of supplies in use",
      ],
    },
    {
      category: "Education Programs",
      amount: 37500,
      percentage: 30,
      verified: true,
      description: "School construction and teacher training initiatives",
      location: "Uganda, Rwanda",
      beneficiaries: 800,
      evidence: [
        "Construction progress photos",
        "Teacher certification records",
        "Student enrollment data",
      ],
    },
    {
      category: "Clean Water Access",
      amount: 25000,
      percentage: 20,
      verified: false,
      description: "Well drilling and water purification systems",
      location: "Mali, Burkina Faso",
      beneficiaries: 1200,
      evidence: ["Self-reported progress updates", "Community testimonials"],
    },
    {
      category: "Administrative Costs",
      amount: 12500,
      percentage: 10,
      verified: true,
      description: "Operational expenses and program management",
      location: "Global",
      evidence: ["Audited financial statements", "Expense tracking reports"],
    },
  ],
});

export default FundFlowDiagram;
