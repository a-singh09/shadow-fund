import {
  TrustAnalysisResult,
  CredibilityScore,
  DuplicationResult,
  VisualVerificationResult,
  AITrustError,
} from "../types/aiTrust";

/**
 * Database schema and storage interface for trust analysis results
 * Uses IndexedDB for persistent client-side storage
 */

export interface TrustDataSchema {
  trustAnalysis: {
    key: string; // campaignId
    value: TrustAnalysisResult;
    indexes: {
      creatorAddress: string;
      trustLevel: string;
      analysisTimestamp: Date;
      expiresAt: Date;
    };
  };
  credibilityCache: {
    key: string; // creatorAddress
    value: CredibilityScore;
    indexes: {
      score: number;
      lastUpdated: Date;
    };
  };
  duplicationCache: {
    key: string; // contentHash
    value: DuplicationResult;
    indexes: {
      isDuplicate: boolean;
      confidence: number;
      lastChecked: Date;
    };
  };
  visualCache: {
    key: string; // mediaHash
    value: VisualVerificationResult;
    indexes: {
      hasIssues: boolean;
      overallScore: number;
      lastVerified: Date;
    };
  };
  analysisMetrics: {
    key: string; // date string (YYYY-MM-DD)
    value: AnalysisMetrics;
    indexes: {
      date: Date;
    };
  };
}

export interface AnalysisMetrics {
  date: string;
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  averageProcessingTime: number;
  trustLevelDistribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    FLAGGED: number;
  };
  errorsByCategory: Record<string, number>;
}

