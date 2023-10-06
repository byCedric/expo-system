import { SystemError, errorMessageWithContext } from '../core/errors';
import { SystemPrototype } from '../core/system';

declare global {
  namespace SystemJS {
    interface System {
      /**
       * Resolve a module request by converting a requestiong "url", and it's "parentUrl" to a full URL.
       * If the URL can't be resolved, an error is thrown.
       */
      resolve(id: ModuleId, parentId?: ModuleId, options?: ModuleOptions): ModuleId;
    }
  }
}

SystemPrototype.resolve = function (id, parentId, options) {
  throw new SystemError(
    'UNHANDLED',
    errorMessageWithContext('".resolve" could not handle module:', { id, parentId })
  );
};
