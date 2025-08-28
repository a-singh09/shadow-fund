import React, { useState, useEffect } from "react";
import {
  ImpactVisualization,
  VisualizationElement,
  ImpactMetric,
  VerificationStatus,
  ImpactCategory,
  LocationImpact,
  TimelinePoint,
} from "../types/aiTrust";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";

interface InteractiveImpactVisualizationProps {
  visualization: ImpactVisualization;
  onElementClick?: (elementId: string, data: any) => void;
  className?: string;
}

/**
 * Interactive impact visualization component
 * Displays various charts and metrics showing campaign impact
 */
export const InteractiveImpactVisualization: React.FC<
  InteractiveImpactVisualizationProps
> = ({ visualization, onElementClick, className = "" }) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const handleElementClick = (elementId: string, data: any) => {
    setSelectedElement(selectedElement === elementId ? null : elementId);
    if (onElementClick) {
      onElementClick(elementId, data);
    }
  };

  const getCategoryColor = (category: ImpactCategory): string => {
    const colors = {
      EDUCATION: "#2196f3",
      HEALTHCARE: "#f44336",
      ENVIRONMENT: "#4caf50",
      POVERTY: "#ff9800",
      DISASTER_RELIEF: "#9c27b0",
      HUMAN_RIGHTS: "#607d8b",
      COMMUNITY_DEVELOPMENT: "#795548",
      OTHER: "#9e9e9e",
    };
    return colors[category];
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

  const renderMetricCard = (metric: ImpactMetric, index: number) => (
    <div
      key={index}
      className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleElementClick(`metric_${index}`, metric)}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">{metric.name}</h3>
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: getVerificationColor(metric.verificationLevel),
          }}
          title={formatVerificationLevel(metric.verificationLevel)}
        />
      </div>
      <div className="text-2xl font-bold text-blue-600 mb-1">
        {metric.value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-600">{metric.unit}</div>
      {metric.category !== "OTHER" && (
        <div className="mt-2">
          <span
            className="inline-block px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: getCategoryColor(metric.category) + "20",
              color: getCategoryColor(metric.category),
            }}
          >
            {metric.category}
          </span>
        </div>
      )}
    </div>
  );

  const renderChart = (element: VisualizationElement) => {
    const isSelected = selectedElement === element.id;
    const borderClass = isSelected
      ? "border-blue-500 border-2"
      : "border-gray-200";

    switch (element.type) {
      case "CHART":
        if (Array.isArray(element.data) && element.data.length > 0) {
          // Determine chart type based on data structure
          if (element.data[0].category && element.data[0].value) {
            // Category distribution - use pie chart
            return (
              <div
                key={element.id}
                className={`bg-white p-4 rounded-lg border ${borderClass} hover:shadow-md transition-all cursor-pointer`}
                onClick={() => handleElementClick(element.id, element.data)}
              >
                <h3 className="font-semibold text-gray-800 mb-4">
                  {element.title}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={element.data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, value }) => `${category}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {element.data.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getCategoryColor(entry.category)}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            );
          } else {
            // Generic bar chart
            return (
              <div
                key={element.id}
                className={`bg-white p-4 rounded-lg border ${borderClass} hover:shadow-md transition-all cursor-pointer`}
                onClick={() => handleElementClick(element.id, element.data)}
              >
                <h3 className="font-semibold text-gray-800 mb-4">
                  {element.title}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={element.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          }
        }
        break;

      case "TIMELINE":
        return (
          <div
            key={element.id}
            className={`bg-white p-4 rounded-lg border ${borderClass} hover:shadow-md transition-all cursor-pointer`}
            onClick={() => handleElementClick(element.id, element.data)}
          >
            <h3 className="font-semibold text-gray-800 mb-4">
              {element.title}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={element.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString()
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString()
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="impactCount"
                  stroke="#2196f3"
                  strokeWidth={2}
                  name="Impact Count"
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeImpact"
                  stroke="#4caf50"
                  strokeWidth={2}
                  name="Cumulative Impact"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case "MAP":
        return (
          <div
            key={element.id}
            className={`bg-white p-4 rounded-lg border ${borderClass} hover:shadow-md transition-all cursor-pointer`}
            onClick={() => handleElementClick(element.id, element.data)}
          >
            <h3 className="font-semibold text-gray-800 mb-4">
              {element.title}
            </h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-500 mb-2">🗺️</div>
                <div className="text-sm text-gray-600">Interactive Map</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Array.isArray(element.data) ? element.data.length : 0}{" "}
                  locations
                </div>
              </div>
            </div>
            {Array.isArray(element.data) && (
              <div className="mt-4 space-y-2">
                {element.data
                  .slice(0, 5)
                  .map((location: LocationImpact, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-700">{location.location}</span>
                      <span className="text-blue-600 font-medium">
                        {location.impactCount} impacts
                      </span>
                    </div>
                  ))}
                {element.data.length > 5 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{element.data.length - 5} more locations
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div
            key={element.id}
            className={`bg-white p-4 rounded-lg border ${borderClass} hover:shadow-md transition-all cursor-pointer`}
            onClick={() => handleElementClick(element.id, element.data)}
          >
            <h3 className="font-semibold text-gray-800 mb-4">
              {element.title}
            </h3>
            <div className="text-gray-500">
              Visualization type: {element.type}
            </div>
          </div>
        );
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "metrics", label: "Key Metrics", icon: "📈" },
    { id: "visualizations", label: "Visualizations", icon: "🎯" },
    { id: "verification", label: "Verification", icon: "✅" },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with AI Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Impact Visualization
            </h2>
            <p className="text-gray-600">{visualization.totalImpact}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Confidence Score</div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(visualization.confidenceScore * 100)}%
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Privacy Level: {visualization.privacyLevel}</span>
          <span>•</span>
          <span>
            {visualization.verificationSources.length} Verification Sources
          </span>
          <span>•</span>
          <span>{visualization.keyMetrics.length} Key Metrics</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visualization.keyMetrics
            .slice(0, 6)
            .map((metric, index) => renderMetricCard(metric, index))}
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visualization.keyMetrics.map((metric, index) =>
              renderMetricCard(metric, index),
            )}
          </div>
        </div>
      )}

      {activeTab === "visualizations" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visualization.visualElements.map((element) => renderChart(element))}
        </div>
      )}

      {activeTab === "verification" && (
        <div className="space-y-6">
          {/* Verification Sources */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Verification Sources
            </h3>
            <div className="space-y-4">
              {visualization.verificationSources.map((source, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {source.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      Type: {source.type}
                    </div>
                    <div className="text-xs text-gray-500">
                      Last checked: {source.lastChecked.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Reliability</div>
                    <div className="text-lg font-bold text-green-600">
                      {Math.round(source.reliability * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Summary by Metrics */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Verification Summary
            </h3>
            <div className="space-y-3">
              {Object.entries(
                visualization.keyMetrics.reduce(
                  (acc, metric) => {
                    acc[metric.verificationLevel] =
                      (acc[metric.verificationLevel] || 0) + 1;
                    return acc;
                  },
                  {} as Record<VerificationStatus, number>,
                ),
              ).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: getVerificationColor(
                          level as VerificationStatus,
                        ),
                      }}
                    />
                    <span className="text-gray-700">
                      {formatVerificationLevel(level as VerificationStatus)}
                    </span>
                  </div>
                  <span className="font-medium text-gray-800">
                    {count} metrics
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Element Details */}
      {selectedElement && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-blue-800">
              Selected: {selectedElement}
            </h4>
            <button
              onClick={() => setSelectedElement(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-blue-700">
            Click on different elements to explore detailed information and
            drill down into specific data points.
          </p>
        </div>
      )}
    </div>
  );
};
