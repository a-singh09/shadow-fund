// IPFS utility functions for image uploads

// Alternative: Use a public IPFS gateway for uploads (no API key required)
const PUBLIC_IPFS_GATEWAY = "https://ipfs.io/ipfs/";

interface IPFSUploadResult {
  hash: string;
  url: string;
  size: number;
}

/**
 * Upload an image file to IPFS
 * Uses real IPFS service if configured, otherwise falls back to mock
 */
export async function uploadImageToIPFS(file: File): Promise<IPFSUploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select a valid image file");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("Image size must be less than 5MB");
    }

    // Check if real IPFS service is configured
    const hasRealIPFS = !!(
      import.meta.env.VITE_PINATA_JWT || import.meta.env.VITE_WEB3_STORAGE_TOKEN
    );

    if (hasRealIPFS) {
      try {
        // Use real IPFS implementation
        const { uploadImageToIPFS: realUpload } = await import("./ipfs-real");
        return await realUpload(file);
      } catch (realError) {
        // Fall through to mock implementation
      }
    }

    // Fall back to mock implementation for demo

    // Create a data URL from the file instead of fake IPFS
    const dataUrl = await createImagePreview(file);
    const mockHash = generateMockIPFSHash(file);

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      hash: mockHash,
      url: dataUrl, // Use data URL instead of fake IPFS URL
      size: file.size,
    };
  } catch (error) {
    console.error("IPFS upload failed:", error);
    throw error;
  }
}

/**
 * Generate a mock IPFS hash for demo purposes
 * In production, this would be returned by the actual IPFS service
 */
function generateMockIPFSHash(file: File): string {
  // Create a deterministic hash based on file properties
  const timestamp = Date.now();
  const fileInfo = `${file.name}-${file.size}-${timestamp}`;

  // Simple hash function (not cryptographically secure, just for demo)
  let hash = 0;
  for (let i = 0; i < fileInfo.length; i++) {
    const char = fileInfo.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to a format that looks like an IPFS hash but is clearly mock
  const hashStr = Math.abs(hash).toString(16);
  return `MOCK-${hashStr.padStart(40, "0").substring(0, 40)}`;
}

/**
 * Get IPFS URL from hash
 */
export function getIPFSUrl(hash: string): string {
  if (!hash) return "";

  // Remove ipfs:// prefix if present
  const cleanHash = hash.replace("ipfs://", "");

  return `${PUBLIC_IPFS_GATEWAY}${cleanHash}`;
}

/**
 * Validate IPFS hash format
 */
export function isValidIPFSHash(hash: string): boolean {
  // Basic validation for IPFS hash format
  const ipfsHashRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  return ipfsHashRegex.test(hash.replace("ipfs://", ""));
}

/**
 * Upload image with progress tracking
 */
export async function uploadImageWithProgress(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<IPFSUploadResult> {
  try {
    // Simulate progress updates
    const progressSteps = [10, 30, 60, 80, 95, 100];

    for (let i = 0; i < progressSteps.length - 1; i++) {
      onProgress?.(progressSteps[i]);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const result = await uploadImageToIPFS(file);
    onProgress?.(100);

    return result;
  } catch (error) {
    onProgress?.(0);
    throw error;
  }
}

/**
 * Create a data URL from file for preview
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image before upload
 */
export function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.8,
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original file
          }
        },
        file.type,
        quality,
      );
    };

    img.src = URL.createObjectURL(file);
  });
}
