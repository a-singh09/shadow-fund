// Base interfaces and types for AI Trust System

export interface AITrustError {
  code: string;
  message: string;
  category: "API" | "DATA" | "ANALYSIS" | "PRIVACY";
  retryable: boolean;
  fallbackAction?: string;
}

export interface GeminiTextResponse {
  text: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface GeminiImageResponse {
  analysis: string;
  confidence: number;
  detectedObjects?: string[];
  metadata?: Record<string, any>;
}

export interface GeminiComparisonResponse {
  similarity: number;
  confidence: number;
  matchedSegments?: TextSegment[];
  analysis: string;
}

export interface GeminiTranslationResponse {
  translatedText: string;
  detectedLanguage: string;
  confidence: number;
}

export interface GeminiManipulationResponse {
  isManipulated: boolean;
  confidence: number;
  manipulationType?: string[];
  analysis: string;
}

export interface GeminiBatchRequest {
  id: string;
  type: "TEXT" | "IMAGE" | "COMPARISON" | "TRANSLATION";
  prompt: string;
  content: string | ArrayBuffer;
  options?: Record<string, any>;
}

export interface GeminiBatchResponse {
  results: Array<{
    id: string;
    success: boolean;
    data?: any;
    error?: AITrustError;
  }>;
}

export interface TextSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  similarity?: number;
}

export interface CredibilityScore {
  score: number; // 0-100
  confidence: number; // 0-1
  factors: ScoreFactor[];
  lastUpdated: Date;
}

export interface ScoreFactor {
  type:
    | "GOVERNMENT_ID"
    | "NGO_LICENSE"
    | "ACCOUNT_AGE"
    | "SOCIAL_MEDIA"
    | "HISTORY";
  weight: number;
  value: number;
  description: string;
}

export interface CredibilityFactors {
  hasGovernmentIdVerification: boolean;
  hasNgoLicenseValidation: boolean;
  accountAge: number; // days since wallet first used
  previousCampaignHistory: CampaignHistory[];
  socialMediaPresence: SocialMediaData;
  publicMetadata: PublicMetadata;
}

export interface CampaignHistory {
  campaignId: string;
  outcome: "SUCCESS" | "FAILED" | "DISPUTED";
  amountRaised: number;
  completionDate: Date;
}

export interface SocialMediaData {
  platforms: string[];
  accountAge: number;
  followerCount?: number;
  verificationStatus: boolean;
}

export interface PublicMetadata {
  walletAge: number;
  transactionCount: number;
  networkReputation: number;
}

export interface ScoreBreakdown {
  totalScore: number;
  factors: ScoreFactor[];
  suggestions: ImprovementSuggestion[];
}

