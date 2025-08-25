import { geminiClient } from "./geminiClient";
import { rateLimiter } from "./rateLimiter";
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
  private cache = new Map<string, TrustAnalysisResult>();
  private readonly cacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Main analysis entry point - orchestrates all AI analysis components
   */
  async analyzeCampaign(
    campaignData: CampaignData,
  ): Promise<TrustAnalysisResult> {
    const campaignId = this.generateCampaignId(campaignData);

    try {
      // Check cache first
      const cachedResult = await this.getCachedAnalysis(campaignId);
      if (cachedResult && !this.isCacheExpired(cachedResult)) {
        return cachedResult;
      }

      // Perform parallel analysis
      const [credibilityScore, duplicationCheck, visualVerification] =
        await Promise.allSettled([
          this.calculateCredibilityScore(campaignData.metadata),
          this.checkNarrativeDuplication(campaignData.content),
          this.verifyVisualContent(campaignData.mediaUrls),
        ]);

      // Process results with error handling
      const result: TrustAnalysisResult = {
        campaignId,
        credibilityScore: this.extractResult(
          credibilityScore,
          this.getFallbackCredibilityScore(),
        ),
        duplicationCheck: this.extractResult(
          duplicationCheck,
          this.getFallbackDuplicationResult(),
        ),
        visualVerification: this.extractResult(
          visualVerification,
          this.getFallbackVisualVerification(),
        ),
        overallTrustLevel: "MEDIUM", // Will be calculated below
        analysisTimestamp: new Date(),
        expiresAt: new Date(Date.now() + this.cacheExpiryMs),
      };

      // Calculate overall trust level
      result.overallTrustLevel = this.calculateOverallTrustLevel(result);

      // Cache the result
      this.cache.set(campaignId, result);

      return result;
    } catch (error) {
      console.error("Campaign analysis failed:", error);
      throw this.handleError(error, "CAMPAIGN_ANALYSIS");
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
   * Get cached analysis result
   */
  async getCachedAnalysis(
    campaignId: string,
  ): Promise<TrustAnalysisResult | null> {
    const cached = this.cache.get(campaignId);
    if (cached && !this.isCacheExpired(cached)) {
      return cached;
    }
    return null;
  }

  /**
   * Invalidate cache for a campaign
   */
  async invalidateCache(campaignId: string): Promise<void> {
    this.cache.delete(campaignId);
  }

  /**
   * Clear expired cache entries
   */
  private cleanupCache(): void {
    const now = new Date();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt < now) {
        this.cache.delete(key);
      }
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
   * Get service status and metrics
   */
  getServiceStatus(): {
    cacheSize: number;
    rateLimiterStatus: any;
    isHealthy: boolean;
  } {
    this.cleanupCache();

    return {
      cacheSize: this.cache.size,
      rateLimiterStatus: rateLimiter.getQueueStatus(),
      isHealthy: true, // Could include more health checks
    };
  }
}

// Export singleton instance
export const aiTrustService = new AITrustService();
