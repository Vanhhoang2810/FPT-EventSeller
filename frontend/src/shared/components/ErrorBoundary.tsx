import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack?.slice(0, 300));
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
            <AlertTriangle size={28} className="text-error" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Đã xảy ra lỗi không mong muốn
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vui lòng thử tải lại trang hoặc quay về trang chủ.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground icon-glass transition-colors"
            >
              <RefreshCw size={14} /> Thử lại
            </button>
            <a
              href="/"
              className="flex items-center gap-2 rounded-xl btn-glass px-5 py-2.5 text-sm font-semibold hover: transition-colors"
            >
              <Home size={14} /> Về trang chủ
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
