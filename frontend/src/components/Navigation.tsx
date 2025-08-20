import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Search, Plus, LayoutDashboard, HelpCircle, Menu, X, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const location = useLocation();

  const menuItems = [
    { text: 'Discover', route: '/campaigns', icon: Search },
    { text: 'Create', route: '/create-campaign', icon: Plus },
    { text: 'Dashboard', route: '/dashboard', icon: LayoutDashboard, authRequired: true },
    { text: 'How It Works', route: '/#how-it-works', icon: HelpCircle },
  ];

  const handleConnectWallet = () => {
    // TODO: Implement wallet connection
    setIsWalletConnected(!isWalletConnected);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <Shield className="w-8 h-8 text-red-400 group-hover:text-red-300 transition-colors duration-300" />
            <span className="text-2xl font-bold gradient-text">
              ShadowFlow
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.route || 
                             (item.route === '/' && location.pathname === '/');
              
              if (item.authRequired && !isWalletConnected) return null;
              
              return (
                <Link
                  key={item.text}
                  to={item.route}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-red-400 bg-red-500/10' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.text}</span>
                </Link>
              );
            })}
          </div>

          {/* Wallet Section */}
          <div className="flex items-center space-x-4">
            {!isWalletConnected ? (
              <Button
                onClick={handleConnectWallet}
                className="btn-primary px-6 py-2 hidden sm:flex items-center space-x-2"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </Button>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 glass px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-300">
                  0x7a2d...4f8b
                </span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 glass border-t border-white/10">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.route;
                
                if (item.authRequired && !isWalletConnected) return null;
                
                return (
                  <Link
                    key={item.text}
                    to={item.route}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isActive 
                        ? 'text-red-400 bg-red-500/10' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.text}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Wallet Button */}
              {!isWalletConnected && (
                <Button
                  onClick={handleConnectWallet}
                  className="btn-primary w-full mt-4 flex items-center justify-center space-x-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;