import { ShieldCheck, Zap, EyeOff, BarChart3 } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: "Zero-Knowledge Privacy",
      description:
        "Donation amounts remain completely encrypted using Avalanche's battle-tested eERC20 protocol. Only you and the creator can see your contribution.",
      highlight: "100% Private",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Sub-second transaction confirmations on Avalanche's high-performance network. No more waiting for slow blockchain confirmations.",
      highlight: "<1s Transfers",
    },
    {
      icon: EyeOff,
      title: "Anonymous Support",
      description:
        "Support causes you believe in without revealing your identity. Your privacy is guaranteed by cryptographic proofs.",
      highlight: "Full Anonymity",
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description:
        "Campaign creators get powerful insights and donation tracking while preserving complete donor privacy through encrypted data.",
      highlight: "Privacy-Safe Insights",
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Why Choose <span className="gradient-text">ShadowFund</span>?
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            Privacy-first crowdfunding with enterprise-grade security
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="glass-strong p-8 rounded-2xl hover-lift hover-glow group transition-all duration-500"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon and Highlight */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 group-hover:bg-red-500/20 transition-colors duration-300">
                      <Icon className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-red-100 transition-colors duration-300">
                        {feature.title}
                      </h3>
                    </div>
                  </div>
                  <span className="privacy-badge text-xs">
                    {feature.highlight}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  {feature.description}
                </p>

                {/* Hover Effect Line */}
                <div className="mt-6 h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-block glass p-6 rounded-2xl border border-red-500/20">
            <p className="text-gray-300 mb-4">
              Ready to experience the future of private crowdfunding?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary px-6 py-3 text-sm font-semibold hover-lift">
                Start Your Campaign
              </button>
              <button className="btn-secondary px-6 py-3 text-sm font-semibold hover-lift">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
