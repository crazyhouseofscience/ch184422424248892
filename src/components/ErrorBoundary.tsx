import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#020617',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f43f5e', marginBottom: '1rem' }}>
              Simulation Initializing Notice
            </h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem', lineHeight: '1.6' }}>
              The application encountered an initialization notice. Click the button below to reload the workstation:
            </p>
            {this.state.error && (
              <div style={{
                textAlign: 'left',
                backgroundColor: '#020617',
                border: '1px solid #dc2626',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#fca5a5',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                maxHeight: '160px'
              }}>
                <strong>Error:</strong> {this.state.error.message || String(this.state.error)}
                {this.state.error.stack && (
                  <div style={{ marginTop: '0.5rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Restart Simulation
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
