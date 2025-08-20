import Navigation from '@/components/Navigation';
import MouseFollower from '@/components/MouseFollower';
import Footer from '@/components/Footer';
import CampaignCard from '@/components/CampaignCard';
import { Search, TrendingUp, Clock, Sparkles } from 'lucide-react';

const Campaigns = () => {
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
                  className="w-full pl-12 pr-4 py-4 glass rounded-xl border border-red-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                />
              </div>
              
              {/* Quick Filters */}
              <div className="flex flex-wrap gap-4 justify-center">
                {[
                  { text: "Trending", icon: TrendingUp },
                  { text: "Ending Soon", icon: Clock },
                  { text: "New", icon: Sparkles }
                ].map((filter, index) => {
                  const Icon = filter.icon;
                  return (
                    <button 
                      key={index}
                      className="flex items-center space-x-2 px-4 py-2 glass rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-300"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{filter.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  id: "1",
                  title: "Privacy-First Social Network",
                  creator: "Alex Chen",
                  description: "Building a decentralized social platform where your data stays yours. No tracking, no ads, just genuine connections with complete privacy protection.",
                  category: "Technology",
                  image: "/api/placeholder/400/200",
                  supportersCount: 67,
                  daysLeft: 23,
                  progressPercentage: 68
                },
                {
                  id: "2", 
                  title: "Sustainable Energy Initiative",
                  creator: "Maria Rodriguez",
                  description: "Developing solar-powered community centers in rural areas. Clean energy solutions that empower local communities while protecting the environment.",
                  category: "Environment",
                  image: "/api/placeholder/400/200",
                  supportersCount: 43,
                  daysLeft: 12,
                  progressPercentage: 45
                },
                {
                  id: "3",
                  title: "Open Source Privacy Tools",
                  creator: "David Kim",
                  description: "Creating free, open-source tools for digital privacy. Encryption software that anyone can use to protect their communications and data.",
                  category: "Technology",
                  image: "/api/placeholder/400/200",
                  supportersCount: 127,
                  daysLeft: 45,
                  progressPercentage: 83
                },
                {
                  id: "4",
                  title: "Community Art Space",
                  creator: "Sarah Johnson",
                  description: "Establishing a creative hub for local artists. A space where creativity flourishes and community bonds strengthen through collaborative art projects.",
                  category: "Art & Design",
                  image: "/api/placeholder/400/200",
                  supportersCount: 89,
                  daysLeft: 31,
                  progressPercentage: 72
                },
                {
                  id: "5",
                  title: "Digital Literacy Program",
                  creator: "Michael Brown",
                  description: "Teaching essential digital skills to underserved communities. Bridging the digital divide with comprehensive education and hands-on training.",
                  category: "Education",
                  image: "/api/placeholder/400/200",
                  supportersCount: 156,
                  daysLeft: 18,
                  progressPercentage: 91
                },
                {
                  id: "6",
                  title: "Mental Health Support App",
                  creator: "Emily Davis",
                  description: "Developing a privacy-focused mental health platform. Anonymous support groups and resources without compromising user privacy.",
                  category: "Health",
                  image: "/api/placeholder/400/200",
                  supportersCount: 234,
                  daysLeft: 8,
                  progressPercentage: 95
                }
              ].map((campaign) => (
                <CampaignCard key={campaign.id} {...campaign} />
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Campaigns;