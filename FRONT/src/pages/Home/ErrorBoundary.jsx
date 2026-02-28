import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log errorInfo to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2em', background: '#fff3cd', color: '#856404', borderRadius: '8px', margin: '2em' }}>
          <h2>Ocorreu um erro nesta página.</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <p>Tente recarregar ou entre em contato com o suporte.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
