import {
  FlowDiagram,
  DiagramData,
  FlowNode,
  FlowLink,
  FlowMetadata,
  InteractiveElement,
  ImpactVisualization,
  VisualizationElement,
  VisualizationConfig,
  ImpactReport,
  ImpactMetric,
  VerificationSource,
  VerificationStatus,
  ImpactCategory,
  LocationImpact,
  AggregatedImpact,
  CategoryImpact,
  TimelinePoint,
} from "../types/aiTrust";
import { GeminiClient } from "./geminiClient";
import { AITrustErrorHandler } from "./aiTrustErrorHandler";

/**
 * Fund Flow Visualizer Service
 * Creates interactive visualizations showing donation flow and impact
 * Maintains privacy by using aggregated data only
 */
export class FundFlowVisualizer {
  private geminiClient: GeminiClient;
  private errorHandler: AITrustErrorHandler;
  private visualizationCache: Map<string, FlowDiagram> = new Map();

  constructor(geminiClient: GeminiClient, errorHandler: AITrustErrorHandler) {
    this.geminiClient = geminiClient;
    this.errorHandler = errorHandler;
  }

  /**
   * Generate comprehensive flow diagram for a campaign
   */
  async generateFlowDiagram(
    campaignId: string,
    impactReports: ImpactReport[],
  ): Promise<FlowDiagram> {
    try {
      const cacheKey = `flow_${campaignId}`;
      if (this.visualizationCache.has(cacheKey)) {
        return this.visualizationCache.get(cacheKey)!;
      }

      // Aggregate data for privacy
      const aggregatedData = await this.aggregateFlowData(
        campaignId,
        impactReports,
      );

      // Create nodes and links
      const nodes = await this.createFlowNodes(aggregatedData);
      const links = await this.createFlowLinks(aggregatedData, nodes);

      // Generate metadata
      const metadata = this.createFlowMetadata(aggregatedData, impactReports);

      // Create interactive elements
      const interactiveElements = this.createInteractiveElements(nodes, links);

      const flowDiagram: FlowDiagram = {
        type: "SANKEY",
        data: {
          nodes,
          links,
          metadata,
        },
        interactiveElements,
        privacyLevel: "AGGREGATED",
        verificationLevel:
          this.determineOverallVerificationLevel(impactReports),
      };

      this.visualizationCache.set(cacheKey, flowDiagram);
      return flowDiagram;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "FLOW_DIAGRAM_GENERATION_FAILED",
        message: `Failed to generate flow diagram: ${error}`,
        category: "ANALYSIS",
        retryable: true,
      });
    }
  }

  /**
   * Create Sankey diagram data structure
   */
  async generateSankeyDiagram(
    flowData: AggregatedFlowData,
  ): Promise<SankeyDiagramData> {
    try {
      const sankeyData: SankeyDiagramData = {
        nodes: flowData.nodes.map((node, index) => ({
          id: index,
          name: node.name,
          category: node.category,
          value: node.value,
          color: this.getCategoryColor(node.category),
          verificationLevel: node.verificationLevel,
        })),
        links: flowData.links.map((link) => ({
          source: flowData.nodes.findIndex((n) => n.id === link.source),
          target: flowData.nodes.findIndex((n) => n.id === link.target),
          value: link.value,
          category: link.category,
          color: this.getCategoryColor(link.category),
          verificationLevel: link.verificationLevel,
        })),
        config: {
          width: 800,
          height: 600,
          nodeWidth: 20,
          nodePadding: 10,
          linkOpacity: 0.7,
          showLabels: true,
          showValues: true,
        },
      };

      return sankeyData;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "SANKEY_GENERATION_FAILED",
        message: `Failed to generate Sankey diagram: ${error}`,
        category: "ANALYSIS",
        retryable: true,
      });
    }
  }

  /**
   * Create interactive impact visualization
   */
  async createImpactVisualization(
    impactData: AggregatedImpact,
  ): Promise<ImpactVisualization> {
    try {
      // Generate AI summary of impact
      const totalImpact = await this.generateImpactSummary(impactData);

      // Create key metrics
      const keyMetrics = this.extractKeyMetrics(impactData);

      // Create visual elements
      const visualElements = await this.createVisualizationElements(impactData);

      // Calculate confidence score
      const confidenceScore = this.calculateVisualizationConfidence(impactData);

      // Get verification sources
      const verificationSources = this.getVisualizationSources();

      const visualization: ImpactVisualization = {
        totalImpact,
        keyMetrics,
        visualElements,
        confidenceScore,
        verificationSources,
        privacyLevel: "AGGREGATED",
      };

      return visualization;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "IMPACT_VISUALIZATION_FAILED",
        message: `Failed to create impact visualization: ${error}`,
        category: "ANALYSIS",
        retryable: true,
      });
    }
  }

  /**
   * Create interactive geographic map visualization
   */
  async createInteractiveMap(
    locationData: LocationImpact[],
  ): Promise<InteractiveMapData> {
    try {
      const mapData: InteractiveMapData = {
        type: "CHOROPLETH",
        locations: locationData.map((location) => ({
          name: location.location,
          coordinates: location.coordinates || { lat: 0, lng: 0 },
          value: location.impactCount,
          categories: location.categories,
          verificationLevel: location.verificationLevel,
          color: this.getVerificationColor(location.verificationLevel),
          tooltip: this.generateLocationTooltip(location),
        })),
        config: {
          center: { lat: 0, lng: 0 },
          zoom: 2,
          showLegend: true,
          showTooltips: true,
          colorScale: ["#ffcccc", "#ff6666", "#cc0000"],
          interactive: true,
        },
        interactions: [
          {
            type: "HOVER",
            action: "SHOW_TOOLTIP",
            data: {},
          },
          {
            type: "CLICK",
            action: "DRILL_DOWN",
            data: {},
          },
        ],
      };

      return mapData;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "MAP_GENERATION_FAILED",
        message: `Failed to create interactive map: ${error}`,
        category: "ANALYSIS",
        retryable: true,
      });
    }
  }

  /**
   * Create heatmap visualization for impact distribution
   */
  async createHeatmapVisualization(
    impactData: AggregatedImpact,
  ): Promise<HeatmapData> {
    try {
      const heatmapData: HeatmapData = {
        type: "CATEGORY_HEATMAP",
        data: Object.entries(impactData.impactsByCategory).map(
          ([category, impact]) => ({
            category: category as ImpactCategory,
            totalReports: impact.totalReports,
            verifiedReports: impact.verifiedReports,
            beneficiaries: impact.estimatedBeneficiaries,
            verificationRatio: impact.verifiedReports / impact.totalReports,
            color: this.getCategoryColor(category as ImpactCategory),
          }),
        ),
        config: {
          width: 600,
          height: 400,
          cellSize: 80,
          showLabels: true,
          showValues: true,
          colorScale: ["#e8f5e8", "#4caf50", "#2e7d32"],
        },
        interactions: [
          {
            type: "HOVER",
            action: "SHOW_DETAILS",
            data: {},
          },
        ],
      };

      return heatmapData;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "HEATMAP_GENERATION_FAILED",
        message: `Failed to create heatmap: ${error}`,
        category: "ANALYSIS",
        retryable: true,
      });
    }
  }

  /**
   * Create timeline visualization for impact over time
   */
  async createTimelineVisualization(
    timelineData: TimelinePoint[],
  ): Promise<TimelineVisualizationData> {
    try {
      const sortedData = timelineData.sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      );

      const timelineViz: TimelineVisualizationData = {
        type: "LINE_CHART",
        data: sortedData.map((point) => ({
          date: point.date,
          impactCount: point.impactCount,
          cumulativeImpact: point.cumulativeImpact,
          categories: point.categories,
          tooltip: `${point.impactCount} impacts on ${point.date.toLocaleDateString()}`,
        })),
        config: {
          width: 800,
          height: 300,
          showGrid: true,
          showLegend: true,
          xAxisLabel: "Time",
          yAxisLabel: "Impact Count",
          lineColor: "#2196f3",
          fillArea: true,
        },
        interactions: [
          {
            type: "HOVER",
            action: "SHOW_POINT_DETAILS",
            data: {},
          },
          {
            type: "ZOOM",
            action: "ZOOM_TIME_RANGE",
            data: {},
          },
        ],
      };

      return timelineViz;
    } catch (error) {
      throw await this.errorHandler.handleError({
        code: "TIMELINE_GENERATION_FAILED",
        message: `Failed to create timeline visualization: ${error}`,
        category: "ANALYSIS",
        retryable: true,
      });
    }
  }

  // Private helper methods

  private async aggregateFlowData(
    campaignId: string,
    impactReports: ImpactReport[],
  ): Promise<AggregatedFlowData> {
    // Simulate aggregated flow data
    const totalDonations = Math.floor(Math.random() * 100000) + 10000;
    const organizationCount = new Set(
      impactReports.map((r) => r.organizationWallet),
    ).size;
    const beneficiaryCount = impactReports.reduce(
      (sum, r) => sum + (r.beneficiaryCount || 0),
      0,
    );

    return {
      campaignId,
      totalFlow: totalDonations,
      organizationCount,
      beneficiaryCount,
      categories: this.aggregateByCategory(impactReports),
      locations: this.aggregateByLocation(impactReports),
      timeRange: this.getTimeRange(impactReports),
      nodes: [],
      links: [],
    };
  }

  private async createFlowNodes(data: AggregatedFlowData): Promise<FlowNode[]> {
    const nodes: FlowNode[] = [];

    // Donor pool node
    nodes.push({
      id: "donors",
      name: "Donors",
      type: "DONOR",
      value: data.totalFlow,
      verificationLevel: "PUBLIC",
    });

    // Campaign node
    nodes.push({
      id: data.campaignId,
      name: "Campaign",
      type: "CAMPAIGN",
      value: data.totalFlow,
      verificationLevel: "AI_VERIFIED",
    });

    // Organization nodes
    Object.entries(data.categories).forEach(([category, impact]) => {
      nodes.push({
        id: `org_${category}`,
        name: `${category} Organizations`,
        type: "ORGANIZATION",
        value: impact.estimatedBeneficiaries * 100, // Simulated allocation
        category: category as ImpactCategory,
        verificationLevel:
          impact.verifiedReports > 0 ? "AI_VERIFIED" : "SELF_DECLARED",
      });
    });

    // Beneficiary nodes
    Object.entries(data.categories).forEach(([category, impact]) => {
      nodes.push({
        id: `beneficiaries_${category}`,
        name: `${category} Beneficiaries`,
        type: "BENEFICIARY",
        value: impact.estimatedBeneficiaries,
        category: category as ImpactCategory,
        verificationLevel:
          impact.verifiedReports > 0 ? "AI_VERIFIED" : "SELF_DECLARED",
      });
    });

    return nodes;
  }

  private async createFlowLinks(
    data: AggregatedFlowData,
    nodes: FlowNode[],
  ): Promise<FlowLink[]> {
    const links: FlowLink[] = [];

    // Donors to Campaign
    links.push({
      source: "donors",
      target: data.campaignId,
      value: data.totalFlow,
      verificationLevel: "PUBLIC",
    });

    // Campaign to Organizations
    Object.entries(data.categories).forEach(([category, impact]) => {
      const allocation = impact.estimatedBeneficiaries * 100; // Simulated
      links.push({
        source: data.campaignId,
        target: `org_${category}`,
        value: allocation,
        category: category as ImpactCategory,
        verificationLevel:
          impact.verifiedReports > 0 ? "AI_VERIFIED" : "SELF_DECLARED",
      });
    });

    // Organizations to Beneficiaries
    Object.entries(data.categories).forEach(([category, impact]) => {
      links.push({
        source: `org_${category}`,
        target: `beneficiaries_${category}`,
        value: impact.estimatedBeneficiaries,
        category: category as ImpactCategory,
        verificationLevel:
          impact.verifiedReports > 0 ? "AI_VERIFIED" : "SELF_DECLARED",
      });
    });

    return links;
  }

  private createFlowMetadata(
    data: AggregatedFlowData,
    reports: ImpactReport[],
  ): FlowMetadata {
    const verificationSummary: Record<VerificationStatus, number> = {
      AI_VERIFIED: 0,
      SELF_DECLARED: 0,
      UNVERIFIED: 0,
      FLAGGED: 0,
      PENDING: 0,
    };

    reports.forEach((report) => {
      verificationSummary[report.verificationStatus]++;
    });

    return {
      totalFlow: data.totalFlow,
      timeRange: data.timeRange,
      participantCount: data.organizationCount + data.beneficiaryCount,
      verificationSummary,
    };
  }

  private createInteractiveElements(
    nodes: FlowNode[],
    links: FlowLink[],
  ): InteractiveElement[] {
    const elements: InteractiveElement[] = [];

    // Add tooltips for nodes
    nodes.forEach((node) => {
      elements.push({
        id: `tooltip_${node.id}`,
        type: "TOOLTIP",
        targetNodeId: node.id,
        action: "SHOW_NODE_DETAILS",
        data: {
          name: node.name,
          type: node.type,
          value: node.value,
          verificationLevel: node.verificationLevel,
        },
      });
    });

    // Add drill-down for organization nodes
    nodes
      .filter((node) => node.type === "ORGANIZATION")
      .forEach((node) => {
        elements.push({
          id: `drilldown_${node.id}`,
          type: "DRILL_DOWN",
          targetNodeId: node.id,
          action: "SHOW_ORGANIZATION_DETAILS",
          data: {
            organizationId: node.id,
            category: node.category,
          },
        });
      });

    return elements;
  }

  private async generateImpactSummary(
    impactData: AggregatedImpact,
  ): Promise<string> {
    const summaryPrompt = `
      Generate a concise, inspiring summary of this aggregated impact data:
      
      Total Beneficiaries: ${impactData.totalBeneficiaries}
      Categories: ${Object.keys(impactData.impactsByCategory).join(", ")}
      Geographic Reach: ${impactData.geographicDistribution.length} locations
      
      Create a 2-3 sentence summary highlighting the collective impact achieved.
    `;

    try {
      const aiResponse = await this.geminiClient.analyzeText(
        summaryPrompt,
        JSON.stringify(impactData),
      );
      return aiResponse.text;
    } catch (error) {
      return `Collective impact reached ${impactData.totalBeneficiaries} beneficiaries across ${Object.keys(impactData.impactsByCategory).length} categories and ${impactData.geographicDistribution.length} locations.`;
    }
  }

  private extractKeyMetrics(impactData: AggregatedImpact): ImpactMetric[] {
    const metrics: ImpactMetric[] = [];

    // Total beneficiaries metric
    metrics.push({
      name: "Total Beneficiaries",
      value: impactData.totalBeneficiaries,
      unit: "people",
      category: "OTHER",
      verificationLevel: "AI_VERIFIED",
    });

    // Category-specific metrics
    Object.entries(impactData.impactsByCategory).forEach(
      ([category, impact]) => {
        metrics.push({
          name: `${category} Impact`,
          value: impact.estimatedBeneficiaries,
          unit: "beneficiaries",
          category: category as ImpactCategory,
          verificationLevel:
            impact.verifiedReports > 0 ? "AI_VERIFIED" : "SELF_DECLARED",
        });
      },
    );

    // Geographic reach metric
    metrics.push({
      name: "Geographic Reach",
      value: impactData.geographicDistribution.length,
      unit: "locations",
      category: "OTHER",
      verificationLevel: "AI_VERIFIED",
    });

    return metrics.slice(0, 6); // Limit to top 6 metrics
  }

  private async createVisualizationElements(
    impactData: AggregatedImpact,
  ): Promise<VisualizationElement[]> {
    const elements: VisualizationElement[] = [];

    // Category distribution chart
    elements.push({
      type: "CHART",
      id: "category_distribution",
      title: "Impact by Category",
      data: Object.entries(impactData.impactsByCategory).map(
        ([category, impact]) => ({
          category,
          value: impact.estimatedBeneficiaries,
          verified: impact.verifiedReports,
          total: impact.totalReports,
        }),
      ),
      config: {
        colors: Object.keys(impactData.impactsByCategory).map((cat) =>
          this.getCategoryColor(cat as ImpactCategory),
        ),
        showLegend: true,
        showTooltips: true,
      },
    });

    // Geographic map
    if (impactData.geographicDistribution.length > 0) {
      elements.push({
        type: "MAP",
        id: "geographic_distribution",
        title: "Geographic Impact Distribution",
        data: impactData.geographicDistribution,
        config: {
          showLegend: true,
          interactive: true,
        },
      });
    }

    // Timeline chart
    if (impactData.timelineData.length > 0) {
      elements.push({
        type: "TIMELINE",
        id: "impact_timeline",
        title: "Impact Over Time",
        data: impactData.timelineData,
        config: {
          showGrid: true,
          interactive: true,
        },
      });
    }

    return elements;
  }

  private calculateVisualizationConfidence(
    impactData: AggregatedImpact,
  ): number {
    const totalReports = Object.values(impactData.impactsByCategory).reduce(
      (sum, cat) => sum + cat.totalReports,
      0,
    );
    const verifiedReports = Object.values(impactData.impactsByCategory).reduce(
      (sum, cat) => sum + cat.verifiedReports,
      0,
    );

    if (totalReports === 0) return 0;
    return verifiedReports / totalReports;
  }

  private getVisualizationSources(): VerificationSource[] {
    return [
      {
        type: "BLOCKCHAIN",
        name: "On-chain Impact Reports",
        reliability: 0.95,
        lastChecked: new Date(),
      },
      {
        type: "NGO_DATABASE",
        name: "Impact Verification Database",
        reliability: 0.85,
        lastChecked: new Date(),
      },
    ];
  }

  // Utility methods

  private aggregateByCategory(
    reports: ImpactReport[],
  ): Record<ImpactCategory, CategoryImpact> {
    const categories: Record<ImpactCategory, CategoryImpact> = {} as any;

    reports.forEach((report) => {
      if (!categories[report.category]) {
        categories[report.category] = {
          category: report.category,
          totalReports: 0,
          verifiedReports: 0,
          estimatedBeneficiaries: 0,
          keyMetrics: [],
        };
      }

      categories[report.category].totalReports++;
      if (report.verificationStatus === "AI_VERIFIED") {
        categories[report.category].verifiedReports++;
      }
      if (report.beneficiaryCount) {
        categories[report.category].estimatedBeneficiaries +=
          report.beneficiaryCount;
      }
    });

    return categories;
  }

  private aggregateByLocation(reports: ImpactReport[]): LocationImpact[] {
    const locationMap = new Map<string, LocationImpact>();

    reports.forEach((report) => {
      if (!report.location) return;

      if (!locationMap.has(report.location)) {
        locationMap.set(report.location, {
          location: report.location,
          impactCount: 0,
          categories: [],
          verificationLevel: 0,
        });
      }

      const location = locationMap.get(report.location)!;
      location.impactCount++;
      if (!location.categories.includes(report.category)) {
        location.categories.push(report.category);
      }
    });

    return Array.from(locationMap.values());
  }

  private getTimeRange(reports: ImpactReport[]): { start: Date; end: Date } {
    const timestamps = reports.map((r) => r.timestamp);
    return {
      start: new Date(Math.min(...timestamps.map((t) => t.getTime()))),
      end: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
    };
  }

  private determineOverallVerificationLevel(
    reports: ImpactReport[],
  ): VerificationStatus {
    const verifiedCount = reports.filter(
      (r) => r.verificationStatus === "AI_VERIFIED",
    ).length;
    const verificationRatio =
      reports.length > 0 ? verifiedCount / reports.length : 0;

    if (verificationRatio > 0.8) return "AI_VERIFIED";
    if (verificationRatio > 0.5) return "PENDING";
    return "SELF_DECLARED";
  }

  private getCategoryColor(category?: ImpactCategory): string {
    const colors: Record<ImpactCategory, string> = {
      EDUCATION: "#2196f3",
      HEALTHCARE: "#f44336",
      ENVIRONMENT: "#4caf50",
      POVERTY: "#ff9800",
      DISASTER_RELIEF: "#9c27b0",
      HUMAN_RIGHTS: "#607d8b",
      COMMUNITY_DEVELOPMENT: "#795548",
      OTHER: "#9e9e9e",
    };

    return category ? colors[category] : "#9e9e9e";
  }

  private getVerificationColor(level: number): string {
    if (level > 0.8) return "#4caf50"; // Green for high verification
    if (level > 0.5) return "#ff9800"; // Orange for medium verification
    return "#f44336"; // Red for low verification
  }

  private generateLocationTooltip(location: LocationImpact): string {
    return `${location.location}: ${location.impactCount} impacts across ${location.categories.length} categories`;
  }
}

