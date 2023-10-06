import { SystemPrototype } from '../core/system';

declare global {
  namespace SystemJS {
    interface System {
      /** Fetch the module source from the requested module url. */
      fetch(id: ModuleId, parentId?: ModuleId, options?: ModuleOptions): Promise<Response>;
    }
  }
}

SystemPrototype.fetch = function (id, parentId, options) {
  return fetch(id);
};
