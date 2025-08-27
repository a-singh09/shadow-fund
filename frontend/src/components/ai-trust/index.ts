// AI Trust System Components
export { default as TrustBadge } from "./TrustBadge";
export {
  default as CredibilityBreakdown,
  getTrustLevel,
} from "./CredibilityBreakdown";
export { default as ImprovementSuggestions } from "./ImprovementSuggestions";
export { default as DuplicationWarning } from "./DuplicationWarning";
export {
  default as VisualIntegrityBadge,
  generateMockVisualResult,
} from "./VisualIntegrityBadge";
export {
  default as FundFlowDiagram,
  generateMockFundFlowData,
} from "./FundFlowDiagram";
export { default as AITrustDashboard } from "./AITrustDashboard";
export { default as CredibilityAdmin } from "./CredibilityAdmin";
export { default as DuplicationAdmin } from "./DuplicationAdmin";
export { default as ReportCampaign } from "./ReportCampaign";
export { default as SimilarityMatchDisplay } from "./SimilarityMatchDisplay";
export { default as DuplicationNotifications } from "./DuplicationNotifications";
export { default as CampaignLinking } from "./CampaignLinking";

// Services
export { duplicateProcessor } from "../../services/duplicateProcessor";
export { narrativeEngine } from "../../services/narrativeEngine";

// Hooks
export {
  useCredibilityScore,
  useTrustLevel,
  useRealTimeCredibilityScore,
} from "../../hooks/useCredibilityScore";
