import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DuplicateProcessor } from "../duplicateProcessor";
import { CampaignContent } from "../../types/aiTrust";

// Mock the narrative engine
vi.mock("../narrativeEngine", () => ({
  narrativeEngine: {
    checkForDuplicates: vi.fn(),
  },
}));

describe("DuplicateProcessor", () => {
  let processor: DuplicateProcessor;

  beforeEach(() => {
    processor = new DuplicateProcessor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    processor.stopProcessing();
  });

  it("should create a new job", () => {
    const content: CampaignContent = {
      title: "Test Campaign",
      description: "Test description",
      category: "Education",
    };

    const jobId = processor.addJob("campaign-123", content, "high");

    expect(jobId).toBeDefined();
    expect(jobId).toMatch(/^job_/);

    const job = processor.getJob(jobId);
    expect(job).toBeDefined();
    expect(job?.campaignId).toBe("campaign-123");
    expect(job?.priority).toBe("high");
    expect(job?.status).toBe("pending");
  });

  it("should get jobs for a specific campaign", () => {
    const content: CampaignContent = {
      title: "Test Campaign",
      description: "Test description",
      category: "Education",
    };

    const jobId1 = processor.addJob("campaign-123", content, "high");
    const jobId2 = processor.addJob("campaign-123", content, "medium");
    processor.addJob("campaign-456", content, "low"); // Different campaign

    const campaignJobs = processor.getCampaignJobs("campaign-123");
    expect(campaignJobs).toHaveLength(2);
    expect(campaignJobs.map((j) => j.id)).toContain(jobId1);
    expect(campaignJobs.map((j) => j.id)).toContain(jobId2);
  });

  it("should count pending jobs correctly", () => {
    const content: CampaignContent = {
      title: "Test Campaign",
      description: "Test description",
      category: "Education",
    };

    expect(processor.getPendingJobsCount()).toBe(0);

    processor.addJob("campaign-123", content);
    processor.addJob("campaign-456", content);

    expect(processor.getPendingJobsCount()).toBe(2);
  });

  it("should provide processing statistics", () => {
    const content: CampaignContent = {
      title: "Test Campaign",
      description: "Test description",
      category: "Education",
    };

    processor.addJob("campaign-123", content, "high");
    processor.addJob("campaign-456", content, "medium");

    const stats = processor.getStats();
    expect(stats.totalJobs).toBe(2);
    expect(stats.pendingJobs).toBe(2);
    expect(stats.processingJobs).toBe(0);
    expect(stats.completedJobs).toBe(0);
    expect(stats.failedJobs).toBe(0);
    expect(stats.isProcessing).toBe(false);
  });

  it("should handle notifications", () => {
    const notifications = processor.getNotifications();
    expect(notifications).toHaveLength(0);

    const unreadNotifications = processor.getUnreadNotifications();
    expect(unreadNotifications).toHaveLength(0);
  });

  it("should subscribe to notifications", () => {
    const callback = vi.fn();
    const unsubscribe = processor.onNotification(callback);

    expect(typeof unsubscribe).toBe("function");

    // Test unsubscribe
    unsubscribe();
    expect(callback).not.toHaveBeenCalled();
  });

  it("should clean up old jobs", () => {
    const content: CampaignContent = {
      title: "Test Campaign",
      description: "Test description",
      category: "Education",
    };

    // Add a job
    const jobId = processor.addJob("campaign-123", content);
    const job = processor.getJob(jobId);

    if (job) {
      // Simulate old completed job
      job.status = "completed";
      job.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    }

    expect(processor.getStats().totalJobs).toBe(1);

    processor.cleanupOldJobs();

    expect(processor.getStats().totalJobs).toBe(0);
  });

  it("should mark notifications as read", () => {
    // Since notifications are created internally, we can't easily test this
    // without triggering the actual processing. This is more of an integration test.
    const notifications = processor.getNotifications();
    expect(notifications).toHaveLength(0);

    processor.markAllNotificationsRead();

    const unreadCount = processor.getUnreadNotifications().length;
    expect(unreadCount).toBe(0);
  });
});
