import { useState } from 'react';
import { Download, Shield, AlertCircle, CheckCircle, Eye, EyeOff, Wallet } from 'lucide-react';

const WithdrawFunds = () => {
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showBalance, setShowBalance] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalStep, setWithdrawalStep] = useState(1);

  const campaigns = [
    {
      id: '1',
      title: 'Privacy-First Social Network',
      availableBalance: '1,234.56',
      encryptedBalance: '******',
      status: 'active'
    },
    {
      id: '2', 
      title: 'Sustainable Energy Initiative',
      availableBalance: '892.34',
      encryptedBalance: '******',
      status: 'active'
    },
    {
      id: '3',
      title: 'Open Source Privacy Tools',
      availableBalance: '720.62',
      encryptedBalance: '******',
      status: 'completed'
    }
  ];

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setWithdrawalStep(2);

    // Simulate withdrawal process
    setTimeout(() => {
      setWithdrawalStep(3);
      setTimeout(() => {
        setWithdrawalStep(4);
        setIsWithdrawing(false);
      }, 2000);
    }, 3000);
  };

  const renderWithdrawalSteps = () => {
    switch (withdrawalStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Campaign
              </label>
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full px-4 py-3 glass rounded-xl border border-red-500/20 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
              >
                <option value="">Choose a campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedCampaign && (
              <div className="glass-subtle p-4 rounded-xl border border-red-500/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Available Balance</h4>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-2xl font-bold text-red-400">
                  {showBalance 
                    ? `${campaigns.find(c => c.id === selectedCampaign)?.availableBalance} eERC20`
                    : `${campaigns.find(c => c.id === selectedCampaign)?.encryptedBalance} eERC20`
                  }
                </div>
              </div>
            )}

            {selectedCampaign && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 pr-20 glass rounded-xl border border-red-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    eERC20
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => setWithdrawAmount(campaigns.find(c => c.id === selectedCampaign)?.availableBalance || '')}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Max Available
                  </button>
                  <span className="text-xs text-gray-500">
                    Network fee: ~0.001 AVAX
                  </span>
                </div>
              </div>
            )}

            <div className="glass-subtle p-4 rounded-xl border border-blue-500/10">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-white text-sm mb-1">Security Notice</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• Funds will be transferred directly to your connected wallet</li>
                    <li>• Transaction is encrypted and private on the blockchain</li>
                    <li>• Withdrawal cannot be reversed once confirmed</li>
                    <li>• Allow 2-5 minutes for blockchain confirmation</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={!selectedCampaign || !withdrawAmount || isWithdrawing}
              className="w-full btn-primary py-4 font-semibold hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Initiate Secure Withdrawal</span>
            </button>
          </div>
        );

      case 2:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
              <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Processing Withdrawal</h3>
              <p className="text-gray-400">Preparing secure transaction on Avalanche network...</p>
            </div>
            <div className="glass-subtle p-4 rounded-xl border border-yellow-500/10">
              <div className="text-sm text-gray-400 space-y-2">
                <div>Amount: {withdrawAmount} eERC20</div>
                <div>Destination: Your connected wallet</div>
                <div>Status: Encrypting transaction...</div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Confirming on Blockchain</h3>
              <p className="text-gray-400">Transaction submitted to Avalanche network...</p>
            </div>
            <div className="glass-subtle p-4 rounded-xl border border-blue-500/10">
              <div className="text-sm text-gray-400 space-y-2">
                <div>Transaction Hash: 0xabc123...def789</div>
                <div>Block Confirmations: 2/3</div>
                <div>Estimated completion: ~30 seconds</div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Withdrawal Successful!</h3>
              <p className="text-gray-400">Your funds have been securely transferred to your wallet</p>
            </div>
            <div className="glass-subtle p-4 rounded-xl border border-green-500/10">
              <div className="text-sm text-gray-400 space-y-2">
                <div>Amount Received: {withdrawAmount} eERC20</div>
                <div>Transaction Fee: 0.001 AVAX</div>
                <div>Completion Time: 34 seconds</div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button className="flex-1 btn-secondary py-3">
                View Transaction
              </button>
              <button 
                onClick={() => {
                  setWithdrawalStep(1);
                  setSelectedCampaign('');
                  setWithdrawAmount('');
                }}
                className="flex-1 btn-primary py-3"
              >
                Make Another Withdrawal
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Withdraw Funds</h1>
        <p className="text-gray-400">Securely transfer your earnings from campaigns</p>
      </div>

      {/* Main Withdrawal Interface */}
      <div className="max-w-2xl mx-auto">
        <div className="glass p-8 rounded-2xl border border-red-500/20">
          {renderWithdrawalSteps()}
        </div>
      </div>

      {/* Recent Withdrawals */}
      {withdrawalStep === 1 && (
        <div className="glass rounded-2xl border border-red-500/20 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Recent Withdrawals</h2>
          </div>
          
          <div className="p-6">
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No recent withdrawals</p>
              <p className="text-sm text-gray-500 mt-1">Your withdrawal history will appear here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawFunds;