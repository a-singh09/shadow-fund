import { useState } from 'react';
import { Heart, Shield, Lock, Users, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  title: string;
  progressPercentage: number;
  supportersCount: number;
  daysLeft: number;
  raised: string;
  goal: string;
}

interface DonationSidebarProps {
  campaign: Campaign;
}

const DonationSidebar = ({ campaign }: DonationSidebarProps) => {
  const [donationAmount, setDonationAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { toast } = useToast();

  const predefinedAmounts = [10, 25, 50, 100];

  const handleDonate = () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Donation Initiated",
      description: `Your anonymous donation of $${donationAmount} is being processed with full privacy protection.`,
    });
  };

  return (
    <div className="sticky top-24">
      <div className="glass rounded-2xl p-8 border border-red-500/20">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-white">{campaign.raised}</h3>
            <span className="text-sm text-gray-400">of {campaign.goal}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-400 h-3 rounded-full transition-all duration-300"
              style={{ width: `${campaign.progressPercentage}%` }}
            />
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-white">{campaign.supportersCount}</p>
              <p className="text-sm text-gray-400">supporters</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{campaign.daysLeft}</p>
              <p className="text-sm text-gray-400">days left</p>
            </div>
          </div>
        </div>

        {/* Privacy Features */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-white mb-4">Privacy Protection</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-300">Zero-knowledge donations</span>
            </div>
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-300">Anonymous by default</span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-300">Private supporter count</span>
            </div>
          </div>
        </div>

        {/* Donation Form */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white">Support this project</h4>
          
          {/* Predefined Amounts */}
          <div className="grid grid-cols-2 gap-2">
            {predefinedAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => setDonationAmount(amount.toString())}
                className="border-gray-600 text-gray-300 hover:bg-red-500/10 hover:border-red-500/50"
              >
                ${amount}
              </Button>
            ))}
          </div>

          {/* Custom Amount */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Custom amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                className="pl-8 bg-gray-800/50 border-gray-600 text-white focus:border-red-500/50"
              />
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500/50"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-300">
              Make this donation anonymous
            </label>
          </div>

          {/* Donation Button */}
          <Button 
            onClick={handleDonate}
            className="w-full btn-primary py-4 font-semibold text-lg"
          >
            <Heart className="w-5 h-5 mr-2" />
            Donate Anonymously
          </Button>

          {/* Rewards Section */}
          <div className="pt-6 border-t border-gray-700">
            <h5 className="text-sm font-semibold text-white mb-3 flex items-center">
              <Gift className="w-4 h-4 mr-2 text-red-400" />
              Supporter Rewards
            </h5>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Early access to beta features</p>
              <p>• Private community membership</p>
              <p>• Exclusive project updates</p>
              <p>• Privacy-first digital badge</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationSidebar;