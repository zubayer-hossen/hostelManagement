import { Component } from 'react';

/** Catches render errors so the whole app never white-screens. */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ui] render error', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-5xl font-extrabold text-primary-600">500</p>
          <h1 className="mt-3 text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-slate-500">An unexpected error occurred. Please reload the page.</p>
          <button className="btn-primary mt-6" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}
