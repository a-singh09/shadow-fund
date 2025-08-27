import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NarrativeEngine, Campaign } from "../narrativeEngine";
import { geminiClient } from "../geminiClient";
import { CampaignContent } from "../../types/aiTrust";

// Mock the geminiClient
vi.mock("../geminiClient", () => ({
  geminiClient: {
    compareTexts: vi.fn(),
    translateText: vi.fn(),
  },
}));

describe("NarrativeEngine", () => {
  let narrativeEngine: NarrativeEngine;
  const mockGeminiClient = vi.mocked(geminiClient);

  beforeEach(() => {
    narrativeEngine = new NarrativeEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("preprocessText", () => {
    it("should normalize text correctly with default options", () => {
      const input = "  Hello World! This is a TEST.  ";
      const result = narrativeEngine.preprocessText(input);

      expect(result.normalized).toBe("hello world this is a test");
      expect(result.tokens).toEqual(["hello", "world", "test"]);
      expect(result.fingerprint).toBeDefined();
      expect(result.original).toBe(input);
    });

    it("should preserve case when caseSensitive is true", () => {
      const input = "Hello World";
      const result = narrativeEngine.preprocessText(input, {
        caseSensitive: true,
      });

      expect(result.normalized).toBe("Hello World");
      expect(result.tokens).toEqual(["Hello", "World"]);
    });

    it("should keep stop words when removeStopWords is false", () => {
      const input = "The quick brown fox";
      const result = narrativeEngine.preprocessText(input, {
        removeStopWords: false,
      });

      expect(result.tokens).toEqual(["the", "quick", "brown", "fox"]);
    });

    it("should filter tokens by minimum length", () => {
      const input = "a big elephant runs";
      const result = narrativeEngine.preprocessText(input, {
        minTokenLength: 3,
      });

      expect(result.tokens).toEqual(["big", "elephant", "runs"]);
    });

    it("should generate consistent fingerprints for similar content", () => {
      const text1 = "Help build school";
      const text2 = "Help build school";

      const result1 = narrativeEngine.preprocessText(text1);
      const result2 = narrativeEngine.preprocessText(text2);

      expect(result1.fingerprint).toBe(result2.fingerprint);
    });
  });

  describe("translateAndAnalyze", () => {
    it("should translate text successfully", async () => {
      const mockTranslation = {
        translatedText: "Hello World",
        detectedLanguage: "Spanish",
        confidence: 0.9,
      };

      mockGeminiClient.translateText.mockResolvedValue(mockTranslation);

      const result = await narrativeEngine.translateAndAnalyze(
        "Hola Mundo",
        "English",
      );

      expect(result).toEqual({
        translatedText: "Hello World",
        originalLanguage: "Spanish",
        confidence: 0.9,
      });

      expect(mockGeminiClient.translateText).toHaveBeenCalledWith(
        "Hola Mundo",
        "English",
      );
    });

    it("should handle translation errors", async () => {
      mockGeminiClient.translateText.mockRejectedValue(
        new Error("Translation failed"),
      );

      await expect(
        narrativeEngine.translateAndAnalyze("Test text", "French"),
      ).rejects.toThrow();
    });
  });

  describe("compareWithExisting", () => {
    const mockCampaigns: Campaign[] = [
      {
        id: "campaign-1",
        title: "Help Build School",
        description: "We need funds to build a school",
        category: "Education",
        language: "English",
        createdAt: new Date("2024-01-01"),
        creatorAddress: "0x123",
      },
      {
        id: "campaign-2",
        title: "Medical Equipment Needed",
        description: "Our clinic needs new equipment",
        category: "Healthcare",
        language: "English",
        createdAt: new Date("2024-01-02"),
        creatorAddress: "0x456",
      },
    ];

    const newContent: CampaignContent = {
      title: "School Construction Project",
      description: "We need funding to construct a new school building",
      category: "Education",
      language: "English",
    };

    beforeEach(() => {
      // Mock language detection (via translateText)
      mockGeminiClient.translateText.mockResolvedValue({
        translatedText: "Same text",
        detectedLanguage: "English",
        confidence: 0.9,
      });
    });

    it("should find high similarity matches", async () => {
      mockGeminiClient.compareTexts.mockResolvedValue({
        similarity: 0.85,
        confidence: 0.9,
        matchedSegments: [
          { text: "school", startIndex: 0, endIndex: 6, similarity: 0.9 },
        ],
        analysis: "High similarity detected",
      });

      const matches = await narrativeEngine.compareWithExisting(
        newContent,
        mockCampaigns,
      );

      expect(matches).toHaveLength(2);
      expect(matches[0].similarity).toBe(0.85);
      expect(matches[0].campaignId).toBe("campaign-1");
      expect(mockGeminiClient.compareTexts).toHaveBeenCalledTimes(2);
    });

    it("should filter out low confidence matches", async () => {
      mockGeminiClient.compareTexts.mockResolvedValue({
        similarity: 0.5,
        confidence: 0.3, // Below threshold
        matchedSegments: [],
        analysis: "Low confidence match",
      });

      const matches = await narrativeEngine.compareWithExisting(
        newContent,
        mockCampaigns,
      );

      expect(matches).toHaveLength(0);
    });

    it("should handle translation for different languages", async () => {
      const spanishCampaigns: Campaign[] = [
        {
          id: "campaign-es",
          title: "Ayuda para Escuela",
          description: "Necesitamos fondos para construir escuela",
          category: "Education",
          language: "Spanish",
          createdAt: new Date("2024-01-01"),
          creatorAddress: "0x789",
        },
      ];

      // Mock language detection returning different languages
      mockGeminiClient.translateText
        .mockResolvedValueOnce({
          translatedText: "Same text",
          detectedLanguage: "English",
          confidence: 0.9,
        })
        .mockResolvedValueOnce({
          translatedText: "Same text",
          detectedLanguage: "Spanish",
          confidence: 0.9,
        })
        // Mock translations to English
        .mockResolvedValueOnce({
          translatedText:
            "School Construction Project We need funding to construct a new school building Category: Education",
          detectedLanguage: "English",
          confidence: 0.9,
        })
        .mockResolvedValueOnce({
          translatedText:
            "Help for School We need funds to build school Category: Education",
          detectedLanguage: "Spanish",
          confidence: 0.9,
        });

      mockGeminiClient.compareTexts.mockResolvedValue({
        similarity: 0.8,
        confidence: 0.85,
        matchedSegments: [],
        analysis: "Cross-language match",
      });

      const matches = await narrativeEngine.compareWithExisting(
        newContent,
        spanishCampaigns,
      );

      expect(matches).toHaveLength(1);
      expect(matches[0].originalLanguage).toBe("Spanish");
      expect(matches[0].detectedLanguage).toBe("English");

      // Should call translateText 4 times: 2 for language detection, 2 for translation
      expect(mockGeminiClient.translateText).toHaveBeenCalledTimes(4);
    });

    it("should sort matches by similarity score", async () => {
      mockGeminiClient.compareTexts
        .mockResolvedValueOnce({
          similarity: 0.7,
          confidence: 0.8,
          matchedSegments: [],
          analysis: "Medium similarity",
        })
        .mockResolvedValueOnce({
          similarity: 0.9,
          confidence: 0.9,
          matchedSegments: [],
          analysis: "High similarity",
        });

      const matches = await narrativeEngine.compareWithExisting(
        newContent,
        mockCampaigns,
      );

      expect(matches).toHaveLength(2);
      expect(matches[0].similarity).toBe(0.9); // Higher similarity first
      expect(matches[1].similarity).toBe(0.7);
    });
  });

  describe("checkForDuplicates", () => {
    const testContent: CampaignContent = {
      title: "Test Campaign",
      description: "This is a test campaign description",
      category: "Education",
      language: "English",
    };

    it("should return no duplicates when no existing campaigns", async () => {
      // Mock empty campaigns list
      vi.spyOn(
        narrativeEngine as any,
        "getExistingCampaigns",
      ).mockResolvedValue([]);

      const result = await narrativeEngine.checkForDuplicates(testContent);

      expect(result.isDuplicate).toBe(false);
      expect(result.confidence).toBe(1.0);
      expect(result.matches).toHaveLength(0);
      expect(result.suggestedActions).toHaveLength(0);
    });

    it("should detect duplicates above threshold", async () => {
      const mockCampaigns: Campaign[] = [
        {
          id: "similar-campaign",
          title: "Test Campaign Copy",
          description: "This is a test campaign description with minor changes",
          category: "Education",
          language: "English",
          createdAt: new Date(),
          creatorAddress: "0x123",
        },
      ];

      vi.spyOn(
        narrativeEngine as any,
        "getExistingCampaigns",
      ).mockResolvedValue(mockCampaigns);

      // Mock language detection
      mockGeminiClient.translateText.mockResolvedValue({
        translatedText: "Same text",
        detectedLanguage: "English",
        confidence: 0.9,
      });

      // Mock high similarity comparison
      mockGeminiClient.compareTexts.mockResolvedValue({
        similarity: 0.85, // Above 0.8 threshold
        confidence: 0.9,
        matchedSegments: [
          {
            text: "test campaign",
            startIndex: 0,
            endIndex: 13,
            similarity: 0.9,
          },
        ],
        analysis: "High similarity detected",
      });

      const result = await narrativeEngine.checkForDuplicates(testContent);

      expect(result.isDuplicate).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].similarity).toBe(0.85);
      expect(result.suggestedActions.length).toBeGreaterThan(0);
    });

    it("should not flag campaigns below similarity threshold", async () => {
      const mockCampaigns: Campaign[] = [
        {
          id: "different-campaign",
          title: "Completely Different Campaign",
          description: "This campaign is about something entirely different",
          category: "Healthcare",
          language: "English",
          createdAt: new Date(),
          creatorAddress: "0x456",
        },
      ];

      vi.spyOn(
        narrativeEngine as any,
        "getExistingCampaigns",
      ).mockResolvedValue(mockCampaigns);

      // Mock language detection
      mockGeminiClient.translateText.mockResolvedValue({
        translatedText: "Same text",
        detectedLanguage: "English",
        confidence: 0.9,
      });

      // Mock low similarity comparison
      mockGeminiClient.compareTexts.mockResolvedValue({
        similarity: 0.3, // Below 0.8 threshold
        confidence: 0.8,
        matchedSegments: [],
        analysis: "Low similarity",
      });

      const result = await narrativeEngine.checkForDuplicates(testContent);

      expect(result.isDuplicate).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it("should handle multiple matches and calculate confidence correctly", async () => {
      const mockCampaigns: Campaign[] = [
        {
          id: "campaign-1",
          title: "Similar Campaign 1",
          description: "Similar description",
          category: "Education",
          language: "English",
          createdAt: new Date(),
          creatorAddress: "0x111",
        },
        {
          id: "campaign-2",
          title: "Similar Campaign 2",
          description: "Another similar description",
          category: "Education",
          language: "English",
          createdAt: new Date(),
          creatorAddress: "0x222",
        },
      ];

      vi.spyOn(
        narrativeEngine as any,
        "getExistingCampaigns",
      ).mockResolvedValue(mockCampaigns);

      // Mock language detection
      mockGeminiClient.translateText.mockResolvedValue({
        translatedText: "Same text",
        detectedLanguage: "English",
        confidence: 0.9,
      });

      // Mock different similarity scores
      mockGeminiClient.compareTexts
        .mockResolvedValueOnce({
          similarity: 0.9,
          confidence: 0.9,
          matchedSegments: [],
          analysis: "High similarity",
        })
        .mockResolvedValueOnce({
          similarity: 0.82,
          confidence: 0.85,
          matchedSegments: [],
          analysis: "Medium-high similarity",
        });

      const result = await narrativeEngine.checkForDuplicates(testContent);

      expect(result.isDuplicate).toBe(true);
      expect(result.matches).toHaveLength(2);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.matches[0].similarity).toBe(0.9); // Should be sorted by similarity
      expect(result.matches[1].similarity).toBe(0.82);
    });
  });

  describe("error handling", () => {
    it("should handle API errors gracefully", async () => {
      const testContent: CampaignContent = {
        title: "Test",
        description: "Test description",
        category: "Education",
      };

      vi.spyOn(
        narrativeEngine as any,
        "getExistingCampaigns",
      ).mockRejectedValue(new Error("Database connection failed"));

      await expect(
        narrativeEngine.checkForDuplicates(testContent),
      ).rejects.toThrow();
    });

    it("should handle individual campaign comparison failures", async () => {
      const mockCampaigns: Campaign[] = [
        {
          id: "campaign-1",
          title: "Test Campaign",
          description: "Test description",
          category: "Education",
          language: "English",
          createdAt: new Date(),
          creatorAddress: "0x123",
        },
      ];

      const testContent: CampaignContent = {
        title: "Another Campaign",
        description: "Another description",
        category: "Education",
      };

      vi.spyOn(
        narrativeEngine as any,
        "getExistingCampaigns",
      ).mockResolvedValue(mockCampaigns);

      // Mock language detection failure
      mockGeminiClient.translateText.mockRejectedValue(
        new Error("Translation API failed"),
      );

      const result = await narrativeEngine.compareWithExisting(
        testContent,
        mockCampaigns,
      );

      // Should handle the error and return empty matches
      expect(result).toHaveLength(0);
    });
  });

  describe("suggested actions generation", () => {
    it("should generate appropriate actions for high similarity matches", () => {
      const highSimilarityMatches = [
        {
          campaignId: "test-1",
          similarity: 0.95,
          matchedSegments: [],
          originalLanguage: "English",
          detectedLanguage: "English",
        },
      ];

      const actions = (narrativeEngine as any).generateSuggestedActions(
        highSimilarityMatches,
      );

      expect(actions).toContain(
        "Review campaign for potential duplicate content",
      );
      expect(actions).toContain("Contact administrator for manual review");
    });

    it("should generate different actions for medium similarity matches", () => {
      const mediumSimilarityMatches = [
        {
          campaignId: "test-1",
          similarity: 0.75,
          matchedSegments: [],
          originalLanguage: "English",
          detectedLanguage: "English",
        },
      ];

      const actions = (narrativeEngine as any).generateSuggestedActions(
        mediumSimilarityMatches,
      );

      expect(actions).toContain(
        "Consider revising campaign description to be more unique",
      );
      expect(actions).toContain(
        "Add specific details that differentiate this campaign",
      );
    });

    it("should suggest translation verification for cross-language matches", () => {
      const crossLanguageMatches = [
        {
          campaignId: "test-1",
          similarity: 0.8,
          matchedSegments: [],
          originalLanguage: "Spanish",
          detectedLanguage: "English",
        },
      ];

      const actions = (narrativeEngine as any).generateSuggestedActions(
        crossLanguageMatches,
      );

      expect(actions).toContain(
        "Verify translation accuracy for cross-language matches",
      );
    });
  });
});
