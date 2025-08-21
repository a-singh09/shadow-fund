import Navigation from "@/components/Navigation";
import MouseFollower from "@/components/MouseFollower";
import Footer from "@/components/Footer";
import CampaignWithdrawal from "@/components/CampaignWithdrawal";

const DashboardWithdraw = () => {
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
                Withdraw <span className="gradient-text">Campaign Funds</span>
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                Securely withdraw your campaign earnings using private transfers
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <CampaignWithdrawal />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardWithdraw;
