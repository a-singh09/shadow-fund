import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { credibilityEngine, CredibilityEngine } from "../credibilityEngine";
import {
  CredibilityFactors,
  CampaignMetadata,
  ZKProof,
  ScoreFactor,
  CampaignHistory,
  SocialMediaData,
  PublicMetadata,
} from "../../types/aiTrust";
import { trustDataStorage } from "../trustDataStorage";

// Mock the dependencies
vi.mock("../trustDataStorage", () => ({
  trustDataStorage: {
    getCredibilityScore: vi.fn(),
    storeCredibilityScore: vi.fn(),
    getTrustAnalysis: vi.fn(),
  },
}));

vi.mock("../geminiClient", () => ({
  geminiClient: {
    analyzeText: vi.fn(),
  },
}));

describe("CredibilityEngine", () => {
  let engine: CredibilityEngine;

  beforeEach(() => {
    engine = new CredibilityEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("calculateScore", () => {
    it("should calculate maximum score with all verifications", async () => {
      const factors: CredibilityFactors = {
        hasGovernmentIdVerification: true,
        hasNgoLicenseValidation: true,
        accountAge: 365, // 1 year
        previousCampaignHistory: [
          {
            campaignId: "1",
            outcome: "SUCCESS",
            amountRaised: 1000,
            completionDate: new Date(),
          },
          {
            campaignId: "2",
            outcome: "SUCCESS",
            amountRaised: 2000,
            completionDate: new Date(),
          },
        ] as CampaignHistory[],
        socialMediaPresence: {
          platforms: ["twitter", "facebook"],
          accountAge: 730, // 2 years
          followerCount: 1000,
          verificationStatus: true,
        } as SocialMediaData,
        publicMetadata: {
          walletAge: 365,
          transactionCount: 100,
          networkReputation: 95,
        } as PublicMetadata,
      };

      const result = await engine.calculateScore(factors);

      expect(result.score).toBeGreaterThan(90);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.factors).toHaveLength(5);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it("should calculate minimum score with no verifications", async () => {
      const factors: CredibilityFactors = {
        hasGovernmentIdVerification: false,
        hasNgoLicenseValidation: false,
        accountAge: 1, // 1 day
        previousCampaignHistory: [],
        socialMediaPresence: {
          platforms: [],
          accountAge: 0,
          verificationStatus: false,
        } as SocialMediaData,
        publicMetadata: {
          walletAge: 1,
          transactionCount: 0,
          networkReputation: 0,
        } as PublicMetadata,
      };

      const result = await engine.calculateScore(factors);

      expect(result.score).toBeLessThan(25); // Adjusted expectation - mostly neutral history score
      expect(result.confidence).toBeGreaterThanOrEqual(0.6); // Minimum confidence
      expect(result.factors).toHaveLength(5);
    });

    it("should handle partial verifications correctly", async () => {
      const factors: CredibilityFactors = {
        hasGovernmentIdVerification: true, // Has this
        hasNgoLicenseValidation: false, // Missing this
        accountAge: 90, // 3 months
        previousCampaignHistory: [
          {
            campaignId: "1",
            outcome: "SUCCESS",
            amountRaised: 500,
            completionDate: new Date(),
          },
        ] as CampaignHistory[],
        socialMediaPresence: {
          platforms: ["twitter"],
          accountAge: 365,
          verificationStatus: false, // Not verified
        } as SocialMediaData,
        publicMetadata: {
          walletAge: 90,
          transactionCount: 20,
          networkReputation: 70,
        } as PublicMetadata,
      };

      const result = await engine.calculateScore(factors);

      expect(result.score).toBeGreaterThan(40);
      expect(result.score).toBeLessThan(80);
      expect(
        result.factors.find((f) => f.type === "GOVERNMENT_ID")?.value,
      ).toBe(100);
      expect(result.factors.find((f) => f.type === "NGO_LICENSE")?.value).toBe(
        0,
      );
    });

    it("should penalize disputed campaigns in history", async () => {
      const factorsWithDisputes: CredibilityFactors = {
        hasGovernmentIdVerification: false, // Reduced to avoid hitting 100% cap
        hasNgoLicenseValidation: false,
        accountAge: 180, // 6 months
        previousCampaignHistory: [
          {
            campaignId: "1",
            outcome: "SUCCESS",
            amountRaised: 1000,
            completionDate: new Date(),
          },
          {
            campaignId: "2",
            outcome: "DISPUTED",
            amountRaised: 500,
            completionDate: new Date(),
          },
        ] as CampaignHistory[],
        socialMediaPresence: {
          platforms: ["twitter"],
          accountAge: 365,
          verificationStatus: false,
        } as SocialMediaData,
        publicMetadata: {
          walletAge: 180,
          transactionCount: 50,
          networkReputation: 80,
        } as PublicMetadata,
      };

      const factorsWithoutDisputes: CredibilityFactors = {
        ...factorsWithDisputes,
        previousCampaignHistory: [
          {
            campaignId: "1",
            outcome: "SUCCESS",
            amountRaised: 1000,
            completionDate: new Date(),
          },
          {
            campaignId: "2",
            outcome: "SUCCESS",
            amountRaised: 500,
            completionDate: new Date(),
          },
        ] as CampaignHistory[],
      };

      const resultWithDisputes =
        await engine.calculateScore(factorsWithDisputes);
      const resultWithoutDisputes = await engine.calculateScore(
        factorsWithoutDisputes,
      );

      expect(resultWithDisputes.score).toBeLessThan(
        resultWithoutDisputes.score,
      );
    });

    it("should calculate account age factor correctly", async () => {
      const testCases = [
        { age: 1, expectedRange: [0, 10] },
        { age: 30, expectedRange: [5, 15] },
        { age: 90, expectedRange: [20, 30] },
        { age: 180, expectedRange: [45, 55] },
        { age: 365, expectedRange: [95, 100] },
        { age: 730, expectedRange: [95, 100] }, // Should cap at 365 days
      ];

      for (const testCase of testCases) {
        const factors: CredibilityFactors = {
          hasGovernmentIdVerification: false,
          hasNgoLicenseValidation: false,
          accountAge: testCase.age,
          previousCampaignHistory: [],
          socialMediaPresence: {
            platforms: [],
            accountAge: 0,
            verificationStatus: false,
          } as SocialMediaData,
          publicMetadata: {
            walletAge: testCase.age,
            transactionCount: 0,
            networkReputation: 0,
          } as PublicMetadata,
        };

        const result = await engine.calculateScore(factors);
        const accountAgeFactor = result.factors.find(
          (f) => f.type === "ACCOUNT_AGE",
        );

        expect(accountAgeFactor?.value).toBeGreaterThanOrEqual(
          testCase.expectedRange[0],
        );
        expect(accountAgeFactor?.value).toBeLessThanOrEqual(
          testCase.expectedRange[1],
        );
      }
    });

    it("should handle social media verification correctly", async () => {
      const factors: CredibilityFactors = {
        hasGovernmentIdVerification: false,
        hasNgoLicenseValidation: false,
        accountAge: 30,
        previousCampaignHistory: [],
        socialMediaPresence: {
          platforms: ["twitter", "facebook", "instagram"],
          accountAge: 730, // 2 years
          followerCount: 5000,
          verificationStatus: true,
        } as SocialMediaData,
        publicMetadata: {
          walletAge: 30,
          transactionCount: 5,
          networkReputation: 50,
        } as PublicMetadata,
      };

      const result = await engine.calculateScore(factors);
      const socialMediaFactor = result.factors.find(
        (f) => f.type === "SOCIAL_MEDIA",
      );

      expect(socialMediaFactor?.value).toBeGreaterThan(80); // Should be high with verification
      expect(socialMediaFactor?.description).toContain("verified accounts");
    });
  });

  describe("getScoreBreakdown", () => {
    it("should return score breakdown from cached analysis", async () => {
      const mockAnalysis = {
        campaignId: "test-campaign",
        credibilityScore: {
          score: 85,
          confidence: 0.9,
          factors: [
            {
              type: "GOVERNMENT_ID" as const,
              weight: 0.25,
              value: 100,
              description: "Government ID verified",
            },
            {
              type: "NGO_LICENSE" as const,
              weight: 0.2,
              value: 0,
              description: "NGO license not verified",
            },
          ] as ScoreFactor[],
          lastUpdated: new Date(),
        },
        duplicationCheck: {} as any,
        visualVerification: {} as any,
        overallTrustLevel: "HIGH" as const,
        analysisTimestamp: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      vi.mocked(trustDataStorage.getTrustAnalysis).mockResolvedValue(
        mockAnalysis,
      );

      const result = await engine.getScoreBreakdown("test-campaign");

      expect(result.totalScore).toBe(85);
      expect(result.factors).toHaveLength(2);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it("should throw error when no cached analysis exists", async () => {
      vi.mocked(trustDataStorage.getTrustAnalysis).mockResolvedValue(null);

      await expect(
        engine.getScoreBreakdown("nonexistent-campaign"),
      ).rejects.toThrow("No credibility analysis found for campaign");
    });
  });

  describe("getSuggestions", () => {
    it("should provide high-priority suggestions for low scores", async () => {
      const suggestions = await engine.getSuggestions(40);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.priority === "HIGH")).toBe(true);
      expect(suggestions.some((s) => s.type === "GOVERNMENT_ID")).toBe(true);
      expect(suggestions.some((s) => s.type === "NGO_LICENSE")).toBe(true);
    });

    it("should provide fewer suggestions for high scores", async () => {
      const lowScoreSuggestions = await engine.getSuggestions(40);
      const highScoreSuggestions = await engine.getSuggestions(85);

      expect(highScoreSuggestions.length).toBeLessThan(
        lowScoreSuggestions.length,
      );
    });

    it("should sort suggestions by priority and impact", async () => {
      const suggestions = await engine.getSuggestions(50);

      for (let i = 0; i < suggestions.length - 1; i++) {
        const current = suggestions[i];
        const next = suggestions[i + 1];

        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const currentPriority = priorityOrder[current.priority];
        const nextPriority = priorityOrder[next.priority];

        if (currentPriority === nextPriority) {
          expect(current.impact).toBeGreaterThanOrEqual(next.impact);
        } else {
          expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
        }
      }
    });
  });

  describe("calculateFromMetadata", () => {
    it("should return cached score if available", async () => {
      const mockScore = {
        score: 75,
        confidence: 0.8,
        factors: [],
        lastUpdated: new Date(),
      };

      vi.mocked(trustDataStorage.getCredibilityScore).mockResolvedValue(
        mockScore,
      );

      const metadata: CampaignMetadata = {
        title: "Test Campaign",
        description: "Test description",
        category: "education",
        creatorAddress: "0x123",
        creationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        zkProofs: [],
        publicVerifications: [],
      };

      const result = await engine.calculateFromMetadata(metadata);

      expect(result).toEqual(mockScore);
      expect(trustDataStorage.getCredibilityScore).toHaveBeenCalledWith(
        "0x123",
      );
    });

    it("should calculate and cache new score if not cached", async () => {
      vi.mocked(trustDataStorage.getCredibilityScore).mockResolvedValue(null);
      vi.mocked(trustDataStorage.storeCredibilityScore).mockResolvedValue();

      const zkProofs: ZKProof[] = [
        {
          type: "GOVERNMENT_ID",
          verified: true,
          timestamp: new Date(),
          proofHash: "0xabcd1234",
        },
        {
          type: "SOCIAL_MEDIA",
          verified: true,
          timestamp: new Date(),
          proofHash: "0xefgh5678",
        },
      ];

      const metadata: CampaignMetadata = {
        title: "Test Campaign",
        description: "Test description",
        category: "education",
        creatorAddress: "0x123",
        creationDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
        zkProofs,
        publicVerifications: [],
      };

      const result = await engine.calculateFromMetadata(metadata);

      expect(result.score).toBeGreaterThan(0);
      expect(result.factors).toHaveLength(5);
      expect(trustDataStorage.storeCredibilityScore).toHaveBeenCalledWith(
        "0x123",
        result,
      );
    });
  });

  describe("validateZKProofs", () => {
    it("should validate all provided ZK proofs", async () => {
      const zkProofs: ZKProof[] = [
        {
          type: "GOVERNMENT_ID",
          verified: true,
          timestamp: new Date(),
          proofHash: "0xvalid1234",
        },
        {
          type: "NGO_LICENSE",
          verified: true,
          timestamp: new Date(),
          proofHash: "0xvalid5678",
        },
        {
          type: "SOCIAL_MEDIA",
          verified: false,
          timestamp: new Date(),
          proofHash: "", // Empty hash should be invalid
        },
      ];

      const result = await engine.validateZKProofs(zkProofs);

      expect(result.GOVERNMENT_ID).toBe(true);
      expect(result.NGO_LICENSE).toBe(true);
      expect(result.SOCIAL_MEDIA).toBe(false);
    });

    it("should handle empty proof array", async () => {
      const result = await engine.validateZKProofs([]);
      expect(result).toEqual({});
    });
  });

  describe("error handling", () => {
    it("should handle cache errors gracefully", async () => {
      vi.mocked(trustDataStorage.getCredibilityScore).mockRejectedValue(
        new Error("Cache connection failed"),
      );

      const metadata: CampaignMetadata = {
        title: "Test Campaign",
        description: "Test description",
        category: "education",
        creatorAddress: "0x123",
        creationDate: new Date(),
        zkProofs: [],
        publicVerifications: [],
      };

      await expect(
        engine.calculateFromMetadata(metadata),
      ).rejects.toMatchObject({
        code: "CREDIBILITY_CALCULATION_ERROR",
        category: "ANALYSIS",
        retryable: true,
      });
    });

    it("should handle validation errors", async () => {
      const factors: CredibilityFactors = {
        hasGovernmentIdVerification: true,
        hasNgoLicenseValidation: true,
        accountAge: 365,
        previousCampaignHistory: [],
        socialMediaPresence: null as any, // Invalid data
        publicMetadata: {} as any, // Invalid data
      };

      // Should not throw, but handle gracefully
      const result = await engine.calculateScore(factors);
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe("score boundaries", () => {
    it("should ensure score is always between 0 and 100", async () => {
      // Test with extreme values that might cause overflow
      const extremeFactors: CredibilityFactors = {
        hasGovernmentIdVerification: true,
        hasNgoLicenseValidation: true,
        accountAge: 10000, // Very high value
        previousCampaignHistory: Array(100).fill({
          campaignId: "test",
          outcome: "SUCCESS",
          amountRaised: 10000,
          completionDate: new Date(),
        }) as CampaignHistory[],
        socialMediaPresence: {
          platforms: Array(50).fill("platform"),
          accountAge: 10000,
          followerCount: 1000000,
          verificationStatus: true,
        } as SocialMediaData,
        publicMetadata: {
          walletAge: 10000,
          transactionCount: 100000,
          networkReputation: 100,
        } as PublicMetadata,
      };

      const result = await engine.calculateScore(extremeFactors);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});
