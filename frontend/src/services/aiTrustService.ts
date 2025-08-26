import { geminiClient } from "./geminiClient";
import { rateLimiter } from "./rateLimiter";
import { trustDataStorage } from "./trustDataStorage";
import { aiTrustErrorHandler } from "./aiTrustErrorHandler";
import {
  TrustAnalysisResult,
  CampaignData,
  CredibilityScore,
  DuplicationResult,
  VisualVerificationResult,
  CampaignMetadata,
  CampaignContent,
  AITrustError,
  ErrorResolution,
  FallbackResult,
} from "../types/aiTrust";

export class AITrustService {
  private memoryCache = new Map<string, TrustAnalysisResult>();
  private readonly cacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours
  private readonly maxMemoryCacheSize = 100; // Limit memory cache size
  private analysisInProgress = new Set<string>(); // Track ongoing analyses

  /**
   * Main analysis entry point - orchestrates all AI analysis components
   */
  async analyzeCampaign(
    campaignData: CampaignData,
  ): Promise<TrustAnalysisResult> {
    const campaignId = this.generateCampaignId(campaignData);

    try {
      // Prevent duplicate analyses
      if (this.analysisInProgress.has(campaignId)) {
        // Wait for ongoing analysis to complete
        return await this.waitForAnalysis(campaignId);
      }

      // Check cache first (memory then persistent storage)
      const cachedResult = await this.getCachedAnalysis(campaignId);
      if (cachedResult && !this.isCacheExpired(cachedResult)) {
        return cachedResult;
      }

      // Mark analysis as in progress
      this.analysisInProgress.add(campaignId);

      try {
        // Perform parallel analysis with enhanced error handling
        const analysisPromises = [
          this.executeWithFallback(
            () => this.calculateCredibilityScore(campaignData.metadata),
            () => this.getFallbackCredibilityScore(),
            "CREDIBILITY_ANALYSIS",
          ),
          this.executeWithFallback(
            () => this.checkNarrativeDuplication(campaignData.content),
            () => this.getFallbackDuplicationResult(),
            "DUPLICATION_ANALYSIS",
          ),
          this.executeWithFallback(
            () => this.verifyVisualContent(campaignData.mediaUrls),
            () => this.getFallbackVisualVerification(),
            "VISUAL_ANALYSIS",
          ),
        ];

        const [credibilityScore, duplicationCheck, visualVerification] =
          await Promise.all(analysisPromises);

        // Create analysis result
        const result: TrustAnalysisResult = {
          campaignId,
          credibilityScore,
          duplicationCheck,
          visualVerification,
          overallTrustLevel: "MEDIUM", // Will be calculated below
          analysisTimestamp: new Date(),
          expiresAt: new Date(Date.now() + this.cacheExpiryMs),
        };

        // Calculate overall trust level
        result.overallTrustLevel = this.calculateOverallTrustLevel(result);

        // Store in both memory and persistent cache
        await this.storeAnalysisResult(result);

        return result;
      } finally {
        // Always remove from in-progress set
        this.analysisInProgress.delete(campaignId);
      }
    } catch (error) {
      console.error("Campaign analysis failed:", error);

      // Try to provide a fallback result even on complete failure
      const fallbackResult = await this.createFallbackAnalysisResult(
        campaignId,
        campaignData,
      );
      await this.storeAnalysisResult(fallbackResult);

      return fallbackResult;
    }
  }