// Supporting interfaces for visualization data structures

interface AggregatedFlowData {
  campaignId: string;
  totalFlow: number;
  organizationCount: number;
  beneficiaryCount: number;
  categories: Record<ImpactCategory, CategoryImpact>;
  locations: LocationImpact[];
  timeRange: { start: Date; end: Date };
  nodes: FlowNode[];
  links: FlowLink[];
}

interface SankeyDiagramData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  config: SankeyConfig;
}

interface SankeyNode {
  id: number;
  name: string;
  category?: ImpactCategory;
  value: number;
  color: string;
  verificationLevel: VerificationStatus;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
  category?: ImpactCategory;
  color: string;
  verificationLevel: VerificationStatus;
}

interface SankeyConfig {
  width: number;
  height: number;
  nodeWidth: number;
  nodePadding: number;
  linkOpacity: number;
  showLabels: boolean;
  showValues: boolean;
}

interface InteractiveMapData {
  type: "CHOROPLETH" | "MARKER" | "HEATMAP";
  locations: MapLocation[];
  config: MapConfig;
  interactions: MapInteraction[];
}

interface MapLocation {
  name: string;
  coordinates: { lat: number; lng: number };
  value: number;
  categories: ImpactCategory[];
  verificationLevel: number;
  color: string;
  tooltip: string;
}

