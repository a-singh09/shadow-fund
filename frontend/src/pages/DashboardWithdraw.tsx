import Navigation from '@/components/Navigation';
import MouseFollower from '@/components/MouseFollower';
import Footer from '@/components/Footer';
import WithdrawFunds from '@/components/WithdrawFunds';

const DashboardWithdraw = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <MouseFollower />
      <Navigation />
      
      <main className="pt-16">
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <WithdrawFunds />
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default DashboardWithdraw;