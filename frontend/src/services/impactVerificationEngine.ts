import {
  ImpactReport,
  AIVerificationResult,
  CrossReference,
  Inconsistency,
  VerificationSource,
  VerificationStatus,
  ImpactCategory,
} from "../types/aiTrust";
import { GeminiClient } from "./geminiClient";
import { AITrustErrorHandler } from "./aiTrustErrorHandler";

/**
 * AI Impact Verification Engine
 * Verifies impact claims against news, government APIs, and social media
 * Provides historical consistency checking and confidence scoring
 */
export class ImpactVerificationEngine {
  private geminiClient: GeminiClient;
  private errorHandler: AITrustErrorHandler;
  private verificationCache: Map<string, AIVerificationResult> = new Map();
  private organizationHistory: Map<string, ImpactReport[]> = new Map();

  // Mock external data sources
  private newsDatabase: NewsArticle[] = [];
  private governmentDatabase: GovernmentRecord[] = [];
  private socialMediaDatabase: SocialMediaPost[] = [];

  constructor(geminiClient: GeminiClient, errorHandler: AITrustErrorHandler) {
    this.geminiClient = geminiClient;
    this.errorHandler = errorHandler;
    this.initializeMockDatabases();
  }

  /**
   * Verify impact claims against trusted data sources
   */
  async verifyImpactClaims(
    reports: ImpactReport[],
  ): Promise<AIVerificationResult[]> {
    try {
      const verificationResults = await Promise.all(
        reports.map((report) => this.verifyIndividualReport(report)),
      );

      return verificationResults;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "BATCH_VERIFICATION_FAILED",
        message: `Failed to verify impact claims: ${error}`,
        category: "ANALYSIS",
        retryable: true,
      });
    }
  }

  /**
   * Verify a single impact report with comprehensive analysis
   */
  async verifyIndividualReport(
    report: ImpactReport,
  ): Promise<AIVerificationResult> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(report);
      if (this.verificationCache.has(cacheKey)) {
        return this.verificationCache.get(cacheKey)!;
      }

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

      // Generate AI summary
      const aiSummary = await this.generateVerificationSummary(
        report,
        crossReferences,
        inconsistencies,
      );

      // Calculate confidence score
      const confidence = this.calculateConfidenceScore(
        crossReferences,
        inconsistencies,
        historicalConsistency,
      );

      const verificationResult: AIVerificationResult = {
        isVerified: confidence > 0.7 && inconsistencies.length === 0,
        confidence,
        crossReferences,
        inconsistencies,
        aiSummary,
        verificationSources: this.getActiveVerificationSources(),
        historicalConsistency,
      };

      // Cache the result
      this.verificationCache.set(cacheKey, verificationResult);

      return verificationResult;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "INDIVIDUAL_VERIFICATION_FAILED",
        message: `Failed to verify individual report: ${error}`,
        category: "ANALYSIS",
        retryable: true,
      });
    }
  }

  /**
   * Check impact claims against news sources
   */
  async checkAgainstNews(report: ImpactReport): Promise<CrossReference[]> {
    try {
      const relevantNews = this.newsDatabase.filter((article) =>
        this.isRelevantToReport(article, report),
      );

      const crossReferences: CrossReference[] = [];

      for (const article of relevantNews) {
        // Use AI to analyze relevance and support
        const analysisPrompt = `
          Analyze if this news article supports or contradicts the impact claim:
          
          Claim: ${report.claim}
          Organization: ${report.organizationWallet}
          Location: ${report.location}
          Category: ${report.category}
          
          News Article:
          Title: ${article.title}
          Content: ${article.content}
          Date: ${article.publishDate}
          Source: ${article.source}
          
          Does this article support the claim? Provide relevance score (0-1) and explanation.
        `;

        const aiResponse = await this.geminiClient.analyzeText(
          analysisPrompt,
          article.content,
        );

        crossReferences.push({
          source: article.source,
          url: article.url,
          relevance: aiResponse.confidence,
          supportsClaim: aiResponse.text.toLowerCase().includes("supports"),
          extractedInfo: aiResponse.text,
        });
      }

      return crossReferences;
    } catch (error) {
      console.error("News verification failed:", error);
      return [];
    }
  }

  /**
   * Check impact claims against government APIs
   */
  async checkAgainstGovernmentAPIs(
    report: ImpactReport,
  ): Promise<CrossReference[]> {
    try {
      const relevantRecords = this.governmentDatabase.filter((record) =>
        this.isGovernmentRecordRelevant(record, report),
      );

      const crossReferences: CrossReference[] = [];

      for (const record of relevantRecords) {
        const analysisPrompt = `
          Analyze if this government record supports the impact claim:
          
          Claim: ${report.claim}
          Organization: ${report.organizationWallet}
          
          Government Record:
          Type: ${record.type}
          Organization: ${record.organizationName}
          Status: ${record.status}
          Activities: ${record.registeredActivities.join(", ")}
          
          Does this record support the organization's capability to make this claim?
        `;

        const aiResponse = await this.geminiClient.analyzeText(
          analysisPrompt,
          JSON.stringify(record),
        );

        crossReferences.push({
          source: `Government ${record.type}`,
          relevance: aiResponse.confidence,
          supportsClaim:
            record.status === "ACTIVE" && aiResponse.confidence > 0.6,
          extractedInfo: `Organization registered for: ${record.registeredActivities.join(", ")}`,
        });
      }

      return crossReferences;
    } catch (error) {
      console.error("Government API verification failed:", error);
      return [];
    }
  }

  /**
   * Check impact claims against social media
   */
  async checkAgainstSocialMedia(
    report: ImpactReport,
  ): Promise<CrossReference[]> {
    try {
      const relevantPosts = this.socialMediaDatabase.filter((post) =>
        this.isSocialMediaRelevant(post, report),
      );

      const crossReferences: CrossReference[] = [];

      for (const post of relevantPosts) {
        const analysisPrompt = `
          Analyze if this social media post supports the impact claim:
          
          Claim: ${report.claim}
          Location: ${report.location}
          
          Social Media Post:
          Platform: ${post.platform}
          Content: ${post.content}
          Date: ${post.timestamp}
          Engagement: ${post.likes} likes, ${post.shares} shares
          
          Does this post provide evidence supporting the claim?
        `;

        const aiResponse = await this.geminiClient.analyzeText(
          analysisPrompt,
          post.content,
        );

        crossReferences.push({
          source: `${post.platform} Post`,
          url: post.url,
          relevance: Math.min(aiResponse.confidence, 0.7), // Social media has lower reliability
          supportsClaim: aiResponse.text.toLowerCase().includes("supports"),
          extractedInfo: aiResponse.text,
        });
      }

      return crossReferences;
    } catch (error) {
      console.error("Social media verification failed:", error);
      return [];
    }
  }

  /**
   * Check historical consistency of organization reports
   */
  async checkHistoricalConsistency(
    organizationWallet: string,
    currentReport: ImpactReport,
  ): Promise<number> {
    try {
      const historicalReports =
        this.organizationHistory.get(organizationWallet) || [];

      if (historicalReports.length === 0) {
        // New organization - neutral score
        return 0.5;
      }

      // Add current report to history
      historicalReports.push(currentReport);
      this.organizationHistory.set(organizationWallet, historicalReports);

      // Analyze consistency patterns
      const consistencyFactors = [
        this.checkCategoryConsistency(historicalReports),
        this.checkLocationConsistency(historicalReports),
        this.checkScaleConsistency(historicalReports),
        this.checkTimingConsistency(historicalReports),
      ];

      const averageConsistency =
        consistencyFactors.reduce((sum, factor) => sum + factor, 0) /
        consistencyFactors.length;

      return Math.max(0, Math.min(1, averageConsistency));
    } catch (error) {
      console.error("Historical consistency check failed:", error);
      return 0.5; // Neutral score on error
    }
  }

  /**
   * Detect inconsistencies and suspicious patterns
   */
  async detectInconsistencies(
    report: ImpactReport,
    crossReferences: CrossReference[],
  ): Promise<Inconsistency[]> {
    const inconsistencies: Inconsistency[] = [];

    // Check for contradictory cross-references
    const contradictoryRefs = crossReferences.filter(
      (ref) => !ref.supportsClaim && ref.relevance > 0.7,
    );
    contradictoryRefs.forEach((ref) => {
      inconsistencies.push({
        type: "CONTRADICTION",
        severity: "HIGH",
        description: `Contradictory evidence found in ${ref.source}`,
        conflictingSource: ref.source,
      });
    });

    // Check for unrealistic scale
    if (report.beneficiaryCount) {
      if (report.beneficiaryCount > 100000) {
        inconsistencies.push({
          type: "SCALE",
          severity: "HIGH",
          description:
            "Extremely high beneficiary count requires additional verification",
        });
      } else if (report.beneficiaryCount > 10000) {
        inconsistencies.push({
          type: "SCALE",
          severity: "MEDIUM",
          description:
            "High beneficiary count should be verified with supporting evidence",
        });
      }
    }

    // Check for timeline inconsistencies
    const recentSimilarReports = this.findRecentSimilarReports(report);
    if (recentSimilarReports.length > 0) {
      inconsistencies.push({
        type: "TIMELINE",
        severity: "MEDIUM",
        description:
          "Similar impact reported recently - may indicate duplication",
      });
    }

    // Check for location inconsistencies
    if (
      report.location &&
      !this.isLocationConsistentWithCategory(report.location, report.category)
    ) {
      inconsistencies.push({
        type: "LOCATION",
        severity: "LOW",
        description: "Location may not be typical for this type of impact",
      });
    }

    return inconsistencies;
  }

  /**
   * Generate confidence score for verification result
   */
  private calculateConfidenceScore(
    crossReferences: CrossReference[],
    inconsistencies: Inconsistency[],
    historicalConsistency: number,
  ): number {
    let baseScore = 0.5;

    // Positive factors
    const supportingRefs = crossReferences.filter((ref) => ref.supportsClaim);
    const avgSupport =
      supportingRefs.length > 0
        ? supportingRefs.reduce((sum, ref) => sum + ref.relevance, 0) /
          supportingRefs.length
        : 0;

    baseScore += avgSupport * 0.3;
    baseScore += historicalConsistency * 0.2;

    // Negative factors
    const highSeverityIssues = inconsistencies.filter(
      (inc) => inc.severity === "HIGH",
    ).length;
    const mediumSeverityIssues = inconsistencies.filter(
      (inc) => inc.severity === "MEDIUM",
    ).length;

    baseScore -= highSeverityIssues * 0.3;
    baseScore -= mediumSeverityIssues * 0.15;

    return Math.max(0, Math.min(1, baseScore));
  }

  /**
   * Generate AI summary of verification results
   */
  private async generateVerificationSummary(
    report: ImpactReport,
    crossReferences: CrossReference[],
    inconsistencies: Inconsistency[],
  ): Promise<string> {
    const summaryPrompt = `
      Generate a concise verification summary for this impact report:
      
      Report: ${report.claim}
      Organization: ${report.organizationWallet}
      Category: ${report.category}
      
      Cross-references found: ${crossReferences.length}
      Supporting references: ${crossReferences.filter((r) => r.supportsClaim).length}
      Inconsistencies detected: ${inconsistencies.length}
      High-severity issues: ${inconsistencies.filter((i) => i.severity === "HIGH").length}
      
      Provide a 2-3 sentence summary of the verification status and key findings.
    `;

    try {
      const aiResponse = await this.geminiClient.analyzeText(
        summaryPrompt,
        JSON.stringify({ crossReferences, inconsistencies }),
      );
      return aiResponse.text;
    } catch (error) {
      return `Verification completed with ${crossReferences.length} cross-references and ${inconsistencies.length} inconsistencies detected.`;
    }
  }

  // Helper methods for cross-referencing

  private async crossReferenceWithSources(
    report: ImpactReport,
  ): Promise<CrossReference[]> {
    const allReferences: CrossReference[] = [];

    // Check against news sources
    const newsRefs = await this.checkAgainstNews(report);
    allReferences.push(...newsRefs);

    // Check against government APIs
    const govRefs = await this.checkAgainstGovernmentAPIs(report);
    allReferences.push(...govRefs);

    // Check against social media
    const socialRefs = await this.checkAgainstSocialMedia(report);
    allReferences.push(...socialRefs);

    return allReferences.sort((a, b) => b.relevance - a.relevance);
  }

  private getActiveVerificationSources(): VerificationSource[] {
    return [
      {
        type: "NEWS",
        name: "Global News Aggregator",
        reliability: 0.85,
        lastChecked: new Date(),
      },
      {
        type: "GOVERNMENT_API",
        name: "NGO Registry Database",
        reliability: 0.95,
        lastChecked: new Date(),
      },
      {
        type: "SOCIAL_MEDIA",
        name: "Social Media Monitor",
        reliability: 0.65,
        lastChecked: new Date(),
      },
    ];
  }

  // Consistency checking methods

  private checkCategoryConsistency(reports: ImpactReport[]): number {
    const categories = reports.map((r) => r.category);
    const uniqueCategories = new Set(categories);

    // Organizations focusing on fewer categories are more consistent
    return Math.max(0, 1 - (uniqueCategories.size - 1) * 0.2);
  }

  private checkLocationConsistency(reports: ImpactReport[]): number {
    const locations = reports.filter((r) => r.location).map((r) => r.location);
    if (locations.length === 0) return 0.5;

    const uniqueLocations = new Set(locations);

    // Organizations working in fewer locations are more consistent
    return Math.max(0, 1 - (uniqueLocations.size - 1) * 0.15);
  }

  private checkScaleConsistency(reports: ImpactReport[]): number {
    const beneficiaryCounts = reports
      .filter((r) => r.beneficiaryCount)
      .map((r) => r.beneficiaryCount!);

    if (beneficiaryCounts.length < 2) return 0.5;

    // Check for reasonable progression in scale
    const avgCount =
      beneficiaryCounts.reduce((sum, count) => sum + count, 0) /
      beneficiaryCounts.length;
    const variance =
      beneficiaryCounts.reduce(
        (sum, count) => sum + Math.pow(count - avgCount, 2),
        0,
      ) / beneficiaryCounts.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance indicates more consistent scale
    return Math.max(0, 1 - stdDev / avgCount);
  }

  private checkTimingConsistency(reports: ImpactReport[]): number {
    if (reports.length < 2) return 0.5;

    // Check for reasonable intervals between reports
    const sortedReports = reports.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const intervals = [];

    for (let i = 1; i < sortedReports.length; i++) {
      const interval =
        sortedReports[i].timestamp.getTime() -
        sortedReports[i - 1].timestamp.getTime();
      intervals.push(interval / (1000 * 60 * 60 * 24)); // Convert to days
    }

    // Reasonable intervals (not too frequent, not too sparse)
    const avgInterval =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;

    if (avgInterval < 7) return 0.3; // Too frequent
    if (avgInterval > 365) return 0.5; // Too sparse
    return 0.8; // Good timing
  }

  // Utility methods

  private generateCacheKey(report: ImpactReport): string {
    return `${report.organizationWallet}-${report.campaignId}-${report.claim.substring(0, 50)}`;
  }

  private isRelevantToReport(
    article: NewsArticle,
    report: ImpactReport,
  ): boolean {
    const articleText = `${article.title} ${article.content}`.toLowerCase();
    const reportText = `${report.claim} ${report.location || ""}`.toLowerCase();

    // Simple keyword matching - in production, would use more sophisticated NLP
    const keywords = reportText.split(" ").filter((word) => word.length > 3);
    return keywords.some((keyword) => articleText.includes(keyword));
  }

  private isGovernmentRecordRelevant(
    record: GovernmentRecord,
    report: ImpactReport,
  ): boolean {
    // Check if organization name matches or activities align with report category
    return record.registeredActivities.some((activity) =>
      activity.toLowerCase().includes(report.category.toLowerCase()),
    );
  }

  private isSocialMediaRelevant(
    post: SocialMediaPost,
    report: ImpactReport,
  ): boolean {
    const postText = post.content.toLowerCase();
    const reportKeywords =
      `${report.claim} ${report.location || ""}`.toLowerCase();

    return reportKeywords
      .split(" ")
      .some((keyword) => keyword.length > 3 && postText.includes(keyword));
  }

  private findRecentSimilarReports(report: ImpactReport): ImpactReport[] {
    const allReports = Array.from(this.organizationHistory.values()).flat();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return allReports.filter(
      (r) =>
        r.reportId !== report.reportId &&
        r.timestamp > thirtyDaysAgo &&
        r.category === report.category &&
        r.location === report.location,
    );
  }

  private isLocationConsistentWithCategory(
    location: string,
    category: ImpactCategory,
  ): boolean {
    // Simple consistency check - in production, would use geographic and demographic data
    const locationLower = location.toLowerCase();

    switch (category) {
      case "DISASTER_RELIEF":
        return true; // Disasters can happen anywhere
      case "ENVIRONMENT":
        return (
          !locationLower.includes("urban") || locationLower.includes("park")
        );
      case "EDUCATION":
        return (
          !locationLower.includes("desert") && !locationLower.includes("ocean")
        );
      default:
        return true; // Most categories can work in most locations
    }
  }

  // Initialize mock databases for demonstration
  private initializeMockDatabases(): void {
    // Mock news articles
    this.newsDatabase = [
      {
        title: "Local NGO Delivers Educational Supplies",
        content:
          "A local organization distributed school supplies to 200 children in rural areas",
        source: "Local News Network",
        url: "https://example-news.com/education-supplies",
        publishDate: new Date("2024-01-15"),
        category: "EDUCATION",
      },
      {
        title: "Healthcare Initiative Reaches Remote Villages",
        content:
          "Medical team provided healthcare services to underserved communities",
        source: "Health Today",
        url: "https://health-today.com/remote-healthcare",
        publishDate: new Date("2024-01-20"),
        category: "HEALTHCARE",
      },
    ];

    // Mock government records
    this.governmentDatabase = [
      {
        organizationName: "Education for All Foundation",
        type: "NGO Registry",
        status: "ACTIVE",
        registeredActivities: [
          "Education",
          "Child Welfare",
          "Community Development",
        ],
        registrationDate: new Date("2020-01-01"),
      },
      {
        organizationName: "Health Access Initiative",
        type: "Healthcare Registry",
        status: "ACTIVE",
        registeredActivities: [
          "Healthcare",
          "Medical Services",
          "Rural Development",
        ],
        registrationDate: new Date("2019-06-15"),
      },
    ];

    // Mock social media posts
    this.socialMediaDatabase = [
      {
        platform: "Twitter",
        content:
          "Amazing to see local schools receiving new supplies! Education is the key to progress #education #community",
        url: "https://twitter.com/example/status/123",
        timestamp: new Date("2024-01-16"),
        likes: 45,
        shares: 12,
      },
      {
        platform: "Facebook",
        content:
          "Grateful for the medical team that visited our village last week. Healthcare for all! #healthcare #rural",
        url: "https://facebook.com/post/456",
        timestamp: new Date("2024-01-21"),
        likes: 78,
        shares: 23,
      },
    ];
  }
}

// Supporting interfaces for mock data
interface NewsArticle {
  title: string;
  content: string;
  source: string;
  url: string;
  publishDate: Date;
  category: string;
}

interface GovernmentRecord {
  organizationName: string;
  type: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  registeredActivities: string[];
  registrationDate: Date;
}

interface SocialMediaPost {
  platform: string;
  content: string;
  url: string;
  timestamp: Date;
  likes: number;
  shares: number;
}
