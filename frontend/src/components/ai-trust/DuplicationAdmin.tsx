import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Eye,
  Flag,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Link,
  Clock,
  User,
  FileText,
  BarChart3,
  Settings,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { narrativeEngine } from "@/services/narrativeEngine";
import { SimilarityMatch, DuplicationResult } from "@/types/aiTrust";

interface DuplicateReport {
  id: string;
  reportedCampaignId: string;
  reportedCampaignTitle: string;
  reportedBy: string;
  reportDate: Date;
  status: "pending" | "approved" | "rejected" | "linked";
  priority: "high" | "medium" | "low";
  matches: SimilarityMatch[];
  confidence: number;
  adminNotes?: string;
  reviewedBy?: string;
  reviewDate?: Date;
  actionTaken?: string;
}

interface DuplicationAdminProps {
  className?: string;
}

const DuplicationAdmin: React.FC<DuplicationAdminProps> = ({ className }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "reports" | "analytics" | "settings"
  >("reports");

  // Reports state
  const [reports, setReports] = useState<DuplicateReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<DuplicateReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DuplicateReport | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewAction, setReviewAction] = useState<
    "approve" | "reject" | "link" | null
  >(null);

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    linkedCampaigns: 0,
    averageConfidence: 0,
    reportsThisWeek: 0,
    falsePositiveRate: 0,
  });

  // Load mock data (in real app, this would come from API)
  useEffect(() => {
    loadMockReports();
    calculateAnalytics();
  }, []);

  // Filter reports based on search and filters
  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.reportedCampaignTitle
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.id.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (report) => report.priority === priorityFilter,
      );
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, priorityFilter]);

  const loadMockReports = () => {
    const mockReports: DuplicateReport[] = [
      {
        id: "dup-001",
        reportedCampaignId: "campaign-123",
        reportedCampaignTitle: "Help Build School in Rural Village",
        reportedBy: "0x1234567890abcdef",
        reportDate: new Date("2024-02-15T10:30:00Z"),
        status: "pending",
        priority: "high",
        confidence: 92,
        matches: [
          {
            campaignId: "campaign-456",
            similarity: 0.92,
            matchedSegments: [
              {
                text: "build school rural village",
                startIndex: 5,
                endIndex: 30,
                similarity: 0.95,
              },
              {
                text: "need funds construction",
                startIndex: 45,
                endIndex: 68,
                similarity: 0.88,
              },
            ],
            originalLanguage: "English",
            detectedLanguage: "English",
          },
        ],
      },
      {
        id: "dup-002",
        reportedCampaignId: "campaign-789",
        reportedCampaignTitle: "Medical Equipment for Clinic",
        reportedBy: "0xabcdef1234567890",
        reportDate: new Date("2024-02-14T15:45:00Z"),
        status: "approved",
        priority: "medium",
        confidence: 78,
        matches: [
          {
            campaignId: "campaign-101",
            similarity: 0.78,
            matchedSegments: [
              {
                text: "medical equipment clinic",
                startIndex: 0,
                endIndex: 23,
                similarity: 0.82,
              },
            ],
            originalLanguage: "English",
            detectedLanguage: "English",
          },
        ],
        adminNotes:
          "Confirmed duplicate - same organization, different location",
        reviewedBy: "admin@shadowflow.com",
        reviewDate: new Date("2024-02-14T16:00:00Z"),
        actionTaken: "Campaign flagged and creator notified",
      },
      {
        id: "dup-003",
        reportedCampaignId: "campaign-321",
        reportedCampaignTitle: "Emergency Food Relief",
        reportedBy: "system",
        reportDate: new Date("2024-02-13T09:15:00Z"),
        status: "rejected",
        priority: "low",
        confidence: 65,
        matches: [
          {
            campaignId: "campaign-654",
            similarity: 0.65,
            matchedSegments: [
              {
                text: "emergency food",
                startIndex: 0,
                endIndex: 14,
                similarity: 0.7,
              },
            ],
            originalLanguage: "English",
            detectedLanguage: "English",
          },
        ],
        adminNotes:
          "False positive - common terminology in disaster relief category",
        reviewedBy: "admin@shadowflow.com",
        reviewDate: new Date("2024-02-13T10:30:00Z"),
        actionTaken: "No action required",
      },
    ];

    setReports(mockReports);
  };

  const calculateAnalytics = () => {
    // Mock analytics calculation
    setAnalytics({
      totalReports: 156,
      pendingReports: 23,
      approvedReports: 89,
      rejectedReports: 44,
      linkedCampaigns: 12,
      averageConfidence: 76.5,
      reportsThisWeek: 8,
      falsePositiveRate: 28.2,
    });
  };

  const handleReviewReport = (
    report: DuplicateReport,
    action: "approve" | "reject" | "link",
  ) => {
    setSelectedReport(report);
    setReviewAction(action);
    setReviewNotes(report.adminNotes || "");
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedReport || !reviewAction) return;

    setIsLoading(true);
    try {
      // Update report status
      const updatedReports = reports.map((report) =>
        report.id === selectedReport.id
          ? {
              ...report,
              status:
                reviewAction === "link"
                  ? "linked"
                  : reviewAction === "approve"
                    ? "approved"
                    : "rejected",
              adminNotes: reviewNotes,
              reviewedBy: "admin@shadowflow.com", // In real app, get from auth
              reviewDate: new Date(),
              actionTaken: getActionDescription(reviewAction),
            }
          : report,
      );

      setReports(updatedReports);
      setShowReviewModal(false);
      setSelectedReport(null);
      setReviewAction(null);
      setReviewNotes("");

      toast({
        title: "Review Submitted",
        description: `Report ${selectedReport.id} has been ${reviewAction}d successfully.`,
      });
    } catch (error) {
      toast({
        title: "Review Failed",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActionDescription = (action: string): string => {
    switch (action) {
      case "approve":
        return "Campaign flagged as duplicate";
      case "reject":
        return "Report dismissed as false positive";
      case "link":
        return "Campaigns linked as related";
      default:
        return "No action taken";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "low":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "linked":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const renderReportsTab = () => (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="glass p-4 rounded-xl border border-gray-500/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search reports by campaign title, reporter, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="linked">Linked</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="glass p-6 rounded-xl border border-gray-500/20"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    {report.reportedCampaignTitle}
                  </h3>
                  <Badge className={getPriorityColor(report.priority)}>
                    {report.priority}
                  </Badge>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {report.reportedBy === "system"
                      ? "AI Detection"
                      : `${report.reportedBy.slice(0, 8)}...`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {report.reportDate.toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    {report.confidence}% confidence
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {report.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReviewReport(report, "approve")}
                      className="text-green-400 border-green-600 hover:bg-green-800/20"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReviewReport(report, "reject")}
                      className="text-red-400 border-red-600 hover:bg-red-800/20"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReviewReport(report, "link")}
                      className="text-purple-400 border-purple-600 hover:bg-purple-800/20"
                    >
                      <Link className="w-3 h-3 mr-1" />
                      Link
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedReport(report)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            </div>

            {/* Matches Summary */}
            <div className="space-y-2">
              <div className="text-sm text-gray-400">
                {report.matches.length} similar campaign(s) found:
              </div>
              {report.matches.slice(0, 2).map((match, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">
                      Campaign {match.campaignId}
                    </span>
                    <span className="text-sm text-orange-400">
                      {Math.round(match.similarity * 100)}% match
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Matched segments: {match.matchedSegments.length}
                  </div>
                </div>
              ))}
              {report.matches.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{report.matches.length - 2} more matches
                </div>
              )}
            </div>

            {/* Admin Notes */}
            {report.adminNotes && (
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-xs text-blue-400 mb-1">Admin Notes:</div>
                <div className="text-sm text-gray-300">{report.adminNotes}</div>
                {report.reviewedBy && (
                  <div className="text-xs text-gray-500 mt-2">
                    Reviewed by {report.reviewedBy} on{" "}
                    {report.reviewDate?.toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No duplicate reports found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-xl border border-blue-500/20 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {analytics.totalReports}
          </div>
          <div className="text-sm text-gray-400">Total Reports</div>
        </div>
        <div className="glass p-4 rounded-xl border border-orange-500/20 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {analytics.pendingReports}
          </div>
          <div className="text-sm text-gray-400">Pending Review</div>
        </div>
        <div className="glass p-4 rounded-xl border border-green-500/20 text-center">
          <div className="text-2xl font-bold text-green-400">
            {analytics.approvedReports}
          </div>
          <div className="text-sm text-gray-400">Approved</div>
        </div>
        <div className="glass p-4 rounded-xl border border-red-500/20 text-center">
          <div className="text-2xl font-bold text-red-400">
            {analytics.rejectedReports}
          </div>
          <div className="text-sm text-gray-400">Rejected</div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">
            Detection Quality
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Average Confidence:</span>
              <span className="text-white font-semibold">
                {analytics.averageConfidence}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">False Positive Rate:</span>
              <span className="text-white font-semibold">
                {analytics.falsePositiveRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Linked Campaigns:</span>
              <span className="text-white font-semibold">
                {analytics.linkedCampaigns}
              </span>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl border border-green-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Reports This Week:</span>
              <span className="text-white font-semibold">
                {analytics.reportsThisWeek}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg. Review Time:</span>
              <span className="text-white font-semibold">2.3 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Reviewers:</span>
              <span className="text-white font-semibold">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="glass p-6 rounded-xl border border-gray-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">
          Detection Settings
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Similarity Threshold (%)</Label>
              <Input type="number" min="50" max="100" defaultValue="80" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Confidence Threshold (%)</Label>
              <Input type="number" min="50" max="100" defaultValue="60" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Auto-flagging Rules</Label>
            <Textarea
              placeholder="Define rules for automatic flagging..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-xl border border-gray-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">
          Notification Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-gray-300">
              Email notifications for high-priority reports
            </Label>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-gray-300">Daily summary reports</Label>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-gray-300">Slack integration</Label>
            <input type="checkbox" className="rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-orange-400" />
        <h2 className="text-2xl font-bold text-white">
          Duplication Admin Panel
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
        {[
          { id: "reports", label: "Reports", icon: Flag },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
          { id: "settings", label: "Settings", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "reports" && renderReportsTab()}
      {activeTab === "analytics" && renderAnalyticsTab()}
      {activeTab === "settings" && renderSettingsTab()}

      {/* Review Modal */}
      {showReviewModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl border border-gray-500/20 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Review Report: {selectedReport.id}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-gray-300">Campaign:</Label>
                <p className="text-white">
                  {selectedReport.reportedCampaignTitle}
                </p>
              </div>

              <div>
                <Label className="text-gray-300">Action:</Label>
                <p className="text-white capitalize">
                  {reviewAction} this report
                </p>
              </div>

              <div>
                <Label className="text-gray-300">Admin Notes:</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitReview} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Submit Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuplicationAdmin;
