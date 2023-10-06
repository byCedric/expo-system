import { SystemPrototype } from './core/system';

export { System } from './core/system';

// Polyfill from system-core
declare global {
  namespace SystemJS {
    interface System {
      prepareImport(): void;
    }
  }
}
SystemPrototype.prepareImport = function(){};

// Initialize all core features
import './features/resolve';
import './features/fetch';
import './features/evaluate';
import './features/instantiate';
import './features/registry';

// Initialize all extras
import './extras/babel-transpile';
import './extras/snack-files';
