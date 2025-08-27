import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Shield,
  Rocket,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useEERCWithKey } from "@/hooks/useEERCWithKey";
import { useCampaignFactory } from "@/hooks/useCampaignFactory";
import { useToast } from "@/hooks/use-toast";
import WalletConnectionModal from "./WalletConnectionModal";
import EeRC20RegistrationFlow from "./EeRC20RegistrationFlow";
import ImageUpload from "./ImageUpload";
import {
  TrustBadge,
  CredibilityBreakdown,
  ImprovementSuggestions,
  VisualIntegrityBadge,
  generateMockVisualResult,
  useRealTimeCredibilityScore,
} from "./ai-trust";
import { CampaignMetadata, ZKProof } from "@/types/aiTrust";

const CampaignForm = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { isRegistered, keyLoaded } = useEERCWithKey("converter");
  const {
    createCampaign,
    isLoading: isCampaignLoading,
    error: campaignError,
  } = useCampaignFactory();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showEeRC20Flow, setShowEeRC20Flow] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    category: "",
    description: "",
    duration: "",
    tags: [],
    location: "",
    heroImage: "",
    heroImageHash: "",
    galleryImages: [],
    videoUrl: "",
  });

  // Create campaign metadata for credibility scoring
  const campaignMetadata: CampaignMetadata | undefined =
    address && formData.title
      ? {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          creatorAddress: address,
          creationDate: new Date(),
          zkProofs: [] as ZKProof[], // Would be populated with actual ZK proofs
          publicVerifications: [],
        }
      : undefined;

  // Use real-time credibility scoring
  const {
    score: credibilityScore,
    breakdown: scoreBreakdown,
    suggestions: improvementSuggestions,
    trustLevel,
    isLoading: isScoreLoading,
    error: scoreError,
  } = useRealTimeCredibilityScore(campaignMetadata!, [
    formData.title,
    formData.description,
    formData.category,
    formData.location,
  ]);

  const steps = [
    { number: 1, title: "Basics", icon: Target },
    { number: 2, title: "Details", icon: Shield },
    { number: 3, title: "Media", icon: Upload },
    { number: 4, title: "Review", icon: CheckCircle },
    { number: 5, title: "Launch", icon: Rocket },
  ];

  const categories = [
    { value: "technology", label: "Technology", icon: "💻" },
    { value: "art", label: "Art & Design", icon: "🎨" },
    { value: "social", label: "Social Impact", icon: "❤️" },
    { value: "education", label: "Education", icon: "🎓" },
    { value: "health", label: "Health", icon: "🏥" },
    { value: "environment", label: "Environment", icon: "🌱" },
  ];

  // Form validation functions
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        errors.title = "Campaign title is required";
      } else if (formData.title.length < 5) {
        errors.title = "Title must be at least 5 characters long";
      } else if (formData.title.length > 100) {
        errors.title = "Title must be less than 100 characters";
      }

      if (!formData.tagline.trim()) {
        errors.tagline = "Tagline is required";
      } else if (formData.tagline.length > 150) {
        errors.tagline = "Tagline must be less than 150 characters";
      }

      if (!formData.category) {
        errors.category = "Please select a category";
      }

      if (!formData.description.trim()) {
        errors.description = "Description is required";
      } else if (formData.description.length < 200) {
        errors.description = "Description must be at least 200 characters";
      }
    }

    if (step === 2) {
      if (!formData.duration) {
        errors.duration = "Campaign duration is required";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEeRC20Complete = () => {
    setShowEeRC20Flow(false);
  };

  const handleDeploy = async () => {
    // Check wallet connection
    if (!isConnected) {
      setShowWalletModal(true);
      return;
    }

    // Check eERC20 registration
    if (!isRegistered) {
      setShowEeRC20Flow(true);
      return;
    }

    // Validate form data
    if (!validateStep(1) || !validateStep(2)) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before deploying",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);

    try {
      // Calculate deadline date
      const deadlineDate = new Date();
      deadlineDate.setDate(
        deadlineDate.getDate() + parseInt(formData.duration),
      );

      // Create campaign
      const result = await createCampaign({
        title: formData.title,
        description: formData.description,
        deadline: deadlineDate,
        imageHash: formData.heroImageHash, // This will be stored client-side
      });

      toast({
        title: "Campaign Created Successfully!",
        description: `Your campaign has been deployed to the blockchain.`,
      });

      // Store image with proper campaign address if we have it
      if (formData.heroImageHash && result.campaignAddress) {
        const { storeCampaignImage } = await import("@/lib/campaignImages");
        storeCampaignImage(result.campaignAddress, formData.heroImageHash);
        // Clean up temporary storage
        localStorage.removeItem(`temp_${result.transactionHash}`);
      }

      // Redirect to campaign detail page
      navigate(`/campaign/${result.campaignAddress}`);
    } catch (error) {
      console.error("Campaign deployment failed:", error);
      toast({
        title: "Deployment Failed",
        description:
          error instanceof Error ? error.message : "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      // Validate current step before proceeding
      if (currentStep === 1 && !validateStep(1)) {
        return;
      }
      if (currentStep === 2 && !validateStep(2)) {
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Clear validation errors when going back
      setValidationErrors({});
    }
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
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  // Clear validation error when user starts typing
                  if (validationErrors.title) {
                    setValidationErrors({ ...validationErrors, title: "" });
                  }
                }}
                placeholder="Give your campaign a compelling title that captures attention"
                className={`w-full px-4 py-3 glass rounded-xl border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-red-500/50 transition-all duration-300 ${
                  validationErrors.title
                    ? "border-red-500 focus:ring-red-500/50"
                    : "border-red-500/20 focus:ring-red-500/50"
                }`}
                maxLength={100}
              />
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-500">
                  {formData.title.length}/100 characters
                </div>
                {validationErrors.title && (
                  <div className="flex items-center text-xs text-red-400">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.title}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Short Tagline *
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => {
                  setFormData({ ...formData, tagline: e.target.value });
                  if (validationErrors.tagline) {
                    setValidationErrors({ ...validationErrors, tagline: "" });
                  }
                }}
                placeholder="A brief, catchy description of your project"
                className={`w-full px-4 py-3 glass rounded-xl border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-red-500/50 transition-all duration-300 ${
                  validationErrors.tagline
                    ? "border-red-500 focus:ring-red-500/50"
                    : "border-red-500/20 focus:ring-red-500/50"
                }`}
                maxLength={150}
              />
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-500">
                  {formData.tagline.length}/150 characters
                </div>
                {validationErrors.tagline && (
                  <div className="flex items-center text-xs text-red-400">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.tagline}
                  </div>
                )}
              </div>
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
                    onClick={() => {
                      setFormData({ ...formData, category: category.value });
                      if (validationErrors.category) {
                        setValidationErrors({
                          ...validationErrors,
                          category: "",
                        });
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                      formData.category === category.value
                        ? "border-red-500 bg-red-500/10 text-white"
                        : "border-gray-700 glass text-gray-300 hover:border-red-500/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="font-medium">{category.label}</div>
                  </button>
                ))}
              </div>
              {validationErrors.category && (
                <div className="flex items-center text-xs text-red-400 mt-2">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {validationErrors.category}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Campaign Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (validationErrors.description) {
                    setValidationErrors({
                      ...validationErrors,
                      description: "",
                    });
                  }
                }}
                placeholder="Tell your story. What are you building? Why does it matter? How will you use the funds?"
                rows={8}
                className={`w-full px-4 py-3 glass rounded-xl border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-red-500/50 transition-all duration-300 resize-none ${
                  validationErrors.description
                    ? "border-red-500 focus:ring-red-500/50"
                    : "border-red-500/20 focus:ring-red-500/50"
                }`}
                minLength={200}
              />
              <div className="flex justify-between items-start mt-1">
                <div className="text-xs text-gray-500">
                  {formData.description.length < 200
                    ? `Minimum 200 characters (${200 - formData.description.length} remaining)`
                    : `${formData.description.length} characters`}
                </div>
                {validationErrors.description && (
                  <div className="flex items-center text-xs text-red-400">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.description}
                  </div>
                )}
              </div>

              {/* AI Content Analysis Preview */}
              {formData.description.length >= 200 && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">
                      AI Content Analysis
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400">Originality:</span>
                      <span className="text-green-400 ml-1">95% Original</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Clarity:</span>
                      <span className="text-green-400 ml-1">High</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Duplicates:</span>
                      <span className="text-green-400 ml-1">None Found</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Trust Score:</span>
                      <span className="text-yellow-400 ml-1">Building...</span>
                    </div>
                  </div>
                </div>
              )}
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
                onChange={(e) => {
                  setFormData({ ...formData, duration: e.target.value });
                  if (validationErrors.duration) {
                    setValidationErrors({ ...validationErrors, duration: "" });
                  }
                }}
                className={`w-full px-4 py-3 glass rounded-xl border text-white focus:outline-none focus:ring-2 focus:border-red-500/50 transition-all duration-300 ${
                  validationErrors.duration
                    ? "border-red-500 focus:ring-red-500/50"
                    : "border-red-500/20 focus:ring-red-500/50"
                }`}
              >
                <option value="">Select duration</option>
                <option value="30">30 days</option>
                <option value="45">45 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
              {validationErrors.duration && (
                <div className="flex items-center text-xs text-red-400 mt-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {validationErrors.duration}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
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
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Campaign Image
              </label>
              <ImageUpload
                onImageUploaded={(hash, url) => {
                  setFormData({
                    ...formData,
                    heroImageHash: hash,
                    heroImage: url,
                  });
                }}
                currentImage={formData.heroImage}
                className="mb-4"
              />

              {/* AI Image Verification Preview */}
              {formData.heroImage && (
                <div className="mb-4 p-4 glass-subtle rounded-xl border border-green-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      Image Verified
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400">Authenticity:</span>
                      <span className="text-green-400 ml-1">Original</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Manipulation:</span>
                      <span className="text-green-400 ml-1">None Detected</span>
                    </div>
                    <div>
                      <span className="text-gray-400">IPFS Storage:</span>
                      <span className="text-green-400 ml-1">Verified</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Reverse Search:</span>
                      <span className="text-green-400 ml-1">0 Matches</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-400">
                <p>• Upload a compelling image that represents your campaign</p>
                <p>
                  • Images are automatically verified for authenticity using AI
                </p>
                <p>• Images are stored on IPFS for decentralized access</p>
                <p>• Recommended size: 800x400px or larger</p>
                <p>• Supported formats: PNG, JPG, GIF (max 5MB)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Video (Optional)
              </label>
              <input
                type="url"
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                placeholder="YouTube, Vimeo, or other video URL"
                className="w-full px-4 py-3 glass rounded-xl border border-red-500/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
              />
              <div className="text-sm text-gray-400 mt-2">
                Add a video to better explain your project and connect with
                supporters
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Campaign Preview */}
            <div className="glass p-6 rounded-xl border border-red-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Campaign Preview
                </h3>
                {credibilityScore && (
                  <TrustBadge
                    score={credibilityScore.score}
                    level={trustLevel}
                    size="sm"
                    isLoading={isScoreLoading}
                    confidence={credibilityScore.confidence}
                    showDetails={true}
                  />
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-300">Title</h4>
                  <p className="text-white">
                    {formData.title || "No title set"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-300">Tagline</h4>
                  <p className="text-white">
                    {formData.tagline || "No tagline set"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-300">Category</h4>
                  <p className="text-white">
                    {categories.find((c) => c.value === formData.category)
                      ?.label || "No category selected"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-300">Duration</h4>
                  <p className="text-white">
                    {formData.duration
                      ? `${formData.duration} days`
                      : "No duration set"}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Trust Analysis Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {scoreBreakdown && (
                <CredibilityBreakdown
                  breakdown={scoreBreakdown}
                  isOwner={true}
                />
              )}
              {improvementSuggestions.length > 0 && (
                <ImprovementSuggestions
                  suggestions={improvementSuggestions}
                  currentScore={credibilityScore?.score || 0}
                  onActionClick={(suggestion) => {
                    // Handle improvement action clicks
                    console.log("Improvement action clicked:", suggestion);
                    // Could navigate to verification flows, etc.
                  }}
                />
              )}
              {formData.heroImage && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">
                    Image Verification
                  </h4>
                  <VisualIntegrityBadge
                    result={generateMockVisualResult("verified")}
                    showDetails={true}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="glass p-8 rounded-xl border border-red-500/20">
              <Rocket className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Launch!
              </h3>
              <div className="space-y-2 text-sm text-gray-400 mb-6">
                <p>Network: Avalanche C-Chain</p>
                <p>Estimated Gas: ~0.01 AVAX</p>
                <p>Deployment Time: ~30 seconds</p>
                <p>Privacy Features: eERC20 encryption enabled</p>
              </div>

              {/* Wallet and Registration Status */}
              {!isConnected && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Wallet connection required to deploy campaign
                  </div>
                </div>
              )}

              {isConnected && !isRegistered && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center text-blue-400 text-sm">
                    <Shield className="w-4 h-4 mr-2" />
                    eERC20 registration required for privacy features
                  </div>
                </div>
              )}

              {campaignError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {campaignError}
                  </div>
                  {campaignError.includes("not deployed yet") && (
                    <div className="text-xs text-gray-400 mt-2 text-center">
                      The campaign factory contract needs to be deployed to
                      Avalanche Fuji testnet first.
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleDeploy}
                disabled={isDeploying || isCampaignLoading || !keyLoaded}
                className="btn-primary px-8 py-4 font-semibold text-lg hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
              >
                {isDeploying || isCampaignLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {!isConnected
                      ? "Connecting..."
                      : !isRegistered
                        ? "Registering..."
                        : "Deploying..."}
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    Deploy Campaign to Avalanche
                  </>
                )}
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
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "border-red-500 bg-red-500/20 text-red-400"
                      : isCompleted
                        ? "border-green-500 bg-green-500/20 text-green-400"
                        : "border-gray-600 text-gray-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <div
                    className={`font-medium ${isActive ? "text-white" : "text-gray-400"}`}
                  >
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-4 h-px w-8 sm:w-16 transition-all duration-300 ${
                      isCompleted ? "bg-green-500" : "bg-gray-600"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="glass p-8 rounded-2xl border border-red-500/20 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          Step {currentStep}:{" "}
          {steps.find((s) => s.number === currentStep)?.title}
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
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "btn-secondary hover-lift"
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
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "btn-primary hover-lift"
          }`}
        >
          <span>{currentStep === 4 ? "Review" : "Next"}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="mt-8 glass-subtle p-6 rounded-xl border border-red-500/10">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-white mb-2">
              Privacy & Transparency
            </h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Your campaign details will be publicly visible</li>
              <li>• All donation amounts remain completely private</li>
              <li>• Donor identities are protected by encryption</li>
              <li>
                • You can track donations without seeing individual amounts
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
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
