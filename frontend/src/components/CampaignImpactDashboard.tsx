import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FundFlowDiagram } from "./FundFlowDiagram";
import { InteractiveImpactVisualization } from "./InteractiveImpactVisualization";
import {
  FlowDiagram,
  ImpactVisualization,
  ImpactReport,
  VerificationStatus,
  ImpactCategory,
  AggregatedImpact,
  CategoryImpact,
  LocationImpact,
  TimelinePoint,
  ImpactMetric,
} from "../types/aiTrust";
import { FundFlowVisualizer } from "../services/fundFlowVisualizer";
import { ImpactReportingService } from "../services/impactReportingService";
import { GeminiClient } from "../services/geminiClient";
import { AITrustErrorHandler } from "../services/aiTrustErrorHandler";
import {
  TrendingUp,
  Eye,
  BarChart3,
  Map,
  Users,
  Target,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface CampaignImpactDashboardProps {
  campaignId: string;
  campaignTitle?: string;
  className?: string;
}

/**
 * Campaign Impact Dashboard Component
 * Integrates fund flow visualization with campaign pages
 * Shows "Show Impact" button and impact dashboard for donors
 */
export const CampaignImpactDashboard: React.FC<
  CampaignImpactDashboardProps
> = ({ campaignId, campaignTitle = "Campaign", className = "" }) => {
  const [showImpact, setShowImpact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowDiagram, setFlowDiagram] = useState<FlowDiagram | null>(null);
  const [impactVisualization, setImpactVisualization] =
    useState<ImpactVisualization | null>(null);
  const [impactReports, setImpactReports] = useState<ImpactReport[]>([]);
  const [activeView, setActiveView] = useState<"flow" | "impact" | "reports">(
    "flow",
  );

  // Initialize services (memoized to prevent recreation on every render)
  const services = useMemo(() => {
    const geminiClient = new GeminiClient();
    const errorHandler = new AITrustErrorHandler();
    const fundFlowVisualizer = new FundFlowVisualizer(
      geminiClient,
      errorHandler,
    );
    const impactReportingService = new ImpactReportingService(
      geminiClient,
      errorHandler,
    );
    return { fundFlowVisualizer, impactReportingService };
  }, []);

  const generateMockImpactReports = useCallback(
    async (campaignId: string): Promise<ImpactReport[]> => {
      // Generate realistic mock data for demonstration
      const categories: ImpactCategory[] = [
        "EDUCATION",
        "HEALTHCARE",
        "ENVIRONMENT",
        "POVERTY",
      ];
      const locations = ["Kenya", "Bangladesh", "Guatemala", "Philippines"];
      const organizations = [
        "0x1234567890123456789012345678901234567890",
        "0x2345678901234567890123456789012345678901",
        "0x3456789012345678901234567890123456789012",
      ];

      const reports: ImpactReport[] = [];

      for (let i = 0; i < 8; i++) {
        const category = categories[i % categories.length];
        const location = locations[i % locations.length];
        const organization = organizations[i % organizations.length];

        const report = await services.impactReportingService.createImpactReport(
          organization,
          campaignId,
          generateImpactClaim(category, location),
          category,
          [`evidence_${i + 1}.jpg`, `report_${i + 1}.pdf`],
          location,
          Math.floor(Math.random() * 500) + 50,
        );

        // Simulate verification results
        report.verificationStatus =
          i % 3 === 0
            ? "AI_VERIFIED"
            : i % 3 === 1
              ? "SELF_DECLARED"
              : "PENDING";

        reports.push(report);
      }

      return reports;
    },
    [services.impactReportingService],
  );

  const loadImpactData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate mock impact reports for demonstration
      const mockReports = await generateMockImpactReports(campaignId);
      setImpactReports(mockReports);

      // Generate flow diagram
      const diagram = await services.fundFlowVisualizer.generateFlowDiagram(
        campaignId,
        mockReports,
      );
      setFlowDiagram(diagram);

      // Create aggregated impact data
      const aggregatedImpact = await createAggregatedImpact(mockReports);

      // Generate impact visualization
      const visualization =
        await services.fundFlowVisualizer.createImpactVisualization(
          aggregatedImpact,
        );
      setImpactVisualization(visualization);
    } catch (err) {
      console.error("Failed to load impact data:", err);
      setError("Failed to load impact data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [campaignId, services, generateMockImpactReports]);

  useEffect(() => {
    if (showImpact && !flowDiagram) {
      loadImpactData();
    }
  }, [showImpact, flowDiagram, loadImpactData]);

  const generateImpactClaim = (
    category: ImpactCategory,
    location: string,
  ): string => {
    const claims = {
      EDUCATION: [
        `Provided school supplies to 150 children in ${location}`,
        `Built 2 new classrooms in rural ${location}`,
        `Trained 25 teachers in digital literacy in ${location}`,
      ],
      HEALTHCARE: [
        `Delivered medical supplies to 3 clinics in ${location}`,
        `Vaccinated 200 children in remote areas of ${location}`,
        `Established mobile health unit serving ${location}`,
      ],
      ENVIRONMENT: [
        `Planted 1,000 trees in deforested areas of ${location}`,
        `Installed solar panels for 50 homes in ${location}`,
        `Cleaned 5 km of coastline in ${location}`,
      ],
      POVERTY: [
        `Provided food assistance to 300 families in ${location}`,
        `Created 25 microfinance opportunities in ${location}`,
        `Distributed clean water filters to 100 households in ${location}`,
      ],
      DISASTER_RELIEF: [
        `Emergency shelter for 200 displaced families in ${location}`,
        `Disaster relief supplies to affected areas in ${location}`,
      ],
      HUMAN_RIGHTS: [
        `Legal aid services for 50 individuals in ${location}`,
        `Human rights training for 100 community leaders in ${location}`,
      ],
      COMMUNITY_DEVELOPMENT: [
        `Community center construction in ${location}`,
        `Skills training program for 75 youth in ${location}`,
      ],
      OTHER: [`Community support initiative in ${location}`],
    };

    const categoryClaimsArray = claims[category] || claims.OTHER;
    return categoryClaimsArray[
      Math.floor(Math.random() * categoryClaimsArray.length)
    ];
  };

  const createAggregatedImpact = async (
    reports: ImpactReport[],
  ): Promise<AggregatedImpact> => {
    const categories: Record<ImpactCategory, CategoryImpact> = {} as any;
    const locationMap = new Map<string, LocationImpact>();
    const timelineMap = new Map<string, TimelinePoint>();

    reports.forEach((report) => {
      // Aggregate by category
      if (!categories[report.category]) {
        categories[report.category] = {
          category: report.category,
          totalReports: 0,
          verifiedReports: 0,
          estimatedBeneficiaries: 0,
          keyMetrics: [],
        };
      }

      categories[report.category].totalReports++;
      if (report.verificationStatus === "AI_VERIFIED") {
        categories[report.category].verifiedReports++;
      }
      if (report.beneficiaryCount) {
        categories[report.category].estimatedBeneficiaries +=
          report.beneficiaryCount;
      }

      // Aggregate by location
      if (report.location) {
        if (!locationMap.has(report.location)) {
          locationMap.set(report.location, {
            location: report.location,
            impactCount: 0,
            categories: [],
            verificationLevel: 0,
          });
        }

        const location = locationMap.get(report.location)!;
        location.impactCount++;
        if (!location.categories.includes(report.category)) {
          location.categories.push(report.category);
        }
      }

      // Aggregate by timeline
      const dateKey = report.timestamp.toISOString().split("T")[0];
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, {
          date: new Date(dateKey),
          impactCount: 0,
          categories: [],
          cumulativeImpact: 0,
        });
      }

      const timelinePoint = timelineMap.get(dateKey)!;
      timelinePoint.impactCount++;
      if (!timelinePoint.categories.includes(report.category)) {
        timelinePoint.categories.push(report.category);
      }
    });

    // Calculate cumulative impact for timeline
    const sortedTimelinePoints = Array.from(timelineMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    let cumulative = 0;
    sortedTimelinePoints.forEach((point) => {
      cumulative += point.impactCount;
      point.cumulativeImpact = cumulative;
    });

    return {
      totalBeneficiaries: Object.values(categories).reduce(
        (sum, cat) => sum + cat.estimatedBeneficiaries,
        0,
      ),
      impactsByCategory: categories,
      geographicDistribution: Array.from(locationMap.values()),
      timelineData: sortedTimelinePoints,
    };
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    console.log("Node clicked:", nodeId);
    // Could implement drill-down functionality here
  }, []);

  const handleElementClick = useCallback((elementId: string, data: any) => {
    console.log("Element clicked:", elementId, data);
    // Could implement detailed view functionality here
  }, []);

  const getVerificationSummary = useMemo(() => {
    if (!impactReports.length) return null;

    const summary = impactReports.reduce(
      (acc, report) => {
        acc[report.verificationStatus] =
          (acc[report.verificationStatus] || 0) + 1;
        return acc;
      },
      {} as Record<VerificationStatus, number>,
    );

    return summary;
  }, [impactReports]);

  const getVerificationColor = (level: VerificationStatus): string => {
    const colors = {
      AI_VERIFIED: "#4caf50",
      SELF_DECLARED: "#ff9800",
      UNVERIFIED: "#f44336",
      FLAGGED: "#d32f2f",
      PENDING: "#2196f3",
    };
    return colors[level];
  };

  const formatVerificationLevel = (level: VerificationStatus): string => {
    return level
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!showImpact) {
    return (
      <div
        className={`glass rounded-2xl p-8 border border-blue-500/20 ${className}`}
      >
        <div className="text-center">
          <div className="mb-6">
            <TrendingUp className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Track Your Impact
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              See how your donations are making a real difference. View fund
              flow, impact metrics, and verification status.
            </p>
          </div>

          <Button
            onClick={() => setShowImpact(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Eye className="w-5 h-5" />
            <span>Show Impact</span>
          </Button>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <BarChart3 className="w-4 h-4" />
              <span>Fund Flow Tracking</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <Map className="w-4 h-4" />
              <span>Geographic Impact</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <CheckCircle className="w-4 h-4" />
              <span>AI Verification</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`glass rounded-2xl p-8 border border-blue-500/20 ${className}`}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto animate-spin mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Loading Impact Data
          </h2>
          <p className="text-gray-400">
            Analyzing fund flow and impact reports...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`glass rounded-2xl p-8 border border-red-500/20 ${className}`}
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Error Loading Impact Data
          </h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button
            onClick={loadImpactData}
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const verificationSummary = getVerificationSummary;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Impact Dashboard Header */}
      <div className="glass rounded-2xl p-8 border border-blue-500/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Impact Dashboard
            </h2>
            <p className="text-gray-400">
              Real-time tracking of {campaignTitle} impact and fund distribution
            </p>
          </div>
          <Button
            onClick={() => setShowImpact(false)}
            variant="outline"
            size="sm"
            className="text-gray-400 border-gray-600 hover:bg-gray-800"
          >
            Hide Impact
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Total Beneficiaries</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {impactReports
                .reduce((sum, r) => sum + (r.beneficiaryCount || 0), 0)
                .toLocaleString()}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Impact Reports</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {impactReports.length}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">AI Verified</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {verificationSummary?.AI_VERIFIED || 0}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Pending Review</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {(verificationSummary?.PENDING || 0) +
                (verificationSummary?.SELF_DECLARED || 0)}
            </div>
          </div>
        </div>

        {/* Verification Summary */}
        {verificationSummary && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(verificationSummary).map(
              ([level, count]) =>
                count > 0 && (
                  <div
                    key={level}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        getVerificationColor(level as VerificationStatus) +
                        "20",
                      color: getVerificationColor(level as VerificationStatus),
                    }}
                  >
                    {formatVerificationLevel(level as VerificationStatus)}:{" "}
                    {count}
                  </div>
                ),
            )}
          </div>
        )}
      </div>

      {/* View Selector */}
      <div className="flex space-x-4">
        <Button
          onClick={() => setActiveView("flow")}
          variant={activeView === "flow" ? "default" : "outline"}
          size="sm"
          className={
            activeView === "flow"
              ? "btn-primary"
              : "border-gray-600 text-gray-400"
          }
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Fund Flow
        </Button>
        <Button
          onClick={() => setActiveView("impact")}
          variant={activeView === "impact" ? "default" : "outline"}
          size="sm"
          className={
            activeView === "impact"
              ? "btn-primary"
              : "border-gray-600 text-gray-400"
          }
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Impact Analysis
        </Button>
        <Button
          onClick={() => setActiveView("reports")}
          variant={activeView === "reports" ? "default" : "outline"}
          size="sm"
          className={
            activeView === "reports"
              ? "btn-primary"
              : "border-gray-600 text-gray-400"
          }
        >
          <Target className="w-4 h-4 mr-2" />
          Impact Reports
        </Button>
      </div>

      {/* Content Views */}
      {activeView === "flow" && flowDiagram && (
        <div className="glass rounded-2xl p-8 border border-blue-500/20">
          <h3 className="text-xl font-bold text-white mb-6">
            Fund Flow Visualization
          </h3>
          <FundFlowDiagram
            flowDiagram={flowDiagram}
            onNodeClick={handleNodeClick}
            className="w-full"
          />
        </div>
      )}

      {activeView === "impact" && impactVisualization && (
        <div className="glass rounded-2xl p-8 border border-blue-500/20">
          <InteractiveImpactVisualization
            visualization={impactVisualization}
            onElementClick={handleElementClick}
          />
        </div>
      )}

      {activeView === "reports" && (
        <div className="glass rounded-2xl p-8 border border-blue-500/20">
          <h3 className="text-xl font-bold text-white mb-6">Impact Reports</h3>
          <div className="space-y-4">
            {impactReports.map((report, index) => (
              <div
                key={report.reportId}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">
                      {report.claim}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{report.location}</span>
                      <span>•</span>
                      <span>{report.category}</span>
                      <span>•</span>
                      <span>{report.beneficiaryCount} beneficiaries</span>
                    </div>
                  </div>
                  <div
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        getVerificationColor(report.verificationStatus) + "20",
                      color: getVerificationColor(report.verificationStatus),
                    }}
                  >
                    {formatVerificationLevel(report.verificationStatus)}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Reported: {report.timestamp.toLocaleDateString()}
                  {report.supportingEvidence && (
                    <span className="ml-4">
                      {report.supportingEvidence.length} supporting documents
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
