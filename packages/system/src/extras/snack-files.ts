import { System, SystemPrototype } from '../core/system';
import '../features/instantiate';

declare global {
  namespace SystemJS {
    interface System {
      files: Map<string, string>;
      addFiles(files: Record<string, string>): void;
      resetFiles(): void;
    }
  }
}

SystemPrototype.files = new Map<string, string>();

SystemPrototype.addFiles = function (newFiles: Record<string, string>) {
  for (const [url, source] of Object.entries(newFiles)) {
    this.files.set(url, source);
  }
};

SystemPrototype.resetFiles = function () {
  this.files.clear();
};

// Hooks

const nextResolve = SystemPrototype.resolve;
SystemPrototype.resolve = function (id, parentId) {
  return this.files.has(id) ? id : nextResolve.call(this, id, parentId);
}

const nextInstantiate = SystemPrototype.instantiate;
SystemPrototype.instantiate = function (id, parentId, options) {
  const system = this as typeof System;
  const source = system.files.get(id);

  if (source) {
    return Promise.resolve(
      system.evaluateSource(source, id, parentId, options)
    );
  }

  return nextInstantiate.call(this, id, parentId, options);
}
