import { geminiClient } from "./geminiClient";
import {
  DuplicationResult,
  SimilarityMatch,
  TranslationAnalysis,
  CampaignContent,
  TextSegment,
  AITrustError,
} from "../types/aiTrust";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  language?: string;
  createdAt: Date;
  creatorAddress: string;
}

export interface NormalizedText {
  original: string;
  normalized: string;
  language: string;
  tokens: string[];
  fingerprint: string;
}

export interface TextPreprocessingOptions {
  removeStopWords?: boolean;
  stemming?: boolean;
  caseSensitive?: boolean;
  minTokenLength?: number;
}

/**
 * NarrativeEngine handles semantic text analysis and duplicate detection
 * using Google's Gemini API for cross-language comparison
 */
export class NarrativeEngine {
  private readonly SIMILARITY_THRESHOLD = 0.8;
  private readonly CONFIDENCE_THRESHOLD = 0.6;
  private readonly MAX_BATCH_SIZE = 10;

  /**
   * Check for duplicate campaigns based on semantic similarity
   */
  async checkForDuplicates(
    content: CampaignContent,
  ): Promise<DuplicationResult> {
    try {
      // Get existing campaigns (this would normally come from a database)
      const existingCampaigns = await this.getExistingCampaigns();

      if (existingCampaigns.length === 0) {
        return {
          isDuplicate: false,
          confidence: 1.0,
          matches: [],
          suggestedActions: [],
        };
      }

      // Compare with existing campaigns
      const matches = await this.compareWithExisting(
        content,
        existingCampaigns,
      );

      // Filter matches above threshold
      const significantMatches = matches.filter(
        (match) => match.similarity >= this.SIMILARITY_THRESHOLD,
      );

      const isDuplicate = significantMatches.length > 0;
      const confidence = this.calculateOverallConfidence(matches);

      return {
        isDuplicate,
        confidence,
        matches: significantMatches,
        suggestedActions: this.generateSuggestedActions(significantMatches),
      };
    } catch (error) {
      console.error("Error in duplicate detection:", error);
      throw this.handleError(error, "DUPLICATE_DETECTION");
    }
  }

