import { useState, useEffect, useCallback } from "react";
import {
  CredibilityScore,
  ScoreBreakdown,
  ImprovementSuggestion,
  CampaignMetadata,
  TrustLevel,
  AITrustError,
} from "@/types/aiTrust";
import { credibilityEngine } from "@/services/credibilityEngine";
import { getTrustLevel } from "@/components/ai-trust/CredibilityBreakdown";

interface UseCredibilityScoreOptions {
  campaignId?: string;
  metadata?: CampaignMetadata;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseCredibilityScoreReturn {
  score: CredibilityScore | null;
  breakdown: ScoreBreakdown | null;
  suggestions: ImprovementSuggestion[];
  trustLevel: TrustLevel;
  isLoading: boolean;
  error: AITrustError | null;
  refresh: () => Promise<void>;
  calculateScore: (metadata: CampaignMetadata) => Promise<void>;
  getSuggestions: (currentScore: number) => Promise<void>;
}

export const useCredibilityScore = (
  options: UseCredibilityScoreOptions = {},
): UseCredibilityScoreReturn => {
  const {
    campaignId,
    metadata,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [score, setScore] = useState<CredibilityScore | null>(null);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AITrustError | null>(null);

  // Calculate trust level from score
  const trustLevel: TrustLevel = score ? getTrustLevel(score.score) : "FLAGGED";

  // Calculate credibility score from metadata
  const calculateScore = useCallback(
    async (campaignMetadata: CampaignMetadata) => {
      setIsLoading(true);
      setError(null);

      try {
        const credibilityScore =
          await credibilityEngine.calculateFromMetadata(campaignMetadata);
        setScore(credibilityScore);

        // Also get suggestions for the score
        const scoreSuggestions = await credibilityEngine.getSuggestions(
          credibilityScore.score,
        );
        setSuggestions(scoreSuggestions);
      } catch (err) {
        const aiError = err as AITrustError;
        setError(aiError);
        console.error("Failed to calculate credibility score:", aiError);
      } finally {
        setIsLoading(false);
      }
    },
    [], // Empty dependency array is correct here
  );

  // Get score breakdown for a campaign
  const getBreakdown = useCallback(async (campaignIdParam: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const scoreBreakdown =
        await credibilityEngine.getScoreBreakdown(campaignIdParam);
      setBreakdown(scoreBreakdown);
    } catch (err) {
      const aiError = err as AITrustError;
      setError(aiError);
      console.error("Failed to get score breakdown:", aiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get improvement suggestions
  const getSuggestions = useCallback(async (currentScore: number) => {
    try {
      const scoreSuggestions =
        await credibilityEngine.getSuggestions(currentScore);
      setSuggestions(scoreSuggestions);
    } catch (err) {
      const aiError = err as AITrustError;
      console.error("Failed to get suggestions:", aiError);
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    if (campaignId) {
      await getBreakdown(campaignId);
    } else if (metadata) {
      await calculateScore(metadata);
    }
  }, [campaignId, getBreakdown, calculateScore]); // Remove metadata from deps to prevent infinite loops

  // Initial load
  useEffect(() => {
    if (campaignId) {
      getBreakdown(campaignId);
    } else if (metadata) {
      calculateScore(metadata);
    }
  }, [campaignId, getBreakdown, calculateScore]); // Remove metadata from deps

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || (!campaignId && !metadata)) {
      return;
    }

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh, campaignId]); // Remove metadata from deps

  // Update suggestions when score changes
  useEffect(() => {
    if (score && suggestions.length === 0) {
      getSuggestions(score.score);
    }
  }, [score?.score, suggestions.length, getSuggestions]); // Use score.score instead of score object

  return {
    score,
    breakdown,
    suggestions,
    trustLevel,
    isLoading,
    error,
    refresh,
    calculateScore,
    getSuggestions,
  };
};

// Helper hook for just getting trust level from score
export const useTrustLevel = (score: number): TrustLevel => {
  return getTrustLevel(score);
};

// Helper hook for real-time score updates
export const useRealTimeCredibilityScore = (
  metadata: CampaignMetadata,
  dependencies: any[] = [],
): UseCredibilityScoreReturn => {
  const credibilityHook = useCredibilityScore({
    metadata,
    autoRefresh: true,
    refreshInterval: 10000, // 10 seconds for real-time updates
  });

  // Recalculate when dependencies change
  useEffect(() => {
    if (metadata) {
      credibilityHook.calculateScore(metadata);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return credibilityHook;
};
