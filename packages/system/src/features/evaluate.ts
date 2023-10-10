import { System, SystemPrototype } from '../core/system';
import { SystemError } from '../core/errors';

declare global {
  namespace SystemJS {
    interface System {
      /** Evaluate the provided source code and turn it into a module declaration */
      evaluateSource(source: string, id: ModuleId, parentId?: ModuleId, options?: ModuleOptions): ModuleDeclaration;
      /** Evaluate the fetch result and turn it into a module declaration */
      evaluateResponse(response: Response, id: ModuleId, parentId?: ModuleId, options?: ModuleOptions): Promise<ModuleDeclaration>;
    }
  }
}

/** Determine if we can use the React Native `globalEvalWithSourceUrl` function */
const hasGlobalEvaluate = typeof global.globalEvalWithSourceUrl === 'function';

SystemPrototype.evaluateSource = function (source, id, parentId, options) {
  if (hasGlobalEvaluate) {
    global.globalEvalWithSourceUrl(source, id);
  } else {
    (0, eval)(source);
  }

  return (this as typeof System).getRegister(id);
};

SystemPrototype.evaluateResponse = function (response, id, parentId, options) {
  if (!response.ok) {
    throw new SystemError('FETCH_ERROR', `Unable to fetch module "${id}": ${response.status} - ${response.statusText}`);
  }

  const system = this as typeof System;
  const contentType = (response.headers.get('content-type') || '').split(';', 1).pop();

  switch (contentType) {
    case 'text/javascript':
    case 'application/javascript':
      return response.text().then((source) => this.evaluateSource(source, id, parentId, options));

    case 'text/json':
    case 'application/json':
      return response.json().then((data) => {
        system.register([], function (_export) {
          return {
            execute() { _export('default', data) }
          };
        });

        return system.getRegister();
      });

    default:
      throw new SystemError(
        'UNKNOWN_CONTENT_TYPE',
        `Unknown "content-type" header received for module "${id}": ${contentType}`
      );
  }
}
