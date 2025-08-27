import React, { useState, useEffect } from "react";
import {
  Shield,
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  User,
  Building,
  Clock,
  Users,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { credibilityEngine } from "@/services/credibilityEngine";
import { trustDataStorage } from "@/services/trustDataStorage";
import {
  CredibilityScore,
  ScoreBreakdown,
  CampaignMetadata,
  ZKProof,
  AITrustError,
} from "@/types/aiTrust";

interface CredibilityAdminProps {
  className?: string;
}

interface CredibilityWeights {
  GOVERNMENT_ID: number;
  NGO_LICENSE: number;
  ACCOUNT_AGE: number;
  SOCIAL_MEDIA: number;
  HISTORY: number;
}

interface AdminSettings {
  weights: CredibilityWeights;
  minConfidenceThreshold: number;
  cacheDurationHours: number;
  enableRealTimeUpdates: boolean;
  enableAutoRecalculation: boolean;
}

const CredibilityAdmin: React.FC<CredibilityAdminProps> = ({ className }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "settings" | "campaigns" | "stats"
  >("settings");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Admin settings state
  const [settings, setSettings] = useState<AdminSettings>({
    weights: {
      GOVERNMENT_ID: 25,
      NGO_LICENSE: 20,
      ACCOUNT_AGE: 15,
      SOCIAL_MEDIA: 15,
      HISTORY: 25,
    },
    minConfidenceThreshold: 60,
    cacheDurationHours: 24,
    enableRealTimeUpdates: true,
    enableAutoRecalculation: false,
  });

  // Test campaign data
  const [testCampaign, setTestCampaign] = useState<Partial<CampaignMetadata>>({
    title: "Test Campaign",
    description: "This is a test campaign for credibility scoring",
    category: "education",
    location: "Global",
    creatorAddress: "0x1234567890123456789012345678901234567890",
    creationDate: new Date(),
  });

  const [testResult, setTestResult] = useState<CredibilityScore | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Storage statistics
  const [storageStats, setStorageStats] = useState({
    trustAnalyses: 0,
    credibilityScores: 0,
    totalSize: 0,
  });

  // Load storage statistics
  const loadStorageStats = async () => {
    try {
      const stats = await trustDataStorage.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error("Failed to load storage stats:", error);
    }
  };

  useEffect(() => {
    loadStorageStats();
  }, []);

  // Handle settings update
  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Validate weights sum to 100
      const totalWeight = Object.values(settings.weights).reduce(
        (sum, weight) => sum + weight,
        0,
      );
      if (Math.abs(totalWeight - 100) > 0.1) {
        throw new Error("Credibility factor weights must sum to 100%");
      }

      // Save settings to localStorage (in a real app, this would be saved to a backend)
      localStorage.setItem(
        "credibilityAdminSettings",
        JSON.stringify(settings),
      );

      toast({
        title: "Settings Saved",
        description:
          "Credibility scoring settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description:
          error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test credibility calculation
  const handleTestCalculation = async () => {
    if (!testCampaign.title || !testCampaign.creatorAddress) {
      toast({
        title: "Invalid Test Data",
        description: "Please provide at least a title and creator address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTestError(null);

    try {
      const metadata: CampaignMetadata = {
        title: testCampaign.title,
        description: testCampaign.description || "",
        category: testCampaign.category || "other",
        location: testCampaign.location || "",
        creatorAddress: testCampaign.creatorAddress,
        creationDate: testCampaign.creationDate || new Date(),
        zkProofs: [] as ZKProof[],
        publicVerifications: [],
      };

      const result = await credibilityEngine.calculateFromMetadata(metadata);
      setTestResult(result);

      toast({
        title: "Test Completed",
        description: `Credibility score calculated: ${result.score}%`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Test calculation failed";
      setTestError(errorMessage);
      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      await trustDataStorage.clearAllData();
      await loadStorageStats();
      toast({
        title: "Cache Cleared",
        description: "All credibility data has been cleared from cache.",
      });
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Credibility Factor Weights */}
      <div className="glass p-6 rounded-xl border border-blue-500/20">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Credibility Factor Weights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(settings.weights).map(([factor, weight]) => {
            const getFactorIcon = (type: string) => {
              switch (type) {
                case "GOVERNMENT_ID":
                  return User;
                case "NGO_LICENSE":
                  return Building;
                case "ACCOUNT_AGE":
                  return Clock;
                case "SOCIAL_MEDIA":
                  return Users;
                case "HISTORY":
                  return Calendar;
                default:
                  return Shield;
              }
            };

            const getFactorName = (type: string) => {
              switch (type) {
                case "GOVERNMENT_ID":
                  return "Government ID";
                case "NGO_LICENSE":
                  return "NGO License";
                case "ACCOUNT_AGE":
                  return "Account Age";
                case "SOCIAL_MEDIA":
                  return "Social Media";
                case "HISTORY":
                  return "Campaign History";
                default:
                  return type;
              }
            };

            const Icon = getFactorIcon(factor);

            return (
              <div key={factor} className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-300">
                  <Icon className="w-4 h-4" />
                  {getFactorName(factor)}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={weight}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        weights: {
                          ...settings.weights,
                          [factor]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-400 w-8">%</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="text-sm text-gray-400">
            Total Weight:{" "}
            {Object.values(settings.weights).reduce((sum, w) => sum + w, 0)}%
            {Math.abs(
              Object.values(settings.weights).reduce((sum, w) => sum + w, 0) -
                100,
            ) > 0.1 && (
              <span className="text-red-400 ml-2">⚠ Must equal 100%</span>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="glass p-6 rounded-xl border border-gray-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Advanced Settings
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>

        {showAdvanced && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Min Confidence Threshold (%)
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.minConfidenceThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minConfidenceThreshold: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Cache Duration (hours)</Label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={settings.cacheDurationHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cacheDurationHours: parseFloat(e.target.value) || 24,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">
                  Enable Real-time Updates
                </Label>
                <Switch
                  checked={settings.enableRealTimeUpdates}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      enableRealTimeUpdates: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">
                  Auto-recalculate on Data Change
                </Label>
                <Switch
                  checked={settings.enableAutoRecalculation}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      enableAutoRecalculation: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );

  const renderTestTab = () => (
    <div className="space-y-6">
      {/* Test Campaign Input */}
      <div className="glass p-6 rounded-xl border border-green-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">
          Test Credibility Calculation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Campaign Title</Label>
            <Input
              value={testCampaign.title || ""}
              onChange={(e) =>
                setTestCampaign({
                  ...testCampaign,
                  title: e.target.value,
                })
              }
              placeholder="Enter campaign title"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Creator Address</Label>
            <Input
              value={testCampaign.creatorAddress || ""}
              onChange={(e) =>
                setTestCampaign({
                  ...testCampaign,
                  creatorAddress: e.target.value,
                })
              }
              placeholder="0x..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Category</Label>
            <Input
              value={testCampaign.category || ""}
              onChange={(e) =>
                setTestCampaign({
                  ...testCampaign,
                  category: e.target.value,
                })
              }
              placeholder="e.g., education, health"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Location</Label>
            <Input
              value={testCampaign.location || ""}
              onChange={(e) =>
                setTestCampaign({
                  ...testCampaign,
                  location: e.target.value,
                })
              }
              placeholder="e.g., Global, USA"
            />
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <Label className="text-gray-300">Description</Label>
          <Textarea
            value={testCampaign.description || ""}
            onChange={(e) =>
              setTestCampaign({
                ...testCampaign,
                description: e.target.value,
              })
            }
            placeholder="Enter campaign description"
            rows={3}
          />
        </div>
        <Button onClick={handleTestCalculation} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Calculate Score
        </Button>
      </div>

      {/* Test Results */}
      {(testResult || testError) && (
        <div className="glass p-6 rounded-xl border border-gray-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">
            Test Results
          </h3>
          {testError ? (
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span>{testError}</span>
            </div>
          ) : testResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Overall Score:</span>
                <span className="text-2xl font-bold text-green-400">
                  {testResult.score}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Confidence:</span>
                <span className="text-lg font-semibold text-blue-400">
                  {Math.round(testResult.confidence * 100)}%
                </span>
              </div>
              <div className="space-y-2">
                <span className="text-gray-300">Factor Breakdown:</span>
                {testResult.factors.map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-400">{factor.type}:</span>
                    <span className="text-white">{factor.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      {/* Storage Statistics */}
      <div className="glass p-6 rounded-xl border border-purple-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">
          Storage Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {storageStats.trustAnalyses}
            </div>
            <div className="text-sm text-gray-400">Trust Analyses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {storageStats.credibilityScores}
            </div>
            <div className="text-sm text-gray-400">Credibility Scores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {storageStats.totalSize}
            </div>
            <div className="text-sm text-gray-400">Total Entries</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadStorageStats}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            onClick={handleClearCache}
            disabled={isLoading}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">
          Credibility Admin Panel
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
        {[
          { id: "settings", label: "Settings", icon: Settings },
          { id: "campaigns", label: "Test", icon: CheckCircle },
          { id: "stats", label: "Statistics", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "settings" && renderSettingsTab()}
      {activeTab === "campaigns" && renderTestTab()}
      {activeTab === "stats" && renderStatsTab()}
    </div>
  );
};

export default CredibilityAdmin;
