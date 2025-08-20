import { Wallet, Rocket, Lock, TrendingUp } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      step: "01",
      title: "Connect Wallet",
      description: "Connect your Avalanche-compatible wallet and register with the eERC20 privacy system. One-time setup generates your private encryption keys.",
      icon: Wallet,
      techDetail: "Uses Avalanche's eERC20 protocol for encrypted token registration"
    },
    {
      step: "02",
      title: "Create or Browse",
      description: "Launch your own campaign with detailed project information, or discover innovative projects to support from our curated marketplace.",
      icon: Rocket,
      techDetail: "Smart contracts deployed on Avalanche C-Chain"
    },
    {
      step: "03",
      title: "Private Donations",
      description: "Make encrypted donations using eERC20 tokens. Your contribution amount and identity remain completely private through zero-knowledge proofs.",
      icon: Lock,
      techDetail: "Zero-knowledge encryption ensures donation privacy"
    },
    {
      step: "04",
      title: "Track & Withdraw",
      description: "Creators can track campaign progress and withdraw funds securely. All operations maintain donor privacy while providing necessary transparency.",
      icon: TrendingUp,
      techDetail: "Secure withdrawal system with privacy preservation"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            Four simple steps to private crowdfunding
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isEven = index % 2 === 0;
            
            return (
              <div
                key={index}
                className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                  isEven ? '' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center space-x-4">
                    <span className="text-6xl font-bold gradient-text opacity-20">
                      {step.step}
                    </span>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        {step.title}
                      </h3>
                      <div className="privacy-badge inline-block">
                        Privacy-First
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-lg text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                  
                  <div className="glass p-4 rounded-xl border border-red-500/20">
                    <p className="text-sm text-red-300 font-medium">
                      Tech: {step.techDetail}
                    </p>
                  </div>
                </div>

                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    {/* Background Circle */}
                    <div className="w-32 h-32 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-full border border-red-500/30 flex items-center justify-center">
                      <Icon className="w-16 h-16 text-red-400" />
                    </div>
                    
                    {/* Connecting Line (except for last step) */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-red-500/50 to-red-500/20 lg:hidden" />
                    )}
                    
                    {/* Pulse Animation */}
                    <div className="absolute inset-0 w-32 h-32 bg-red-500/10 rounded-full animate-ping opacity-20" 
                         style={{ animationDelay: `${index * 0.5}s` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mt-16">
          <div className="flex items-center space-x-4">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 bg-red-400 rounded-full opacity-60" />
                {index < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-gradient-to-r from-red-400/60 to-red-400/20 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;