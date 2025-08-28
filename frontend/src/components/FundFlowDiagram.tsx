import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import {
  FlowDiagram,
  FlowNode,
  FlowLink,
  VerificationStatus,
  ImpactCategory,
} from "../types/aiTrust";

interface FundFlowDiagramProps {
  flowDiagram: FlowDiagram;
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
  onLinkClick?: (sourceId: string, targetId: string) => void;
  className?: string;
}

interface SankeyNodeExtended extends d3.SankeyNode<{}, {}> {
  id: string;
  name: string;
  type: string;
  category?: ImpactCategory;
  verificationLevel: VerificationStatus;
}

interface SankeyLinkExtended extends d3.SankeyLink<{}, {}> {
  source: SankeyNodeExtended;
  target: SankeyNodeExtended;
  category?: ImpactCategory;
  verificationLevel: VerificationStatus;
}

/**
 * Interactive Sankey diagram component for visualizing fund flow
 * Shows donation flow from donors through organizations to beneficiaries
 */
export const FundFlowDiagram: React.FC<FundFlowDiagramProps> = ({
  flowDiagram,
  width = 800,
  height = 600,
  onNodeClick,
  onLinkClick,
  className = "",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    content: string;
  }>({ show: false, x: 0, y: 0, content: "" });

  useEffect(() => {
    if (!svgRef.current || !flowDiagram.data.nodes.length) return;

    drawSankeyDiagram();
  }, [flowDiagram, width, height]);

  const drawSankeyDiagram = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data for D3 Sankey
    const sankeyGenerator = sankey<{}, {}>()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ]);

    // Convert our data format to D3 Sankey format
    const nodes: SankeyNodeExtended[] = flowDiagram.data.nodes.map((node) => ({
      ...node,
      id: node.id,
      name: node.name,
      type: node.type,
      category: node.category,
      verificationLevel: node.verificationLevel,
    }));

    const links: SankeyLinkExtended[] = flowDiagram.data.links.map((link) => ({
      source: nodes.findIndex((n) => n.id === link.source),
      target: nodes.findIndex((n) => n.id === link.target),
      value: link.value,
      category: link.category,
      verificationLevel: link.verificationLevel,
    })) as SankeyLinkExtended[];

    const sankeyData = sankeyGenerator({
      nodes: nodes as any,
      links: links as any,
    });

    // Draw links
    const link = g
      .append("g")
      .selectAll(".link")
      .data(sankeyData.links)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", sankeyLinkHorizontal())
      .style("stroke", (d: any) =>
        getLinkColor(d.category, d.verificationLevel),
      )
      .style("stroke-width", (d: any) => Math.max(1, d.width))
      .style("fill", "none")
      .style("opacity", 0.7)
      .style("cursor", "pointer")
      .on("mouseover", handleLinkMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", (event: any, d: any) => {
        if (onLinkClick) {
          onLinkClick(d.source.id, d.target.id);
        }
      });

    // Draw nodes
    const node = g
      .append("g")
      .selectAll(".node")
      .data(sankeyData.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`);

    // Node rectangles
    node
      .append("rect")
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("height", (d: any) => d.y1 - d.y0)
      .style("fill", (d: any) => getNodeColor(d.type, d.verificationLevel))
      .style("stroke", (d: any) => (selectedNode === d.id ? "#333" : "none"))
      .style("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", handleNodeMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", (event: any, d: any) => {
        setSelectedNode(selectedNode === d.id ? null : d.id);
        if (onNodeClick) {
          onNodeClick(d.id);
        }
      });

    // Node labels
    node
      .append("text")
      .attr("x", (d: any) => (d.x1 - d.x0) / 2)
      .attr("y", (d: any) => (d.y1 - d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", "#333")
      .style("pointer-events", "none")
      .text((d: any) => d.name);

    // Verification level indicators
    node
      .append("circle")
      .attr("cx", (d: any) => d.x1 - d.x0 - 5)
      .attr("cy", 5)
      .attr("r", 3)
      .style("fill", (d: any) => getVerificationColor(d.verificationLevel))
      .style("stroke", "#fff")
      .style("stroke-width", 1);

    // Add legend
    addLegend(g, innerWidth, innerHeight);
  };

  const handleNodeMouseOver = (event: any, d: any) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const content = `
      <div class="font-semibold">${d.name}</div>
      <div class="text-sm text-gray-600">Type: ${d.type}</div>
      <div class="text-sm text-gray-600">Value: ${formatValue(d.value)}</div>
      <div class="text-sm text-gray-600">Verification: ${d.verificationLevel}</div>
      ${d.category ? `<div class="text-sm text-gray-600">Category: ${d.category}</div>` : ""}
    `;

    setTooltip({
      show: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      content,
    });
  };

  const handleLinkMouseOver = (event: any, d: any) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const content = `
      <div class="font-semibold">Flow: ${d.source.name} → ${d.target.name}</div>
      <div class="text-sm text-gray-600">Value: ${formatValue(d.value)}</div>
      <div class="text-sm text-gray-600">Verification: ${d.verificationLevel}</div>
      ${d.category ? `<div class="text-sm text-gray-600">Category: ${d.category}</div>` : ""}
    `;

    setTooltip({
      show: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      content,
    });
  };

  const handleMouseOut = () => {
    setTooltip({ show: false, x: 0, y: 0, content: "" });
  };

  const addLegend = (g: any, width: number, height: number) => {
    const legend = g
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 150}, 20)`);

    // Verification level legend
    const verificationLevels: VerificationStatus[] = [
      "AI_VERIFIED",
      "SELF_DECLARED",
      "UNVERIFIED",
    ];

    legend
      .selectAll(".legend-item")
      .data(verificationLevels)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`)
      .each(function (d) {
        const item = d3.select(this);

        item
          .append("circle")
          .attr("r", 4)
          .style("fill", getVerificationColor(d));

        item
          .append("text")
          .attr("x", 10)
          .attr("dy", "0.35em")
          .style("font-size", "10px")
          .style("fill", "#666")
          .text(formatVerificationLevel(d));
      });
  };

  const getNodeColor = (
    type: string,
    verification: VerificationStatus,
  ): string => {
    const baseColors = {
      DONOR: "#e3f2fd",
      CAMPAIGN: "#f3e5f5",
      ORGANIZATION: "#e8f5e8",
      BENEFICIARY: "#fff3e0",
      IMPACT: "#fce4ec",
    };

    const color = baseColors[type as keyof typeof baseColors] || "#f5f5f5";

    // Adjust opacity based on verification level
    if (verification === "AI_VERIFIED") return color;
    if (verification === "SELF_DECLARED") return color + "cc";
    return color + "99";
  };

  const getLinkColor = (
    category?: ImpactCategory,
    verification?: VerificationStatus,
  ): string => {
    const categoryColors = {
      EDUCATION: "#2196f3",
      HEALTHCARE: "#f44336",
      ENVIRONMENT: "#4caf50",
      POVERTY: "#ff9800",
      DISASTER_RELIEF: "#9c27b0",
      HUMAN_RIGHTS: "#607d8b",
      COMMUNITY_DEVELOPMENT: "#795548",
      OTHER: "#9e9e9e",
    };

    const baseColor = category ? categoryColors[category] : "#9e9e9e";

    // Adjust opacity based on verification
    if (verification === "AI_VERIFIED") return baseColor;
    if (verification === "SELF_DECLARED") return baseColor + "cc";
    return baseColor + "99";
  };

  const getVerificationColor = (level: VerificationStatus): string => {
    const colors = {
      AI_VERIFIED: "#4caf50",
      SELF_DECLARED: "#ff9800",
      UNVERIFIED: "#f44336",
      FLAGGED: "#d32f2f",
      PENDING: "#2196f3",
    };

    return colors[level];
  };

  const formatVerificationLevel = (level: VerificationStatus): string => {
    return level
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg bg-white"
      />

      {tooltip.show && (
        <div
          className="absolute z-10 p-3 bg-white border border-gray-300 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            maxWidth: "250px",
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      {/* Diagram metadata */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-700">Total Flow</div>
            <div className="text-lg font-bold text-blue-600">
              {formatValue(flowDiagram.data.metadata.totalFlow)}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">Participants</div>
            <div className="text-lg font-bold text-green-600">
              {flowDiagram.data.metadata.participantCount}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">Privacy Level</div>
            <div className="text-lg font-bold text-purple-600">
              {flowDiagram.privacyLevel}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">Verification</div>
            <div
              className="text-lg font-bold"
              style={{
                color: getVerificationColor(flowDiagram.verificationLevel),
              }}
            >
              {formatVerificationLevel(flowDiagram.verificationLevel)}
            </div>
          </div>
        </div>

        {/* Verification summary */}
        <div className="mt-4">
          <div className="font-semibold text-gray-700 mb-2">
            Verification Summary
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(flowDiagram.data.metadata.verificationSummary).map(
              ([level, count]) =>
                count > 0 && (
                  <div
                    key={level}
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        getVerificationColor(level as VerificationStatus) +
                        "20",
                      color: getVerificationColor(level as VerificationStatus),
                    }}
                  >
                    {formatVerificationLevel(level as VerificationStatus)}:{" "}
                    {count}
                  </div>
                ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
