import React, { useState } from "react";
import { ArrowRight, Sparkles, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ImpactConstellation from "./ImpactConstellation";

interface ImpactCategory {
  id: string;
  name: string;
  color: string;
  impactCount: number;
  description: string;
}

const ImpactConstellationSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] =
    useState<ImpactCategory | null>(null);

  const handleCategoryClick = (category: ImpactCategory) => {
    setSelectedCategory(category);
  };

  const resetSelection = () => {
    setSelectedCategory(null);
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />

      {/* Animated background particles */}
      <div className="absolute inset-0 floating-particles opacity-30" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 privacy-badge mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Impact Visualization</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="gradient-text">Together, We Build</span>
            <br />
            <span className="text-white">A Brighter Constellation</span>
          </h2>

          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            Every donation creates a star of hope. Watch how individual
            contributions form constellations of change across education,
            healthcare, climate action, and humanitarian aid.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center space-x-2 text-gray-400">
              <Users className="w-5 h-5" />
              <span>16,130+ donations creating impact</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Heart className="w-5 h-5 text-red-400" />
              <span>12 unique constellations</span>
            </div>
          </div>
        </div>

        {/* Constellation Visualization */}
        <div className="relative">
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="relative h-[500px] lg:h-[600px] w-full">
              <ImpactConstellation
                width={1200}
                height={600}
                className="w-full h-full"
                onCategoryClick={handleCategoryClick}
              />

              {/* Overlay instructions */}
              <div className="absolute top-4 right-4 glass p-4 rounded-lg max-w-xs">
                <h3 className="font-semibold text-sm mb-2 text-white">
                  Interactive Constellation
                </h3>
                <p className="text-xs text-gray-300 mb-2">
                  Hover over star clusters to explore different impact
                  categories
                </p>
                <div className="text-xs text-gray-400">
                  Click on a constellation to learn more
                </div>
              </div>

              {/* Reset button when category is selected */}
              {selectedCategory && (
                <div className="absolute bottom-4 left-4">
                  <Button
                    onClick={resetSelection}
                    className="btn-ghost text-sm"
                  >
                    ← View All Constellations
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Category Details Panel */}
          {selectedCategory && (
            <div
              className="glass rounded-xl p-6 mb-8 border-l-4"
              style={{ borderLeftColor: selectedCategory.color }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3
                    className="text-2xl font-bold mb-2"
                    style={{ color: selectedCategory.color }}
                  >
                    {selectedCategory.name} Impact
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {selectedCategory.description}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: selectedCategory.color }}
                  >
                    {selectedCategory.impactCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">donations</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="glass-subtle p-4 rounded-lg">
                  <div className="text-lg font-semibold text-white mb-1">
                    {Math.floor(
                      selectedCategory.impactCount * 0.7,
                    ).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Active Projects</div>
                </div>
                <div className="glass-subtle p-4 rounded-lg">
                  <div className="text-lg font-semibold text-white mb-1">
                    {Math.floor(
                      selectedCategory.impactCount * 0.3,
                    ).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Lives Impacted</div>
                </div>
                <div className="glass-subtle p-4 rounded-lg">
                  <div className="text-lg font-semibold text-white mb-1">
                    {Math.floor(
                      selectedCategory.impactCount * 0.1,
                    ).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Organizations</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/campaigns" className="flex-1">
                  <Button className="btn-primary w-full flex items-center justify-center space-x-2">
                    <span>Explore {selectedCategory.name} Campaigns</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/create-campaign" className="flex-1">
                  <Button className="btn-secondary w-full">
                    Start Your Own Campaign
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Inspirational Message */}
          <div className="text-center">
            <div className="glass rounded-xl p-8 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 gradient-text">
                "Together, we build a brighter constellation of hope"
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Each star represents real impact made possible by donors like
                you. When individual contributions connect, they form powerful
                constellations of change that light up communities around the
                world.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/create-campaign">
                  <Button className="btn-primary px-8 py-3 flex items-center space-x-2 hover-lift hover-glow">
                    <Sparkles className="w-5 h-5" />
                    <span>Create Your Star</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>

                <Link to="/campaigns">
                  <Button className="btn-secondary px-8 py-3 flex items-center space-x-2 hover-lift">
                    <Heart className="w-5 h-5" />
                    <span>Join a Constellation</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Statistics */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { label: "Total Impact Stars", value: "16,130", icon: "⭐" },
            { label: "Unique Constellations", value: "12", icon: "✨" },
            { label: "Lives Touched", value: "48,000+", icon: "❤️" },
            { label: "Global Reach", value: "85 Countries", icon: "🌍" },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center space-y-2 fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactConstellationSection;