  /**
   * Calculate credibility score based on campaign metadata
   */
  async calculateCredibilityScore(
    metadata: CampaignMetadata,
  ): Promise<CredibilityScore> {
    try {
      const prompt = `
        Analyze the following campaign metadata and calculate a credibility score (0-100).
        Consider these factors:
        1. Zero-knowledge proofs and verifications
        2. Account age and history
        3. Public metadata quality
        4. Verification completeness
        
        Provide response in JSON format:
        {
          "score": <number 0-100>,
          "confidence": <number 0-1>,
          "factors": [
            {
              "type": "<factor_type>",
              "weight": <number 0-1>,
              "value": <number 0-100>,
              "description": "<explanation>"
            }
          ]
        }
        
        Campaign Metadata:
        - Title: ${metadata.title}
        - Category: ${metadata.category}
        - Location: ${metadata.location || "Not specified"}
        - Creation Date: ${metadata.creationDate.toISOString()}
        - ZK Proofs: ${metadata.zkProofs.length} proofs
        - Public Verifications: ${metadata.publicVerifications.length} verifications
        - Creator Address Age: ${this.calculateWalletAge(metadata.creatorAddress)} days
      `;

      const response = await rateLimiter.queueRequest(
        () => geminiClient.analyzeText(prompt, JSON.stringify(metadata)),
        "HIGH",
      );

      const parsedResponse = this.parseJsonResponse(response.text);

      return {
        score: parsedResponse.score || 50,
        confidence: parsedResponse.confidence || response.confidence,
        factors: parsedResponse.factors || [],
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("Credibility score calculation failed:", error);
      return this.getFallbackCredibilityScore();
    }
  }

  /**
   * Check for narrative duplication across campaigns
   */
  async checkNarrativeDuplication(
    content: CampaignContent,
  ): Promise<DuplicationResult> {
    try {
      // In a real implementation, this would compare against existing campaigns
      // For now, we'll simulate the analysis
      const prompt = `
        Analyze this campaign content for potential duplication indicators:
        1. Generic or template-like language
        2. Overly common phrases or structures
        3. Suspicious patterns that might indicate copy-paste content
        
        Provide response in JSON format:
        {
          "isDuplicate": <boolean>,
          "confidence": <number 0-1>,
          "matches": [],
          "suggestedActions": ["<action1>", "<action2>"]
        }
        
        Campaign Content:
        Title: ${content.title}
        Description: ${content.description}
        Category: ${content.category}
      `;

      const response = await rateLimiter.queueRequest(
        () => geminiClient.analyzeText(prompt, JSON.stringify(content)),
        "MEDIUM",
      );

      const parsedResponse = this.parseJsonResponse(response.text);

      return {
        isDuplicate: parsedResponse.isDuplicate || false,
        confidence: parsedResponse.confidence || response.confidence,
        matches: parsedResponse.matches || [],
        suggestedActions: parsedResponse.suggestedActions || [],
      };
    } catch (error) {
      console.error("Narrative duplication check failed:", error);
      return this.getFallbackDuplicationResult();
    }
  }

  /**
   * Verify visual content authenticity
   */
  async verifyVisualContent(
    mediaUrls: string[],
  ): Promise<VisualVerificationResult> {
    try {
      if (!mediaUrls || mediaUrls.length === 0) {
        return {
          images: [],
          overallScore: 100,
          hasIssues: false,
        };
      }

      // For now, simulate visual verification
      // In a real implementation, this would download and analyze images
      const imageResults = await Promise.allSettled(
        mediaUrls.map(async (url) => {
          const prompt = `
            Analyze this image URL for potential authenticity issues:
            ${url}
            
            Consider:
            1. URL structure and source credibility
            2. File naming patterns
            3. Hosting platform reputation
          `;

          const response = await rateLimiter.queueRequest(
            () => geminiClient.analyzeText(prompt, url),
            "LOW",
          );

          return {
            isAuthentic: true,
            confidence: response.confidence,
            issues: [],
            metadata: {
              dimensions: { width: 0, height: 0 },
              format: "unknown",
              size: 0,
              uploadDate: new Date(),
              fingerprint: this.generateFingerprint(url),
            },
          };
        }),
      );

      const images = imageResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => (result as PromiseFulfilledResult<any>).value);

      const overallScore =
        images.length > 0
          ? images.reduce((sum, img) => sum + img.confidence * 100, 0) /
            images.length
          : 100;

      return {
        images,
        overallScore,
        hasIssues: images.some((img) => !img.isAuthentic),
      };
    } catch (error) {
      console.error("Visual content verification failed:", error);
      return this.getFallbackVisualVerification();
    }
  }

  /**
   * Get cached analysis result (checks memory cache first, then persistent storage)
   */
  async getCachedAnalysis(
    campaignId: string,
  ): Promise<TrustAnalysisResult | null> {
    // Check memory cache first
    const memoryResult = this.memoryCache.get(campaignId);
    if (memoryResult && !this.isCacheExpired(memoryResult)) {
      return memoryResult;
    }

    // Check persistent storage
    try {
      const persistentResult =
        await trustDataStorage.getTrustAnalysis(campaignId);
      if (persistentResult && !this.isCacheExpired(persistentResult)) {
        // Store in memory cache for faster access
        this.addToMemoryCache(campaignId, persistentResult);
        return persistentResult;
      }
    } catch (error) {
      console.warn("Failed to retrieve from persistent cache:", error);
    }

    return null;
  }

  /**
   * Invalidate cache for a campaign (both memory and persistent)
   */
  async invalidateCache(campaignId: string): Promise<void> {
    // Remove from memory cache
    this.memoryCache.delete(campaignId);

    // Remove from persistent storage
    try {
      await trustDataStorage.deleteTrustAnalysis(campaignId);
    } catch (error) {
      console.warn("Failed to invalidate persistent cache:", error);
    }
  }