export interface ImprovementSuggestion {
  type: string;
  description: string;
  impact: number; // potential score increase
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface DuplicationResult {
  isDuplicate: boolean;
  confidence: number;
  matches: SimilarityMatch[];
  suggestedActions: string[];
}

export interface SimilarityMatch {
  campaignId: string;
  similarity: number; // 0-1
  matchedSegments: TextSegment[];
  originalLanguage: string;
  detectedLanguage: string;
}

export interface TranslationAnalysis {
  translatedText: string;
  originalLanguage: string;
  confidence: number;
  semanticSimilarity?: number;
}

export interface ImageVerificationResult {
  isAuthentic: boolean;
  confidence: number;
  issues: VerificationIssue[];
  metadata: ImageMetadata;
}

export interface VerificationIssue {
  type: "DUPLICATE" | "MANIPULATION" | "SUSPICIOUS_SOURCE";
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
}

export interface ImageMetadata {
  dimensions: { width: number; height: number };
  format: string;
  size: number;
  uploadDate: Date;
  fingerprint: string;
}

export interface ReverseSearchResult {
  foundMatches: boolean;
  matches: ImageMatch[];
  earliestUsage: Date | null;
  originalSource: string | null;
}

export interface ImageMatch {
  url: string;
  source: string;
  similarity: number;
  firstSeen: Date;
}

export interface ManipulationResult {
  isManipulated: boolean;
  confidence: number;
  manipulationType: string[];
  analysis: string;
}

export interface VisualVerificationResult {
  images: ImageVerificationResult[];
  overallScore: number;
  hasIssues: boolean;
}

export interface TrustAnalysisResult {
  campaignId: string;
  credibilityScore: CredibilityScore;
  duplicationCheck: DuplicationResult;
  visualVerification: VisualVerificationResult;
  overallTrustLevel: "HIGH" | "MEDIUM" | "LOW" | "FLAGGED";
  analysisTimestamp: Date;
  expiresAt: Date;
}

export interface CampaignMetadata {
  title: string;
  description: string;
  category: string;
  location?: string;
  creatorAddress: string;
  creationDate: Date;
  zkProofs: ZKProof[];
  publicVerifications: Verification[];
}

export interface ZKProof {
  type: "GOVERNMENT_ID" | "NGO_LICENSE" | "SOCIAL_MEDIA" | "CUSTOM";
  verified: boolean;
  timestamp: Date;
  proofHash: string;
}

export interface Verification {
  type: string;
  status: "VERIFIED" | "PENDING" | "FAILED";
  timestamp: Date;
  source: string;
}

export interface CampaignContent {
  title: string;
  description: string;
  category: string;
  language?: string;
}

export interface CampaignData {
  metadata: CampaignMetadata;
  content: CampaignContent;
  mediaUrls: string[];
}

export type TrustLevel = "HIGH" | "MEDIUM" | "LOW" | "FLAGGED";

export interface ErrorResolution {
  action: "RETRY" | "FALLBACK" | "FAIL";
  fallbackResult?: any;
  retryAfter?: number;
}

export interface FallbackResult {
  type: string;
  data: any;
  confidence: 0;
  isFallback: true;
}

// Rate limiting types
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

export interface QueuedRequest {
  id: string;
  timestamp: Date;
  priority: "HIGH" | "MEDIUM" | "LOW";
  request: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: Date;
}

// Storage and database types
export interface TrustDataSchema {
  trustAnalysis: {
    key: string;
    value: TrustAnalysisResult;
    indexes: {
      creatorAddress: string;
      trustLevel: string;
      analysisTimestamp: Date;
      expiresAt: Date;
    };
  };
  credibilityCache: {
    key: string;
    value: CredibilityScore;
    indexes: {
      score: number;
      lastUpdated: Date;
    };
  };
}

export interface AnalysisMetrics {
  date: string;
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  averageProcessingTime: number;
  trustLevelDistribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    FLAGGED: number;
  };
  errorsByCategory: Record<string, number>;
}

export interface StorageStats {
  trustAnalyses: number;
  credibilityScores: number;
  duplicationCache: number;
  visualCache: number;
  totalSize: number;
}

// Impact Reporting System Types
export interface ImpactReport {
  reportId: string;
  organizationWallet: string;
  campaignId: string;
  claim: string; // e.g., "Delivered 100 meals"
  timestamp: Date;
  onChainSignature: string;
  supportingEvidence?: string[];
  category: ImpactCategory;
  location?: string;
  beneficiaryCount?: number;
  verificationStatus: VerificationStatus;
  aiVerificationResult?: AIVerificationResult;
}

export interface ZKAttestation {
  attestationId: string;
  type: "RECEIVED_FUNDS" | "SPENT_FUNDS" | "DELIVERED_IMPACT";
  metadata: AttestationMetadata; // Only non-sensitive data
  proofHash: string; // Simulated ZK proof
  timestamp: Date;
  verifierSignature: string;
  campaignId: string;
}

export interface AttestationMetadata {
  cause: string;
  location: string;
  timeframe: string;
  impactType: string;
  // No amounts or sensitive data
}

export interface AIVerificationResult {
  isVerified: boolean;
  confidence: number;
  crossReferences: CrossReference[];
  inconsistencies: Inconsistency[];
  aiSummary: string;
  verificationSources: VerificationSource[];
  historicalConsistency: number; // 0-1
}

export interface CrossReference {
  source: string;
  url?: string;
  relevance: number;
  supportsClaim: boolean;
  extractedInfo: string;
}

export interface Inconsistency {
  type: "TIMELINE" | "LOCATION" | "SCALE" | "DUPLICATE" | "CONTRADICTION";
  severity: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  conflictingSource?: string;
}

export interface VerificationSource {
  type:
    | "NEWS"
    | "GOVERNMENT_API"
    | "SOCIAL_MEDIA"
    | "NGO_DATABASE"
    | "BLOCKCHAIN";
  name: string;
  url?: string;
  reliability: number; // 0-1
  lastChecked: Date;
}

export interface AttestationSummary {
  totalAttestations: number;
  verifiedAttestations: number;
  categories: Record<ImpactCategory, number>;
  timeRange: {
    earliest: Date;
    latest: Date;
  };
  aggregatedImpact: AggregatedImpact;
}

