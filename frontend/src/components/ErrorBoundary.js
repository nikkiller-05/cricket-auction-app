import React from 'react';

// Top-level safety net: catches render/runtime errors in the tree below it
// and shows a recoverable fallback instead of a blank white screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log for diagnostics; swap for a real reporter (Sentry) later if desired.
    console.error('Unhandled UI error:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0b0a06] via-[#1c1608] to-[#0b0a06] text-center">
          <div className="max-w-md w-full rounded-2xl border border-amber-300/20 bg-white/[0.06] backdrop-blur-xl p-8 shadow-2xl">
            <div className="text-5xl mb-4">🏏</div>
            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-amber-100/70 mb-6">
              An unexpected error occurred. Reloading usually fixes it — your auction data is safe.
            </p>
            <button
              onClick={this.handleReload}
              className="rounded-full bg-gradient-to-b from-amber-400 to-amber-600 px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-md hover:-translate-y-0.5 active:translate-y-0 transition"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
