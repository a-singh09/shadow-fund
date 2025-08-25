import {
  AITrustError,
  ErrorResolution,
  FallbackResult,
} from "../types/aiTrust";

export class AITrustErrorHandler {
  private errorCounts = new Map<string, number>();
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 2000, 5000]; // Progressive delays in ms

  /**
   * Handle an error and determine the appropriate resolution
   */
  async handleError(error: AITrustError): Promise<ErrorResolution> {
    console.error("AI Trust Error:", error);

    // Track error frequency
    this.trackError(error.code);

    // Determine if we should retry
    if (this.shouldRetry(error)) {
      const retryCount = this.errorCounts.get(error.code) || 0;
      const delay = this.getRetryDelay(retryCount);

      return {
        action: "RETRY",
        retryAfter: delay,
      };
    }

    // Check if we should use fallback
    if (this.shouldUseFallback(error)) {
      const fallbackResult = await this.getFallbackResult(error.category);
      return {
        action: "FALLBACK",
        fallbackResult,
      };
    }

    // Fail the operation
    return {
      action: "FAIL",
    };
  }

  /**
   * Determine if an error should be retried
   */
  shouldRetry(error: AITrustError): boolean {
    if (!error.retryable) {
      return false;
    }

    const retryCount = this.errorCounts.get(error.code) || 0;
    if (retryCount >= this.maxRetries) {
      return false;
    }

    // Retry specific error types
    const retryableErrors = [
      "RATE_LIMIT_EXCEEDED",
      "NETWORK_ERROR",
      "TIMEOUT_ERROR",
      "TEMPORARY_SERVICE_UNAVAILABLE",
    ];

    return retryableErrors.includes(error.code);
  }

  /**
   * Determine if we should use fallback for an error
   */
  shouldUseFallback(error: AITrustError): boolean {
    // Use fallback for analysis errors to maintain functionality
    const fallbackErrors = [
      "API_UNAVAILABLE",
      "ANALYSIS_FAILED",
      "INVALID_RESPONSE",
      "CONTENT_SAFETY_VIOLATION",
    ];

    return fallbackErrors.includes(error.code) || error.category === "ANALYSIS";
  }

  /**
   * Get fallback result based on error category
   */
  async getFallbackResult(category: string): Promise<FallbackResult> {
    switch (category) {
      case "ANALYSIS":
        return {
          type: "CREDIBILITY_SCORE",
          data: {
            score: 50,
            confidence: 0.1,
            factors: [],
            lastUpdated: new Date(),
            note: "AI analysis unavailable - using default score",
          },
          confidence: 0,
          isFallback: true,
        };

      case "API":
        return {
          type: "SERVICE_UNAVAILABLE",
          data: {
            message: "AI services temporarily unavailable",
            timestamp: new Date(),
            suggestedAction: "Try again later",
          },
          confidence: 0,
          isFallback: true,
        };

      case "DATA":
        return {
          type: "DATA_ERROR",
          data: {
            message: "Unable to process data",
            timestamp: new Date(),
            suggestedAction: "Check data format and try again",
          },
          confidence: 0,
          isFallback: true,
        };

      case "PRIVACY":
        return {
          type: "PRIVACY_VIOLATION",
          data: {
            message: "Analysis blocked to protect privacy",
            timestamp: new Date(),
            suggestedAction: "Review data for sensitive information",
          },
          confidence: 0,
          isFallback: true,
        };

      default:
        return {
          type: "UNKNOWN_ERROR",
          data: {
            message: "Unknown error occurred",
            timestamp: new Date(),
            suggestedAction: "Contact support if problem persists",
          },
          confidence: 0,
          isFallback: true,
        };
    }
  }

  /**
   * Track error occurrence for retry logic
   */
  private trackError(errorCode: string): void {
    const currentCount = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, currentCount + 1);

    // Clean up old error counts after some time
    setTimeout(() => {
      this.errorCounts.delete(errorCode);
    }, 60000); // Reset after 1 minute
  }

  /**
   * Get retry delay based on attempt count
   */
  private getRetryDelay(retryCount: number): number {
    if (retryCount < this.retryDelays.length) {
      return this.retryDelays[retryCount];
    }
    return this.retryDelays[this.retryDelays.length - 1];
  }

  /**
   * Create a standardized error
   */
  createError(
    code: string,
    message: string,
    category: AITrustError["category"],
    retryable = false,
    fallbackAction?: string,
  ): AITrustError {
    return {
      code,
      message,
      category,
      retryable,
      fallbackAction,
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    mostCommonError: string | null;
  } {
    const errorsByCode: Record<string, number> = {};
    let totalErrors = 0;
    let mostCommonError: string | null = null;
    let maxCount = 0;

    for (const [code, count] of this.errorCounts.entries()) {
      errorsByCode[code] = count;
      totalErrors += count;

      if (count > maxCount) {
        maxCount = count;
        mostCommonError = code;
      }
    }

    return {
      totalErrors,
      errorsByCode,
      mostCommonError,
    };
  }

  /**
   * Clear error tracking (useful for testing)
   */
  clearErrorTracking(): void {
    this.errorCounts.clear();
  }
}

// Export singleton instance
export const aiTrustErrorHandler = new AITrustErrorHandler();
