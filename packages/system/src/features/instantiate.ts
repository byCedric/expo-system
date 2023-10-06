import { System, SystemPrototype } from '../core/system';

import './fetch';
import './evaluate';

declare global {
  namespace SystemJS {
    interface System {
      /**
       * Instantiate a module by converting a resolved module id to a systemjs registration.
       * Once the registration is created, systemjs will execute the module when required.
       */
      instantiate(id: ModuleId, parentId?: ModuleId, options?: ModuleOptions): Promise<ModuleDeclaration>;

      /** Hook to create the initial module options */
      // createOptions(id: ModuleId, parentId?: ModuleId, options?: ModuleOptions): ModuleOptions;
    }
  }
}

SystemPrototype.instantiate = function (id, parentId, options) {
  const system = this as typeof System;
  return system.fetch(id, parentId, options).then(
    (response) => system.evaluateResponse(response, id, parentId, options)
  );
};