  /**
   * Execute analysis with fallback on error
   */
  private async executeWithFallback<T>(
    analysisFunction: () => Promise<T>,
    fallbackFunction: () => T,
    context: string,
  ): Promise<T> {
    try {
      return await analysisFunction();
    } catch (error) {
      console.warn(`${context} failed, using fallback:`, error);

      // Handle error through error handler
      const aiError = this.createAITrustError(error, context);
      const resolution = await aiTrustErrorHandler.handleError(aiError);

      if (resolution.action === "RETRY" && resolution.retryAfter) {
        // Wait and retry once
        await this.sleep(resolution.retryAfter);
        try {
          return await analysisFunction();
        } catch (retryError) {
          console.warn(`${context} retry failed, using fallback:`, retryError);
          return fallbackFunction();
        }
      }

      return fallbackFunction();
    }
  }

  /**
   * Wait for ongoing analysis to complete
   */
  private async waitForAnalysis(
    campaignId: string,
  ): Promise<TrustAnalysisResult> {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 500; // 500ms
    let waited = 0;

    while (this.analysisInProgress.has(campaignId) && waited < maxWaitTime) {
      await this.sleep(checkInterval);
      waited += checkInterval;
    }

    // Check if analysis completed and result is available
    const result = await this.getCachedAnalysis(campaignId);
    if (result) {
      return result;
    }

    // If still no result, throw error
    throw new Error("Analysis timeout - unable to complete or retrieve result");
  }

  /**
   * Store analysis result in both memory and persistent cache
   */
  private async storeAnalysisResult(
    result: TrustAnalysisResult,
  ): Promise<void> {
    // Store in memory cache
    this.addToMemoryCache(result.campaignId, result);

    // Store in persistent storage
    try {
      await trustDataStorage.storeTrustAnalysis(result);
    } catch (error) {
      console.warn("Failed to store in persistent cache:", error);
    }
  }

  /**
   * Add result to memory cache with size management
   */
  private addToMemoryCache(
    campaignId: string,
    result: TrustAnalysisResult,
  ): void {
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }

