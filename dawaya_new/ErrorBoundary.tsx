import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Global Enterprise Crash-Proof Error Boundary for DAWAYA.
 * Prevents any unexpected runtime or network chunk error from ever displaying a blank white screen.
 */
export class DawayaErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[DAWAYA ErrorBoundary Caught]:', error, errorInfo);
  }

  handleRecover = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    if (typeof window !== 'undefined') {
      window.location.hash = '#/';
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="wrap narrow" dir="rtl" style={{ paddingTop: '36px', paddingBottom: '48px' }}>
          <div
            className="card stack"
            style={{
              padding: '28px 24px',
              borderRadius: '22px',
              borderTop: '5px solid #10b981',
              textAlign: 'center',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
              تمت حماية الجلسة من خطأ عارض أثناء عرض الصفحة
            </h2>
            <p className="small muted" style={{ margin: 0, maxWidth: '48ch', lineHeight: 1.6 }}>
              لا تقلق، بياناتك وملفك الصحي محفوظة بالكامل. يمكنك إعادة تحميل القسم الحالي أو العودة للصفحة الرئيسية بضغطة واحدة.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
              <button
                type="button"
                className="btn"
                onClick={this.handleRecover}
                style={{ borderRadius: '999px', padding: '10px 22px', fontWeight: 800 }}
              >
                إعادة المحاولة فوراً
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={this.handleGoHome}
                style={{ borderRadius: '999px', padding: '10px 22px', fontWeight: 800 }}
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default DawayaErrorBoundary;
