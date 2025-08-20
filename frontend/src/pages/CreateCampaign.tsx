import Navigation from '@/components/Navigation';
import MouseFollower from '@/components/MouseFollower';
import Footer from '@/components/Footer';
import CampaignForm from '@/components/CampaignForm';
import { Plus, Shield, Rocket } from 'lucide-react';

const CreateCampaign = () => {
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
                Create Your <span className="gradient-text">Campaign</span>
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                Launch your privacy-first crowdfunding campaign in minutes
              </p>
            </div>
            
            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  icon: Shield,
                  title: "Privacy First",
                  description: "All donations remain completely encrypted and private"
                },
                {
                  icon: Rocket,
                  title: "Fast Setup",
                  description: "Launch your campaign in just a few minutes"
                },
                {
                  icon: Plus,
                  title: "Rich Content",
                  description: "Tell your story with multimedia and detailed descriptions"
                }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="text-center glass p-8 rounded-2xl border border-red-500/20 hover-lift">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                        <Icon className="w-8 h-8 text-red-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
            
            {/* Campaign Creation Form */}
            <CampaignForm />
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreateCampaign;