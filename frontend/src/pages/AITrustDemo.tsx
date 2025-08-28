import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import MouseFollower from "@/components/MouseFollower";
import Footer from "@/components/Footer";
import { AITrustDashboard } from "@/components/ai-trust";
import { CampaignImpactDashboard } from "@/components/CampaignImpactDashboard";
import { OrganizationImpactDashboard } from "@/components/OrganizationImpactDashboard";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Shield,
  TrendingUp,
  Building,
  Eye,
  BarChart3,
} from "lucide-react";

/**
 * AI Trust System Demo Page
 * Showcases all AI trust features working with real data
 */
const AITrustDemo = () => {
  const [activeDemo, setActiveDemo] = useState<
    "campaign" | "impact" | "organization"
  >("campaign");

  const demoSections = [
    {
      id: "campaign",
      title: "Campaign Trust Analysis",
      description: "Comprehensive AI-powered trust analysis for campaigns",
      icon: Brain,
      color: "red",
    },
    {
      id: "impact",
      title: "Impact Visualization",
      description: "Fund flow tracking and impact verification",
      icon: TrendingUp,
      color: "blue",
    },
    {
      id: "organization",
      title: "Organization Dashboard",
      description: "Impact reporting and credibility management",
      icon: Building,
      color: "green",
    },
  ];

  const mockOrganizationWallet = "0x1234567890123456789012345678901234567890";
  const mockCampaignId = "demo-campaign-001";

  return (
    <div className="min-h-screen bg-background relative">
      <MouseFollower />
      <Navigation />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 glass rounded-2xl border border-red-500/20">
                  <Brain className="w-12 h-12 text-red-400" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
                AI Trust System
                <span className="block text-red-400">Live Demo</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                Experience the power of AI-driven trust analysis, impact
                verification, and fund flow visualization. All features are
                connected to real AI services and provide dynamic, data-driven
                insights.
              </p>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="glass rounded-xl p-6 border border-red-500/20">
                  <Shield className="w-8 h-8 text-red-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    Trust Analysis
                  </h3>
                  <p className="text-sm text-gray-400">
                    Multi-factor credibility scoring with ZK proofs
                  </p>
                </div>
                <div className="glass rounded-xl p-6 border border-blue-500/20">
                  <Eye className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    Content Verification
                  </h3>
                  <p className="text-sm text-gray-400">
                    AI-powered duplicate detection and visual integrity
                  </p>
                </div>
                <div className="glass rounded-xl p-6 border border-green-500/20">
                  <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    Impact Tracking
                  </h3>
                  <p className="text-sm text-gray-400">
                    Real-time fund flow and impact visualization
                  </p>
                </div>
              </div>
            </div>

            {/* Demo Navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {demoSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeDemo === section.id;
                return (
                  <Button
                    key={section.id}
                    onClick={() => setActiveDemo(section.id as any)}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      isActive
                        ? `btn-primary`
                        : `glass text-gray-400 hover:text-white border border-gray-700/50 hover:border-${section.color}-500/30`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">{section.title}</div>
                      <div className="text-xs opacity-75">
                        {section.description}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Demo Content */}
            <div className="space-y-8">
              {activeDemo === "campaign" && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Campaign Trust Analysis Demo
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                      This dashboard shows real AI analysis including
                      credibility scoring, duplicate detection, visual
                      verification, and impact tracking. All data is generated
                      using actual AI services.
                    </p>
                  </div>
                  <AITrustDashboard campaignId={mockCampaignId} />
                </div>
              )}

              {activeDemo === "impact" && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Impact Visualization Demo
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                      Interactive fund flow diagrams and impact tracking with AI
                      verification. Shows how donations flow from donors to
                      beneficiaries with privacy preservation.
                    </p>
                  </div>
                  <CampaignImpactDashboard
                    campaignId={mockCampaignId}
                    campaignTitle="Demo Campaign - Clean Water Initiative"
                  />
                </div>
              )}

              {activeDemo === "organization" && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Organization Dashboard Demo
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                      Complete organization management interface for submitting
                      impact reports, tracking credibility scores, and managing
                      campaigns with AI verification.
                    </p>
                  </div>
                  <OrganizationImpactDashboard
                    organizationWallet={mockOrganizationWallet}
                  />
                </div>
              )}
            </div>

            {/* Technical Details */}
            <div className="mt-16 glass rounded-2xl p-8 border border-gray-700/50">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Technical Implementation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-red-400">
                    AI Services
                  </h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Google Gemini API integration</li>
                    <li>• Real-time credibility scoring</li>
                    <li>• Semantic content analysis</li>
                    <li>• Cross-reference verification</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-blue-400">
                    Visualization
                  </h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• D3.js Sankey diagrams</li>
                    <li>• Interactive Recharts</li>
                    <li>• Privacy-preserving aggregation</li>
                    <li>• Real-time data updates</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-green-400">
                    Privacy & Security
                  </h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Zero-knowledge attestations</li>
                    <li>• Encrypted impact reports</li>
                    <li>• On-chain signature verification</li>
                    <li>• Aggregated fund flow data</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Build Trust?
              </h3>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                Experience the future of transparent, AI-verified crowdfunding.
                Every feature you see here is powered by real AI services and
                blockchain technology.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="btn-primary px-8 py-3">
                  Create Campaign
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-gray-800 px-8 py-3"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AITrustDemo;
