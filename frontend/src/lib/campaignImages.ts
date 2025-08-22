// Client-side campaign image management using localStorage
// Since we can't modify the deployed smart contracts, we store image hashes locally

interface CampaignImageData {
  imageHash: string;
  timestamp: number;
}

/**
 * Store campaign image hash in localStorage
 */
export function storeCampaignImage(
  campaignAddress: string,
  imageHash: string,
): void {
  if (!campaignAddress || !imageHash) return;

  const data: CampaignImageData = {
    imageHash,
    timestamp: Date.now(),
  };

  localStorage.setItem(
    `campaign_image_${campaignAddress}`,
    JSON.stringify(data),
  );
}

/**
 * Retrieve campaign image hash from localStorage
 */
export function getCampaignImage(campaignAddress: string): string | null {
  if (!campaignAddress) return null;

  try {
    const stored = localStorage.getItem(`campaign_image_${campaignAddress}`);
    if (!stored) return null;

    const data: CampaignImageData = JSON.parse(stored);
    return data.imageHash;
  } catch (error) {
    console.error("Failed to retrieve campaign image:", error);
    return null;
  }
}

/**
 * Remove campaign image from localStorage
 */
export function removeCampaignImage(campaignAddress: string): void {
  if (!campaignAddress) return;
  localStorage.removeItem(`campaign_image_${campaignAddress}`);
}

/**
 * Get all stored campaign images
 */
export function getAllCampaignImages(): Record<string, string> {
  const images: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("campaign_image_")) {
      const campaignAddress = key.replace("campaign_image_", "");
      const imageHash = getCampaignImage(campaignAddress);
      if (imageHash) {
        images[campaignAddress] = imageHash;
      }
    }
  }

  return images;
}

/**
 * Clean up old campaign images (older than 30 days)
 */
export function cleanupOldCampaignImages(): void {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith("campaign_image_")) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data: CampaignImageData = JSON.parse(stored);
          if (data.timestamp < thirtyDaysAgo) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Remove corrupted entries
        localStorage.removeItem(key);
      }
    }
  }
}
/**
 * Move temporary image storage to permanent campaign address
 */
export function moveTemporaryImage(
  tempKey: string,
  campaignAddress: string,
): boolean {
  try {
    const tempData = localStorage.getItem(`temp_${tempKey}`);
    if (tempData) {
      const data: CampaignImageData = JSON.parse(tempData);
      storeCampaignImage(campaignAddress, data.imageHash);
      localStorage.removeItem(`temp_${tempKey}`);
      return true;
    }
  } catch (error) {
    console.error("Failed to move temporary image:", error);
  }
  return false;
}
