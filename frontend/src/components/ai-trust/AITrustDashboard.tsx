import {
  Brain,
  Shield,
  Eye,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react";
import { useState } from "react";
import TrustBadge from "./TrustBadge";
import CredibilityBreakdown, {
  defaultCredibilityFactors,
} from "./CredibilityBreakdown";
import DuplicationWarning from "./DuplicationWarning";
import VisualIntegrityBadge, {
  generateMockVisualResult,
} from "./VisualIntegrityBadge";
import FundFlowDiagram, { generateMockFundFlowData } from "./FundFlowDiagram";

interface AITrustDashboardProps {
  campaignId: string;
  className?: string;
}

const AITrustDashboard = ({ campaignId, className }: AITrustDashboardProps) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "credibility" | "content" | "visual" | "impact"
  >("overview");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock data for demo
  const trustScore = 78;
  const trustLevel =
    trustScore >= 80 ? "high" : trustScore >= 60 ? "medium" : "low";

  const mockSimilarCampaigns = [
    {
      id: "camp_123",
      title: "Clean Water Initiative for Rural Communities",
      creator: "WaterAid Foundation",
      similarity: 85,
      matchedSegments: [
        "providing clean water access to underserved communities",
        "sustainable water solutions for rural areas",
      ],
      status: "active" as const,
    },
    {
      id: "camp_456",
      title: "Safe Drinking Water Project",
      creator: "Global Water Trust",
      similarity: 72,
      matchedSegments: [
        "drilling wells and installing purification systems",
        "improving health outcomes through clean water",
      ],
      status: "completed" as const,
    },
  ];

  const visualResult = generateMockVisualResult("verified");
  const fundFlowData = generateMockFundFlowData();

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsAnalyzing(false);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Brain },
    { id: "credibility", label: "Credibility", icon: Shield },
    { id: "content", label: "Content", icon: Eye },
    { id: "visual", label: "Visual", icon: CheckCircle },
    { id: "impact", label: "Impact", icon: TrendingUp },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="glass rounded-2xl p-6 border border-red-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-white">AI Trust System</h2>
          </div>
          <div className="flex items-center gap-3">
            <TrustBadge score={trustScore} level={trustLevel} />
            <button
              onClick={runAIAnalysis}
              disabled={isAnalyzing}
              className="btn-primary px-4 py-2 flex items-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Re-analyze
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-gray-400 mb-4">
          Comprehensive AI-powered trust analysis for campaign verification and
          fraud prevention.
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Trust Score</span>
            </div>
            <div className="text-lg font-bold text-white">{trustScore}%</div>
          </div>
          <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Content Check</span>
            </div>
            <div className="text-lg font-bold text-yellow-400">Medium Risk</div>
          </div>
          <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Visual Integrity</span>
            </div>
            <div className="text-lg font-bold text-green-400">Verified</div>
          </div>
          <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Last Scan</span>
            </div>
            <div className="text-sm font-bold text-white">2 hours ago</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? "btn-primary"
                  : "glass text-gray-400 hover:text-white border border-gray-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CredibilityBreakdown
              overallScore={trustScore}
              factors={defaultCredibilityFactors}
            />
            <div className="space-y-6">
              <DuplicationWarning
                similarCampaigns={mockSimilarCampaigns}
                confidence={78}
                onDismiss={() => console.log("Dismissed")}
                onReport={(id) => console.log("Reported:", id)}
                onViewDetails={(id) => console.log("View details:", id)}
              />
              <VisualIntegrityBadge result={visualResult} showDetails={true} />
            </div>
          </div>
        )}

        {activeTab === "credibility" && (
          <CredibilityBreakdown
            overallScore={trustScore}
            factors={defaultCredibilityFactors}
          />
        )}

        {activeTab === "content" && (
          <DuplicationWarning
            similarCampaigns={mockSimilarCampaigns}
            confidence={78}
            onDismiss={() => console.log("Dismissed")}
            onReport={(id) => console.log("Reported:", id)}
            onViewDetails={(id) => console.log("View details:", id)}
          />
        )}

        {activeTab === "visual" && (
          <div className="space-y-6">
            <VisualIntegrityBadge result={visualResult} showDetails={true} />

            {/* Additional Visual Analysis */}
            <div className="glass rounded-2xl p-6 border border-red-500/20">
              <h3 className="text-lg font-bold text-white mb-4">
                Image Analysis History
              </h3>
              <div className="space-y-3">
                {[
                  {
                    name: "Hero Image",
                    result: generateMockVisualResult("verified"),
                  },
                  {
                    name: "Gallery Image 1",
                    result: generateMockVisualResult("uncertain"),
                  },
                  {
                    name: "Gallery Image 2",
                    result: generateMockVisualResult("suspicious"),
                  },
                ].map((image, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 glass-subtle rounded-lg border border-gray-700/50"
                  >
                    <span className="text-white font-medium">{image.name}</span>
                    <VisualIntegrityBadge result={image.result} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "impact" && <FundFlowDiagram data={fundFlowData} />}
      </div>

      {/* AI Powered By Notice */}
      <div className="glass-subtle rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <div>
            <h4 className="font-medium text-white">Powered by Advanced AI</h4>
            <p className="text-sm text-gray-400">
              Using Google Gemini API for semantic analysis, image verification,
              and trust scoring. All analysis is performed with
              privacy-preserving techniques.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITrustDashboard;
