import {
  CredibilityScore,
  CredibilityFactors,
  ScoreBreakdown,
  ImprovementSuggestion,
  ScoreFactor,
  ZKProof,
  CampaignMetadata,
  AITrustError,
} from "../types/aiTrust";
import { geminiClient } from "./geminiClient";
import { trustDataStorage } from "./trustDataStorage";

/**
 * CredibilityEngine - Calculates and manages credibility scores for campaign creators
 * Uses zero-knowledge proofs and public metadata to assess trustworthiness
 */
export class CredibilityEngine {
  private readonly SCORE_WEIGHTS = {
    GOVERNMENT_ID: 0.25, // 25% weight for government ID verification
    NGO_LICENSE: 0.2, // 20% weight for NGO license validation
    ACCOUNT_AGE: 0.15, // 15% weight for account age
    SOCIAL_MEDIA: 0.15, // 15% weight for social media presence
    HISTORY: 0.25, // 25% weight for previous campaign history
  };

  private readonly MIN_CONFIDENCE_THRESHOLD = 0.6;
  private readonly CACHE_DURATION_HOURS = 24;

  /**
   * Calculate credibility score based on available factors
   */
  async calculateScore(factors: CredibilityFactors): Promise<CredibilityScore> {
    try {
      const scoreFactors: ScoreFactor[] = [];
      let totalWeightedScore = 0;
      let totalWeight = 0;

      // Government ID Verification Factor
      const govIdFactor = this.calculateGovernmentIdFactor(
        factors.hasGovernmentIdVerification,
      );
      scoreFactors.push(govIdFactor);
      totalWeightedScore +=
        govIdFactor.value * this.SCORE_WEIGHTS.GOVERNMENT_ID;
      totalWeight += this.SCORE_WEIGHTS.GOVERNMENT_ID;

      // NGO License Validation Factor
      const ngoFactor = this.calculateNgoLicenseFactor(
        factors.hasNgoLicenseValidation,
      );
      scoreFactors.push(ngoFactor);
      totalWeightedScore += ngoFactor.value * this.SCORE_WEIGHTS.NGO_LICENSE;
      totalWeight += this.SCORE_WEIGHTS.NGO_LICENSE;

      // Account Age Factor
      const accountAgeFactor = this.calculateAccountAgeFactor(
        factors.accountAge,
      );
      scoreFactors.push(accountAgeFactor);
      totalWeightedScore +=
        accountAgeFactor.value * this.SCORE_WEIGHTS.ACCOUNT_AGE;
      totalWeight += this.SCORE_WEIGHTS.ACCOUNT_AGE;

      // Social Media Presence Factor
      const socialMediaFactor = this.calculateSocialMediaFactor(
        factors.socialMediaPresence,
      );
      scoreFactors.push(socialMediaFactor);
      totalWeightedScore +=
        socialMediaFactor.value * this.SCORE_WEIGHTS.SOCIAL_MEDIA;
      totalWeight += this.SCORE_WEIGHTS.SOCIAL_MEDIA;

      // Campaign History Factor
      const historyFactor = this.calculateHistoryFactor(
        factors.previousCampaignHistory,
      );
      scoreFactors.push(historyFactor);
      totalWeightedScore += historyFactor.value * this.SCORE_WEIGHTS.HISTORY;
      totalWeight += this.SCORE_WEIGHTS.HISTORY;

      // Calculate final score (0-100)
      const finalScore = Math.round(totalWeightedScore / totalWeight);

      // Calculate confidence based on available data completeness
      const confidence = this.calculateConfidence(scoreFactors);

      const credibilityScore: CredibilityScore = {
        score: Math.max(0, Math.min(100, finalScore)), // Ensure score is between 0-100
        confidence,
        factors: scoreFactors,
        lastUpdated: new Date(),
      };

      return credibilityScore;
    } catch (error) {
      throw this.handleError(error, "SCORE_CALCULATION");
    }
  }

  /**
   * Get detailed score breakdown with improvement suggestions
   */
  async getScoreBreakdown(campaignId: string): Promise<ScoreBreakdown> {
    try {
      // Try to get cached analysis first
      const cachedAnalysis =
        await trustDataStorage.getTrustAnalysis(campaignId);

      let credibilityScore: CredibilityScore;

      if (cachedAnalysis) {
        credibilityScore = cachedAnalysis.credibilityScore;
      } else {
        // Generate a demo credibility score if no cached data exists
        credibilityScore = await this.generateDemoCredibilityScore();
      }

      const suggestions =
        await this.generateImprovementSuggestions(credibilityScore);

      return {
        totalScore: credibilityScore.score,
        factors: credibilityScore.factors,
        suggestions,
      };
    } catch (error) {
      throw this.handleError(error, "SCORE_BREAKDOWN");
    }
  }

