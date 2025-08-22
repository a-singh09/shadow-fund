import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  score: number; // 0-100
  level: "high" | "medium" | "low" | "unverified";
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  className?: string;
}

const TrustBadge = ({
  score,
  level,
  size = "md",
  showScore = true,
  className,
}: TrustBadgeProps) => {
  const getConfig = () => {
    switch (level) {
      case "high":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          borderColor: "border-green-500/30",
          label: "High Trust",
          glow: "shadow-green-500/25",
        };
      case "medium":
        return {
          icon: Shield,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          borderColor: "border-yellow-500/30",
          label: "Medium Trust",
          glow: "shadow-yellow-500/25",
        };
      case "low":
        return {
          icon: AlertTriangle,
          color: "text-orange-400",
          bgColor: "bg-orange-500/20",
          borderColor: "border-orange-500/30",
          label: "Low Trust",
          glow: "shadow-orange-500/25",
        };
      case "unverified":
        return {
          icon: XCircle,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          borderColor: "border-gray-500/30",
          label: "Unverified",
          glow: "shadow-gray-500/25",
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
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full glass border transition-all duration-300 hover-lift",
        config.bgColor,
        config.borderColor,
        config.glow,
        getSizeClasses(),
        className,
      )}
    >
      <Icon className={cn("w-4 h-4", config.color)} />
      <span className={cn("font-medium", config.color)}>
        {showScore ? `${score}% ${config.label}` : config.label}
      </span>
    </div>
  );
};

export default TrustBadge;
