import { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, X, Shield, Rocket, Target, CheckCircle } from 'lucide-react';
import WalletConnectionModal from './WalletConnectionModal';
import EeRC20RegistrationFlow from './EeRC20RegistrationFlow';

const CampaignForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showEeRC20Flow, setShowEeRC20Flow] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    category: '',
    description: '',
    duration: '',
    tags: [],
    location: '',
    heroImage: null,
    galleryImages: [],
    videoUrl: ''
  });

  const steps = [
    { number: 1, title: 'Basics', icon: Target },
    { number: 2, title: 'Details', icon: Shield },
    { number: 3, title: 'Media', icon: Upload },
    { number: 4, title: 'Review', icon: CheckCircle },
    { number: 5, title: 'Launch', icon: Rocket }
  ];

  const categories = [
    { value: 'technology', label: 'Technology', icon: '💻' },
    { value: 'art', label: 'Art & Design', icon: '🎨' },
    { value: 'social', label: 'Social Impact', icon: '❤️' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'health', label: 'Health', icon: '🏥' },
    { value: 'environment', label: 'Environment', icon: '🌱' }
  ];

  const handleWalletConnect = (walletType: string) => {
    setIsWalletConnected(true);
    setShowWalletModal(false);
    setShowEeRC20Flow(true);
  };

  const handleEeRC20Complete = () => {
    setShowEeRC20Flow(false);
    setShowDeploymentModal(false);
    // Here you would actually deploy to blockchain
  };

  const handleDeploy = () => {
    if (!isWalletConnected) {
      setShowWalletModal(true);
    } else {
      setShowEeRC20Flow(true);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Campaign Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your campaign a compelling title that captures attention"
                className="w-full px-4 py-3 glass rounded-xl border border-red-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                maxLength={100}
              />
              <div className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Short Tagline *
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="A brief, catchy description of your project"
                className="w-full px-4 py-3 glass rounded-xl border border-red-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                maxLength={150}
              />
              <div className="text-xs text-gray-500 mt-1">{formData.tagline.length}/150 characters</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: category.value })}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                      formData.category === category.value
                        ? 'border-red-500 bg-red-500/10 text-white'
                        : 'border-gray-700 glass text-gray-300 hover:border-red-500/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="font-medium">{category.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Campaign Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell your story. What are you building? Why does it matter? How will you use the funds?"
                rows={8}
                className="w-full px-4 py-3 glass rounded-xl border border-red-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 resize-none"
                minLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.description.length < 200 ? `Minimum 200 characters (${200 - formData.description.length} remaining)` : `${formData.description.length} characters`}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Campaign Duration *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-3 glass rounded-xl border border-red-500/20 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
              >
                <option value="">Select duration</option>
                <option value="30">30 days</option>
                <option value="45">45 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
                className="w-full px-4 py-3 glass rounded-xl border border-red-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hero Image *
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-red-500/50 transition-all duration-300">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">Drag and drop your hero image here</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse (max 5MB)</p>
                <button
                  type="button"
                  className="btn-secondary px-6 py-2"
                >
                  Choose File
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Video (Optional)
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="YouTube, Vimeo, or other video URL"
                className="w-full px-4 py-3 glass rounded-xl border border-red-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="glass p-6 rounded-xl border border-red-500/20">
              <h3 className="text-xl font-bold text-white mb-4">Campaign Preview</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-300">Title</h4>
                  <p className="text-white">{formData.title || 'No title set'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-300">Tagline</h4>
                  <p className="text-white">{formData.tagline || 'No tagline set'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-300">Category</h4>
                  <p className="text-white">{categories.find(c => c.value === formData.category)?.label || 'No category selected'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-300">Duration</h4>
                  <p className="text-white">{formData.duration ? `${formData.duration} days` : 'No duration set'}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="glass p-8 rounded-xl border border-red-500/20">
              <Rocket className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Launch!</h3>
              <div className="space-y-2 text-sm text-gray-400 mb-6">
                <p>Network: Avalanche C-Chain</p>
                <p>Estimated Gas: ~0.01 AVAX</p>
                <p>Deployment Time: ~30 seconds</p>
                <p>Privacy Features: eERC20 encryption enabled</p>
              </div>
              <button 
                onClick={handleDeploy}
                className="btn-primary px-8 py-4 font-semibold text-lg hover-lift"
              >
                Deploy Campaign to Avalanche
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  isActive 
                    ? 'border-red-500 bg-red-500/20 text-red-400' 
                    : isCompleted
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-gray-600 text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-px w-8 sm:w-16 transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="glass p-8 rounded-2xl border border-red-500/20 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          Step {currentStep}: {steps.find(s => s.number === currentStep)?.title}
        </h2>
        
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            currentStep === 1
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'btn-secondary hover-lift'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        <button
          onClick={nextStep}
          disabled={currentStep === 5}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            currentStep === 5
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'btn-primary hover-lift'
          }`}
        >
          <span>{currentStep === 4 ? 'Review' : 'Next'}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="mt-8 glass-subtle p-6 rounded-xl border border-red-500/10">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-white mb-2">Privacy & Transparency</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Your campaign details will be publicly visible</li>
              <li>• All donation amounts remain completely private</li>
              <li>• Donor identities are protected by encryption</li>
              <li>• You can track donations without seeing individual amounts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onWalletConnect={handleWalletConnect}
      />

      <EeRC20RegistrationFlow
        isOpen={showEeRC20Flow}
        onComplete={handleEeRC20Complete}
        onClose={() => setShowEeRC20Flow(false)}
      />
    </div>
  );
};

export default CampaignForm;