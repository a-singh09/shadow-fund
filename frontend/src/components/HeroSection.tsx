import { Plus, Search, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden floating-particles">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-red-900/20" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Privacy Badge */}
          <div className="inline-flex items-center space-x-2 privacy-badge mb-6">
            <Lock className="w-4 h-4 lock-pulse" />
            <span>100% Private & Encrypted</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="gradient-text">Private Funding,</span>
            <br />
            <span className="text-white">Unstoppable Freedom</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-300 font-medium max-w-3xl mx-auto leading-relaxed">
            Censorship-resistant funding platform with complete privacy
            protection powered by{" "}
            <span className="text-red-400 font-semibold">
              Avalanche's encrypted eERC20 tokens
            </span>
          </p>

          {/* Description */}
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Built on Avalanche's lightning-fast network with zero-knowledge
            encryption and AI-powered trust verification to ensure your
            financial privacy and protect against fraud and censorship.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link to="/create-campaign">
              <Button className="btn-primary px-8 py-4 text-lg font-semibold flex items-center space-x-2 hover-lift hover-glow group">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create Campaign</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>

            <Link to="/campaigns">
              <Button className="btn-secondary px-8 py-4 text-lg font-semibold flex items-center space-x-2 hover-lift group">
                <Search className="w-5 h-5" />
                <span>Explore Campaigns</span>
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { label: "Built on Avalanche", value: "⚡" },
              { label: "Zero-Knowledge Privacy", value: "🔒" },
              { label: "AI Trust Verification", value: "🧠" },
              { label: "Fraud Prevention", value: "🛡️" },
            ].map((indicator, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-2xl">{indicator.value}</div>
                <div className="text-xs text-gray-400 font-medium">
                  {indicator.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div
        className="absolute top-20 left-10 w-4 h-4 bg-red-400/30 rounded-full animate-float"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute top-40 right-20 w-6 h-6 bg-red-500/20 rounded-full animate-float"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-40 left-20 w-3 h-3 bg-red-300/40 rounded-full animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-20 right-10 w-5 h-5 bg-red-400/25 rounded-full animate-float"
        style={{ animationDelay: "1.5s" }}
      />
    </section>
  );
};

export default HeroSection;
