"use client";

// =============================================================================
// ErrorBoundary — catches render errors in data pages
// Displays a graceful fallback with retry option instead of crashing the app.
// =============================================================================

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production, report to your error tracking service here
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-16 px-6 text-center"
          style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(0 72% 51% / 0.25)" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
            style={{ backgroundColor: "hsl(0 72% 51% / 0.1)" }}
          >
            <AlertTriangle className="h-6 w-6" style={{ color: "hsl(0 72% 61%)" }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "hsl(0 0% 98%)" }}>
            Something went wrong
          </h3>
          <p className="text-xs max-w-xs mb-5" style={{ color: "hsl(240 4% 38%)" }}>
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: "hsl(263 70% 58%)", color: "white" }}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
