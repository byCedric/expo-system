import { System } from './core/system';

export * from './core/system';

// Initialize all core features
export * from './features/resolve';
export * from './features/fetch';
export * from './features/evaluate';
export * from './features/instantiate';
export * from './features/registry';
export * from './features/named-register';

declare global {
  var System: SystemJS.System;
}

// Bind the singleton instance as global value
(global || globalThis)['System'] = System;
