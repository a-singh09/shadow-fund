import { narrativeEngine } from "./narrativeEngine";
import { CampaignContent, DuplicationResult } from "../types/aiTrust";

export interface DuplicateCheckJob {
  id: string;
  campaignId: string;
  content: CampaignContent;
  priority: "high" | "medium" | "low";
  createdAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  result?: DuplicationResult;
  error?: string;
}

export interface DuplicateNotification {
  id: string;
  campaignId: string;
  type: "duplicate_detected" | "check_completed" | "check_failed";
  message: string;
  severity: "high" | "medium" | "low";
  createdAt: Date;
  read: boolean;
  adminId?: string;
}

/**
 * Background service for processing duplicate detection jobs
 */
export class DuplicateProcessor {
  private jobs: Map<string, DuplicateCheckJob> = new Map();
  private notifications: DuplicateNotification[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private notificationCallbacks: ((
    notification: DuplicateNotification,
  ) => void)[] = [];

  constructor() {
    this.startProcessing();
  }

  /**
   * Add a new duplicate check job to the queue
   */
  addJob(
    campaignId: string,
    content: CampaignContent,
    priority: "high" | "medium" | "low" = "medium",
  ): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: DuplicateCheckJob = {
      id: jobId,
      campaignId,
      content,
      priority,
      createdAt: new Date(),
      status: "pending",
    };

    this.jobs.set(jobId, job);
    console.log(
      `Added duplicate check job ${jobId} for campaign ${campaignId}`,
    );

    return jobId;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): DuplicateCheckJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a campaign
   */
  getCampaignJobs(campaignId: string): DuplicateCheckJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.campaignId === campaignId,
    );
  }

  /**
   * Get pending jobs count
   */
  getPendingJobsCount(): number {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === "pending",
    ).length;
  }

  /**
   * Start background processing
   */
  private startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Process jobs every 5 seconds
    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, 5000);
  }

  /**
   * Stop background processing
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Process the next job in the queue
   */
  private async processNextJob() {
    if (this.isProcessing) {
      return; // Already processing a job
    }

    // Get next pending job (prioritize by priority, then by creation time)
    const pendingJobs = Array.from(this.jobs.values())
      .filter((job) => job.status === "pending")
      .sort((a, b) => {
        // Priority order: high > medium > low
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // If same priority, process older jobs first
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    if (pendingJobs.length === 0) {
      return; // No pending jobs
    }

    const job = pendingJobs[0];
    await this.processJob(job);
  }

  /**
   * Process a specific job
   */
  private async processJob(job: DuplicateCheckJob) {
    this.isProcessing = true;
    job.status = "processing";

    console.log(
      `Processing duplicate check job ${job.id} for campaign ${job.campaignId}`,
    );

    try {
      const result = await narrativeEngine.checkForDuplicates(job.content);

      job.result = result;
      job.status = "completed";

      // Create notification if duplicates found
      if (result.isDuplicate && result.confidence > 0.7) {
        this.createNotification({
          campaignId: job.campaignId,
          type: "duplicate_detected",
          message: `High similarity (${Math.round(result.confidence * 100)}%) detected for campaign ${job.campaignId}`,
          severity: result.confidence > 0.9 ? "high" : "medium",
        });
      } else {
        this.createNotification({
          campaignId: job.campaignId,
          type: "check_completed",
          message: `Duplicate check completed for campaign ${job.campaignId} - no issues found`,
          severity: "low",
        });
      }

      console.log(
        `Completed duplicate check job ${job.id} - duplicates: ${result.isDuplicate}`,
      );
    } catch (error) {
      job.error = error instanceof Error ? error.message : "Unknown error";
      job.status = "failed";

      this.createNotification({
        campaignId: job.campaignId,
        type: "check_failed",
        message: `Duplicate check failed for campaign ${job.campaignId}: ${job.error}`,
        severity: "medium",
      });

      console.error(`Failed to process duplicate check job ${job.id}:`, error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Create a notification
   */
  private createNotification(
    data: Omit<DuplicateNotification, "id" | "createdAt" | "read">,
  ) {
    const notification: DuplicateNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      read: false,
      ...data,
    };

    this.notifications.unshift(notification); // Add to beginning

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Notify callbacks
    this.notificationCallbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error("Error in notification callback:", error);
      }
    });
  }

  /**
   * Get all notifications
   */
  getNotifications(): DuplicateNotification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): DuplicateNotification[] {
    return this.notifications.filter((n) => !n.read);
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId: string) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId,
    );
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead() {
    this.notifications.forEach((n) => (n.read = true));
  }

  /**
   * Subscribe to notifications
   */
  onNotification(callback: (notification: DuplicateNotification) => void) {
    this.notificationCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get processing statistics
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter((j) => j.status === "pending").length,
      processingJobs: jobs.filter((j) => j.status === "processing").length,
      completedJobs: jobs.filter((j) => j.status === "completed").length,
      failedJobs: jobs.filter((j) => j.status === "failed").length,
      duplicatesFound: jobs.filter((j) => j.result?.isDuplicate).length,
      unreadNotifications: this.getUnreadNotifications().length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear old completed jobs (older than 24 hours)
   */
  cleanupOldJobs() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === "completed" || job.status === "failed") &&
        job.createdAt < cutoffTime
      ) {
        this.jobs.delete(jobId);
      }
    }
  }

  /**
   * Force process all pending jobs (for testing)
   */
  async processAllPending(): Promise<void> {
    const pendingJobs = Array.from(this.jobs.values()).filter(
      (job) => job.status === "pending",
    );

    for (const job of pendingJobs) {
      await this.processJob(job);
    }
  }
}

// Export singleton instance
export const duplicateProcessor = new DuplicateProcessor();

// Cleanup old jobs every hour
setInterval(
  () => {
    duplicateProcessor.cleanupOldJobs();
  },
  60 * 60 * 1000,
);
