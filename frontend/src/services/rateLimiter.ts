import {
  RateLimitConfig,
  QueuedRequest,
  RequestMetrics,
  AITrustError,
} from "../types/aiTrust";

export class RateLimiter {
  private config: RateLimitConfig;
  private requestQueue: QueuedRequest[] = [];
  private requestHistory: Date[] = [];
  private metrics: RequestMetrics;
  private isProcessing = false;
  private readonly maxQueueSize = 100;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 10,
      ...config,
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: new Date(),
    };
  }

  /**
   * Add a request to the queue with rate limiting
   */
  async queueRequest<T>(
    request: () => Promise<T>,
    priority: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM",
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check queue size limit
      if (this.requestQueue.length >= this.maxQueueSize) {
        reject(this.createError("QUEUE_FULL", "Request queue is full"));
        return;
      }

      const queuedRequest: QueuedRequest = {
        id: this.generateRequestId(),
        timestamp: new Date(),
        priority,
        request,
        resolve,
        reject,
      };

      // Insert request based on priority
      this.insertByPriority(queuedRequest);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      // Check if we can make a request
      if (!this.canMakeRequest()) {
        const delay = this.getDelayUntilNextRequest();
        await this.sleep(delay);
        continue;
      }

      const queuedRequest = this.requestQueue.shift()!;
      await this.executeRequest(queuedRequest);
    }

    this.isProcessing = false;
  }

  /**
   * Execute a single request with metrics tracking
   */
  private async executeRequest(queuedRequest: QueuedRequest): Promise<void> {
    const startTime = Date.now();

    try {
      // Record request attempt
      this.recordRequest();

      // Execute the request
      const result = await queuedRequest.request();

      // Record success
      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      queuedRequest.resolve(result);
    } catch (error) {
      // Record failure
      this.recordFailure();

      // Check if request should be retried
      if (this.shouldRetry(error, queuedRequest)) {
        // Re-queue with lower priority
        queuedRequest.priority = "LOW";
        this.insertByPriority(queuedRequest);
      } else {
        queuedRequest.reject(error);
      }
    }
  }

  /**
   * Check if we can make a request based on rate limits
   */
  private canMakeRequest(): boolean {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Clean old requests from history
    this.requestHistory = this.requestHistory.filter(
      (date) => date > oneDayAgo,
    );

    // Count requests in different time windows
    const requestsLastMinute = this.requestHistory.filter(
      (date) => date > oneMinuteAgo,
    ).length;
    const requestsLastHour = this.requestHistory.filter(
      (date) => date > oneHourAgo,
    ).length;
    const requestsLastDay = this.requestHistory.length;

    // Check against limits
    return (
      requestsLastMinute < this.config.requestsPerMinute &&
      requestsLastHour < this.config.requestsPerHour &&
      requestsLastDay < this.config.requestsPerDay
    );
  }

  /**
   * Calculate delay until next request can be made
   */
  private getDelayUntilNextRequest(): number {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const recentRequests = this.requestHistory.filter(
      (date) => date > oneMinuteAgo,
    );

    if (recentRequests.length >= this.config.requestsPerMinute) {
      // Wait until the oldest request in the minute window expires
      const oldestRequest = recentRequests[0];
      const waitTime = 60 * 1000 - (now.getTime() - oldestRequest.getTime());
      return Math.max(waitTime, 1000); // Minimum 1 second delay
    }

    return 1000; // Default 1 second delay
  }

  /**
   * Insert request into queue based on priority
   */
  private insertByPriority(request: QueuedRequest): void {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

    let insertIndex = this.requestQueue.length;
    for (let i = 0; i < this.requestQueue.length; i++) {
      if (
        priorityOrder[request.priority] <
        priorityOrder[this.requestQueue[i].priority]
      ) {
        insertIndex = i;
        break;
      }
    }

    this.requestQueue.splice(insertIndex, 0, request);
  }

  /**
   * Record a request attempt
   */
  private recordRequest(): void {
    const now = new Date();
    this.requestHistory.push(now);
    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = now;
  }

  /**
   * Record a successful request
   */
  private recordSuccess(responseTime: number): void {
    this.metrics.successfulRequests++;

    // Update average response time
    const totalResponseTime =
      this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1);
    this.metrics.averageResponseTime =
      (totalResponseTime + responseTime) / this.metrics.successfulRequests;
  }

  /**
   * Record a failed request
   */
  private recordFailure(): void {
    this.metrics.failedRequests++;
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: any, queuedRequest: QueuedRequest): boolean {
    // Don't retry if request is too old (5 minutes)
    const maxAge = 5 * 60 * 1000;
    if (Date.now() - queuedRequest.timestamp.getTime() > maxAge) {
      return false;
    }

    // Check if error is retryable
    if (error?.retryable === false) {
      return false;
    }

    // Retry rate limit errors
    if (error?.code === "RATE_LIMIT_EXCEEDED") {
      return true;
    }

    // Retry network errors
    if (error?.code === "NETWORK_ERROR") {
      return true;
    }

    return false;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create standardized error
   */
  private createError(code: string, message: string): AITrustError {
    return {
      code,
      message,
      category: "API",
      retryable: false,
    };
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current metrics
   */
  getMetrics(): RequestMetrics {
    return { ...this.metrics };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    canMakeRequest: boolean;
    nextRequestDelay: number;
  } {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      canMakeRequest: this.canMakeRequest(),
      nextRequestDelay: this.canMakeRequest()
        ? 0
        : this.getDelayUntilNextRequest(),
    };
  }

  /**
   * Clear the queue (useful for testing or emergency stops)
   */
  clearQueue(): void {
    this.requestQueue.forEach((request) => {
      request.reject(
        this.createError("QUEUE_CLEARED", "Request queue was cleared"),
      );
    });
    this.requestQueue = [];
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