  /**
   * Generate improvement suggestions based on current score
   */
  async getSuggestions(currentScore: number): Promise<ImprovementSuggestion[]> {
    try {
      const suggestions: ImprovementSuggestion[] = [];

      if (currentScore < 70) {
        suggestions.push({
          type: "GOVERNMENT_ID",
          description:
            "Complete government ID verification to significantly boost your credibility score",
          impact: 25,
          priority: "HIGH",
        });

        suggestions.push({
          type: "NGO_LICENSE",
          description: "Verify your NGO license or organizational credentials",
          impact: 20,
          priority: "HIGH",
        });
      }

      if (currentScore < 80) {
        suggestions.push({
          type: "SOCIAL_MEDIA",
          description:
            "Link and verify your social media accounts to show authenticity",
          impact: 15,
          priority: "MEDIUM",
        });

        suggestions.push({
          type: "ACCOUNT_AGE",
          description:
            "Continue using your wallet to build account history over time",
          impact: 10,
          priority: "LOW",
        });
      }

      if (currentScore < 90) {
        suggestions.push({
          type: "CAMPAIGN_HISTORY",
          description:
            "Successfully complete campaigns to build a positive track record",
          impact: 15,
          priority: "MEDIUM",
        });
      }

      // Sort suggestions by priority and impact
      suggestions.sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.impact - a.impact;
      });

