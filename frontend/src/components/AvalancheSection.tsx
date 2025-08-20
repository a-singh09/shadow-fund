import { Shield, Zap, DollarSign, Leaf } from 'lucide-react';
import avalancheLogo from '@/assets/avalanche-logo.png';

const AvalancheSection = () => {
  const features = [
    {
      title: "eERC20 Protocol",
      description: "Advanced encrypted token standard ensuring complete donation privacy",
      icon: Shield
    },
    {
      title: "Sub-Second Finality",
      description: "Lightning-fast transactions with immediate confirmation on Avalanche C-Chain",
      icon: Zap
    },
    {
      title: "Low Gas Fees",
      description: "Minimal transaction costs make micro-donations economically viable",
      icon: DollarSign
    },
    {
      title: "Eco-Friendly",
      description: "Proof-of-Stake consensus with minimal environmental impact",
      icon: Leaf
    }
  ];

  const techSpecs = [
    "Network: Avalanche C-Chain",
    "Token Standard: eERC20",
    "Consensus: Avalanche Consensus",
    "Finality: <1 second"
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Powered by <span className="gradient-text">Avalanche</span>
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            Built on the fastest smart contract platform with enterprise-grade security
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Visual */}
          <div className="relative">
            <div className="glass-strong p-8 rounded-2xl border border-red-500/20 overflow-hidden group hover-lift">
              <img 
                src={avalancheLogo} 
                alt="Avalanche Network Visualization"
                className="w-full h-64 object-cover rounded-xl mb-6 group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Tech Specs Overlay */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white mb-4">Technical Specifications</h3>
                {techSpecs.map((spec, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <span className="text-gray-300 font-mono text-sm">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              
              return (
                <div
                  key={index}
                  className="glass p-6 rounded-xl border border-white/10 hover-lift hover-glow group transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 flex-shrink-0 group-hover:bg-red-500/20 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-100 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: "Transactions/sec", value: "4,500+" },
            { label: "Validators", value: "2,000+" },
            { label: "Network Uptime", value: "99.9%" },
            { label: "Carbon Neutral", value: "✅" }
          ].map((stat, index) => (
            <div key={index} className="text-center glass p-6 rounded-xl border border-red-500/20 hover-lift">
              <div className="text-2xl sm:text-3xl font-bold gradient-text mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Integration CTA */}
        <div className="mt-16 text-center">
          <div className="glass-strong p-8 rounded-2xl border border-red-500/20 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Experience Avalanche Speed
            </h3>
            <p className="text-gray-400 mb-6">
              Join thousands of projects leveraging Avalanche's cutting-edge infrastructure for lightning-fast, secure, and eco-friendly transactions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary px-6 py-3 font-semibold hover-lift">
                Try It Now
              </button>
              <a 
                href="https://docs.avax.network" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary px-6 py-3 font-semibold hover-lift"
              >
                Read Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AvalancheSection;