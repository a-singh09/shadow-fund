import React, { useEffect, useRef, useState, useCallback } from "react";

// Types for constellation data
interface Star {
  id: string;
  x: number;
  y: number;
  brightness: number;
  category: ImpactCategory;
  twinkleSpeed: number;
  connectionStrength: number;
  size: number;
  opacity: number;
  animationPhase: number;
}

interface Connection {
  from: string;
  to: string;
  strength: number;
  opacity: number;
  category: ImpactCategory;
}

interface Cluster {
  category: ImpactCategory;
  stars: Star[];
  centerX: number;
  centerY: number;
  connections: Connection[];
  color: string;
  radius: number;
}

interface ImpactCategory {
  id: string;
  name: string;
  color: string;
  impactCount: number;
  description: string;
}

interface ConstellationData {
  totalDonations: number;
  categories: ImpactCategory[];
  timeframe: { start: Date; end: Date };
  demoMode: boolean;
}

interface ImpactConstellationProps {
  data?: ConstellationData;
  width?: number;
  height?: number;
  className?: string;
  onCategoryClick?: (category: ImpactCategory) => void;
}

// Demo data for showcasing the visualization
const DEMO_CATEGORIES: ImpactCategory[] = [
  {
    id: "education",
    name: "Education",
    color: "#3B82F6", // Blue
    impactCount: 2150,
    description: "Supporting schools, scholarships, and learning resources",
  },
  {
    id: "health",
    name: "Healthcare",
    color: "#10B981", // Green
    impactCount: 1890,
    description: "Medical aid, hospitals, and health initiatives",
  },
  {
    id: "climate",
    name: "Climate Action",
    color: "#22C55E", // Emerald
    impactCount: 1670,
    description: "Environmental protection and sustainability projects",
  },
  {
    id: "poverty",
    name: "Poverty Relief",
    color: "#EF4444", // Red
    impactCount: 2100,
    description: "Food security, housing, and basic needs support",
  },
  {
    id: "disaster",
    name: "Disaster Relief",
    color: "#8B5CF6", // Purple
    impactCount: 950,
    description: "Emergency response and recovery assistance",
  },
  {
    id: "technology",
    name: "Technology Access",
    color: "#06B6D4", // Cyan
    impactCount: 1320,
    description: "Digital literacy, internet access, and tech education",
  },
  {
    id: "political",
    name: "Political Freedom",
    color: "#F59E0B", // Amber
    impactCount: 780,
    description: "Democracy support, human rights, and civic engagement",
  },
  {
    id: "arts",
    name: "Arts & Culture",
    color: "#EC4899", // Pink
    impactCount: 650,
    description:
      "Creative expression, cultural preservation, and artistic freedom",
  },
  {
    id: "research",
    name: "Scientific Research",
    color: "#A855F7", // Violet
    impactCount: 1100,
    description: "Medical research, innovation, and scientific advancement",
  },
  {
    id: "community",
    name: "Community Building",
    color: "#F97316", // Orange
    impactCount: 1450,
    description: "Local initiatives, social cohesion, and grassroots movements",
  },
  {
    id: "human-rights",
    name: "Human Rights",
    color: "#DC2626", // Red-600
    impactCount: 890,
    description: "Civil liberties, equality, and justice advocacy",
  },
  {
    id: "mental-health",
    name: "Mental Health",
    color: "#7C3AED", // Violet-600
    impactCount: 1180,
    description: "Mental wellness, therapy access, and psychological support",
  },
];

const DEMO_DATA: ConstellationData = {
  totalDonations: 16130,
  categories: DEMO_CATEGORIES,
  timeframe: {
    start: new Date("2024-01-01"),
    end: new Date("2024-12-31"),
  },
  demoMode: true,
};

