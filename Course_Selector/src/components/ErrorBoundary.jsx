import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    // No account details or component state enter diagnostics.
    console.error('CourseNFound could not render this page.');
  }
  render() {
    if (this.state.failed) return <main className="app-error"><h1>This page could not load.</h1><p>Your saved results are still in your account. Refresh to try again.</p><button onClick={() => window.location.reload()}>Refresh page</button><a href="/home">Return home</a></main>;
    return this.props.children;
  }
}