      return suggestions;
    } catch (error) {
      throw this.handleError(error, "SUGGESTION_GENERATION");
    }
  }

  /**
   * Calculate credibility score from campaign metadata and ZK proofs
   */
  async calculateFromMetadata(
    metadata: CampaignMetadata,
  ): Promise<CredibilityScore> {
    try {
      // Check cache first
      const cachedScore = await trustDataStorage.getCredibilityScore(
        metadata.creatorAddress,
      );
      if (cachedScore) {
        return cachedScore;
      }

      // Extract factors from metadata
      const factors = this.extractFactorsFromMetadata(metadata);

      // Calculate new score
      const score = await this.calculateScore(factors);

      // Cache the result
      await trustDataStorage.storeCredibilityScore(
        metadata.creatorAddress,
        score,
      );

      return score;
    } catch (error) {
      throw this.handleError(error, "METADATA_SCORE_CALCULATION");
    }
  }

  /**
   * Validate zero-knowledge proofs for privacy-preserving verification
   */
  async validateZKProofs(
    zkProofs: ZKProof[],
  ): Promise<{ [key: string]: boolean }> {
    try {
      const validationResults: { [key: string]: boolean } = {};

      for (const proof of zkProofs) {
        // Simulate ZK proof validation
        // In a real implementation, this would verify the cryptographic proof
        const isValid = await this.simulateZKProofValidation(proof);
        validationResults[proof.type] = isValid;
      }

      return validationResults;
    } catch (error) {
      throw this.handleError(error, "ZK_PROOF_VALIDATION");
    }
  }

  /**
   * Calculate government ID verification factor
   */
  private calculateGovernmentIdFactor(hasVerification: boolean): ScoreFactor {
    return {
      type: "GOVERNMENT_ID",
      weight: this.SCORE_WEIGHTS.GOVERNMENT_ID,
      value: hasVerification ? 100 : 0,
      description: hasVerification
        ? "Government ID verified through zero-knowledge proof"
        : "Government ID verification not completed",
    };
  }

  /**
   * Calculate NGO license validation factor
   */
  private calculateNgoLicenseFactor(hasValidation: boolean): ScoreFactor {
    return {
      type: "NGO_LICENSE",
      weight: this.SCORE_WEIGHTS.NGO_LICENSE,
      value: hasValidation ? 100 : 0,
      description: hasValidation
        ? "NGO license validated through official channels"
        : "NGO license validation not completed",
    };
  }

  /**
   * Calculate account age factor
   */
  private calculateAccountAgeFactor(accountAge: number): ScoreFactor {
    // Score increases with account age, maxing out at 365 days (1 year)
    const maxAge = 365;
    const normalizedAge = Math.min(accountAge, maxAge);
    const score = Math.round((normalizedAge / maxAge) * 100);

    let description: string;
    if (accountAge < 30) {
      description = "New account (less than 30 days old)";
    } else if (accountAge < 90) {
      description = "Established account (30-90 days old)";
    } else if (accountAge < 365) {
      description = "Mature account (3-12 months old)";
    } else {
      description = "Well-established account (over 1 year old)";
    }

    return {
      type: "ACCOUNT_AGE",
      weight: this.SCORE_WEIGHTS.ACCOUNT_AGE,
      value: score,
      description,
    };
  }

  /**
   * Calculate social media presence factor
   */
  private calculateSocialMediaFactor(socialMedia: any): ScoreFactor {
    let score = 0;
    let description = "No social media verification";

    if (socialMedia && typeof socialMedia === "object") {
      const platforms = socialMedia.platforms || [];
      const accountAge = socialMedia.accountAge || 0;
      const isVerified = socialMedia.verificationStatus || false;

      // Base score for having social media accounts
      if (platforms.length > 0) {
        score += 30;
        description = `${platforms.length} social media platform(s) linked`;
      }

      // Bonus for account age
      if (accountAge > 365) {
        score += 30;
        description += ", established accounts";
      } else if (accountAge > 90) {
        score += 15;
        description += ", moderately aged accounts";
      }

      // Bonus for verification
      if (isVerified) {
        score += 40;
        description += ", verified accounts";
      }
    }

    return {
      type: "SOCIAL_MEDIA",
      weight: this.SCORE_WEIGHTS.SOCIAL_MEDIA,
      value: Math.min(100, score),
      description,
    };
  }

  /**
   * Calculate campaign history factor
   */
  private calculateHistoryFactor(history: any[]): ScoreFactor {
    if (!history || history.length === 0) {
      return {
        type: "HISTORY",
        weight: this.SCORE_WEIGHTS.HISTORY,
        value: 50, // Neutral score for new users
        description: "No previous campaign history",
      };
    }

    let score = 50; // Start with neutral base score
    let successfulCampaigns = 0;
    let totalCampaigns = history.length;

    for (const campaign of history) {
      if (campaign.outcome === "SUCCESS") {
        successfulCampaigns++;
        score += 10; // 10 points per successful campaign
      } else if (campaign.outcome === "DISPUTED") {
        score -= 15; // Penalty for disputed campaigns
      } else if (campaign.outcome === "FAILED") {
        score -= 5; // Small penalty for failed campaigns
      }
    }

    // Calculate success rate bonus/penalty
    const successRate = successfulCampaigns / totalCampaigns;
    if (successRate >= 0.8) {
      score += 15; // Bonus for high success rate
    } else if (successRate < 0.5) {
      score -= 10; // Penalty for low success rate
    }

    // Cap the score at 100 and minimum at 0
    score = Math.min(100, Math.max(0, score));

    const description = `${successfulCampaigns}/${totalCampaigns} successful campaigns (${Math.round(successRate * 100)}% success rate)`;

    return {
      type: "HISTORY",
      weight: this.SCORE_WEIGHTS.HISTORY,
      value: score,
      description,
    };
  }

  /**
   * Calculate confidence based on data completeness
   */
  private calculateConfidence(factors: ScoreFactor[]): number {
    let dataCompleteness = 0;
    let totalFactors = factors.length;

    for (const factor of factors) {
      // Consider a factor "complete" if it has a meaningful value
      if (factor.value > 0) {
        dataCompleteness++;
      }
    }

    // Base confidence on data completeness
    const completenessRatio = dataCompleteness / totalFactors;

    // Minimum confidence of 0.6 if we have at least some data
    return Math.max(this.MIN_CONFIDENCE_THRESHOLD, completenessRatio);
  }

  /**
   * Generate improvement suggestions based on current score
   */
  private async generateImprovementSuggestions(
    credibilityScore: CredibilityScore,
  ): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];

    for (const factor of credibilityScore.factors) {
      if (factor.value < 50) {
        let suggestion: ImprovementSuggestion;

        switch (factor.type) {
          case "GOVERNMENT_ID":
            suggestion = {
              type: "GOVERNMENT_ID",
              description:
                "Complete government ID verification using zero-knowledge proofs to maintain privacy",
              impact: Math.round(factor.weight * 100),
              priority: "HIGH",
            };
            break;

          case "NGO_LICENSE":
            suggestion = {
              type: "NGO_LICENSE",
              description:
                "Verify your NGO license or organizational credentials",
              impact: Math.round(factor.weight * 100),
              priority: "HIGH",
            };
            break;

          case "ACCOUNT_AGE":
            suggestion = {
              type: "ACCOUNT_AGE",
              description:
                "Continue using your wallet to build account history over time",
              impact: Math.round(factor.weight * 50), // Lower impact as this improves naturally
              priority: "LOW",
            };
            break;

          case "SOCIAL_MEDIA":
            suggestion = {
              type: "SOCIAL_MEDIA",
              description:
                "Link and verify your social media accounts to demonstrate authenticity",
              impact: Math.round(factor.weight * 100),
              priority: "MEDIUM",
            };
            break;

          case "HISTORY":
            suggestion = {
              type: "HISTORY",
              description:
                "Successfully complete campaigns to build a positive track record",
              impact: Math.round(factor.weight * 100),
              priority: "MEDIUM",
            };
            break;

          default:
            continue;
        }

        suggestions.push(suggestion);
      }
    }

    // Sort suggestions by priority and impact
    suggestions.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.impact - a.impact;
    });

    return suggestions;
  }

  /**
   * Extract credibility factors from campaign metadata
   */
  private extractFactorsFromMetadata(
    metadata: CampaignMetadata,
  ): CredibilityFactors {
    // Extract ZK proof validations
    const hasGovernmentIdVerification = metadata.zkProofs.some(
      (proof) => proof.type === "GOVERNMENT_ID" && proof.verified,
    );
    const hasNgoLicenseValidation = metadata.zkProofs.some(
      (proof) => proof.type === "NGO_LICENSE" && proof.verified,
    );

    // Calculate account age from creation date
    const accountAge = Math.floor(
      (Date.now() - metadata.creationDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Extract social media data from ZK proofs
    const socialMediaProof = metadata.zkProofs.find(
      (proof) => proof.type === "SOCIAL_MEDIA",
    );
    const socialMediaPresence = socialMediaProof
      ? {
          platforms: ["twitter"], // Simplified for demo
          accountAge: 365, // Simplified for demo
          verificationStatus: socialMediaProof.verified,
        }
      : {
          platforms: [],
          accountAge: 0,
          verificationStatus: false,
        };

    // For demo purposes, we'll use empty arrays for history and basic public metadata
    const previousCampaignHistory: any[] = [];
    const publicMetadata = {
      walletAge: accountAge,
      transactionCount: 0, // Would be fetched from blockchain
      networkReputation: 0, // Would be calculated from on-chain data
    };

    return {
      hasGovernmentIdVerification,
      hasNgoLicenseValidation,
      accountAge,
      previousCampaignHistory,
      socialMediaPresence,
      publicMetadata,
    };
  }

  /**
   * Simulate zero-knowledge proof validation
   * In a real implementation, this would verify cryptographic proofs
   */
  private async simulateZKProofValidation(proof: ZKProof): Promise<boolean> {
    // Simulate validation delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    // For demo purposes, assume proofs are valid if they have a hash
    // In reality, this would involve complex cryptographic verification
    return Boolean(proof.proofHash && proof.proofHash.length > 0);
  }

  /**
   * Generate a demo credibility score for campaigns without cached data
   */
  private async generateDemoCredibilityScore(): Promise<CredibilityScore> {
    const demoFactors: ScoreFactor[] = [
      {
        type: "GOVERNMENT_ID",
        weight: this.SCORE_WEIGHTS.GOVERNMENT_ID,
        value: 85,
        description: "Government ID verified through zero-knowledge proof",
      },
      {
        type: "NGO_LICENSE",
        weight: this.SCORE_WEIGHTS.NGO_LICENSE,
        value: 0,
        description: "NGO license validation not completed",
      },
      {
        type: "ACCOUNT_AGE",
        weight: this.SCORE_WEIGHTS.ACCOUNT_AGE,
        value: 65,
        description: "Established account (8 months old)",
      },
      {
        type: "SOCIAL_MEDIA",
        weight: this.SCORE_WEIGHTS.SOCIAL_MEDIA,
        value: 72,
        description: "Active social media presence with verified accounts",
      },
      {
        type: "HISTORY",
        weight: this.SCORE_WEIGHTS.HISTORY,
        value: 90,
        description: "3/3 successful campaigns (100% success rate)",
      },
    ];

    // Calculate weighted score
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const factor of demoFactors) {
      totalWeightedScore += factor.value * factor.weight;
      totalWeight += factor.weight;
    }

    const finalScore = Math.round(totalWeightedScore / totalWeight);

    return {
      score: finalScore,
      confidence: 0.85,
      factors: demoFactors,
      lastUpdated: new Date(),
    };
  }

  /**
   * Handle and categorize errors
   */
  private handleError(error: any, context: string): AITrustError {
    console.error(`CredibilityEngine Error in ${context}:`, error);

    if (error.message?.includes("cache")) {
      return {
        code: "CACHE_ERROR",
        message: "Failed to access credibility cache",
        category: "DATA",
        retryable: true,
        fallbackAction: "Calculate score without cache",
      };
    }

    if (error.message?.includes("validation")) {
      return {
        code: "VALIDATION_ERROR",
        message: "Failed to validate zero-knowledge proofs",
        category: "ANALYSIS",
        retryable: true,
        fallbackAction: "Use basic scoring without ZK validation",
      };
    }

    return {
      code: "CREDIBILITY_CALCULATION_ERROR",
      message: error.message || "Failed to calculate credibility score",
      category: "ANALYSIS",
      retryable: true,
      fallbackAction: "Use fallback scoring algorithm",
    };
  }
}

// Export singleton instance
export const credibilityEngine = new CredibilityEngine();