export class TrustDataStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = "ShadowFlowTrustDB";
  private readonly dbVersion = 1;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initializeDB();
  }

  /**
   * Initialize IndexedDB database with schema
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        reject(new Error("Failed to initialize trust data storage"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("Trust data storage initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Trust Analysis store
        if (!db.objectStoreNames.contains("trustAnalysis")) {
          const trustStore = db.createObjectStore("trustAnalysis", {
            keyPath: "campaignId",
          });
          trustStore.createIndex(
            "creatorAddress",
            "credibilityScore.creatorAddress",
            { unique: false },
          );
          trustStore.createIndex("trustLevel", "overallTrustLevel", {
            unique: false,
          });
          trustStore.createIndex("analysisTimestamp", "analysisTimestamp", {
            unique: false,
          });
          trustStore.createIndex("expiresAt", "expiresAt", { unique: false });
        }

        // Credibility Cache store
        if (!db.objectStoreNames.contains("credibilityCache")) {
          const credibilityStore = db.createObjectStore("credibilityCache", {
            keyPath: "creatorAddress",
          });
          credibilityStore.createIndex("score", "score", { unique: false });
          credibilityStore.createIndex("lastUpdated", "lastUpdated", {
            unique: false,
          });
        }

        // Duplication Cache store
        if (!db.objectStoreNames.contains("duplicationCache")) {
          const duplicationStore = db.createObjectStore("duplicationCache", {
            keyPath: "contentHash",
          });
          duplicationStore.createIndex("isDuplicate", "isDuplicate", {
            unique: false,
          });
          duplicationStore.createIndex("confidence", "confidence", {
            unique: false,
          });
          duplicationStore.createIndex("lastChecked", "lastChecked", {
            unique: false,
          });
        }

        // Visual Cache store
        if (!db.objectStoreNames.contains("visualCache")) {
          const visualStore = db.createObjectStore("visualCache", {
            keyPath: "mediaHash",
          });
          visualStore.createIndex("hasIssues", "hasIssues", { unique: false });
          visualStore.createIndex("overallScore", "overallScore", {
            unique: false,
          });
          visualStore.createIndex("lastVerified", "lastVerified", {
            unique: false,
          });
        }

        // Analysis Metrics store
        if (!db.objectStoreNames.contains("analysisMetrics")) {
          const metricsStore = db.createObjectStore("analysisMetrics", {
            keyPath: "date",
          });
          metricsStore.createIndex("date", "date", { unique: true });
        }
      };
    });
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error("Database not initialized");
    }
  }

  /**
   * Store trust analysis result
   */
  async storeTrustAnalysis(result: TrustAnalysisResult): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["trustAnalysis"], "readwrite");
      const store = transaction.objectStore("trustAnalysis");

      const request = store.put(result);

      request.onsuccess = () => {
        this.recordAnalysisMetric(result);
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to store trust analysis: ${request.error}`));
      };
    });
  }

  /**
   * Retrieve trust analysis result
   */
  async getTrustAnalysis(
    campaignId: string,
  ): Promise<TrustAnalysisResult | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["trustAnalysis"], "readonly");
      const store = transaction.objectStore("trustAnalysis");

      const request = store.get(campaignId);

      request.onsuccess = () => {
        const result = request.result;

        // Check if result is expired
        if (result && new Date(result.expiresAt) > new Date()) {
          resolve(result);
        } else {
          if (result) {
            // Clean up expired result
            this.deleteTrustAnalysis(campaignId);
          }
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(
          new Error(`Failed to retrieve trust analysis: ${request.error}`),
        );
      };
    });
  }

  /**
   * Delete trust analysis result
   */
  async deleteTrustAnalysis(campaignId: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["trustAnalysis"], "readwrite");
      const store = transaction.objectStore("trustAnalysis");

      const request = store.delete(campaignId);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(new Error(`Failed to delete trust analysis: ${request.error}`));
      };
    });
  }

  /**
   * Store credibility score in cache
   */
  async storeCredibilityScore(
    creatorAddress: string,
    score: CredibilityScore,
  ): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["credibilityCache"],
        "readwrite",
      );
      const store = transaction.objectStore("credibilityCache");

      const cacheEntry = {
        creatorAddress,
        ...score,
      };

      const request = store.put(cacheEntry);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(
          new Error(`Failed to store credibility score: ${request.error}`),
        );
      };
    });
  }

  /**
   * Retrieve credibility score from cache
   */
  async getCredibilityScore(
    creatorAddress: string,
  ): Promise<CredibilityScore | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["credibilityCache"],
        "readonly",
      );
      const store = transaction.objectStore("credibilityCache");

      const request = store.get(creatorAddress);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache is still valid (24 hours)
          const cacheAge = Date.now() - new Date(result.lastUpdated).getTime();
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (cacheAge < maxAge) {
            const { creatorAddress: _, ...score } = result;
            resolve(score as CredibilityScore);
          } else {
            // Clean up expired cache
            this.deleteCredibilityScore(creatorAddress);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(
          new Error(`Failed to retrieve credibility score: ${request.error}`),
        );
      };
    });
  }

  /**
   * Delete credibility score from cache
   */
  async deleteCredibilityScore(creatorAddress: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["credibilityCache"],
        "readwrite",
      );
      const store = transaction.objectStore("credibilityCache");

      const request = store.delete(creatorAddress);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(
          new Error(`Failed to delete credibility score: ${request.error}`),
        );
      };
    });
  }

  /**
   * Clean up expired entries from all stores
   */
  async cleanupExpiredEntries(): Promise<void> {
    await this.ensureInitialized();

    const now = new Date();

    // Clean up expired trust analyses
    await this.cleanupStore("trustAnalysis", "expiresAt", now);

    // Clean up old credibility scores (older than 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await this.cleanupStore("credibilityCache", "lastUpdated", weekAgo);

    // Clean up old duplication cache (older than 30 days)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    await this.cleanupStore("duplicationCache", "lastChecked", monthAgo);

    // Clean up old visual cache (older than 30 days)
    await this.cleanupStore("visualCache", "lastVerified", monthAgo);
  }

  /**
   * Generic cleanup method for stores with date-based expiry
   */
  private async cleanupStore(
    storeName: string,
    dateIndex: string,
    cutoffDate: Date,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const index = store.index(dateIndex);

      const range = IDBKeyRange.upperBound(cutoffDate);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to cleanup ${storeName}: ${request.error}`));
      };
    });
  }

  /**
   * Record analysis metrics for monitoring
   */
  private async recordAnalysisMetric(
    result: TrustAnalysisResult,
  ): Promise<void> {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    try {
      const transaction = this.db!.transaction(
        ["analysisMetrics"],
        "readwrite",
      );
      const store = transaction.objectStore("analysisMetrics");

      // Get existing metrics for today
      const getRequest = store.get(today);

      getRequest.onsuccess = () => {
        const existing = getRequest.result || {
          date: today,
          totalAnalyses: 0,
          successfulAnalyses: 0,
          failedAnalyses: 0,
          averageProcessingTime: 0,
          trustLevelDistribution: { HIGH: 0, MEDIUM: 0, LOW: 0, FLAGGED: 0 },
          errorsByCategory: {},
        };

        // Update metrics
        existing.totalAnalyses++;
        existing.successfulAnalyses++;
        existing.trustLevelDistribution[result.overallTrustLevel]++;

        // Store updated metrics
        store.put(existing);
      };
    } catch (error) {
      console.warn("Failed to record analysis metrics:", error);
    }
  }

  /**
   * Get analysis metrics for a date range
   */
  async getAnalysisMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<AnalysisMetrics[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["analysisMetrics"], "readonly");
      const store = transaction.objectStore("analysisMetrics");
      const index = store.index("date");

      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(
          new Error(`Failed to retrieve analysis metrics: ${request.error}`),
        );
      };
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    trustAnalyses: number;
    credibilityScores: number;
    duplicationCache: number;
    visualCache: number;
    totalSize: number;
  }> {
    await this.ensureInitialized();

    const stats = {
      trustAnalyses: 0,
      credibilityScores: 0,
      duplicationCache: 0,
      visualCache: 0,
      totalSize: 0,
    };

    // Count entries in each store
    const stores = [
      "trustAnalysis",
      "credibilityCache",
      "duplicationCache",
      "visualCache",
    ];

    for (const storeName of stores) {
      const count = await this.countStoreEntries(storeName);
      switch (storeName) {
        case "trustAnalysis":
          stats.trustAnalyses = count;
          break;
        case "credibilityCache":
          stats.credibilityScores = count;
          break;
        case "duplicationCache":
          stats.duplicationCache = count;
          break;
        case "visualCache":
          stats.visualCache = count;
          break;
      }
    }

    stats.totalSize =
      stats.trustAnalyses +
      stats.credibilityScores +
      stats.duplicationCache +
      stats.visualCache;

    return stats;
  }

  /**
   * Count entries in a store
   */
  private async countStoreEntries(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn(`Failed to count entries in ${storeName}:`, request.error);
        resolve(0);
      };
    });
  }

  /**
   * Clear all data (useful for testing or reset)
   */
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();

    const stores = [
      "trustAnalysis",
      "credibilityCache",
      "duplicationCache",
      "visualCache",
      "analysisMetrics",
    ];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(stores, "readwrite");

      let completed = 0;
      const total = stores.length;

      stores.forEach((storeName) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        request.onerror = () => {
          reject(new Error(`Failed to clear ${storeName}: ${request.error}`));
        };
      });
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const trustDataStorage = new TrustDataStorage();