  /**
   * Compare new content with existing campaigns
   */
  async compareWithExisting(
    newContent: CampaignContent,
    existingCampaigns: Campaign[],
  ): Promise<SimilarityMatch[]> {
    const matches: SimilarityMatch[] = [];

    // Process campaigns in batches to avoid rate limits
    const batches = this.createBatches(existingCampaigns, this.MAX_BATCH_SIZE);

    for (const batch of batches) {
      const batchMatches = await Promise.all(
        batch.map((campaign) =>
          this.compareSingleCampaign(newContent, campaign),
        ),
      );

      matches.push(
        ...(batchMatches.filter(
          (match) => match !== null,
        ) as SimilarityMatch[]),
      );
    }

    // Sort by similarity score (highest first)
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Compare new content with a single existing campaign
   */
  private async compareSingleCampaign(
    newContent: CampaignContent,
    existingCampaign: Campaign,
  ): Promise<SimilarityMatch | null> {
    try {
      // Normalize and preprocess both texts
      const newText = this.combineContentText(newContent);
      const existingText = this.combineContentText({
        title: existingCampaign.title,
        description: existingCampaign.description,
        category: existingCampaign.category,
        language: existingCampaign.language,
      });

      // Detect languages
      const newLangAnalysis = await this.detectLanguage(newText);
      const existingLangAnalysis = await this.detectLanguage(existingText);

      // Translate to common language if needed
      let translatedNewText = newText;
      let translatedExistingText = existingText;

      if (
        newLangAnalysis.detectedLanguage !==
        existingLangAnalysis.detectedLanguage
      ) {
        // Translate both to English for comparison
        const newTranslation = await this.translateAndAnalyze(
          newText,
          "English",
        );
        const existingTranslation = await this.translateAndAnalyze(
          existingText,
          "English",
        );

        translatedNewText = newTranslation.translatedText;
        translatedExistingText = existingTranslation.translatedText;
      }

      // Perform semantic comparison
      const comparison = await geminiClient.compareTexts(
        translatedNewText,
        translatedExistingText,
      );

      // Only return matches above confidence threshold
      if (comparison.confidence < this.CONFIDENCE_THRESHOLD) {
        return null;
      }

      return {
        campaignId: existingCampaign.id,
        similarity: comparison.similarity,
        matchedSegments: comparison.matchedSegments || [],
        originalLanguage: existingLangAnalysis.detectedLanguage,
        detectedLanguage: newLangAnalysis.detectedLanguage,
      };
    } catch (error) {
      console.error(
        `Error comparing with campaign ${existingCampaign.id}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Translate text and analyze for semantic similarity
   */
  async translateAndAnalyze(
    content: string,
    targetLanguage: string,
  ): Promise<TranslationAnalysis> {
    try {
      const translation = await geminiClient.translateText(
        content,
        targetLanguage,
      );

      return {
        translatedText: translation.translatedText,
        originalLanguage: translation.detectedLanguage,
        confidence: translation.confidence,
      };
    } catch (error) {
      throw this.handleError(error, "TRANSLATION_ANALYSIS");
    }
  }

  /**
   * Preprocess and normalize text for comparison
   */
  preprocessText(
    text: string,
    options: TextPreprocessingOptions = {},
  ): NormalizedText {
    const {
      removeStopWords = true,
      caseSensitive = false,
      minTokenLength = 2,
    } = options;

    // Basic normalization
    let normalized = text.trim();
    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }

    // Remove extra whitespace and special characters
    normalized = normalized.replace(/\s+/g, " ");
    normalized = normalized.replace(/[^\w\s]/g, " ");

    // Remove extra spaces again after character replacement
    normalized = normalized.replace(/\s+/g, " ").trim();

    // Tokenize
    let tokens = normalized
      .split(/\s+/)
      .filter((token) => token.length >= minTokenLength);

    // Remove stop words (basic English stop words)
    if (removeStopWords) {
      const stopWords = new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "may",
        "might",
        "can",
        "this",
        "that",
        "these",
        "those",
      ]);

      tokens = tokens.filter((token) => !stopWords.has(token));
    }

    // Generate fingerprint (simple hash of sorted unique tokens)
    const uniqueTokens = [...new Set(tokens)].sort();
    const fingerprint = this.generateFingerprint(uniqueTokens.join(" "));

    return {
      original: text,
      normalized,
      language: "unknown", // Will be detected separately
      tokens,
      fingerprint,
    };
  }

  /**
   * Detect language of text content
   */
  private async detectLanguage(
    text: string,
  ): Promise<{ detectedLanguage: string; confidence: number }> {
    try {
      // Use a simple translation request to detect language
      const result = await geminiClient.translateText(text, "English");
      return {
        detectedLanguage: result.detectedLanguage,
        confidence: result.confidence,
      };
    } catch (error) {
      console.warn("Language detection failed:", error);
      return {
        detectedLanguage: "unknown",
        confidence: 0.1,
      };
    }
  }

  /**
   * Combine campaign content into single text for analysis
   */
  private combineContentText(content: CampaignContent): string {
    return `${content.title}\n\n${content.description}\n\nCategory: ${content.category}`;
  }

  /**
   * Generate text fingerprint for quick similarity checks
   */
  private generateFingerprint(text: string): string {
    // Simple hash function for fingerprinting
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Create batches for processing campaigns
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Calculate overall confidence from multiple matches
   */
  private calculateOverallConfidence(matches: SimilarityMatch[]): number {
    if (matches.length === 0) return 1.0;

    // Use the highest confidence match as the overall confidence
    const maxSimilarity = Math.max(...matches.map((m) => m.similarity));

    // Adjust confidence based on number of matches
    const matchCountFactor = Math.min(matches.length / 3, 1.0);

    return Math.min(maxSimilarity * (0.7 + 0.3 * matchCountFactor), 1.0);
  }

  /**
   * Generate suggested actions based on matches
   */
  private generateSuggestedActions(matches: SimilarityMatch[]): string[] {
    const actions: string[] = [];

    if (matches.length === 0) {
      return actions;
    }

    const highSimilarityMatches = matches.filter((m) => m.similarity > 0.9);
    const mediumSimilarityMatches = matches.filter(
      (m) => m.similarity > 0.7 && m.similarity <= 0.9,
    );

    if (highSimilarityMatches.length > 0) {
      actions.push("Review campaign for potential duplicate content");
      actions.push("Contact administrator for manual review");
    }

    if (mediumSimilarityMatches.length > 0) {
      actions.push("Consider revising campaign description to be more unique");
      actions.push("Add specific details that differentiate this campaign");
    }

    if (matches.some((m) => m.originalLanguage !== m.detectedLanguage)) {
      actions.push("Verify translation accuracy for cross-language matches");
    }

    return actions;
  }

  /**
   * Get existing campaigns (mock implementation - would connect to database)
   */
  private async getExistingCampaigns(): Promise<Campaign[]> {
    // Mock data for testing - in real implementation, this would query the database
    return [
      {
        id: "campaign-1",
        title: "Help Build School in Rural Village",
        description:
          "We need funds to construct a new school building for children in our remote village. The current facility is overcrowded and lacks basic amenities.",
        category: "Education",
        language: "English",
        createdAt: new Date("2024-01-15"),
        creatorAddress: "0x1234567890abcdef",
      },
      {
        id: "campaign-2",
        title: "Ayuda para Construir Escuela en Pueblo Rural",
        description:
          "Necesitamos fondos para construir un nuevo edificio escolar para niños en nuestro pueblo remoto. La instalación actual está sobrepoblada y carece de servicios básicos.",
        category: "Education",
        language: "Spanish",
        createdAt: new Date("2024-01-20"),
        creatorAddress: "0xabcdef1234567890",
      },
      {
        id: "campaign-3",
        title: "Medical Equipment for Local Clinic",
        description:
          "Our community clinic urgently needs new medical equipment to serve patients better. We're raising funds for essential diagnostic tools.",
        category: "Healthcare",
        language: "English",
        createdAt: new Date("2024-02-01"),
        creatorAddress: "0x9876543210fedcba",
      },
    ];
  }

  /**
   * Handle and categorize errors
   */
  private handleError(error: any, context: string): AITrustError {
    console.error(`NarrativeEngine Error in ${context}:`, error);

    if (error.code && error.category) {
      // Already an AITrustError
      return error;
    }

    return {
      code: "NARRATIVE_ANALYSIS_ERROR",
      message: error?.message || "Unknown error in narrative analysis",
      category: "ANALYSIS",
      retryable: true,
      fallbackAction: "Try with simplified text analysis",
    };
  }
}

// Export singleton instance
export const narrativeEngine = new NarrativeEngine();
