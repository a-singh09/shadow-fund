import { useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import MouseFollower from "@/components/MouseFollower";
import Footer from "@/components/Footer";
import CampaignCard from "@/components/CampaignCard";
import {
  Search,
  TrendingUp,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  Shield,
  Brain,
  Eye,
} from "lucide-react";
import { useCampaignList } from "@/hooks/useCampaignList";
import { getCampaignImage } from "@/lib/campaignImages";

const Campaigns = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "trending" | "ending-soon" | "new"
  >("all");

  const { campaigns, loading, error, refetch } = useCampaignList();

  // Filter and search campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (campaign) =>
          campaign.title.toLowerCase().includes(search) ||
          campaign.description.toLowerCase().includes(search) ||
          campaign.creator.toLowerCase().includes(search),
      );
    }

    // Apply category filters
    switch (activeFilter) {
      case "trending":
        // Sort by donation count (most donations first)
        filtered = [...filtered].sort(
          (a, b) => Number(b.donationCount) - Number(a.donationCount),
        );
        break;
      case "ending-soon":
        // Sort by deadline (soonest first) - only active campaigns
        filtered = [...filtered]
          .filter((campaign) => campaign.isActive)
          .sort((a, b) => Number(a.deadline) - Number(b.deadline));
        break;
      case "new":
        // Sort by creation (newest first) - using donation count as proxy for now
        filtered = [...filtered].sort(
          (a, b) => Number(a.donationCount) - Number(b.donationCount),
        );
        break;
      default:
        // Show active campaigns first
        filtered = [...filtered].sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return Number(b.donationCount) - Number(a.donationCount);
        });
    }

    return filtered;
  }, [campaigns, searchTerm, activeFilter]);

  // Calculate days left for a campaign
  const getDaysLeft = (deadline: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const deadlineSeconds = Number(deadline);
    const secondsLeft = deadlineSeconds - now;
    return Math.max(0, Math.ceil(secondsLeft / (24 * 60 * 60)));
  };

  // Calculate progress percentage (mock calculation since amounts are private)
  const getProgressPercentage = (donationCount: bigint) => {
    // Mock progress based on donation count for demo purposes
    const count = Number(donationCount);
    if (count === 0) return 0;
    if (count <= 5) return Math.min(count * 15, 75);
    if (count <= 10) return Math.min(75 + (count - 5) * 5, 95);
    return Math.min(95 + (count - 10) * 1, 100);
  };

  // Format creator address for display
  const formatCreator = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background relative">
      <MouseFollower />
      <Navigation />

      <main className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Discover <span className="gradient-text">Campaigns</span>
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed mb-8">
                Support innovative projects while protecting your privacy
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns, creators, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 glass rounded-xl border border-red-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2 sm:gap-4 justify-center mb-8">
                {[
                  { key: "all", text: "All", icon: Sparkles },
                  { key: "trending", text: "Trending", icon: TrendingUp },
                  { key: "ending-soon", text: "Ending Soon", icon: Clock },
                  { key: "new", text: "New", icon: Sparkles },
                ].map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.key;
                  return (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key as any)}
                      className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 glass rounded-full border transition-all duration-300 text-sm sm:text-base ${
                        isActive
                          ? "border-red-500/50 bg-red-500/20 text-red-300"
                          : "border-red-500/20 text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{filter.text}</span>
                      <span className="sm:hidden">
                        {filter.text.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* AI Trust Features Banner */}
              <div className="glass rounded-2xl p-6 border border-blue-500/20 mb-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">
                    AI-Powered Trust & Safety
                  </h3>
                </div>
                <p className="text-gray-400 mb-4">
                  Every campaign is analyzed by our advanced AI system for
                  credibility, authenticity, and fraud prevention.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 glass-subtle rounded-lg border border-gray-700/50">
                    <Shield className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        Credibility Scoring
                      </div>
                      <div className="text-xs text-gray-400">
                        Multi-factor trust analysis
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 glass-subtle rounded-lg border border-gray-700/50">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        Content Verification
                      </div>
                      <div className="text-xs text-gray-400">
                        Duplicate & fraud detection
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 glass-subtle rounded-lg border border-gray-700/50">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-sm font-medium text-white">
                        AI Analysis
                      </div>
                      <div className="text-xs text-gray-400">
                        Powered by Google Gemini
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              {!loading && (
                <button
                  onClick={refetch}
                  className="inline-flex items-center space-x-2 px-4 py-2 glass rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-300"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center space-x-3 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading campaigns...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex items-center space-x-3 text-red-400 bg-red-500/10 px-6 py-4 rounded-xl border border-red-500/20 mb-4">
                  <AlertCircle className="w-6 h-6" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={refetch}
                  className="flex items-center space-x-2 px-4 py-2 glass rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-300"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredCampaigns.length === 0 && (
              <div className="text-center py-20">
                <div className="text-gray-400 mb-4">
                  {campaigns.length === 0 ? (
                    <>
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-xl mb-2">No campaigns yet</p>
                      <p>
                        Be the first to create a campaign and start raising
                        funds!
                      </p>
                    </>
                  ) : (
                    <>
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-xl mb-2">No campaigns found</p>
                      <p>Try adjusting your search or filters</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Campaigns Grid */}
            {!loading && !error && filteredCampaigns.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {filteredCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.address}
                      id={campaign.address}
                      title={campaign.title}
                      creator={formatCreator(campaign.creator)}
                      description={campaign.description}
                      category="privacy" // Default category for red theme
                      image={getCampaignImage(campaign.address) || ""} // Use stored image hash
                      supportersCount={Number(campaign.donationCount)}
                      daysLeft={getDaysLeft(campaign.deadline)}
                      progressPercentage={getProgressPercentage(
                        campaign.donationCount,
                      )}
                      isActive={campaign.isActive}
                    />
                  ))}
                </div>

                {/* Results Summary */}
                <div className="text-center mt-12 text-gray-400">
                  <p>
                    Showing {filteredCampaigns.length} of {campaigns.length}{" "}
                    campaigns
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Campaigns;
