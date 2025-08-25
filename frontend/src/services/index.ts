// AI Trust System Services
export { geminiClient, GeminiClient } from "./geminiClient";
export { rateLimiter, RateLimiter } from "./rateLimiter";
export { aiTrustService, AITrustService } from "./aiTrustService";
export {
  aiTrustErrorHandler,
  AITrustErrorHandler,
} from "./aiTrustErrorHandler";

// Re-export types for convenience
export type {
  AITrustError,
  GeminiTextResponse,
  GeminiImageResponse,
  GeminiComparisonResponse,
  GeminiTranslationResponse,
  GeminiManipulationResponse,
  GeminiBatchRequest,
  GeminiBatchResponse,
  CredibilityScore,
  DuplicationResult,
  VisualVerificationResult,
  TrustAnalysisResult,
  CampaignData,
  CampaignMetadata,
  CampaignContent,
  RateLimitConfig,
  RequestMetrics,
  ErrorResolution,
  FallbackResult,
} from "../types/aiTrust";
