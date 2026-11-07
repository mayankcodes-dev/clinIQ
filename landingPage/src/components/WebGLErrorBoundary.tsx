"use client";

import React, { Component, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Catches WebGL / Three.js render errors so the rest of the page keeps working.
 */
export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // surfaced in dev console only
    console.warn("[Hero3DGlass] WebGL context error – showing fallback.", error.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
