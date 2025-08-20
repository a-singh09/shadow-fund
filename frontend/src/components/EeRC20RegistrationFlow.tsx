import { useState, useEffect } from 'react';
import { CheckCircle, Shield, Key, PartyPopper, Loader, AlertCircle } from 'lucide-react';

interface EeRC20RegistrationFlowProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
}

const EeRC20RegistrationFlow = ({ isOpen, onComplete, onClose }: EeRC20RegistrationFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: "Wallet Connected Successfully",
      description: "Your wallet is now connected to the Avalanche network",
      icon: CheckCircle,
      color: "green"
    },
    {
      step: 2,
      title: "Register with eERC20 System",
      description: "One-time registration enables private donations and encrypted balances",
      icon: Shield,
      color: "red",
      transaction: {
        estimatedGas: "~0.005 AVAX",
        confirmationTime: "~2 seconds"
      }
    },
    {
      step: 3,
      title: "Generate Privacy Keys",
      description: "Generate your local decryption keys for viewing private balances",
      icon: Key,
      color: "blue",
      securityNote: "Keys are generated locally and never leave your device"
    },
    {
      step: 4,
      title: "Setup Complete!",
      description: "You're all set to use ShadowFlow's privacy features",
      icon: PartyPopper,
      color: "purple",
      nextSteps: [
        "Create your first campaign",
        "Explore existing campaigns", 
        "Make your first private donation"
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: "text-green-400 bg-green-500/10 border-green-500/20",
      red: "text-red-400 bg-red-500/10 border-red-500/20",
      blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      purple: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    };
    return colors[color as keyof typeof colors] || colors.red;
  };

  const handleNextStep = async () => {
    if (currentStep < 4) {
      setIsProcessing(true);
      setError(null);
      
      try {
        // Simulate blockchain operations
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCurrentStep(currentStep + 1);
      } catch (err) {
        setError("Transaction failed. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      onComplete();
    }
  };

  const currentStepData = steps[currentStep - 1];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative glass max-w-lg w-full rounded-2xl border border-red-500/20 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">eERC20 Setup</h2>
          <p className="text-gray-400">Setting up your privacy-enabled wallet</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  currentStep === step.step
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : currentStep > step.step
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-gray-600 text-gray-400'
                }`}>
                  {currentStep > step.step ? '✓' : step.step}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-px ml-2 ${
                    currentStep > step.step ? 'bg-green-500' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto mb-4 ${getColorClasses(currentStepData.color)}`}>
            <Icon className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{currentStepData.title}</h3>
          <p className="text-gray-400 mb-4">{currentStepData.description}</p>

          {currentStepData.transaction && (
            <div className="glass-subtle p-4 rounded-xl border border-red-500/10 mb-4">
              <h4 className="font-medium text-white text-sm mb-2">Transaction Details</h4>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Estimated Gas: {currentStepData.transaction.estimatedGas}</div>
                <div>Confirmation Time: {currentStepData.transaction.confirmationTime}</div>
              </div>
            </div>
          )}

          {currentStepData.securityNote && (
            <div className="glass-subtle p-4 rounded-xl border border-blue-500/10 mb-4">
              <div className="flex items-center space-x-2 text-blue-400 text-sm">
                <Shield className="w-4 h-4" />
                <span>{currentStepData.securityNote}</span>
              </div>
            </div>
          )}

          {currentStepData.nextSteps && (
            <div className="text-left glass-subtle p-4 rounded-xl border border-purple-500/10">
              <h4 className="font-medium text-white text-sm mb-2">What's Next?</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                {currentStepData.nextSteps.map((step, index) => (
                  <li key={index}>• {step}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              disabled={isProcessing}
              className="btn-primary px-8 py-3 font-semibold hover-lift flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{currentStep === 2 ? 'Register Now' : currentStep === 3 ? 'Generate Keys' : 'Continue'}</span>
              )}
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="btn-primary px-8 py-3 font-semibold hover-lift"
            >
              Start Using ShadowFlow
            </button>
          )}
        </div>

        {currentStep === 1 && (
          <div className="text-center mt-4">
            <button
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Skip Setup (Limited Features)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EeRC20RegistrationFlow;