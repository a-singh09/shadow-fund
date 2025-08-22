import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import MouseFollower from "@/components/MouseFollower";
import Footer from "@/components/Footer";
import DonationSidebar from "@/components/DonationSidebar";
import { useCampaign } from "@/hooks/useCampaign";
import { getIPFSUrl } from "@/lib/ipfs";
import { getCampaignFallbackImage } from "@/lib/placeholders";
import { getCampaignImage } from "@/lib/campaignImages";
import {
  Heart,
  Share2,
  Clock,
  Users,
  Calendar,
  MapPin,
  Target,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CampaignDetail = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Use the campaign hook to fetch real data
  const { getCampaignInfo, getDonationHashes, isLoading } = useCampaign(id);

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!id) {
        setError("Campaign ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to fetch real campaign data
        const campaignInfo = await getCampaignInfo();

        if (campaignInfo) {
          // Convert blockchain data to UI format
          const now = Date.now();
          const deadline = Number(campaignInfo.deadline) * 1000; // Convert to milliseconds
          const daysLeft = Math.max(
            0,
            Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)),
          );

          setCampaign({
            id: id,
            title: campaignInfo.title,
            creator: campaignInfo.creator,
            description: campaignInfo.description,
            fullDescription: campaignInfo.description, // Use same description for now
            category: "privacy", // Default category for red theme
            image: getCampaignImage(id) || "", // Use stored image hash
            supportersCount: Number(campaignInfo.donationCount),
            daysLeft: daysLeft,
            progressPercentage: 0, // We don't have goal amount to calculate this
            location: "Blockchain", // Default location
            createdDate: new Date().toISOString().split("T")[0],
            goal: "Private Goal Amount",
            raised: `${Number(campaignInfo.donationCount)} donations received`,
            isActive: campaignInfo.isActive,
            updates: [], // No updates data available from contract
          });
        } else {
          // Fallback to mock data if contract not deployed or campaign not found
          setCampaign(getMockCampaignData(id));
        }
      } catch (err) {
        console.warn("Failed to fetch campaign data, using mock data:", err);
        // Fallback to mock data
        setCampaign(getMockCampaignData(id));
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [id, getCampaignInfo]);

  // Mock campaign data fallback
  const getMockCampaignData = (campaignId: string) => ({
    id: campaignId || "1",
    title: "Privacy-First Social Network",
    creator: "0xb73c17CC80527e300D122263D67144112F92e804", // Mock creator address
    description:
      "Building a decentralized social platform where your data stays yours. No tracking, no ads, just genuine connections with complete privacy protection.",
    fullDescription: `We're creating the future of social networking - a platform that puts privacy first and users in control of their data.

In today's digital landscape, your personal information has become a commodity traded without your knowledge or consent. Social media giants collect vast amounts of data about your behaviors, relationships, and preferences, often using this information in ways that don't serve your best interests.

Our privacy-first social network changes this dynamic entirely. Built on decentralized technology, it ensures that your data remains yours and yours alone. No tracking cookies, no behavioral profiling, no selling your information to advertisers.

Key features include:
• End-to-end encrypted messaging
• Decentralized data storage
• Zero-knowledge architecture
• Open-source transparency
• Community governance
• Ad-free experience

We believe that meaningful connections shouldn't come at the cost of your privacy. Join us in building a social platform that respects your digital rights and empowers genuine human connection.`,
    category: "Privacy",
    image: "", // No image in mock data
    supportersCount: 67,
    daysLeft: 23,
    progressPercentage: 68,
    location: "San Francisco, CA",
    createdDate: "2024-01-15",
    goal: "Private Goal Amount",
    raised: "68% of goal reached",
    updates: [
      {
        date: "2024-01-20",
        title: "Development Milestone Reached",
        content:
          "We've successfully implemented the core encryption protocols.",
      },
      {
        date: "2024-01-18",
        title: "Team Update",
        content: "Welcomed two new privacy experts to our development team.",
      },
    ],
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background relative">
        <MouseFollower />
        <Navigation />
        <main className="pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-red-400 mx-auto animate-spin" />
                <h2 className="text-2xl font-bold text-white">
                  Loading Campaign
                </h2>
                <p className="text-gray-400">
                  Fetching campaign data from blockchain...
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-background relative">
        <MouseFollower />
        <Navigation />
        <main className="pt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                <h2 className="text-2xl font-bold text-white">
                  Campaign Not Found
                </h2>
                <p className="text-gray-400">{error}</p>
                <Button
                  onClick={() => window.history.back()}
                  className="btn-primary"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  // Get proper image URL (handle IPFS hashes and data URLs)
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return "";

    // If it's a data URL, return as-is
    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }

    // If it's an IPFS hash, convert to URL
    if (imageUrl.startsWith("Qm") || imageUrl.startsWith("ipfs://")) {
      return getIPFSUrl(imageUrl);
    }

    // Return as-is for regular URLs
    return imageUrl;
  };

  const imageUrl = getImageUrl(campaign.image);
  const fallbackImage = getCampaignFallbackImage(
    campaign.title,
    campaign.category,
  );
  const shouldShowFallback = !imageUrl || imageError;

  return (
    <div className="min-h-screen bg-background relative">
      <MouseFollower />
      <Navigation />

      <main className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Campaign Header */}
                <div className="mb-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="text-sm text-red-400 font-medium bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">
                      {campaign.category}
                    </span>
                    <div className="flex items-center space-x-1 text-sm text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{campaign.location}</span>
                    </div>
                    {campaign.creator?.startsWith("0x") && (
                      <span className="text-xs text-green-400 font-medium bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
                        On-Chain Data
                      </span>
                    )}
                  </div>

                  <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                    {campaign.title}
                  </h1>

                  <p className="text-xl text-gray-400 mb-6">
                    by{" "}
                    <span className="text-white font-medium font-mono text-sm">
                      {campaign.creator?.startsWith("0x")
                        ? `${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}`
                        : campaign.creator}
                    </span>
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-400 border-gray-600 hover:bg-gray-800"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-400 border-gray-600 hover:bg-gray-800"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Follow
                    </Button>
                  </div>
                </div>

                {/* Campaign Image */}
                <div className="relative mb-8 rounded-2xl overflow-hidden bg-gray-800">
                  {shouldShowFallback ? (
                    // Fallback when no image or image fails to load
                    <img
                      src={fallbackImage}
                      alt={campaign.title}
                      className="w-full h-96 object-cover"
                    />
                  ) : (
                    <>
                      <img
                        src={imageUrl}
                        alt={campaign.title}
                        className={`w-full h-96 object-cover transition-all duration-300 ${
                          imageLoading ? "opacity-0" : "opacity-100"
                        }`}
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          setImageError(true);
                          setImageLoading(false);
                        }}
                      />
                      {/* Loading placeholder */}
                      {imageLoading && (
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <div className="w-8 h-8 border-2 border-gray-600 border-t-red-500 rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-sm">Loading image...</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Campaign Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div className="glass rounded-xl p-6 border border-red-500/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-gray-400">
                        {campaign.creator?.startsWith("0x")
                          ? "Donations"
                          : "Supporters"}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {campaign.supportersCount}
                    </p>
                  </div>

                  <div className="glass rounded-xl p-6 border border-red-500/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-gray-400">Days Left</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {campaign.daysLeft}
                    </p>
                    {campaign.isActive !== undefined && (
                      <p
                        className={`text-xs mt-1 ${campaign.isActive ? "text-green-400" : "text-red-400"}`}
                      >
                        {campaign.isActive ? "Active" : "Inactive"}
                      </p>
                    )}
                  </div>

                  <div className="glass rounded-xl p-6 border border-red-500/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-gray-400">
                        {campaign.creator?.startsWith("0x")
                          ? "Status"
                          : "Progress"}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {campaign.creator?.startsWith("0x")
                        ? "Live"
                        : `${campaign.progressPercentage}%`}
                    </p>
                  </div>
                </div>

                {/* Blockchain Info (for real campaigns) */}
                {campaign.creator?.startsWith("0x") && (
                  <div className="glass rounded-2xl p-8 border border-green-500/20 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">
                      Blockchain Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Campaign Address:</span>
                        <p className="text-white font-mono break-all">{id}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Creator Address:</span>
                        <p className="text-white font-mono break-all">
                          {campaign.creator}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Network:</span>
                        <p className="text-white">Avalanche Fuji Testnet</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Privacy:</span>
                        <p className="text-green-400">
                          eERC20 Encrypted Donations
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campaign Description */}
                <div className="glass rounded-2xl p-8 border border-red-500/20 mb-8">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    About this project
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    {campaign.fullDescription
                      .split("\n\n")
                      .map((paragraph, index) => (
                        <p
                          key={index}
                          className="text-gray-300 leading-relaxed mb-4"
                        >
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </div>

                {/* Campaign Updates */}
                <div className="glass rounded-2xl p-8 border border-red-500/20">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Recent Updates
                  </h2>
                  <div className="space-y-6">
                    {campaign.updates && campaign.updates.length > 0 ? (
                      campaign.updates.map((update, index) => (
                        <div
                          key={index}
                          className="border-l-2 border-red-500/30 pl-6"
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-gray-400">
                              {update.date}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {update.title}
                          </h3>
                          <p className="text-gray-300">{update.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">
                          No updates available yet
                        </p>
                        {campaign.creator?.startsWith("0x") && (
                          <p className="text-sm text-gray-500 mt-2">
                            Updates are not stored on-chain in the current
                            implementation
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Donation Sidebar */}
              <div className="lg:col-span-1">
                <DonationSidebar
                  campaign={campaign}
                  campaignAddress={id} // Use campaign ID as contract address
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CampaignDetail;
