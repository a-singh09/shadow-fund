import React, { useState } from "react";
import {
  Link,
  Unlink,
  Search,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Calendar,
  User,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface LinkedCampaign {
  id: string;
  title: string;
  creator: string;
  createdDate: Date;
  status: "active" | "completed" | "paused";
  category: string;
  linkType: "related" | "continuation" | "collaboration" | "duplicate";
  linkReason: string;
  linkedDate: Date;
  linkedBy: string;
}

interface CampaignLinkingProps {
  campaignId: string;
  campaignTitle: string;
  onLink?: (targetCampaignId: string, linkType: string, reason: string) => void;
  onUnlink?: (linkedCampaignId: string) => void;
  className?: string;
}

const CampaignLinking: React.FC<CampaignLinkingProps> = ({
  campaignId,
  campaignTitle,
  onLink,
  onUnlink,
  className,
}) => {
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [linkType, setLinkType] = useState<
    "related" | "continuation" | "collaboration" | "duplicate"
  >("related");
  const [linkReason, setLinkReason] = useState("");
  const [linkedCampaigns, setLinkedCampaigns] = useState<LinkedCampaign[]>([
    // Mock data
    {
      id: "campaign-456",
      title: "School Building Project Phase 2",
      creator: "0xabcd...1234",
      createdDate: new Date("2024-01-10"),
      status: "active",
      category: "Education",
      linkType: "continuation",
      linkReason:
        "This is the second phase of the original school building project",
      linkedDate: new Date("2024-02-01"),
      linkedBy: "admin@shadowflow.com",
    },
    {
      id: "campaign-789",
      title: "Community Education Initiative",
      creator: "0xefgh...5678",
      createdDate: new Date("2024-01-20"),
      status: "completed",
      category: "Education",
      linkType: "related",
      linkReason: "Related educational project in the same community",
      linkedDate: new Date("2024-02-05"),
      linkedBy: "admin@shadowflow.com",
    },
  ]);

  // Mock search results
  const searchResults =
    searchTerm.length > 2
      ? [
          {
            id: "campaign-101",
            title: "Rural School Renovation",
            creator: "0x1111...2222",
            createdDate: new Date("2024-01-15"),
            status: "active" as const,
            category: "Education",
            similarity: 0.85,
          },
          {
            id: "campaign-102",
            title: "Educational Equipment Fund",
            creator: "0x3333...4444",
            createdDate: new Date("2024-01-25"),
            status: "active" as const,
            category: "Education",
            similarity: 0.72,
          },
        ]
      : [];

  const linkTypes = [
    {
      value: "related",
      label: "Related Campaign",
      description: "Campaigns addressing similar causes or communities",
      icon: Link,
      color: "text-blue-400",
    },
    {
      value: "continuation",
      label: "Continuation",
      description: "Follow-up or next phase of this campaign",
      icon: Target,
      color: "text-green-400",
    },
    {
      value: "collaboration",
      label: "Collaboration",
      description: "Joint effort or partnership campaign",
      icon: Plus,
      color: "text-purple-400",
    },
    {
      value: "duplicate",
      label: "Duplicate/Alternative",
      description: "Same or very similar campaign (for transparency)",
      icon: AlertTriangle,
      color: "text-orange-400",
    },
  ];

  const handleLink = async () => {
    if (!selectedCampaign || !linkReason.trim()) {
      toast({
        title: "Missing Information",
        description:
          "Please select a campaign and provide a reason for linking.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const selectedResult = searchResults.find(
        (r) => r.id === selectedCampaign,
      );
      if (selectedResult) {
        const newLink: LinkedCampaign = {
          id: selectedResult.id,
          title: selectedResult.title,
          creator: selectedResult.creator,
          createdDate: selectedResult.createdDate,
          status: selectedResult.status,
          category: selectedResult.category,
          linkType,
          linkReason,
          linkedDate: new Date(),
          linkedBy: "admin@shadowflow.com", // Would come from auth
        };

        setLinkedCampaigns((prev) => [...prev, newLink]);
      }

      if (onLink) {
        onLink(selectedCampaign, linkType, linkReason);
      }

      // Reset form
      setSelectedCampaign("");
      setLinkReason("");
      setSearchTerm("");
      setIsLinking(false);

      toast({
        title: "Campaign Linked",
        description: "The campaigns have been successfully linked.",
      });
    } catch (error) {
      toast({
        title: "Linking Failed",
        description: "Failed to link campaigns. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnlink = async (linkedCampaignId: string) => {
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setLinkedCampaigns((prev) =>
        prev.filter((link) => link.id !== linkedCampaignId),
      );

      if (onUnlink) {
        onUnlink(linkedCampaignId);
      }

      toast({
        title: "Campaign Unlinked",
        description: "The campaign link has been removed.",
      });
    } catch (error) {
      toast({
        title: "Unlinking Failed",
        description: "Failed to unlink campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getLinkTypeColor = (type: string) => {
    const linkType = linkTypes.find((lt) => lt.value === type);
    return linkType?.color || "text-gray-400";
  };

  const getLinkTypeIcon = (type: string) => {
    const linkType = linkTypes.find((lt) => lt.value === type);
    return linkType?.icon || Link;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "completed":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "paused":
        return "text-orange-400 bg-orange-500/20 border-orange-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Link className="w-5 h-5" />
            Campaign Links
          </h3>
          <p className="text-sm text-gray-400">
            Manage relationships between campaigns
          </p>
        </div>
        <Button
          onClick={() => setIsLinking(!isLinking)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Link Campaign
        </Button>
      </div>

      {/* Link Creation Form */}
      {isLinking && (
        <div className="glass p-6 rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-white">
              Link to Another Campaign
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLinking(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Search for campaigns */}
            <div>
              <Label className="text-gray-300 mb-2 block">
                Search Campaigns
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by title, creator, or campaign ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-300">Search Results</Label>
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedCampaign === result.id
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-gray-700/50 hover:border-gray-600/50"
                    }`}
                    onClick={() => setSelectedCampaign(result.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-white">
                          {result.title}
                        </h5>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {result.creator}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {result.createdDate.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {Math.round(result.similarity * 100)}% similar
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Link Type Selection */}
            <div>
              <Label className="text-gray-300 mb-2 block">Link Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {linkTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.value}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        linkType === type.value
                          ? "border-blue-500/50 bg-blue-500/10"
                          : "border-gray-700/50 hover:border-gray-600/50"
                      }`}
                      onClick={() => setLinkType(type.value as any)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${type.color}`} />
                        <span className="font-medium text-white">
                          {type.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {type.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Link Reason */}
            <div>
              <Label className="text-gray-300 mb-2 block">
                Reason for Linking <span className="text-red-400">*</span>
              </Label>
              <Textarea
                placeholder="Explain why these campaigns should be linked..."
                value={linkReason}
                onChange={(e) => setLinkReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsLinking(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleLink}
                disabled={!selectedCampaign || !linkReason.trim()}
              >
                <Link className="w-4 h-4 mr-2" />
                Link Campaigns
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Links */}
      <div className="space-y-3">
        {linkedCampaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Link className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No linked campaigns yet.</p>
            <p className="text-sm">
              Link related campaigns to provide transparency and context.
            </p>
          </div>
        ) : (
          linkedCampaigns.map((link) => {
            const LinkIcon = getLinkTypeIcon(link.linkType);
            return (
              <div
                key={link.id}
                className="glass-subtle p-4 rounded-xl border border-gray-700/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <LinkIcon
                        className={`w-4 h-4 ${getLinkTypeColor(link.linkType)}`}
                      />
                      <h5 className="font-medium text-white">{link.title}</h5>
                      <Badge className={getStatusColor(link.status)}>
                        {link.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {link.creator}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {link.createdDate.toLocaleDateString()}
                      </span>
                      <Badge
                        className={`${getLinkTypeColor(link.linkType)} bg-transparent border`}
                      >
                        {
                          linkTypes.find((lt) => lt.value === link.linkType)
                            ?.label
                        }
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlink(link.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Unlink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Link Reason:</div>
                  <div className="text-sm text-gray-300">{link.linkReason}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Linked by {link.linkedBy} on{" "}
                    {link.linkedDate.toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CampaignLinking;
