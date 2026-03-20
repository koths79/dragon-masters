import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-8 max-w-lg w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-white text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-400 text-sm mb-4">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-xl transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
