import { SystemError } from '../core/errors';
import { REGISTRY, SystemPrototype } from '../core/system';
import { NAMED_REGISTRY } from '../features/named-register';

import '../features/registry';

declare global {
  namespace SystemJS {
    interface System {
      /**
       * Synchronously initiate and return module instances.
       * This only checks the internal registry, and the named registers for available modules.
       * For asynchronous or http-based modules, this function will throw, use `System.import` instead.
       */
      require(id: ModuleId): Module;
    }
  }
}

SystemPrototype.require = function (id) {
  const moduleId = this.resolve(id);

  // Return the loaded module if it's already available
  const preloadedModule = this.get(moduleId);
  if (preloadedModule) {
    return preloadedModule;
  }

  // Instantiate and return a name-registered module
  const registeredModule = this[NAMED_REGISTRY].get(moduleId);
  if (registeredModule) {
    instantiateModule(this, moduleId, registeredModule);
    return this.get(moduleId);
  }

  // Throw if the module is not available
  throw new SystemError(
    'COMMONJS_REQUIRE_UNAVAILABLE',
    `Module "${moduleId}" is not (yet) available and ".require" can't load modules async, use ".import" instead.`
  );
};

var toStringTag = Symbol.toStringTag;

/**
 * This function is forked from the `getOrCreateLoad` in `../core/system.ts`.
 * It is used to instantiate a module synchronously.
 */
function instantiateModule(loader: SystemJS.System, id: string, registration: SystemJS.ModuleDeclaration) {
  // Remove pending registration, if any
  loader[NAMED_REGISTRY].delete(id);

  var load: any = {};
  var importerSetters: SystemJS.DeclarationSetter[] = [];
  var ns = Object.create(null);

  if (toStringTag) {
    Object.defineProperty(ns, toStringTag, { value: 'Module' });
  }

  // Create the `export` object used to export values from the module
  const _export: SystemJS.DeclarationExport = (name, value) => {
    // note if we have hoisted exports (including reexports)
    load.h = true;
    var changed = false;

    if (typeof name === 'string') {
      // Handle exporting through `_export('key', 'value')`
      if (!(name in ns) || ns[name] !== value) {
        ns[name] = value;
        changed = true;
      }
    } else {
      // Handle exporting through `_export({ key: 'value' })`
      for (var p in name) {
        var value = name[p];
        if (!(p in ns) || ns[p] !== value) {
          ns[p] = value;
          changed = true;
        }
      }

      if (name && name.__esModule) {
        ns.__esModule = name.__esModule;
      }
    }

    if (changed) {
      for (var i = 0; i < importerSetters.length; i++) {
        var setter = importerSetters[i];
        if (setter) setter(ns);
      }
    }

    return value;
  }

  const [dependencies, declaration] = registration;

  // Execute the module declaration, without executing the module yet
  const declared = declaration(
    _export,
    declaration.length === 2
      ? {
          import: function (importId, meta) {
            return loader.import(importId, id, meta);
          },
          meta: loader.createContext(id),
        }
      : undefined
  );

  // Prepare the linked dependency records for the original module, if any
  const dependencyLoads: any = dependencies.length ? [] : undefined;
  // Iterate, get or instantiate, and link dependencies to the original module
  for (let i = 0; i < dependencies.length; i++) {
    const dependency = loader.resolve(dependencies[i]);
    const setter = declared.setters?.[i];
    // TODO: add meta

    let dependencyLoad = loader[REGISTRY].get(dependency);
    let dependencyRegistration = loader[NAMED_REGISTRY].get(dependency)

    if (!dependencyLoad && dependencyRegistration) {
      instantiateModule(loader, dependency, dependencyRegistration);
      dependencyLoad = loader[REGISTRY].get(dependency);
    }

    if (setter) {
      // Register the setter from the original module to the dependency
      dependencyLoad.i.push(setter);
      // Invoke the setter within the original module namespace
      if (dependencyLoad.h) {
        setter(dependencyLoad.n);
      }
    }

    dependencyLoads.push(dependencyLoad);
  }

  // Prepare the module registration
  load = {
    id,
    // importerSetters, the setters functions registered to this dependency
    // we retain this to add more later
    i: importerSetters,
    // module namespace object
    n: ns,
    // extra module information for import assertion
    // shape like: { assert: { type: 'xyz' } }
    m: undefined, // meta, - // TODO

    // instantiate
    I: undefined,
    // link
    L: undefined,
    // whether it has hoisted exports
    h: false,

    // On instantiate completion we have populated:
    // dependency load records
    d: dependencyLoads,
    // execution function
    e: undefined,

    // On execution we have populated:
    // the execution error if any
    er: undefined,
    // in the case of TLA, the execution promise
    E: undefined,

    // On execution, L, I, E cleared

    // Promise for top-level completion
    C: undefined,

    // parent instantiator / executor
    p: undefined,
  };

  // Execute the module itself, after all dependencies are loaded
  load.e = declared.execute || function () {};
  // Guard against asynchronous execution
  if (typeof load.e()?.then === 'function') {
    throw new SystemError(
      'COMMONJS_REQUIRE_ASYNC_EXECUTE',
      `Module "${id}" needs to be initialized asynchronously, use ".import" instead.`,
    )
  } else {
    // Mark module as instantiated
    load.e = null;
  }

  // Write the evaluated module to the registry
  loader[REGISTRY].set(id, load);
}