export interface AggregatedImpact {
  totalBeneficiaries: number;
  impactsByCategory: Record<ImpactCategory, CategoryImpact>;
  geographicDistribution: LocationImpact[];
  timelineData: TimelinePoint[];
}

export interface CategoryImpact {
  category: ImpactCategory;
  totalReports: number;
  verifiedReports: number;
  estimatedBeneficiaries: number;
  keyMetrics: ImpactMetric[];
}

export interface LocationImpact {
  location: string;
  coordinates?: { lat: number; lng: number };
  impactCount: number;
  categories: ImpactCategory[];
  verificationLevel: number; // 0-1
}

export interface TimelinePoint {
  date: Date;
  impactCount: number;
  categories: ImpactCategory[];
  cumulativeImpact: number;
}

export interface ImpactMetric {
  name: string;
  value: number;
  unit: string;
  category: ImpactCategory;
  verificationLevel: VerificationStatus;
}

export type ImpactCategory =
  | "EDUCATION"
  | "HEALTHCARE"
  | "ENVIRONMENT"
  | "POVERTY"
  | "DISASTER_RELIEF"
  | "HUMAN_RIGHTS"
  | "COMMUNITY_DEVELOPMENT"
  | "OTHER";

export type VerificationStatus =
  | "AI_VERIFIED"
  | "SELF_DECLARED"
  | "UNVERIFIED"
  | "FLAGGED"
  | "PENDING";

// Fund Flow Visualization Types
export interface FlowDiagram {
  type: "SANKEY" | "FLOWCHART" | "TREE" | "MAP" | "HEATMAP";
  data: DiagramData;
  interactiveElements: InteractiveElement[];
  privacyLevel: "AGGREGATED" | "ANONYMIZED" | "PUBLIC";
  verificationLevel: VerificationStatus;
}

export interface DiagramData {
  nodes: FlowNode[];
  links: FlowLink[];
  metadata: FlowMetadata;
}

export interface FlowNode {
  id: string;
  name: string;
  type: "DONOR" | "CAMPAIGN" | "ORGANIZATION" | "BENEFICIARY" | "IMPACT";
  value: number; // Aggregated, not individual amounts
  category?: ImpactCategory;
  verificationLevel: VerificationStatus;
  metadata?: Record<string, any>;
}

export interface FlowLink {
  source: string;
  target: string;
  value: number; // Aggregated flow amount
  category?: ImpactCategory;
  verificationLevel: VerificationStatus;
  timestamp?: Date;
}

export interface FlowMetadata {
  totalFlow: number;
  timeRange: { start: Date; end: Date };
  participantCount: number;
  verificationSummary: Record<VerificationStatus, number>;
}

export interface InteractiveElement {
  id: string;
  type: "TOOLTIP" | "DRILL_DOWN" | "FILTER" | "HIGHLIGHT";
  targetNodeId?: string;
  targetLinkId?: string;
  action: string;
  data: any;
}

export interface ImpactVisualization {
  totalImpact: string; // AI-generated summary
  keyMetrics: ImpactMetric[];
  visualElements: VisualizationElement[];
  confidenceScore: number;
  verificationSources: VerificationSource[];
  privacyLevel: "AGGREGATED" | "ANONYMIZED" | "PUBLIC";
}

export interface VisualizationElement {
  type: "CHART" | "MAP" | "TIMELINE" | "METRIC_CARD" | "PROGRESS_BAR";
  id: string;
  title: string;
  data: any;
  config: VisualizationConfig;
}

export interface VisualizationConfig {
  colors?: string[];
  dimensions?: { width: number; height: number };
  interactive?: boolean;
  showLegend?: boolean;
  showTooltips?: boolean;
  customOptions?: Record<string, any>;
}

// Organization Dashboard Types
export interface OrganizationDashboard {
  organizationId: string;
  organizationName: string;
  walletAddress: string;
  campaigns: CampaignSummary[];
  impactReports: ImpactReport[];
  attestations: ZKAttestation[];
  verificationStatus: OrganizationVerificationStatus;
  credibilityScore: number;
  totalImpactClaimed: AggregatedImpact;
}

export interface CampaignSummary {
  campaignId: string;
  title: string;
  category: ImpactCategory;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  totalRaised: number; // Can be shown as it's public
  impactReports: number;
  verificationLevel: VerificationStatus;
}

export interface OrganizationVerificationStatus {
  isVerified: boolean;
  verificationLevel: "BASIC" | "ENHANCED" | "PREMIUM";
  verifiedFields: string[];
  pendingVerifications: string[];
  lastVerificationUpdate: Date;
}
