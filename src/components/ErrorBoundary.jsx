import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    const english = document.documentElement.lang === 'en';
    return (
      <main className="service-state" role="alert">
        <img src="/uploads/logo_lwmfd.png" alt="Life Word Mission France & Diaspora" />
        <h1>{english
          ? 'The application encountered an unexpected error.'
          : "L'application a rencontré une erreur inattendue."}</h1>
        <button type="button" onClick={() => window.location.reload()}>
          {english ? 'Restart the application' : "Relancer l'application"}
        </button>
      </main>
    );
  }
}
