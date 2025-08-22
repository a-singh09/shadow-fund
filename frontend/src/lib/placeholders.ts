// Utility functions for generating placeholder content

/**
 * Generate a placeholder image URL based on campaign data
 */
export function generatePlaceholderImage(
  title: string,
  category: string = "general",
  width: number = 400,
  height: number = 200,
): string {
  // Use a color scheme based on category
  const categoryColors: Record<string, string> = {
    technology: "6366f1,8b5cf6", // Purple gradient
    art: "f59e0b,ef4444", // Orange to red
    social: "ef4444,ec4899", // Red to pink
    education: "3b82f6,06b6d4", // Blue to cyan
    health: "10b981,059669", // Green
    environment: "22c55e,16a34a", // Light green
    privacy: "ef4444,dc2626", // Red theme (default for ShadowFund)
    general: "6b7280,4b5563", // Gray
  };

  const colors =
    categoryColors[category.toLowerCase()] || categoryColors.privacy;

  // Create a deterministic seed from the title
  const seed = title
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Use a placeholder service that generates consistent images
  // Alternative services: picsum.photos, placeholder.com, via.placeholder.com
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(category)}&sig=${seed}`;
}

/**
 * Generate a gradient placeholder as data URL
 */
export function generateGradientPlaceholder(
  title: string,
  category: string = "general",
  width: number = 400,
  height: number = 200,
): string {
  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  // Category-based gradients
  const gradients: Record<string, [string, string]> = {
    technology: ["#6366f1", "#8b5cf6"],
    art: ["#f59e0b", "#ef4444"],
    social: ["#ef4444", "#ec4899"],
    education: ["#3b82f6", "#06b6d4"],
    health: ["#10b981", "#059669"],
    environment: ["#22c55e", "#16a34a"],
    privacy: ["#ef4444", "#dc2626"],
    general: ["#6b7280", "#4b5563"],
  };

  const [color1, color2] =
    gradients[category.toLowerCase()] || gradients.privacy;

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  // Fill background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add title text
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Wrap text if too long
  const maxWidth = width - 40;
  const words = title.split(" ");
  let line = "";
  const lines: string[] = [];

  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && line !== "") {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  // Draw text lines
  const lineHeight = 30;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });

  return canvas.toDataURL();
}

/**
 * Get a fallback image for campaigns
 */
export function getCampaignFallbackImage(
  title: string,
  category: string = "privacy",
): string {
  // For demo purposes, return a generated gradient
  // In production, you might want to use a service or pre-generated images
  try {
    return generateGradientPlaceholder(title, category);
  } catch (error) {
    console.error("Failed to generate placeholder:", error);
    // Fallback to a simple colored rectangle
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="200" fill="url(#grad)" />
        <text x="200" y="100" font-family="Arial" font-size="20" font-weight="bold" 
              text-anchor="middle" dominant-baseline="middle" fill="white" opacity="0.9">
          ${title.length > 30 ? title.substring(0, 30) + "..." : title}
        </text>
      </svg>
    `)}`;
  }
}

/**
 * Check if a URL is a valid image
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(pathname);
  } catch {
    return false;
  }
}

/**
 * Generate avatar placeholder for users
 */
export function generateUserAvatar(address: string, size: number = 40): string {
  // Simple geometric avatar based on address
  const colors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
  ];

  // Use address to determine color and pattern
  const hash = address.slice(2); // Remove 0x
  const colorIndex = parseInt(hash.slice(0, 2), 16) % colors.length;
  const color = colors[colorIndex];

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${color}" />
      <text x="${size / 2}" y="${size / 2}" font-family="Arial" font-size="${size / 3}" font-weight="bold" 
            text-anchor="middle" dominant-baseline="middle" fill="white">
        ${address.slice(2, 4).toUpperCase()}
      </text>
    </svg>
  `)}`;
}
