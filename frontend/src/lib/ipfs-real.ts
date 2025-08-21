// Real IPFS implementation using Pinata service
import { toast } from "@/hooks/use-toast";

// Pinata configuration
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY_DOMAIN = import.meta.env.VITE_PINATA_GATEWAY; // e.g., "fun-llama-300.mypinata.cloud"

// IPFS gateways
const PINATA_GATEWAY = PINATA_GATEWAY_DOMAIN
  ? `https://${PINATA_GATEWAY_DOMAIN}/ipfs/`
  : "https://gateway.pinata.cloud/ipfs/";
const PUBLIC_IPFS_GATEWAY = "https://ipfs.io/ipfs/";

interface IPFSUploadResult {
  hash: string;
  url: string;
  size: number;
  pinataUrl?: string;
}

/**
 * Upload file to IPFS using Pinata service
 */
export async function uploadToIPFSPinata(
  file: File,
): Promise<IPFSUploadResult> {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured");
  }

  try {
    // Validate file
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select a valid image file");
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("Image size must be less than 5MB");
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("file", file);

    // Add metadata
    const metadata = JSON.stringify({
      name: `shadowflow-campaign-${Date.now()}`,
      keyvalues: {
        uploadedBy: "shadowflow-app",
        timestamp: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size.toString(),
      },
    });
    formData.append("pinataMetadata", metadata);

    // Upload options
    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    // Make request to Pinata
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.details || `Upload failed: ${response.statusText}`,
      );
    }

    const result = await response.json();

    return {
      hash: result.IpfsHash,
      url: `${PUBLIC_IPFS_GATEWAY}${result.IpfsHash}`,
      pinataUrl: `${PINATA_GATEWAY}${result.IpfsHash}`,
      size: file.size,
    };
  } catch (error) {
    console.error("Pinata upload failed:", error);
    throw error;
  }
}

/**
 * Upload file to IPFS using Web3.Storage (alternative)
 */
export async function uploadToIPFSWeb3Storage(
  file: File,
): Promise<IPFSUploadResult> {
  const WEB3_STORAGE_TOKEN = process.env.VITE_WEB3_STORAGE_TOKEN;

  if (!WEB3_STORAGE_TOKEN) {
    throw new Error("Web3.Storage token not configured");
  }

  try {
    // Validate file
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select a valid image file");
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("Image size must be less than 5MB");
    }

    // Create form data
    const formData = new FormData();
    formData.append("file", file);

    // Upload to Web3.Storage
    const response = await fetch("https://api.web3.storage/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WEB3_STORAGE_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      hash: result.cid,
      url: `${PUBLIC_IPFS_GATEWAY}${result.cid}`,
      size: file.size,
    };
  } catch (error) {
    console.error("Web3.Storage upload failed:", error);
    throw error;
  }
}

/**
 * Upload using browser-based IPFS (requires IPFS node)
 */
export async function uploadToIPFSBrowser(
  file: File,
): Promise<IPFSUploadResult> {
  try {
    // This requires the user to have IPFS running locally or use a browser extension
    // @ts-ignore - IPFS might be injected by browser extension
    if (typeof window.ipfs === "undefined") {
      throw new Error(
        "IPFS not available in browser. Please install IPFS Companion extension.",
      );
    }

    // @ts-ignore
    const ipfs = window.ipfs;

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Add to IPFS
    const result = await ipfs.add(buffer);

    return {
      hash: result.path,
      url: `${PUBLIC_IPFS_GATEWAY}${result.path}`,
      size: file.size,
    };
  } catch (error) {
    console.error("Browser IPFS upload failed:", error);
    throw error;
  }
}

/**
 * Main upload function that tries different methods
 */
export async function uploadImageToIPFS(file: File): Promise<IPFSUploadResult> {
  const errors: string[] = [];

  // Try Pinata first (most reliable)
  if (PINATA_JWT) {
    try {
      return await uploadToIPFSPinata(file);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Pinata: ${errorMsg}`);
    }
  }

  // Try Web3.Storage as fallback
  if (process.env.VITE_WEB3_STORAGE_TOKEN) {
    try {
      return await uploadToIPFSWeb3Storage(file);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Web3.Storage: ${errorMsg}`);
    }
  }

  // Don't try browser IPFS automatically - it's unreliable and requires extension
  // If all configured methods fail, throw error with details
  throw new Error(
    `All configured IPFS upload methods failed:\n${errors.join("\n")}`,
  );
}

/**
 * Get IPFS URL from hash with multiple gateway options
 */
export function getIPFSUrl(
  hash: string,
  preferredGateway: "pinata" | "ipfs" | "cloudflare" = "ipfs",
): string {
  if (!hash) return "";

  // Remove ipfs:// prefix if present
  const cleanHash = hash.replace("ipfs://", "");

  const gateways = {
    pinata: `https://gateway.pinata.cloud/ipfs/${cleanHash}`,
    ipfs: `https://ipfs.io/ipfs/${cleanHash}`,
    cloudflare: `https://cloudflare-ipfs.com/ipfs/${cleanHash}`,
  };

  return gateways[preferredGateway];
}

/**
 * Test IPFS connectivity
 */
export async function testIPFSConnection(): Promise<boolean> {
  try {
    // Test with a known IPFS hash (IPFS logo)
    const testHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const response = await fetch(`${PUBLIC_IPFS_GATEWAY}${testHash}`, {
      method: "HEAD",
      timeout: 5000,
    } as any);

    return response.ok;
  } catch (error) {
    console.error("IPFS connectivity test failed:", error);
    return false;
  }
}
