import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-fin-card border border-fin-border rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[200px] animate-fade-in w-full h-full">
          <AlertTriangle className="w-12 h-12 text-fin-danger mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Component Error</h3>
          <p className="text-fin-mute text-sm mb-6 max-w-md">
            We encountered an unexpected error while rendering this section.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 border border-fin-border hover:bg-fin-border text-fin-mute hover:text-white rounded-md transition-colors text-sm"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="flex items-center px-4 py-2 bg-fin-accent hover:bg-emerald-600 text-white rounded-md transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