    this.memoryCache.set(campaignId, result);
  }

  /**
   * Create fallback analysis result for complete failures
   */
  private async createFallbackAnalysisResult(
    campaignId: string,
    campaignData: CampaignData,
  ): Promise<TrustAnalysisResult> {
    return {
      campaignId,
      credibilityScore: this.getFallbackCredibilityScore(),
      duplicationCheck: this.getFallbackDuplicationResult(),
      visualVerification: this.getFallbackVisualVerification(),
      overallTrustLevel: "MEDIUM",
      analysisTimestamp: new Date(),
      expiresAt: new Date(Date.now() + this.cacheExpiryMs),
    };
  }

  /**
   * Create standardized AI Trust Error
   */
  private createAITrustError(error: any, context: string): AITrustError {
    if (error?.code && error?.category) {
      // Already an AITrustError
      return error;
    }

    return {
      code: "ANALYSIS_ERROR",
      message: `${context} failed: ${error?.message || "Unknown error"}`,
      category: "ANALYSIS",
      retryable: true,
      fallbackAction: "Use fallback analysis results",
    };
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear expired cache entries from memory
   */
  private cleanupMemoryCache(): void {
    const now = new Date();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiresAt < now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Perform comprehensive cache cleanup
   */
  async performCacheCleanup(): Promise<void> {
    // Clean memory cache
    this.cleanupMemoryCache();

    // Clean persistent storage
    try {
      await trustDataStorage.cleanupExpiredEntries();
    } catch (error) {
      console.warn("Failed to cleanup persistent storage:", error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isCacheExpired(result: TrustAnalysisResult): boolean {
    return result.expiresAt < new Date();
  }

  /**
   * Generate campaign ID from campaign data
   */
  private generateCampaignId(campaignData: CampaignData): string {
    const content = JSON.stringify({
      title: campaignData.content.title,
      creator: campaignData.metadata.creatorAddress,
      timestamp: campaignData.metadata.creationDate.getTime(),
    });

    // Simple hash function (in production, use a proper hash function)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `campaign_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Calculate overall trust level from individual scores
   */
  private calculateOverallTrustLevel(
    result: TrustAnalysisResult,
  ): "HIGH" | "MEDIUM" | "LOW" | "FLAGGED" {
    const credibilityScore = result.credibilityScore.score;
    const hasDuplication = result.duplicationCheck.isDuplicate;
    const hasVisualIssues = result.visualVerification.hasIssues;

    // Flag if duplication detected with high confidence
    if (hasDuplication && result.duplicationCheck.confidence > 0.8) {
      return "FLAGGED";
    }

    // Flag if visual issues detected
    if (hasVisualIssues) {
      return "FLAGGED";
    }

    // Calculate based on credibility score
    if (credibilityScore >= 80) {
      return "HIGH";
    } else if (credibilityScore >= 60) {
      return "MEDIUM";
    } else {
      return "LOW";
    }
  }

  /**
   * Extract result from Promise.allSettled result
   */
  private extractResult<T>(result: PromiseSettledResult<T>, fallback: T): T {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.error("Analysis component failed:", result.reason);
      return fallback;
    }
  }

  /**
   * Parse JSON response with error handling
   */
  private parseJsonResponse(text: string): any {
    try {
      const jsonMatch =
        text.match(/```json\n([\s\S]*?)\n```/) ||
        text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      return JSON.parse(jsonText);
    } catch (error) {
      console.warn("Failed to parse JSON response:", error);
      return {};
    }
  }

  /**
   * Calculate wallet age (placeholder implementation)
   */
  private calculateWalletAge(address: string): number {
    // In a real implementation, this would query blockchain data
    // For now, return a random age between 1-365 days
    return Math.floor(Math.random() * 365) + 1;
  }

  /**
   * Generate fingerprint for media URL
   */
  private generateFingerprint(url: string): string {
    // Simple fingerprint based on URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `fp_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Fallback credibility score
   */
  private getFallbackCredibilityScore(): CredibilityScore {
    return {
      score: 50,
      confidence: 0.1,
      factors: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Fallback duplication result
   */
  private getFallbackDuplicationResult(): DuplicationResult {
    return {
      isDuplicate: false,
      confidence: 0.1,
      matches: [],
      suggestedActions: ["Analysis unavailable - manual review recommended"],
    };
  }

  /**
   * Fallback visual verification result
   */
  private getFallbackVisualVerification(): VisualVerificationResult {
    return {
      images: [],
      overallScore: 50,
      hasIssues: false,
    };
  }

  /**
   * Handle errors with proper categorization
   */
  private handleError(error: any, context: string): AITrustError {
    return {
      code: "ANALYSIS_FAILED",
      message: `AI analysis failed in ${context}: ${error?.message || "Unknown error"}`,
      category: "ANALYSIS",
      retryable: true,
      fallbackAction: "Use fallback analysis results",
    };
  }

  /**
   * Get comprehensive service status and metrics
   */
  async getServiceStatus(): Promise<{
    memoryCacheSize: number;
    persistentCacheStats: any;
    rateLimiterStatus: any;
    analysisInProgress: number;
    isHealthy: boolean;
    lastCleanup: Date;
  }> {
    // Perform cleanup
    await this.performCacheCleanup();

    // Get persistent storage stats
    let persistentStats = null;
    try {
      persistentStats = await trustDataStorage.getStorageStats();
    } catch (error) {
      console.warn("Failed to get persistent storage stats:", error);
    }

    return {
      memoryCacheSize: this.memoryCache.size,
      persistentCacheStats: persistentStats,
      rateLimiterStatus: rateLimiter.getQueueStatus(),
      analysisInProgress: this.analysisInProgress.size,
      isHealthy: this.checkServiceHealth(),
      lastCleanup: new Date(),
    };
  }

  /**
   * Check overall service health
   */
  private checkServiceHealth(): boolean {
    try {
      // Check if essential services are available
      const rateLimiterHealthy = rateLimiter.getQueueStatus().queueLength < 50;
      const memoryUsageHealthy =
        this.memoryCache.size < this.maxMemoryCacheSize;
      const noStuckAnalyses = this.analysisInProgress.size < 10;

      return rateLimiterHealthy && memoryUsageHealthy && noStuckAnalyses;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }

  /**
   * Get analysis metrics for monitoring
   */
  async getAnalysisMetrics(days: number = 7): Promise<any> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    try {
      return await trustDataStorage.getAnalysisMetrics(startDate, endDate);
    } catch (error) {
      console.warn("Failed to get analysis metrics:", error);
      return [];
    }
  }

  /**
   * Force cache refresh for a campaign
   */
  async refreshCampaignAnalysis(
    campaignData: CampaignData,
  ): Promise<TrustAnalysisResult> {
    const campaignId = this.generateCampaignId(campaignData);

    // Invalidate existing cache
    await this.invalidateCache(campaignId);

    // Perform fresh analysis
    return await this.analyzeCampaign(campaignData);
  }
}

// Export singleton instance
export const aiTrustService = new AITrustService();
