import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ImpactReport,
  OrganizationDashboard,
  ImpactCategory,
  VerificationStatus,
} from "../types/aiTrust";
import { ImpactReportingService } from "../services/impactReportingService";
import { GeminiClient } from "../services/geminiClient";
import { AITrustErrorHandler } from "../services/aiTrustErrorHandler";
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Target,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface OrganizationImpactDashboardProps {
  organizationWallet: string;
  className?: string;
}

interface ImpactReportForm {
  campaignId: string;
  claim: string;
  category: ImpactCategory;
  location: string;
  beneficiaryCount: number;
  supportingEvidence: string[];
}

/**
 * Organization Impact Dashboard
 * Allows organizations to submit and manage impact reports
 */
export const OrganizationImpactDashboard: React.FC<
  OrganizationImpactDashboardProps
> = ({ organizationWallet, className = "" }) => {
  const [dashboard, setDashboard] = useState<OrganizationDashboard | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportForm, setReportForm] = useState<ImpactReportForm>({
    campaignId: "",
    claim: "",
    category: "OTHER",
    location: "",
    beneficiaryCount: 0,
    supportingEvidence: [],
  });

  // Initialize services
  const geminiClient = new GeminiClient();
  const errorHandler = new AITrustErrorHandler();
  const impactReportingService = new ImpactReportingService(
    geminiClient,
    errorHandler,
  );

  useEffect(() => {
    loadDashboard();
  }, [organizationWallet]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData =
        await impactReportingService.getOrganizationDashboard(
          organizationWallet,
        );
      setDashboard(dashboardData);
    } catch (error) {
      console.error("Failed to load organization dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    try {
      setSubmittingReport(true);

      await impactReportingService.createImpactReport(
        organizationWallet,
        reportForm.campaignId,
        reportForm.claim,
        reportForm.category,
        reportForm.supportingEvidence,
        reportForm.location,
        reportForm.beneficiaryCount,
      );

      // Reset form and reload dashboard
      setReportForm({
        campaignId: "",
        claim: "",
        category: "OTHER",
        location: "",
        beneficiaryCount: 0,
        supportingEvidence: [],
      });
      setShowReportForm(false);
      await loadDashboard();
    } catch (error) {
      console.error("Failed to submit impact report:", error);
    } finally {
      setSubmittingReport(false);
    }
  };

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

  const categories: ImpactCategory[] = [
    "EDUCATION",
    "HEALTHCARE",
    "ENVIRONMENT",
    "POVERTY",
    "DISASTER_RELIEF",
    "HUMAN_RIGHTS",
    "COMMUNITY_DEVELOPMENT",
    "OTHER",
  ];

  if (loading) {
    return (
      <div
        className={`glass rounded-2xl p-8 border border-blue-500/20 ${className}`}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto animate-spin mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Loading Dashboard
          </h2>
          <p className="text-gray-400">Fetching organization data...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div
        className={`glass rounded-2xl p-8 border border-red-500/20 ${className}`}
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Dashboard Unavailable
          </h2>
          <p className="text-gray-400">Unable to load organization dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Dashboard Header */}
      <div className="glass rounded-2xl p-8 border border-blue-500/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Organization Dashboard
            </h1>
            <p className="text-gray-400">{dashboard.organizationName}</p>
            <p className="text-sm text-gray-500 font-mono">
              {dashboard.walletAddress.slice(0, 10)}...
              {dashboard.walletAddress.slice(-8)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Credibility Score</div>
            <div className="text-3xl font-bold text-green-400">
              {dashboard.credibilityScore}%
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Active Campaigns</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {dashboard.campaigns.filter((c) => c.status === "ACTIVE").length}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Impact Reports</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {dashboard.impactReports.length}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Total Beneficiaries</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {dashboard.totalImpactClaimed.totalBeneficiaries.toLocaleString()}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Verified Reports</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {
                dashboard.impactReports.filter(
                  (r) => r.verificationStatus === "AI_VERIFIED",
                ).length
              }
            </div>
          </div>
        </div>
      </div>

      {/* Submit New Report */}
      <div className="glass rounded-2xl p-8 border border-green-500/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Submit Impact Report</h2>
          <Button
            onClick={() => setShowReportForm(!showReportForm)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </div>

        {showReportForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign ID
                </label>
                <input
                  type="text"
                  value={reportForm.campaignId}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, campaignId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter campaign ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={reportForm.category}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      category: e.target.value as ImpactCategory,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={reportForm.location}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, location: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Beneficiary Count
                </label>
                <input
                  type="number"
                  value={reportForm.beneficiaryCount}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      beneficiaryCount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Number of beneficiaries"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Impact Claim
              </label>
              <textarea
                value={reportForm.claim}
                onChange={(e) =>
                  setReportForm({ ...reportForm, claim: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                placeholder="Describe the impact achieved (e.g., 'Provided clean water to 100 families')"
                rows={3}
              />
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={handleSubmitReport}
                disabled={
                  submittingReport ||
                  !reportForm.claim ||
                  !reportForm.campaignId
                }
                className="btn-primary"
              >
                {submittingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowReportForm(false)}
                variant="outline"
                className="border-gray-600 text-gray-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Impact Reports */}
      <div className="glass rounded-2xl p-8 border border-blue-500/20">
        <h2 className="text-xl font-bold text-white mb-6">
          Recent Impact Reports
        </h2>
        <div className="space-y-4">
          {dashboard.impactReports.length > 0 ? (
            dashboard.impactReports.slice(0, 10).map((report) => (
              <div
                key={report.reportId}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {report.claim}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{report.location}</span>
                      <span>•</span>
                      <span>{report.category.replace("_", " ")}</span>
                      <span>•</span>
                      <span>{report.beneficiaryCount} beneficiaries</span>
                    </div>
                  </div>
                  <div
                    className="px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1"
                    style={{
                      backgroundColor:
                        getVerificationColor(report.verificationStatus) + "20",
                      color: getVerificationColor(report.verificationStatus),
                    }}
                  >
                    {report.verificationStatus === "AI_VERIFIED" && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    {report.verificationStatus === "PENDING" && (
                      <Clock className="w-3 h-3" />
                    )}
                    {report.verificationStatus === "FLAGGED" && (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    <span>
                      {formatVerificationLevel(report.verificationStatus)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Submitted: {report.timestamp.toLocaleDateString()}
                  {report.supportingEvidence &&
                    report.supportingEvidence.length > 0 && (
                      <span className="ml-4">
                        {report.supportingEvidence.length} supporting documents
                      </span>
                    )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No impact reports submitted yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Submit your first impact report to start building credibility
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Campaigns Overview */}
      <div className="glass rounded-2xl p-8 border border-blue-500/20">
        <h2 className="text-xl font-bold text-white mb-6">Your Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboard.campaigns.map((campaign) => (
            <div
              key={campaign.campaignId}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
            >
              <h3 className="font-semibold text-white mb-2">
                {campaign.title}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span
                    className={`font-medium ${
                      campaign.status === "ACTIVE"
                        ? "text-green-400"
                        : campaign.status === "COMPLETED"
                          ? "text-blue-400"
                          : "text-red-400"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Raised:</span>
                  <span className="text-white font-medium">
                    ${campaign.totalRaised.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Impact Reports:</span>
                  <span className="text-white font-medium">
                    {campaign.impactReports}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Verification:</span>
                  <span
                    className="font-medium"
                    style={{
                      color: getVerificationColor(campaign.verificationLevel),
                    }}
                  >
                    {formatVerificationLevel(campaign.verificationLevel)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
