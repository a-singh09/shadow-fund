import {
  ImpactReport,
  ZKAttestation,
  AttestationSummary,
  AIVerificationResult,
  CrossReference,
  Inconsistency,
  VerificationSource,
  ImpactCategory,
  VerificationStatus,
  OrganizationDashboard,
  CampaignSummary,
  OrganizationVerificationStatus,
  AggregatedImpact,
  CategoryImpact,
  LocationImpact,
  TimelinePoint,
  ImpactMetric,
  AttestationMetadata,
} from "../types/aiTrust";
import { GeminiClient } from "./geminiClient";
import { AITrustErrorHandler } from "./aiTrustErrorHandler";

/**
 * Impact Reporting Service
 * Handles creation, verification, and management of impact reports
 * Processes zero-knowledge attestations for privacy-preserving impact data
 */
export class ImpactReportingService {
  private geminiClient: GeminiClient;
  private errorHandler: AITrustErrorHandler;
  private reportCache: Map<string, ImpactReport> = new Map();
  private attestationCache: Map<string, ZKAttestation> = new Map();

  constructor(geminiClient: GeminiClient, errorHandler: AITrustErrorHandler) {
    this.geminiClient = geminiClient;
    this.errorHandler = errorHandler;
  }

  /**
   * Create a new impact report with on-chain signature verification
   */
  async createImpactReport(
    organizationWallet: string,
    campaignId: string,
    claim: string,
    category: ImpactCategory,
    supportingEvidence?: string[],
    location?: string,
    beneficiaryCount?: number,
  ): Promise<ImpactReport> {
    try {
      // Generate unique report ID
      const reportId = this.generateReportId(organizationWallet, campaignId);

      // Simulate on-chain signature verification
      const onChainSignature = await this.generateOnChainSignature(
        organizationWallet,
        claim,
        campaignId,
      );

      const report: ImpactReport = {
        reportId,
        organizationWallet,
        campaignId,
        claim,
        timestamp: new Date(),
        onChainSignature,
        supportingEvidence,
        category,
        location,
        beneficiaryCount,
        verificationStatus: "PENDING",
      };

      // Cache the report
      this.reportCache.set(reportId, report);

      // Trigger AI verification in background
      this.verifyImpactReportAsync(report);

      return report;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "IMPACT_REPORT_CREATION_FAILED",
        message: `Failed to create impact report: ${error}`,
        category: "DATA",
        retryable: true,
      });
    }
  }

  /**
   * Verify impact report using AI cross-referencing
   */
  async verifyImpactReport(
    report: ImpactReport,
  ): Promise<AIVerificationResult> {
    try {
      // Prepare verification prompt
      const verificationPrompt = this.buildVerificationPrompt(report);

      // Get AI analysis
      const aiResponse = await this.geminiClient.analyzeText(
        verificationPrompt,
        report.claim,
      );

      // Cross-reference with external sources
      const crossReferences = await this.crossReferenceWithSources(report);

      // Check historical consistency
      const historicalConsistency = await this.checkHistoricalConsistency(
        report.organizationWallet,
        report,
      );

      // Detect inconsistencies
      const inconsistencies = await this.detectInconsistencies(
        report,
        crossReferences,
      );

      const verificationResult: AIVerificationResult = {
        isVerified: aiResponse.confidence > 0.7 && inconsistencies.length === 0,
        confidence: aiResponse.confidence,
        crossReferences,
        inconsistencies,
        aiSummary: aiResponse.text,
        verificationSources: this.getVerificationSources(),
        historicalConsistency,
      };

      // Update report with verification result
      const updatedReport = {
        ...report,
        aiVerificationResult: verificationResult,
        verificationStatus:
          this.determineVerificationStatus(verificationResult),
      };

      this.reportCache.set(report.reportId, updatedReport);

      return verificationResult;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "IMPACT_VERIFICATION_FAILED",
        message: `Failed to verify impact report: ${error}`,
        category: "ANALYSIS",
        retryable: true,
      });
    }
  }

  /**
   * Process zero-knowledge attestations for privacy-preserving impact data
   */
  async processZKAttestations(
    attestations: ZKAttestation[],
  ): Promise<AttestationSummary> {
    try {
      const processedAttestations = await Promise.all(
        attestations.map((attestation) => this.processAttestation(attestation)),
      );

      const verifiedAttestations = processedAttestations.filter(
        (a) => a.verificationStatus === "AI_VERIFIED",
      );

      // Aggregate impact data while preserving privacy
      const aggregatedImpact =
        await this.aggregateImpactData(verifiedAttestations);

      const summary: AttestationSummary = {
        totalAttestations: attestations.length,
        verifiedAttestations: verifiedAttestations.length,
        categories: this.categorizeAttestations(verifiedAttestations),
        timeRange: this.getTimeRange(attestations),
        aggregatedImpact,
      };

      return summary;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "ZK_ATTESTATION_PROCESSING_FAILED",
        message: `Failed to process ZK attestations: ${error}`,
        category: "ANALYSIS",
        retryable: true,
      });
    }
  }

  /**
   * Get organization dashboard with impact reports and verification status
   */
  async getOrganizationDashboard(
    organizationWallet: string,
  ): Promise<OrganizationDashboard> {
    try {
      // Get organization's campaigns
      const campaigns = await this.getOrganizationCampaigns(organizationWallet);

      // Get impact reports
      const impactReports =
        await this.getImpactReportsByOrganization(organizationWallet);

      // Get attestations
      const attestations =
        await this.getAttestationsByOrganization(organizationWallet);

      // Get verification status
      const verificationStatus =
        await this.getOrganizationVerificationStatus(organizationWallet);

      // Calculate credibility score
      const credibilityScore = await this.calculateOrganizationCredibility(
        organizationWallet,
        impactReports,
      );

      // Aggregate total impact
      const totalImpactClaimed =
        await this.aggregateOrganizationImpact(impactReports);

      const dashboard: OrganizationDashboard = {
        organizationId: organizationWallet,
        organizationName: await this.getOrganizationName(organizationWallet),
        walletAddress: organizationWallet,
        campaigns,
        impactReports,
        attestations,
        verificationStatus,
        credibilityScore,
        totalImpactClaimed,
      };

      return dashboard;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "DASHBOARD_FETCH_FAILED",
        message: `Failed to fetch organization dashboard: ${error}`,
        category: "DATA",
        retryable: true,
      });
    }
  }

  /**
   * Get impact reports by campaign ID
   */
  async getImpactReportsByCampaign(
    campaignId: string,
  ): Promise<ImpactReport[]> {
    try {
      // In a real implementation, this would query the database
      const reports = Array.from(this.reportCache.values()).filter(
        (report) => report.campaignId === campaignId,
      );

      return reports.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "REPORTS_FETCH_FAILED",
        message: `Failed to fetch impact reports for campaign: ${error}`,
        category: "DATA",
        retryable: true,
      });
    }
  }

  /**
   * Validate on-chain signature for impact report
   */
  async validateOnChainSignature(report: ImpactReport): Promise<boolean> {
    try {
      // Simulate signature validation
      // In a real implementation, this would verify the signature on-chain
      const isValid =
        report.onChainSignature.length > 0 &&
        report.organizationWallet.length > 0;

      return isValid;
    } catch (error) {
      console.error("Signature validation failed:", error);
      return false;
    }
  }

  // Private helper methods

  private async verifyImpactReportAsync(report: ImpactReport): Promise<void> {
    try {
      await this.verifyImpactReport(report);
    } catch (error) {
      console.error("Background verification failed:", error);
    }
  }

  private generateReportId(
    organizationWallet: string,
    campaignId: string,
  ): string {
    const timestamp = Date.now();
    const hash = btoa(`${organizationWallet}-${campaignId}-${timestamp}`);
    return `report_${hash.substring(0, 16)}`;
  }

  private async generateOnChainSignature(
    wallet: string,
    claim: string,
    campaignId: string,
  ): Promise<string> {
    // Simulate signature generation
    const data = `${wallet}-${claim}-${campaignId}-${Date.now()}`;
    return btoa(data);
  }

  private buildVerificationPrompt(report: ImpactReport): string {
    return `
      Analyze the following impact claim for credibility and consistency:
      
      Organization: ${report.organizationWallet}
      Campaign: ${report.campaignId}
      Claim: ${report.claim}
      Category: ${report.category}
      Location: ${report.location || "Not specified"}
      Beneficiaries: ${report.beneficiaryCount || "Not specified"}
      
      Please assess:
      1. Plausibility of the claim
      2. Consistency with the category and location
      3. Reasonableness of beneficiary count
      4. Any red flags or inconsistencies
      
      Provide a confidence score (0-1) and detailed analysis.
    `;
  }

  private async crossReferenceWithSources(
    report: ImpactReport,
  ): Promise<CrossReference[]> {
    // Simulate cross-referencing with external sources
    const mockReferences: CrossReference[] = [
      {
        source: "Local News",
        url: "https://example-news.com/article",
        relevance: 0.8,
        supportsClaim: true,
        extractedInfo: "Local organization reported similar activities",
      },
      {
        source: "Government Database",
        relevance: 0.6,
        supportsClaim: true,
        extractedInfo: "Organization registered for this type of activity",
      },
    ];

    return mockReferences;
  }

  private async checkHistoricalConsistency(
    organizationWallet: string,
    currentReport: ImpactReport,
  ): Promise<number> {
    // Get previous reports from this organization
    const previousReports = Array.from(this.reportCache.values()).filter(
      (report) =>
        report.organizationWallet === organizationWallet &&
        report.reportId !== currentReport.reportId,
    );

    if (previousReports.length === 0) {
      return 0.5; // Neutral score for new organizations
    }

    // Check consistency with previous reports
    const consistentReports = previousReports.filter(
      (report) =>
        report.category === currentReport.category ||
        report.location === currentReport.location,
    );

    return consistentReports.length / previousReports.length;
  }

  private async detectInconsistencies(
    report: ImpactReport,
    crossReferences: CrossReference[],
  ): Promise<Inconsistency[]> {
    const inconsistencies: Inconsistency[] = [];

    // Check for conflicting cross-references
    const conflictingRefs = crossReferences.filter((ref) => !ref.supportsClaim);
    conflictingRefs.forEach((ref) => {
      inconsistencies.push({
        type: "CONTRADICTION",
        severity: "HIGH",
        description: `Conflicting information found in ${ref.source}`,
        conflictingSource: ref.source,
      });
    });

    // Check for unrealistic beneficiary counts
    if (report.beneficiaryCount && report.beneficiaryCount > 10000) {
      inconsistencies.push({
        type: "SCALE",
        severity: "MEDIUM",
        description: "Unusually high beneficiary count may need verification",
      });
    }

    return inconsistencies;
  }

  private getVerificationSources(): VerificationSource[] {
    return [
      {
        type: "NEWS",
        name: "Local News Aggregator",
        reliability: 0.8,
        lastChecked: new Date(),
      },
      {
        type: "GOVERNMENT_API",
        name: "NGO Registry API",
        reliability: 0.9,
        lastChecked: new Date(),
      },
      {
        type: "SOCIAL_MEDIA",
        name: "Social Media Monitor",
        reliability: 0.6,
        lastChecked: new Date(),
      },
    ];
  }

  private determineVerificationStatus(
    result: AIVerificationResult,
  ): VerificationStatus {
    if (result.inconsistencies.some((i) => i.severity === "HIGH")) {
      return "FLAGGED";
    }
    if (result.confidence > 0.8 && result.isVerified) {
      return "AI_VERIFIED";
    }
    if (result.confidence > 0.5) {
      return "PENDING";
    }
    return "UNVERIFIED";
  }

  private async processAttestation(
    attestation: ZKAttestation,
  ): Promise<ZKAttestation & { verificationStatus: VerificationStatus }> {
    // Simulate ZK proof verification
    const isValid = attestation.proofHash.length > 0;
    const verificationStatus: VerificationStatus = isValid
      ? "AI_VERIFIED"
      : "UNVERIFIED";

    this.attestationCache.set(attestation.attestationId, attestation);

    return {
      ...attestation,
      verificationStatus,
    };
  }

  private async aggregateImpactData(
    attestations: (ZKAttestation & {
      verificationStatus: VerificationStatus;
    })[],
  ): Promise<AggregatedImpact> {
    const categories: Record<ImpactCategory, CategoryImpact> = {} as any;
    const locations: LocationImpact[] = [];
    const timeline: TimelinePoint[] = [];

    // Process attestations to build aggregated data
    attestations.forEach((attestation) => {
      const category = this.mapAttestationToCategory(attestation.metadata);
      if (!categories[category]) {
        categories[category] = {
          category,
          totalReports: 0,
          verifiedReports: 0,
          estimatedBeneficiaries: 0,
          keyMetrics: [],
        };
      }

      categories[category].totalReports++;
      if (attestation.verificationStatus === "AI_VERIFIED") {
        categories[category].verifiedReports++;
      }
    });

    return {
      totalBeneficiaries: 0, // Would be calculated from actual data
      impactsByCategory: categories,
      geographicDistribution: locations,
      timelineData: timeline,
    };
  }

  private categorizeAttestations(
    attestations: (ZKAttestation & {
      verificationStatus: VerificationStatus;
    })[],
  ): Record<ImpactCategory, number> {
    const categories: Record<ImpactCategory, number> = {} as any;

    attestations.forEach((attestation) => {
      const category = this.mapAttestationToCategory(attestation.metadata);
      categories[category] = (categories[category] || 0) + 1;
    });

    return categories;
  }

  private getTimeRange(attestations: ZKAttestation[]): {
    earliest: Date;
    latest: Date;
  } {
    const timestamps = attestations.map((a) => a.timestamp);
    return {
      earliest: new Date(Math.min(...timestamps.map((t) => t.getTime()))),
      latest: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
    };
  }

  private mapAttestationToCategory(
    metadata: AttestationMetadata,
  ): ImpactCategory {
    // Simple mapping based on cause
    const cause = metadata.cause.toLowerCase();
    if (cause.includes("education") || cause.includes("school")) {
      return "EDUCATION";
    }
    if (cause.includes("health") || cause.includes("medical")) {
      return "HEALTHCARE";
    }
    if (cause.includes("environment") || cause.includes("climate")) {
      return "ENVIRONMENT";
    }
    if (cause.includes("poverty") || cause.includes("food")) {
      return "POVERTY";
    }
    if (cause.includes("disaster") || cause.includes("emergency")) {
      return "DISASTER_RELIEF";
    }
    return "OTHER";
  }

  private async getOrganizationCampaigns(
    organizationWallet: string,
  ): Promise<CampaignSummary[]> {
    // Mock implementation - would query actual campaign data
    return [
      {
        campaignId: "campaign_1",
        title: "Education for All",
        category: "EDUCATION",
        status: "ACTIVE",
        totalRaised: 5000,
        impactReports: 3,
        verificationLevel: "AI_VERIFIED",
      },
    ];
  }

  private async getImpactReportsByOrganization(
    organizationWallet: string,
  ): Promise<ImpactReport[]> {
    return Array.from(this.reportCache.values()).filter(
      (report) => report.organizationWallet === organizationWallet,
    );
  }

  private async getAttestationsByOrganization(
    organizationWallet: string,
  ): Promise<ZKAttestation[]> {
    return Array.from(this.attestationCache.values()).filter((attestation) => {
      // In a real implementation, we'd have a way to link attestations to organizations
      return true; // Mock implementation
    });
  }

  private async getOrganizationVerificationStatus(
    organizationWallet: string,
  ): Promise<OrganizationVerificationStatus> {
    return {
      isVerified: true,
      verificationLevel: "ENHANCED",
      verifiedFields: ["wallet", "identity", "registration"],
      pendingVerifications: [],
      lastVerificationUpdate: new Date(),
    };
  }

  private async calculateOrganizationCredibility(
    organizationWallet: string,
    reports: ImpactReport[],
  ): Promise<number> {
    const verifiedReports = reports.filter(
      (r) => r.verificationStatus === "AI_VERIFIED",
    );
    const verificationRatio =
      reports.length > 0 ? verifiedReports.length / reports.length : 0;
    return Math.round(verificationRatio * 100);
  }

  private async aggregateOrganizationImpact(
    reports: ImpactReport[],
  ): Promise<AggregatedImpact> {
    // Aggregate impact data from reports
    const categories: Record<ImpactCategory, CategoryImpact> = {} as any;

    reports.forEach((report) => {
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
    });

    return {
      totalBeneficiaries: Object.values(categories).reduce(
        (sum, cat) => sum + cat.estimatedBeneficiaries,
        0,
      ),
      impactsByCategory: categories,
      geographicDistribution: [],
      timelineData: [],
    };
  }

  private async getOrganizationName(
    organizationWallet: string,
  ): Promise<string> {
    // Mock implementation - would query organization registry
    return `Organization ${organizationWallet.substring(0, 8)}...`;
  }
}
