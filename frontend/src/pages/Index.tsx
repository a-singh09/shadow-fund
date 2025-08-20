import Navigation from '@/components/Navigation';
import MouseFollower from '@/components/MouseFollower';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import AvalancheSection from '@/components/AvalancheSection';
import StatsSection from '@/components/StatsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <MouseFollower />
      <Navigation />
      
      <main className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AvalancheSection />
        <StatsSection />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
