import {
  Camera,
  Shield,
  AlertTriangle,
  CheckCircle,
  Search,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface VisualVerificationResult {
  isOriginal: boolean;
  confidence: number;
  manipulationDetected: boolean;
  reverseSearchResults: number;
  ipfsVerified: boolean;
  aiAnalysis: {
    authenticity: number;
    manipulation: string[];
    metadata: {
      camera?: string;
      location?: string;
      timestamp?: string;
    };
  };
}

interface VisualIntegrityBadgeProps {
  result: VisualVerificationResult;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  className?: string;
}

const VisualIntegrityBadge = ({
  result,
  imageUrl,
  size = "md",
  showDetails = false,
  className,
}: VisualIntegrityBadgeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getOverallStatus = () => {
    if (
      result.isOriginal &&
      result.confidence >= 80 &&
      !result.manipulationDetected
    ) {
      return {
        level: "verified",
        icon: CheckCircle,
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500/30",
        label: "Verified Original",
        glow: "shadow-green-500/25",
      };
    } else if (result.confidence >= 60 && !result.manipulationDetected) {
      return {
        level: "likely-original",
        icon: Shield,
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500/30",
        label: "Likely Original",
        glow: "shadow-blue-500/25",
      };
    } else if (result.manipulationDetected || result.confidence < 40) {
      return {
        level: "suspicious",
        icon: AlertTriangle,
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        borderColor: "border-red-500/30",
        label: "Suspicious",
        glow: "shadow-red-500/25",
      };
    } else {
      return {
        level: "uncertain",
        icon: Camera,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/30",
        label: "Uncertain",
        glow: "shadow-yellow-500/25",
      };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      case "md":
        return "px-3 py-2 text-sm";
      case "lg":
        return "px-4 py-3 text-base";
    }
  };

  const status = getOverallStatus();
  const Icon = status.icon;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Badge */}
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full glass border transition-all duration-300 hover-lift cursor-pointer",
          status.bgColor,
          status.borderColor,
          status.glow,
          getSizeClasses(),
        )}
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
      >
        <Icon className={cn("w-4 h-4", status.color)} />
        <span className={cn("font-medium", status.color)}>{status.label}</span>
        <span className="text-xs text-gray-400">({result.confidence}%)</span>
      </div>

      {/* Detailed Analysis */}
      {showDetails && isExpanded && (
        <div className="glass rounded-2xl p-6 border border-red-500/20 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Camera className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">
              Visual Integrity Analysis
            </h3>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
              <div className="text-xs text-gray-400">Authenticity</div>
              <div className="text-lg font-bold text-white">
                {result.aiAnalysis.authenticity}%
              </div>
            </div>
            <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
              <div className="text-xs text-gray-400">Reverse Search</div>
              <div className="text-lg font-bold text-white">
                {result.reverseSearchResults}
              </div>
            </div>
            <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
              <div className="text-xs text-gray-400">IPFS Status</div>
              <div
                className={`text-lg font-bold ${result.ipfsVerified ? "text-green-400" : "text-red-400"}`}
              >
                {result.ipfsVerified ? "Verified" : "Missing"}
              </div>
            </div>
            <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
              <div className="text-xs text-gray-400">Manipulation</div>
              <div
                className={`text-lg font-bold ${result.manipulationDetected ? "text-red-400" : "text-green-400"}`}
              >
                {result.manipulationDetected ? "Detected" : "None"}
              </div>
            </div>
          </div>

          {/* AI Analysis Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white">AI Analysis Results</h4>

            {result.aiAnalysis.manipulation.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">
                    Potential Issues Detected
                  </span>
                </div>
                <ul className="text-sm text-gray-300 space-y-1">
                  {result.aiAnalysis.manipulation.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            {Object.keys(result.aiAnalysis.metadata).length > 0 && (
              <div className="glass-subtle rounded-lg p-3 border border-gray-700/50">
                <div className="text-sm font-medium text-white mb-2">
                  Image Metadata
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  {result.aiAnalysis.metadata.camera && (
                    <div>
                      <span className="text-gray-400">Camera:</span>
                      <span className="text-white ml-1">
                        {result.aiAnalysis.metadata.camera}
                      </span>
                    </div>
                  )}
                  {result.aiAnalysis.metadata.location && (
                    <div>
                      <span className="text-gray-400">Location:</span>
                      <span className="text-white ml-1">
                        {result.aiAnalysis.metadata.location}
                      </span>
                    </div>
                  )}
                  {result.aiAnalysis.metadata.timestamp && (
                    <div>
                      <span className="text-gray-400">Timestamp:</span>
                      <span className="text-white ml-1">
                        {result.aiAnalysis.metadata.timestamp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Steps */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">
                Verification Process
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">
                    Reverse image search completed
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">
                    AI manipulation detection analyzed
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {result.ipfsVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  )}
                  <span className="text-gray-300">
                    IPFS storage verification
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">
                    Powered by Google Gemini Vision AI
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-400 border-gray-600 hover:bg-gray-800"
            >
              <Search className="w-3 h-3 mr-1" />
              View Full Report
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              Re-verify Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Demo data generator
export const generateMockVisualResult = (
  scenario: "verified" | "suspicious" | "uncertain" = "verified",
): VisualVerificationResult => {
  switch (scenario) {
    case "verified":
      return {
        isOriginal: true,
        confidence: 92,
        manipulationDetected: false,
        reverseSearchResults: 0,
        ipfsVerified: true,
        aiAnalysis: {
          authenticity: 92,
          manipulation: [],
          metadata: {
            camera: "iPhone 14 Pro",
            location: "San Francisco, CA",
            timestamp: "2024-01-15 14:30:22",
          },
        },
      };
    case "suspicious":
      return {
        isOriginal: false,
        confidence: 25,
        manipulationDetected: true,
        reverseSearchResults: 15,
        ipfsVerified: false,
        aiAnalysis: {
          authenticity: 25,
          manipulation: [
            "Potential digital manipulation detected in background",
            "Inconsistent lighting patterns",
            "Possible composite image elements",
          ],
          metadata: {
            timestamp: "2024-01-10 09:15:33",
          },
        },
      };
    case "uncertain":
      return {
        isOriginal: true,
        confidence: 65,
        manipulationDetected: false,
        reverseSearchResults: 2,
        ipfsVerified: true,
        aiAnalysis: {
          authenticity: 65,
          manipulation: [],
          metadata: {
            camera: "Unknown Device",
            timestamp: "2024-01-12 16:45:11",
          },
        },
      };
  }
};

export default VisualIntegrityBadge;
