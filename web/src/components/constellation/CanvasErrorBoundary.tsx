import { Component, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Wraps the lazy 3D canvas. If R3F/WebGL throws during render (driver issue,
 * lost context, missing WebGL), we swap in the 2D fallback instead of a blank
 * page. A blank page burned this project once — this guarantees projects stay
 * reachable.
 */
export default class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.warn("Constellation canvas failed; using 2D fallback.", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
