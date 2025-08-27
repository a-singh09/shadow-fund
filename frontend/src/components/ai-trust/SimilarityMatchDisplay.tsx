import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  BarChart3,
  FileText,
  Languages,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SimilarityMatch, TextSegment } from "@/types/aiTrust";

interface SimilarityMatchDisplayProps {
  matches: SimilarityMatch[];
  originalText: string;
  showFullText?: boolean;
  maxMatches?: number;
  onViewCampaign?: (campaignId: string) => void;
  className?: string;
}

interface HighlightedText {
  text: string;
  isHighlighted: boolean;
  similarity?: number;
}

const SimilarityMatchDisplay: React.FC<SimilarityMatchDisplayProps> = ({
  matches,
  originalText,
  showFullText = false,
  maxMatches = 5,
  onViewCampaign,
  className,
}) => {
  const { toast } = useToast();
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(
    new Set(),
  );
  const [showAllMatches, setShowAllMatches] = useState(false);

  const displayedMatches = showAllMatches
    ? matches
    : matches.slice(0, maxMatches);

  const toggleMatchExpansion = (campaignId: string) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId);
    } else {
      newExpanded.add(campaignId);
    }
    setExpandedMatches(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied to your clipboard.",
      });
    });
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9)
      return "text-red-400 bg-red-500/20 border-red-500/30";
    if (similarity >= 0.7)
      return "text-orange-400 bg-orange-500/20 border-orange-500/30";
    if (similarity >= 0.5)
      return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
    return "text-green-400 bg-green-500/20 border-green-500/30";
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.9) return "Very High";
    if (similarity >= 0.7) return "High";
    if (similarity >= 0.5) return "Medium";
    return "Low";
  };

  const highlightMatchedSegments = (
    text: string,
    segments: TextSegment[],
  ): HighlightedText[] => {
    if (!segments.length) return [{ text, isHighlighted: false }];

    const result: HighlightedText[] = [];
    let lastIndex = 0;

    // Sort segments by start index
    const sortedSegments = [...segments].sort(
      (a, b) => a.startIndex - b.startIndex,
    );

    sortedSegments.forEach((segment) => {
      // Add text before the segment
      if (segment.startIndex > lastIndex) {
        result.push({
          text: text.slice(lastIndex, segment.startIndex),
          isHighlighted: false,
        });
      }

      // Add the highlighted segment
      result.push({
        text: text.slice(segment.startIndex, segment.endIndex),
        isHighlighted: true,
        similarity: segment.similarity,
      });

      lastIndex = segment.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push({
        text: text.slice(lastIndex),
        isHighlighted: false,
      });
    }

    return result;
  };

  const renderHighlightedText = (highlightedParts: HighlightedText[]) => (
    <div className="text-sm leading-relaxed">
      {highlightedParts.map((part, index) => (
        <span
          key={index}
          className={
            part.isHighlighted
              ? "bg-orange-500/30 border border-orange-500/50 rounded px-1 py-0.5 font-medium"
              : ""
          }
          title={
            part.isHighlighted
              ? `Similarity: ${Math.round((part.similarity || 0) * 100)}%`
              : undefined
          }
        >
          {part.text}
        </span>
      ))}
    </div>
  );

  const renderMatchCard = (match: SimilarityMatch) => {
    const isExpanded = expandedMatches.has(match.campaignId);
    const mockCampaignData = {
      title: `Campaign ${match.campaignId}`,
      creator: "0x1234...5678",
      createdDate: new Date("2024-01-15"),
      status: "active" as const,
    };

    return (
      <div
        key={match.campaignId}
        className="glass-subtle rounded-xl p-4 border border-gray-700/50"
      >
        {/* Match Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white">
                {mockCampaignData.title}
              </h4>
              <Badge
                className={`text-xs ${getSimilarityColor(match.similarity)}`}
              >
                {Math.round(match.similarity * 100)}% match
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {mockCampaignData.creator}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {mockCampaignData.createdDate.toLocaleDateString()}
              </span>
              {match.originalLanguage !== match.detectedLanguage && (
                <span className="flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  {match.originalLanguage} → {match.detectedLanguage}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleMatchExpansion(match.campaignId)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Similarity Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">
              {Math.round(match.similarity * 100)}%
            </div>
            <div className="text-xs text-gray-400">Overall</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">
              {match.matchedSegments.length}
            </div>
            <div className="text-xs text-gray-400">Segments</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">
              {getSimilarityLabel(match.similarity)}
            </div>
            <div className="text-xs text-gray-400">Risk Level</div>
          </div>
        </div>

        {/* Matched Segments Preview */}
        <div className="space-y-2 mb-3">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Top matched segments:
          </div>
          {match.matchedSegments
            .slice(0, isExpanded ? undefined : 2)
            .map((segment, index) => (
              <div
                key={index}
                className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    Segment {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-xs ${getSimilarityColor(segment.similarity || 0)}`}
                    >
                      {Math.round((segment.similarity || 0) * 100)}%
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(segment.text)}
                      className="text-gray-400 hover:text-white p-1 h-auto"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-300 bg-gray-900/50 rounded p-2 border-l-2 border-orange-500/50">
                  "{segment.text}"
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Position: {segment.startIndex}-{segment.endIndex}
                </div>
              </div>
            ))}

          {!isExpanded && match.matchedSegments.length > 2 && (
            <div className="text-xs text-gray-500 text-center">
              +{match.matchedSegments.length - 2} more segments
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onViewCampaign && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewCampaign(match.campaignId)}
              className="text-gray-400 border-gray-600 hover:bg-gray-800"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Campaign
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(match.campaignId)}
            className="text-gray-400 hover:text-white"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy ID
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Compare
          </Button>
        </div>
      </div>
    );
  };

  if (!matches.length) {
    return (
      <div className={`text-center py-8 text-gray-400 ${className}`}>
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No similar campaigns found.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Similarity Analysis
        </h3>
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
          {matches.length} match{matches.length !== 1 ? "es" : ""} found
        </Badge>
      </div>

      {/* Original Text (if requested) */}
      {showFullText && (
        <div className="glass-subtle rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">Original Text</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(originalText)}
              className="text-gray-400 hover:text-white"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
          <div className="text-sm text-gray-300 leading-relaxed">
            {originalText}
          </div>
        </div>
      )}

      {/* Matches */}
      <div className="space-y-3">{displayedMatches.map(renderMatchCard)}</div>

      {/* Show More/Less Button */}
      {matches.length > maxMatches && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setShowAllMatches(!showAllMatches)}
            className="text-gray-400 hover:text-white"
          >
            {showAllMatches ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show {matches.length - maxMatches} More
              </>
            )}
          </Button>
        </div>
      )}

      {/* Analysis Summary */}
      <div className="glass-subtle rounded-xl p-4 border border-gray-700/50">
        <h4 className="font-semibold text-white mb-3">Analysis Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-orange-400">
              {Math.round(
                (matches.reduce((sum, m) => sum + m.similarity, 0) /
                  matches.length) *
                  100,
              )}
              %
            </div>
            <div className="text-xs text-gray-400">Avg. Similarity</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-400">
              {matches.reduce((sum, m) => sum + m.matchedSegments.length, 0)}
            </div>
            <div className="text-xs text-gray-400">Total Segments</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-400">
              {
                matches.filter((m) => m.originalLanguage !== m.detectedLanguage)
                  .length
              }
            </div>
            <div className="text-xs text-gray-400">Cross-Language</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400">
              {matches.filter((m) => m.similarity >= 0.8).length}
            </div>
            <div className="text-xs text-gray-400">High Risk</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarityMatchDisplay;
