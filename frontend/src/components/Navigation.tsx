import { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";
import {
  Shield,
  Search,
  Plus,
  LayoutDashboard,
  HelpCircle,
  Menu,
  X,
  Wallet,
  ChevronDown,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import WalletConnectionModal from "./WalletConnectionModal";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isRegistered } = useEERCWithKey("converter");
  const location = useLocation();

  const menuItems = [
    { text: "Discover", route: "/campaigns", icon: Search },
    { text: "Create", route: "/create-campaign", icon: Plus },
    {
      text: "Dashboard",
      route: "/dashboard",
      icon: LayoutDashboard,
      authRequired: true,
    },

    { text: "How It Works", route: "/#how-it-works", icon: HelpCircle },
  ];

  const handleConnectWallet = () => {
    setIsWalletModalOpen(true);
  };

  const handleDisconnect = () => {
    disconnect();
    setIsAccountMenuOpen(false);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <Shield className="w-8 h-8 text-red-400 group-hover:text-red-300 transition-colors duration-300" />
            <span className="text-2xl font-bold gradient-text">ShadowFlow</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.route ||
                (item.route === "/" && location.pathname === "/");

              if (item.authRequired && !isConnected) return null;

              return (
                <Link
                  key={item.text}
                  to={item.route}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isActive
                      ? "text-red-400 bg-red-500/10"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
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
            {!isConnected ? (
              <Button
                onClick={handleConnectWallet}
                className="btn-primary px-6 py-2 hidden sm:flex items-center space-x-2"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </Button>
            ) : (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center space-x-2 glass px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${isRegistered ? "bg-green-400" : "bg-yellow-400"}`}
                  ></div>
                  <span className="text-sm font-medium text-gray-300">
                    {address && formatAddress(address)}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass rounded-lg border border-white/10 py-2">
                    <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/10">
                      Status:{" "}
                      {isRegistered ? "eERC20 Ready" : "Registration Required"}
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
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

                if (item.authRequired && !isConnected) return null;

                return (
                  <Link
                    key={item.text}
                    to={item.route}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isActive
                        ? "text-red-400 bg-red-500/10"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.text}</span>
                  </Link>
                );
              })}

              {/* Mobile Wallet Button */}
              {!isConnected ? (
                <Button
                  onClick={handleConnectWallet}
                  className="btn-primary w-full mt-4 flex items-center justify-center space-x-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </Button>
              ) : (
                <div className="mt-4 p-3 glass rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${isRegistered ? "bg-green-400" : "bg-yellow-400"}`}
                      ></div>
                      <span className="text-sm font-medium text-gray-300">
                        {address && formatAddress(address)}
                      </span>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Disconnect
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {isRegistered ? "eERC20 Ready" : "Registration Required"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isWalletModalOpen &&
        createPortal(
          <WalletConnectionModal
            isOpen={isWalletModalOpen}
            onClose={() => setIsWalletModalOpen(false)}
          />,
          document.body,
        )}
    </nav>
  );
};

export default Navigation;
