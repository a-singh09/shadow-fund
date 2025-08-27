import React, { useState } from "react";
import {
  Flag,
  AlertTriangle,
  Send,
  X,
  FileText,
  Link,
  Eye,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ReportCampaignProps {
  campaignId: string;
  campaignTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (reportData: ReportData) => void;
  className?: string;
}

interface ReportData {
  campaignId: string;
  reportType: "duplicate" | "fraud" | "inappropriate" | "spam" | "other";
  description: string;
  evidence?: string;
  reporterContact?: string;
  similarCampaignId?: string;
}

interface ReportCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  severity: "high" | "medium" | "low";
}

const ReportCampaign: React.FC<ReportCampaignProps> = ({
  campaignId,
  campaignTitle,
  isOpen,
  onClose,
  onSubmit,
  className,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "category" | "details" | "confirmation"
  >("category");

  const [reportData, setReportData] = useState<ReportData>({
    campaignId,
    reportType: "duplicate",
    description: "",
    evidence: "",
    reporterContact: "",
    similarCampaignId: "",
  });

  const reportCategories: ReportCategory[] = [
    {
      id: "duplicate",
      label: "Duplicate Campaign",
      description:
        "This campaign appears to be a copy of another existing campaign",
      icon: FileText,
      severity: "high",
    },
    {
      id: "fraud",
      label: "Fraudulent Activity",
      description: "Suspicious or fraudulent behavior detected",
      icon: AlertTriangle,
      severity: "high",
    },
    {
      id: "inappropriate",
      label: "Inappropriate Content",
      description: "Contains offensive, harmful, or inappropriate content",
      icon: Eye,
      severity: "medium",
    },
    {
      id: "spam",
      label: "Spam or Low Quality",
      description: "Appears to be spam or very low quality content",
      icon: Flag,
      severity: "low",
    },
    {
      id: "other",
      label: "Other Issues",
      description: "Other concerns not covered by the above categories",
      icon: Clock,
      severity: "medium",
    },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setReportData({
      ...reportData,
      reportType: categoryId as ReportData["reportType"],
    });
    setCurrentStep("details");
  };

  const handleSubmit = async () => {
    if (!reportData.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a description of the issue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (onSubmit) {
        onSubmit(reportData);
      }

      setCurrentStep("confirmation");

      toast({
        title: "Report Submitted",
        description:
          "Thank you for your report. Our team will review it shortly.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep("category");
    setReportData({
      campaignId,
      reportType: "duplicate",
      description: "",
      evidence: "",
      reporterContact: "",
      similarCampaignId: "",
    });
    onClose();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-500/50 bg-red-500/10 text-red-400";
      case "medium":
        return "border-orange-500/50 bg-orange-500/10 text-orange-400";
      case "low":
        return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
      default:
        return "border-gray-500/50 bg-gray-500/10 text-gray-400";
    }
  };

  const renderCategoryStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          Report Campaign Issue
        </h3>
        <p className="text-gray-400">
          What type of issue would you like to report for "{campaignTitle}"?
        </p>
      </div>

      <div className="space-y-3">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`w-full p-4 rounded-xl border transition-all hover:scale-[1.02] ${getSeverityColor(
                category.severity,
              )} hover:border-opacity-80`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold mb-1">{category.label}</div>
                  <div className="text-sm opacity-80">
                    {category.description}
                  </div>
                </div>
                <Badge
                  className={`ml-auto ${getSeverityColor(category.severity)} border-0`}
                >
                  {category.severity}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDetailsStep = () => {
    const selectedCategory = reportCategories.find(
      (cat) => cat.id === reportData.reportType,
    );

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">
            Report Details
          </h3>
          <p className="text-gray-400">
            Reporting:{" "}
            <span className="text-white">{selectedCategory?.label}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-300 mb-2 block">
              Description <span className="text-red-400">*</span>
            </Label>
            <Textarea
              value={reportData.description}
              onChange={(e) =>
                setReportData({ ...reportData, description: e.target.value })
              }
              placeholder="Please describe the issue in detail..."
              rows={4}
              className="resize-none"
            />
          </div>

          {reportData.reportType === "duplicate" && (
            <div>
              <Label className="text-gray-300 mb-2 block">
                Similar Campaign ID (optional)
              </Label>
              <Input
                value={reportData.similarCampaignId || ""}
                onChange={(e) =>
                  setReportData({
                    ...reportData,
                    similarCampaignId: e.target.value,
                  })
                }
                placeholder="If you know the ID of the similar campaign..."
              />
            </div>
          )}

          <div>
            <Label className="text-gray-300 mb-2 block">
              Evidence/Links (optional)
            </Label>
            <Textarea
              value={reportData.evidence || ""}
              onChange={(e) =>
                setReportData({ ...reportData, evidence: e.target.value })
              }
              placeholder="Any additional evidence, links, or supporting information..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block">
              Contact Information (optional)
            </Label>
            <Input
              value={reportData.reporterContact || ""}
              onChange={(e) =>
                setReportData({
                  ...reportData,
                  reporterContact: e.target.value,
                })
              }
              placeholder="Email or other contact info (for follow-up questions)"
            />
            <p className="text-xs text-gray-500 mt-1">
              We may contact you if we need additional information about your
              report.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("category")}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reportData.description.trim()}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderConfirmationStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <Flag className="w-8 h-8 text-green-400" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Report Submitted Successfully
        </h3>
        <p className="text-gray-400">
          Thank you for helping keep our platform safe. Your report has been
          submitted and will be reviewed by our moderation team.
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 text-left">
        <h4 className="font-semibold text-white mb-2">What happens next?</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Our team will review your report within 24-48 hours</li>
          <li>• We may investigate the reported campaign</li>
          <li>
            • If contact info was provided, we may reach out for clarification
          </li>
          <li>
            • Appropriate action will be taken if violations are confirmed
          </li>
        </ul>
      </div>

      <Button onClick={handleClose} className="w-full">
        Close
      </Button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`glass rounded-2xl border border-gray-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Flag className="w-6 h-6 text-red-400" />
              <span className="text-lg font-semibold text-white">
                Report Campaign
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Indicator */}
          {currentStep !== "confirmation" && (
            <div className="flex items-center gap-2 mb-6">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep === "category"
                    ? "bg-blue-500 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                1
              </div>
              <div
                className={`flex-1 h-1 rounded ${
                  currentStep === "details" ? "bg-blue-500" : "bg-gray-600"
                }`}
              />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep === "details"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-600 text-gray-400"
                }`}
              >
                2
              </div>
            </div>
          )}

          {/* Step Content */}
          {currentStep === "category" && renderCategoryStep()}
          {currentStep === "details" && renderDetailsStep()}
          {currentStep === "confirmation" && renderConfirmationStep()}
        </div>
      </div>
    </div>
  );
};

export default ReportCampaign;
