import { useState } from 'react';
import { X, Shield, Wallet, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnect: (walletType: string) => void;
}

const WalletConnectionModal = ({ isOpen, onClose, onWalletConnect }: WalletConnectionModalProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  if (!isOpen) return null;

  const walletOptions = [
    {
      name: 'MetaMask',
      description: 'Connect using MetaMask browser extension',
      popularity: 'Most Popular',
      icon: '🦊',
      id: 'metamask'
    },
    {
      name: 'WalletConnect',
      description: 'Connect using WalletConnect protocol',
      popularity: 'Mobile Friendly',
      icon: '📱',
      id: 'walletconnect'
    },
    {
      name: 'Coinbase Wallet',
      description: 'Connect using Coinbase Wallet',
      popularity: 'Beginner Friendly',
      icon: '🔵',
      id: 'coinbase'
    }
  ];

  const handleWalletSelect = async (walletId: string) => {
    setIsConnecting(true);
    setSelectedWallet(walletId);
    
    // Simulate connection delay
    setTimeout(() => {
      onWalletConnect(walletId);
      setIsConnecting(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative glass max-w-md w-full rounded-2xl border border-red-500/20 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Choose your preferred wallet to start using ShadowFlow</p>
        </div>

        <div className="space-y-3 mb-6">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletSelect(wallet.id)}
              disabled={isConnecting}
              className={`w-full p-4 rounded-xl border transition-all duration-300 text-left ${
                selectedWallet === wallet.id && isConnecting
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-gray-700 glass hover:border-red-500/50'
              } ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover-lift'}`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{wallet.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-white">{wallet.name}</h3>
                    <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">
                      {wallet.popularity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{wallet.description}</p>
                </div>
                {selectedWallet === wallet.id && isConnecting && (
                  <div className="animate-spin w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="glass-subtle p-4 rounded-xl border border-red-500/10">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-white text-sm mb-1">Network Information</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Network: Avalanche C-Chain</div>
                <div>Chain ID: 43114</div>
                <div>Currency: AVAX</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectionModal;