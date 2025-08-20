import { Lock, ShieldCheck, Zap, Infinity } from 'lucide-react';

const StatsSection = () => {
  const stats = [
    {
      number: "100%",
      label: "Private Donations",
      description: "Complete donation privacy guaranteed",
      icon: Lock
    },
    {
      number: "0",
      label: "Data Breaches",
      description: "Zero privacy compromises since launch",
      icon: ShieldCheck
    },
    {
      number: "<1s",
      label: "Transaction Time",
      description: "Lightning-fast Avalanche confirmations",
      icon: Zap
    },
    {
      number: "∞",
      label: "Privacy Guaranteed",
      description: "Cryptographically proven privacy",
      icon: Infinity
    }
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Privacy by the <span className="gradient-text">Numbers</span>
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            Measurable privacy protection you can trust
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <div
                key={index}
                className="text-center glass-strong p-8 rounded-2xl border border-red-500/20 hover-lift hover-glow group transition-all duration-500"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 group-hover:bg-red-500/20 transition-colors duration-300">
                    <Icon className="w-8 h-8 text-red-400 lock-pulse" />
                  </div>
                </div>

                {/* Number */}
                <div className="text-4xl sm:text-5xl font-bold gradient-text mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>

                {/* Label */}
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-100 transition-colors duration-300">
                  {stat.label}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                  {stat.description}
                </p>

                {/* Animated Bottom Line */}
                <div className="mt-6 h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
              </div>
            );
          })}
        </div>

        {/* Additional Security Info */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="glass p-8 rounded-2xl border border-red-500/20 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Mathematically Proven Privacy
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Our privacy guarantees aren't just promises - they're backed by cutting-edge cryptographic proofs that make it mathematically impossible to breach your privacy. 
              Built on Avalanche's tested infrastructure with additional zero-knowledge layers.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
              {[
                { title: "Zero-Knowledge Proofs", description: "Cryptographic verification without data exposure" },
                { title: "eERC20 Encryption", description: "Advanced token-level privacy protection" },
                { title: "Avalanche Security", description: "Battle-tested network infrastructure" }
              ].map((feature, index) => (
                <div key={index} className="space-y-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full mx-auto mb-3" />
                  <h4 className="font-semibold text-white text-sm">{feature.title}</h4>
                  <p className="text-xs text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;