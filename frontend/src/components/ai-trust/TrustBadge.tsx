import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TrustLevel } from "@/types/aiTrust";

interface TrustBadgeProps {
  score: number; // 0-100
  level: TrustLevel;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  showDetails?: boolean;
  isLoading?: boolean;
  confidence?: number; // 0-1
  onClick?: () => void;
  className?: string;
}

const TrustBadge = ({
  score,
  level,
  size = "md",
  showScore = true,
  showDetails = false,
  isLoading = false,
  confidence,
  onClick,
  className,
}: TrustBadgeProps) => {
  const getConfig = () => {
    switch (level) {
      case "HIGH":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          label: "High Trust",
          glow: "shadow-green-500/25",
        };
      case "MEDIUM":
        return {
          icon: Shield,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30",
          label: "Medium Trust",
          glow: "shadow-yellow-500/25",
        };
      case "LOW":
        return {
          icon: AlertTriangle,
          color: "text-orange-400",
          bgColor: "bg-orange-500/20",
          borderColor: "border-orange-500/30",
          label: "Low Trust",
          glow: "shadow-orange-500/25",
        };
      case "FLAGGED":
        return {
          icon: XCircle,
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          borderColor: "border-red-500/30",
          label: "Flagged",
          glow: "shadow-red-500/25",
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

  const config = getConfig();
  const Icon = isLoading ? Loader2 : config.icon;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full glass border transition-all duration-300",
        config.bgColor,
        config.borderColor,
        config.glow,
        getSizeClasses(),
        onClick && "cursor-pointer hover-lift hover:scale-105",
        className,
      )}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <Icon
        className={cn("w-4 h-4", config.color, isLoading && "animate-spin")}
      />
      <div className="flex flex-col">
        <span className={cn("font-medium", config.color)}>
          {isLoading
            ? "Analyzing..."
            : showScore
              ? `${score}% ${config.label}`
              : config.label}
        </span>
        {showDetails && confidence && !isLoading && (
          <span className="text-xs text-gray-400">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
      {showDetails && onClick && !isLoading && (
        <Info className="w-3 h-3 text-gray-400 ml-1" />
      )}
    </div>
  );
};

export default TrustBadge;
