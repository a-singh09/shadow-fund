import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });

    // Log the error
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Check if this is a cryptographic error
      const isCryptoError =
        this.state.error?.message?.includes(
          "last element of the message must be 0",
        ) ||
        this.state.error?.message?.includes("decrypt") ||
        this.state.error?.message?.includes("cipher") ||
        this.state.error?.message?.includes("encryption");

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 glass rounded-2xl border border-red-700/50 bg-red-900/10">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                {isCryptoError ? "Encryption Error" : "Something went wrong"}
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                {isCryptoError
                  ? "There was an issue with the encrypted data. This might be due to corrupted encryption keys or malformed encrypted balance data."
                  : "An unexpected error occurred while loading this component."}
              </p>

              {isCryptoError && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <p className="text-xs text-yellow-300">
                    <strong>Suggested fixes:</strong>
                  </p>
                  <ul className="text-xs text-yellow-300 mt-1 space-y-1">
                    <li>• Try refreshing the page</li>
                    <li>• Clear your browser's local storage</li>
                    <li>• Re-register with the eERC20 system</li>
                    <li>• Disconnect and reconnect your wallet</li>
                  </ul>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={this.handleReset}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                {isCryptoError && (
                  <Button
                    onClick={() => {
                      // Clear eERC related localStorage
                      const keys = Object.keys(localStorage);
                      keys.forEach((key) => {
                        if (key.includes("eerc-key")) {
                          localStorage.removeItem(key);
                        }
                      });
                      window.location.reload();
                    }}
                    size="sm"
                    variant="outline"
                    className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                  >
                    Clear Keys & Reload
                  </Button>
                )}
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
