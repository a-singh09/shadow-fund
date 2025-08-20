import { Plus, Search, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  const trustIndicators = [
    "Built on Avalanche",
    "Zero-Knowledge Privacy", 
    "Open Source",
    "Audited Smart Contracts"
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA */}
        <div className="max-w-4xl mx-auto text-center">
          {/* Background Card */}
          <div className="relative glass-strong p-12 rounded-3xl border border-red-500/20 hover-glow">
            {/* Floating Elements */}
            <div className="absolute top-4 right-4 w-3 h-3 bg-red-400/40 rounded-full animate-pulse" />
            <div className="absolute bottom-6 left-6 w-2 h-2 bg-red-300/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Privacy Badge */}
            <div className="inline-flex items-center space-x-2 privacy-badge mb-6">
              <Shield className="w-4 h-4 lock-pulse" />
              <span>100% Privacy Guaranteed</span>
            </div>

            {/* Headline */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Fund <span className="gradient-text">Privately</span>?
            </h2>

            {/* Subtitle */}
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of creators and supporters using privacy-first crowdfunding
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link to="/create-campaign">
                <Button className="btn-primary px-8 py-4 text-lg font-semibold flex items-center space-x-2 hover-lift group">
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Create Campaign</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              
              <Link to="/campaigns">
                <Button className="btn-secondary px-8 py-4 text-lg font-semibold flex items-center space-x-2 hover-lift group">
                  <Search className="w-5 h-5" />
                  <span>Explore Projects</span>
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {trustIndicators.map((indicator, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center space-x-2 glass p-3 rounded-lg border border-white/5 hover:border-red-500/30 transition-colors duration-300"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-sm text-gray-400 font-medium">{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: "For Creators",
              description: "Launch your privacy-first campaign and protect your supporters",
              action: "Start Creating",
              route: "/create-campaign",
              icon: Plus
            },
            {
              title: "For Supporters", 
              description: "Discover amazing projects and donate with complete privacy",
              action: "Explore Campaigns",
              route: "/campaigns",
              icon: Search
            },
            {
              title: "Learn More",
              description: "Understand how our privacy technology keeps you protected",
              action: "How It Works",
              route: "/#how-it-works",
              icon: Shield
            }
          ].map((item, index) => {
            const Icon = item.icon;
            
            return (
              <div key={index} className="text-center glass p-8 rounded-2xl border border-white/10 hover-lift hover-glow group transition-all duration-300">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 group-hover:bg-red-500/20 transition-colors duration-300">
                    <Icon className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-red-100 transition-colors duration-300">
                  {item.title}
                </h3>
                
                <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300">
                  {item.description}
                </p>
                
                <Link to={item.route}>
                  <Button className="btn-ghost w-full group-hover:bg-red-500/10 group-hover:text-red-400 transition-all duration-300">
                    {item.action}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CTASection;