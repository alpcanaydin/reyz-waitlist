declare module '*.css' {}

interface Turnstile {
  execute: (widgetId: string) => void;
  ready: (callback: () => void) => void;
  remove: (widgetId: string) => void;
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
}

interface TurnstileRenderOptions {
  action?: string;
  callback?: (token: string) => void;
  execution?: 'execute' | 'render';
  'error-callback'?: () => boolean | void;
  'expired-callback'?: () => void;
  sitekey: string;
  'timeout-callback'?: () => void;
}

interface Window {
  turnstile?: Turnstile;
}
