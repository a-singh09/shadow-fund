import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import EERCRecovery from "./EERCRecovery";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class EERCErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("eERC Error Boundary caught an error:", error, errorInfo);

    // Check if it's the specific message formatting error
    if (error.message.includes("The last element of the message must be 0")) {
      console.warn("Detected eERC message formatting error");
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRecoveryComplete = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isMessageError = this.state.error?.message.includes(
        "The last element of the message must be 0",
      );
      const isBalanceError =
        this.state.error?.message.includes("calculateTotalBalance") ||
        this.state.error?.message.includes("decryptPCT") ||
        this.state.error?.message.includes("poseidonDecrypt");

      // If it's a data corruption error, show the recovery component
      if (isMessageError || isBalanceError) {
        return (
          <EERCRecovery onRecoveryComplete={this.handleRecoveryComplete} />
        );
      }

      return (
        <div className="p-6 glass rounded-2xl border border-red-500/20">
          <div className="flex items-center space-x-2 text-red-400 mb-4">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-lg font-semibold">eERC System Error</h3>
          </div>

          <div className="space-y-3">
            <p className="text-gray-300 text-sm">
              {isMessageError
                ? "There's an issue with the eERC message formatting. This usually resolves itself after refreshing."
                : "An error occurred while initializing the eERC system."}
            </p>

            {isMessageError && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-xs">
                  💡 Try refreshing the page or reconnecting your wallet to
                  resolve this issue.
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Refresh Page
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-4">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EERCErrorBoundary;
