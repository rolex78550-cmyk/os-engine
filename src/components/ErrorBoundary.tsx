import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

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
    // Log full error for debugging
    console.error("🚨 [Menifest OS] Quantum Resonance Error:", error);
    console.error("Component Stack:", errorInfo.componentStack);
  }

  private handleReset = () => {
    // Full hard reset
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorName = this.state.error?.name || "RESONANCE_FAIL";
      const errorMsg = this.state.error?.message || "";

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle size={40} className="text-rose-500" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Quantum Resonance Interrupted</h1>
              <p className="text-white/50 text-sm leading-relaxed">
                The manifestation engine encountered a temporary misalignment. Your progress is safe, but we need to reset the connection.
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all"
            >
              <RefreshCw size={18} />
              Re-align Engine
            </button>

            <div className="text-left">
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">
                Error code: {errorName}
              </p>
              {errorMsg && (
                <div className="mt-2 p-3 rounded-xl bg-black/70 text-left text-xs font-mono text-rose-400/80 break-all border border-rose-500/10">
                  {errorMsg}
                </div>
              )}
            </div>

            <p className="text-[10px] text-white/30">
              Tip: Try hard refresh (Ctrl+Shift+R) after clicking Re-align
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