const ImpactConstellation: React.FC<ImpactConstellationProps> = ({
  data = DEMO_DATA,
  width = 800,
  height = 600,
  className = "",
  onCategoryClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [stars, setStars] = useState<Star[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [animationPhase, setAnimationPhase] = useState(0); // 0: forming, 1: twinkling, 2: connecting
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // Generate stars based on impact data
  const generateStars = useCallback(
    (
      categories: ImpactCategory[],
      canvasWidth: number,
      canvasHeight: number,
    ): Star[] => {
      const generatedStars: Star[] = [];
      const padding = 60;
      const usableWidth = canvasWidth - padding * 2;
      const usableHeight = canvasHeight - padding * 2;

      // Pre-defined constellation positions to avoid uniformity
      const constellationPositions = [
        { x: 0.15, y: 0.25 }, // Top-left
        { x: 0.4, y: 0.15 }, // Top-center
        { x: 0.75, y: 0.3 }, // Top-right
        { x: 0.2, y: 0.55 }, // Mid-left
        { x: 0.6, y: 0.45 }, // Mid-center
        { x: 0.85, y: 0.6 }, // Mid-right
        { x: 0.1, y: 0.8 }, // Bottom-left
        { x: 0.45, y: 0.75 }, // Bottom-center
        { x: 0.8, y: 0.85 }, // Bottom-right
        { x: 0.35, y: 0.9 }, // Bottom extra
      ];

      categories.forEach((category, categoryIndex) => {
        // Each constellation gets 5-10 stars based on impact
        const baseStarsCount = Math.max(
          5,
          Math.min(10, Math.floor(category.impactCount / 250)),
        );

        // Get constellation center position
        const position =
          constellationPositions[categoryIndex % constellationPositions.length];
        const centerX = padding + position.x * usableWidth;
        const centerY = padding + position.y * usableHeight;

        // Create constellation shapes - different patterns for variety
        const constellationShapes = [
          "cluster", // Tight cluster
          "line", // Linear arrangement
          "triangle", // Triangle shape
          "arc", // Curved arc
          "cross", // Cross/plus shape
          "diamond", // Diamond shape
          "spiral", // Loose spiral
          "scattered", // Organic scatter
        ];

        const shapeType =
          constellationShapes[categoryIndex % constellationShapes.length];

        for (let i = 0; i < baseStarsCount; i++) {
          let x, y;

          // Generate position based on constellation shape
          switch (shapeType) {
            case "cluster":
              // Tight cluster with gaussian distribution
              const clusterRadius = 40 + Math.random() * 30;
              const clusterAngle = Math.random() * 2 * Math.PI;
              const clusterDistance = Math.random() * clusterRadius;
              x = centerX + Math.cos(clusterAngle) * clusterDistance;
              y = centerY + Math.sin(clusterAngle) * clusterDistance;
              break;

            case "line":
              // Linear arrangement with some variation
              const lineLength = 80 + Math.random() * 40;
              const lineAngle = (categoryIndex * 0.7) % (2 * Math.PI); // Different angle per category
              const lineProgress = i / (baseStarsCount - 1);
              const lineVariation = (Math.random() - 0.5) * 20;
              x =
                centerX +
                Math.cos(lineAngle) *
                  (lineProgress * lineLength - lineLength / 2) +
                lineVariation;
              y =
                centerY +
                Math.sin(lineAngle) *
                  (lineProgress * lineLength - lineLength / 2) +
                lineVariation;
              break;

            case "triangle":
              // Triangle formation
              const triangleRadius = 50 + Math.random() * 25;
              const triangleAngle =
                (i / baseStarsCount) * 2 * Math.PI +
                (Math.random() - 0.5) * 0.5;
              const triangleDistance =
                triangleRadius * (0.7 + Math.random() * 0.6);
              x = centerX + Math.cos(triangleAngle) * triangleDistance;
              y = centerY + Math.sin(triangleAngle) * triangleDistance;
              break;

            case "arc":
              // Curved arc
              const arcRadius = 60 + Math.random() * 30;
              const arcSpan = Math.PI * 0.8; // 144 degrees
              const arcStart = (categoryIndex * 0.5) % (2 * Math.PI);
              const arcAngle = arcStart + (i / (baseStarsCount - 1)) * arcSpan;
              const arcVariation = (Math.random() - 0.5) * 15;
              x = centerX + Math.cos(arcAngle) * (arcRadius + arcVariation);
              y = centerY + Math.sin(arcAngle) * (arcRadius + arcVariation);
              break;

            case "cross":
              // Cross/plus shape
              const crossSize = 40 + Math.random() * 20;
              const isVertical = i < baseStarsCount / 2;
              if (isVertical) {
                x = centerX + (Math.random() - 0.5) * 20;
                y = centerY + (Math.random() - 0.5) * crossSize * 2;
              } else {
                x = centerX + (Math.random() - 0.5) * crossSize * 2;
                y = centerY + (Math.random() - 0.5) * 20;
              }
              break;

            case "diamond":
              // Diamond shape
              const diamondSize = 45 + Math.random() * 25;
              const diamondAngle = (i / baseStarsCount) * 2 * Math.PI;
              const diamondRadius = diamondSize * (0.8 + Math.random() * 0.4);
              x =
                centerX +
                Math.cos(diamondAngle) *
                  diamondRadius *
                  Math.abs(Math.cos(diamondAngle));
              y =
                centerY +
                Math.sin(diamondAngle) *
                  diamondRadius *
                  Math.abs(Math.sin(diamondAngle));
              break;

            case "spiral":
              // Loose spiral
              const spiralRadius = 20 + (i / baseStarsCount) * 40;
              const spiralAngle =
                (i / baseStarsCount) * Math.PI * 3 + categoryIndex;
              const spiralVariation = (Math.random() - 0.5) * 15;
              x =
                centerX +
                Math.cos(spiralAngle) * (spiralRadius + spiralVariation);
              y =
                centerY +
                Math.sin(spiralAngle) * (spiralRadius + spiralVariation);
              break;

            default: // 'scattered'
              // Organic scattered pattern
              const scatterRadius = 50 + Math.random() * 35;
              const scatterAngle = Math.random() * 2 * Math.PI;
              const scatterDistance = Math.random() * scatterRadius;
              x = centerX + Math.cos(scatterAngle) * scatterDistance;
              y = centerY + Math.sin(scatterAngle) * scatterDistance;
              break;
          }

          // Ensure stars stay within bounds
          const clampedX = Math.max(
            padding,
            Math.min(canvasWidth - padding, x),
          );
          const clampedY = Math.max(
            padding,
            Math.min(canvasHeight - padding, y),
          );

          // Vary star properties based on category impact and position in constellation
          const categoryMultiplier =
            category.impactCount > 1500
              ? 1.3
              : category.impactCount > 1000
                ? 1.1
                : 1.0;
          const brightnessVariation = i === 0 ? 1.2 : Math.random() * 0.6 + 0.4; // First star is brightest

          const star: Star = {
            id: `${category.id}-${i}`,
            x: clampedX,
            y: clampedY,
            brightness: brightnessVariation,
            category,
            twinkleSpeed: Math.random() * 1.2 + 0.8,
            connectionStrength: Math.random() * 0.6 + 0.3,
            size:
              (Math.random() * 1.5 + 1.5) *
              categoryMultiplier *
              (i === 0 ? 1.3 : 1),
            opacity: 0,
            animationPhase: Math.random() * Math.PI * 2,
          };

          generatedStars.push(star);
        }
      });

      return generatedStars;
    },
    [],
  );

  // Generate clusters from stars
  const generateClusters = useCallback(
    (stars: Star[], categories: ImpactCategory[]): Cluster[] => {
      return categories.map((category) => {
        const categoryStars = stars.filter(
          (star) => star.category.id === category.id,
        );

        if (categoryStars.length === 0) {
          return {
            category,
            stars: [],
            centerX: 0,
            centerY: 0,
            connections: [],
            color: category.color,
            radius: 0,
          };
        }

        // Calculate cluster center
        const centerX =
          categoryStars.reduce((sum, star) => sum + star.x, 0) /
          categoryStars.length;
        const centerY =
          categoryStars.reduce((sum, star) => sum + star.y, 0) /
          categoryStars.length;

        // Calculate cluster radius
        const radius = Math.max(
          ...categoryStars.map((star) =>
            Math.sqrt(
              Math.pow(star.x - centerX, 2) + Math.pow(star.y - centerY, 2),
            ),
          ),
        );

        return {
          category,
          stars: categoryStars,
          centerX,
          centerY,
          connections: [],
          color: category.color,
          radius,
        };
      });
    },
    [],
  );

  // Generate connections between stars
  const generateConnections = useCallback(
    (stars: Star[], clusters: Cluster[]): Connection[] => {
      const connections: Connection[] = [];

      // Enhanced intra-cluster connections
      clusters.forEach((cluster) => {
        const { stars: clusterStars } = cluster;

        for (let i = 0; i < clusterStars.length; i++) {
          for (let j = i + 1; j < clusterStars.length; j++) {
            const star1 = clusterStars[i];
            const star2 = clusterStars[j];
            const distance = Math.sqrt(
              Math.pow(star1.x - star2.x, 2) + Math.pow(star1.y - star2.y, 2),
            );

            // Fewer connections for cleaner look
            if (distance < 150 && Math.random() > 0.7) {
              connections.push({
                from: star1.id,
                to: star2.id,
                strength: Math.max(
                  star1.connectionStrength,
                  star2.connectionStrength,
                ),
                opacity: 0,
                category: star1.category,
              });
            }
          }
        }
      });

      // Enhanced inter-cluster connections with category relationships
      const categoryRelationships = {
        education: ["technology", "research", "community"],
        health: ["research", "disaster", "poverty"],
        climate: ["technology", "research", "community"],
        poverty: ["health", "education", "community"],
        disaster: ["health", "community", "poverty"],
        technology: ["education", "research", "political"],
        political: ["community", "arts", "technology"],
        arts: ["community", "education", "political"],
        research: ["health", "climate", "technology"],
        community: ["poverty", "arts", "political"],
      };

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const cluster1 = clusters[i];
          const cluster2 = clusters[j];

          if (cluster1.stars.length > 0 && cluster2.stars.length > 0) {
            // Check if categories are related
            const related =
              categoryRelationships[cluster1.category.id]?.includes(
                cluster2.category.id,
              ) ||
              categoryRelationships[cluster2.category.id]?.includes(
                cluster1.category.id,
              );

            const connectionChance = related ? 0.2 : 0.08; // Reduced connection density

            if (Math.random() < connectionChance) {
              // Fewer connections between clusters
              const connectionCount = related
                ? Math.floor(Math.random() * 2) + 1
                : 1;

              for (let k = 0; k < connectionCount; k++) {
                const star1 =
                  cluster1.stars[
                    Math.floor(Math.random() * cluster1.stars.length)
                  ];
                const star2 =
                  cluster2.stars[
                    Math.floor(Math.random() * cluster2.stars.length)
                  ];

                connections.push({
                  from: star1.id,
                  to: star2.id,
                  strength: related ? 0.5 : 0.3,
                  opacity: 0,
                  category: star1.category,
                });
              }
            }
          }
        }
      }

      // Add fewer long-range connections for cleaner look
      const longRangeConnections = Math.floor(stars.length * 0.01);
      for (let i = 0; i < longRangeConnections; i++) {
        const star1 = stars[Math.floor(Math.random() * stars.length)];
        const star2 = stars[Math.floor(Math.random() * stars.length)];

        if (star1.id !== star2.id && star1.category.id !== star2.category.id) {
          connections.push({
            from: star1.id,
            to: star2.id,
            strength: 0.2,
            opacity: 0,
            category: star1.category,
          });
        }
      }

      return connections;
    },
    [],
  );

  // Initialize constellation
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width || width;
    const canvasHeight = rect.height || height;

    const generatedStars = generateStars(
      data.categories,
      canvasWidth,
      canvasHeight,
    );
    const generatedClusters = generateClusters(generatedStars, data.categories);
    const generatedConnections = generateConnections(
      generatedStars,
      generatedClusters,
    );

    setStars(generatedStars);
    setClusters(generatedClusters);
    setConnections(generatedConnections);
    setAnimationPhase(0);
    setIsAnimating(true);
  }, [
    data,
    width,
    height,
    generateStars,
    generateClusters,
    generateConnections,
  ]);

  // Enhanced animation loop with sophisticated effects
  useEffect(() => {
    if (!canvasRef.current || !isAnimating) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let startTime = Date.now();

    // Helper function for category-specific visual effects
    const getCategoryVisualEffects = (categoryId: string, time: number) => {
      switch (categoryId) {
        case "education":
          return {
            glowIntensity: Math.sin(time * 1.5) * 5,
            hasRings: true,
            pulseSpeed: 1.5,
          };
        case "health":
          return {
            glowIntensity: Math.sin(time * 2) * 8,
            hasRings: false,
            pulseSpeed: 2.0,
          };
        case "climate":
          return {
            glowIntensity: Math.sin(time * 1.2) * 6,
            hasRings: true,
            pulseSpeed: 1.2,
          };
        case "poverty":
          return {
            glowIntensity: Math.sin(time * 1.8) * 7,
            hasRings: false,
            pulseSpeed: 1.8,
          };
        case "disaster":
          return {
            glowIntensity: Math.sin(time * 2.5) * 10,
            hasRings: true,
            pulseSpeed: 2.5,
          };
        default:
          return {
            glowIntensity: 0,
            hasRings: false,
            pulseSpeed: 1.0,
          };
      }
    };

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000; // seconds

      // Clear canvas with subtle fade effect for trailing
      ctx.fillStyle = "rgba(15, 15, 15, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Phase 1: Star formation (0-4 seconds)
      if (elapsed < 4) {
        const progress = elapsed / 4;

        // Animate stars appearing with staggered entrance
        stars.forEach((star, index) => {
          const delay = (index / stars.length) * 3; // Stagger appearance over 3 seconds
          const starProgress = Math.max(
            0,
            Math.min(1, (elapsed - delay) / 1.5),
          );

          if (starProgress > 0) {
            // Entrance animation with scale and fade
            const scale = Math.sin(starProgress * Math.PI * 0.5);
            star.opacity = starProgress * star.brightness;

            // Apply selective highlighting even during formation
            let finalOpacity = star.opacity;
            let shadowBlur = 15 * starProgress;
            let starSize = star.size * scale;

            if (hoveredCategory) {
              if (star.category.id === hoveredCategory) {
                finalOpacity = Math.min(1, star.opacity * 2.2);
                shadowBlur = 25 * starProgress;
                starSize = star.size * scale * 1.4;
              } else {
                finalOpacity = star.opacity * 0.15;
                shadowBlur = 8 * starProgress;
                starSize = star.size * scale * 0.8;
              }
            }

            // Draw star with entrance effect
            ctx.save();
            ctx.globalAlpha = finalOpacity;
            ctx.fillStyle = star.category.color;
            ctx.shadowBlur = shadowBlur;
            ctx.shadowColor = star.category.color;

            // Add sparkle effect during formation (only for non-dimmed stars)
            if (
              starProgress < 0.8 &&
              (!hoveredCategory || star.category.id === hoveredCategory)
            ) {
              const sparkles = 3;
              for (let i = 0; i < sparkles; i++) {
                const sparkleAngle = (i / sparkles) * Math.PI * 2 + elapsed * 2;
                const sparkleDistance = starSize * 3 * (1 - starProgress);
                const sparkleX =
                  star.x + Math.cos(sparkleAngle) * sparkleDistance;
                const sparkleY =
                  star.y + Math.sin(sparkleAngle) * sparkleDistance;

                ctx.globalAlpha = finalOpacity * 0.5;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // Main star
            ctx.globalAlpha = finalOpacity;
            ctx.beginPath();
            ctx.arc(star.x, star.y, starSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        setAnimationPhase(0);
      }
      // Phase 2: Advanced twinkling with breathing effect (4-7 seconds)
      else if (elapsed < 7) {
        const progress = (elapsed - 4) / 3;

        stars.forEach((star, index) => {
          // Multi-layered twinkling effect
          const baseTwinkle =
            Math.sin(elapsed * star.twinkleSpeed + star.animationPhase) * 0.3 +
            0.7;
          const fastTwinkle =
            Math.sin(elapsed * star.twinkleSpeed * 3 + star.animationPhase) *
            0.1;
          const breathe = Math.sin(elapsed * 0.5 + index * 0.1) * 0.15 + 1;

          star.opacity =
            star.brightness * (baseTwinkle + fastTwinkle) * breathe;

          // Apply selective highlighting even in phase 2
          let finalOpacity = star.opacity;
          let shadowBlur = 20;
          let starSize = star.size;

          if (hoveredCategory) {
            if (star.category.id === hoveredCategory) {
              finalOpacity = Math.min(1, star.opacity * 2.2);
              shadowBlur = 35;
              starSize = star.size * 1.4;
            } else {
              finalOpacity = star.opacity * 0.15;
              shadowBlur = 8;
              starSize = star.size * 0.8;
            }
          }

          // Category-specific visual themes
          const categoryEffects = getCategoryVisualEffects(
            star.category.id,
            elapsed,
          );

          // Draw star with enhanced effects
          ctx.save();
          ctx.globalAlpha = finalOpacity;

          // Category-specific glow
          ctx.shadowBlur = shadowBlur + categoryEffects.glowIntensity;
          ctx.shadowColor = star.category.color;
          ctx.fillStyle = star.category.color;

          // Pulsing size effect
          const pulseSize =
            starSize *
            (1 +
              Math.sin(
                elapsed * categoryEffects.pulseSpeed + star.animationPhase,
              ) *
                0.2);

          ctx.beginPath();
          ctx.arc(star.x, star.y, pulseSize, 0, Math.PI * 2);
          ctx.fill();

          // Add category-specific visual elements
          if (categoryEffects.hasRings) {
            ctx.globalAlpha = finalOpacity * 0.3;
            ctx.strokeStyle = star.category.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(star.x, star.y, pulseSize * 2, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.restore();
        });

        setAnimationPhase(1);
      }
      // Phase 3: Constellation formation with flowing connections (7+ seconds)
      else {
        const progress = Math.min(1, (elapsed - 7) / 4);

        // Continue enhanced twinkling with selective highlighting
        stars.forEach((star, index) => {
          const baseTwinkle =
            Math.sin(elapsed * star.twinkleSpeed + star.animationPhase) * 0.2 +
            0.8;
          const breathe = Math.sin(elapsed * 0.3 + index * 0.1) * 0.1 + 1;

          star.opacity = star.brightness * baseTwinkle * breathe;

          // Selective highlighting: dim non-hovered constellations when hovering
          let finalOpacity = star.opacity;
          let shadowBlur = 20;
          let starSize = star.size;

          if (hoveredCategory) {
            if (star.category.id === hoveredCategory) {
              // Enhance the hovered constellation
              finalOpacity = Math.min(1, star.opacity * 2.2);
              shadowBlur = 35;
              starSize = star.size * 1.4;

              // Add selection ring for hovered constellation
              ctx.save();
              ctx.globalAlpha = 0.7;
              ctx.strokeStyle = star.category.color;
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              ctx.lineDashOffset = -elapsed * 10;
              ctx.beginPath();
              ctx.arc(star.x, star.y, star.size * 3.5, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            } else {
              // Dim other constellations significantly
              finalOpacity = star.opacity * 0.15;
              shadowBlur = 8;
              starSize = star.size * 0.8;
            }
          }

          // Draw star
          ctx.save();
          ctx.globalAlpha = finalOpacity;
          ctx.fillStyle = star.category.color;
          ctx.shadowBlur = shadowBlur;
          ctx.shadowColor = star.category.color;

          ctx.beginPath();
          ctx.arc(star.x, star.y, starSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Draw animated connections with selective highlighting
        connections.forEach((connection, index) => {
          const delay = (index / connections.length) * 3;
          const connectionProgress = Math.max(
            0,
            Math.min(1, progress - delay / 4),
          );

          if (connectionProgress > 0) {
            const fromStar = stars.find((s) => s.id === connection.from);
            const toStar = stars.find((s) => s.id === connection.to);

            if (fromStar && toStar) {
              connection.opacity =
                connectionProgress * connection.strength * 0.7;

              // Selective highlighting for connections
              let finalConnectionOpacity = connection.opacity;
              let lineWidth = 1;
              let shadowBlur = 5;

              if (hoveredCategory) {
                const isHoveredConstellation =
                  fromStar.category.id === hoveredCategory ||
                  toStar.category.id === hoveredCategory;

                if (isHoveredConstellation) {
                  // Enhance connections within or connected to hovered constellation
                  finalConnectionOpacity = connection.opacity * 3.5;
                  lineWidth = 2.5;
                  shadowBlur = 15;
                } else {
                  // Dim connections not related to hovered constellation
                  finalConnectionOpacity = connection.opacity * 0.1;
                  lineWidth = 0.5;
                  shadowBlur = 2;
                }
              }

              // Flowing energy effect along connections
              const flowProgress = (elapsed * 0.5 + index * 0.2) % 1;
              const flowX = fromStar.x + (toStar.x - fromStar.x) * flowProgress;
              const flowY = fromStar.y + (toStar.y - fromStar.y) * flowProgress;

              // Draw main connection line with selective highlighting
              ctx.save();
              ctx.globalAlpha = finalConnectionOpacity;
              ctx.strokeStyle = connection.category.color;
              ctx.lineWidth = lineWidth;
              ctx.shadowBlur = shadowBlur;
              ctx.shadowColor = connection.category.color;

              // Gradient line effect
              const gradient = ctx.createLinearGradient(
                fromStar.x,
                fromStar.y,
                toStar.x,
                toStar.y,
              );
              gradient.addColorStop(0, connection.category.color);
              gradient.addColorStop(0.5, `${connection.category.color}80`);
              gradient.addColorStop(1, connection.category.color);
              ctx.strokeStyle = gradient;

              ctx.beginPath();
              ctx.moveTo(fromStar.x, fromStar.y);
              ctx.lineTo(toStar.x, toStar.y);
              ctx.stroke();

              // Draw flowing energy particle (only for highlighted connections when hovering)
              if (
                connectionProgress > 0.5 &&
                (!hoveredCategory ||
                  finalConnectionOpacity > connection.opacity)
              ) {
                ctx.globalAlpha = finalConnectionOpacity * 0.8;
                ctx.fillStyle = connection.category.color;
                ctx.shadowBlur = shadowBlur;
                const particleSize =
                  hoveredCategory && finalConnectionOpacity > connection.opacity
                    ? 3
                    : 2;
                ctx.beginPath();
                ctx.arc(flowX, flowY, particleSize, 0, Math.PI * 2);
                ctx.fill();
              }

              ctx.restore();
            }
          }
        });

        setAnimationPhase(2);

        // Continue animation indefinitely for ongoing effects
        if (progress >= 1 && elapsed > 12) {
          // Keep animating for twinkling and flow effects
          setIsAnimating(true);
        }
      }

      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stars, connections, hoveredCategory, isAnimating]);

  // Handle canvas resize
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
      }
    });

    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle mouse interactions
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if mouse is over any star (constellation detection)
      let foundCategory: string | null = null;
      let closestDistance = Infinity;

      // Check each star to see if mouse is nearby
      for (const star of stars) {
        const distance = Math.sqrt(
          Math.pow(x - star.x, 2) + Math.pow(y - star.y, 2),
        );

        // If mouse is within 60px of any star, consider it hovering over that constellation
        if (distance < 60 && distance < closestDistance) {
          foundCategory = star.category.id;
          closestDistance = distance;
        }
      }

      setHoveredCategory(foundCategory);
    },
    [stars],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!hoveredCategory || !onCategoryClick) return;

      const category = data.categories.find((c) => c.id === hoveredCategory);
      if (category) {
        onCategoryClick(category);
      }
    },
    [hoveredCategory, onCategoryClick, data.categories],
  );

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ background: "transparent" }}
      />

      {/* Category tooltip */}
      {hoveredCategory && (
        <div className="absolute top-4 left-4 glass p-4 rounded-lg max-w-xs">
          {(() => {
            const category = data.categories.find(
              (c) => c.id === hoveredCategory,
            );
            if (!category) return null;

            return (
              <div>
                <h3
                  className="font-semibold text-lg mb-2"
                  style={{ color: category.color }}
                >
                  {category.name}
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  {category.description}
                </p>
                <div className="text-xs text-gray-400">
                  {category.impactCount.toLocaleString()} donations creating
                  impact
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Animation phase indicator */}
      {isAnimating && (
        <div className="absolute bottom-4 right-4 glass px-3 py-2 rounded-lg text-xs text-gray-400">
          {animationPhase === 0 && "Stars are forming..."}
          {animationPhase === 1 && "Constellations awakening..."}
          {animationPhase === 2 && "Connections emerging..."}
        </div>
      )}
    </div>
  );
};

export default ImpactConstellation;