interface MapConfig {
  center: { lat: number; lng: number };
  zoom: number;
  showLegend: boolean;
  showTooltips: boolean;
  colorScale: string[];
  interactive: boolean;
}

interface MapInteraction {
  type: "HOVER" | "CLICK" | "ZOOM";
  action: string;
  data: any;
}

interface HeatmapData {
  type: "CATEGORY_HEATMAP" | "TIME_HEATMAP" | "LOCATION_HEATMAP";
  data: HeatmapCell[];
  config: HeatmapConfig;
  interactions: HeatmapInteraction[];
}

interface HeatmapCell {
  category: ImpactCategory;
  totalReports: number;
  verifiedReports: number;
  beneficiaries: number;
  verificationRatio: number;
  color: string;
}

interface HeatmapConfig {
  width: number;
  height: number;
  cellSize: number;
  showLabels: boolean;
  showValues: boolean;
  colorScale: string[];
}

interface HeatmapInteraction {
  type: "HOVER" | "CLICK";
  action: string;
  data: any;
}

interface TimelineVisualizationData {
  type: "LINE_CHART" | "BAR_CHART" | "AREA_CHART";
  data: TimelineDataPoint[];
  config: TimelineConfig;
  interactions: TimelineInteraction[];
}

interface TimelineDataPoint {
  date: Date;
  impactCount: number;
  cumulativeImpact: number;
  categories: ImpactCategory[];
  tooltip: string;
}

interface TimelineConfig {
  width: number;
  height: number;
  showGrid: boolean;
  showLegend: boolean;
  xAxisLabel: string;
  yAxisLabel: string;
  lineColor: string;
  fillArea: boolean;
}

interface TimelineInteraction {
  type: "HOVER" | "ZOOM" | "FILTER";
  action: string;
  data: any;
}
