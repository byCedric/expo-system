/*
 * SystemJS Core that works on React Native
 *
 * Provides
 * - System.import
 * - System.register support for
 *     live bindings, function hoisting through circular references,
 *     reexports, dynamic import, import.meta.url, top-level await
 * - System.getRegister to get the registration
 * - Symbol.toStringTag support in Module objects
 * - Hookable System.createContext to customize import.meta
 * - System.onload(err, id, deps) handler for tracing / hot-reloading
 *
 * Core comes with no System.prototype.resolve or
 * System.prototype.instantiate implementations
 *
 * This fork is based on `systemjs@6.14.2`
 * See: https://github.com/systemjs/systemjs/blob/6.14.2/src/system-core.js
 */
import { SystemError, errorMessageWithContext } from './errors';

// Typescript declaration with the ability to extend in each feature file
declare global { // TODO: make not-global
  namespace SystemJS {
    /** The evaluated and instantiated module reference */
    export type Module = any;
    /** The full URL or id of a module */
    export type ModuleId = string;

    /** The systemjs module declaration function, used to instantiate and emulate modules */
    export type Declaration = (_exports: DeclarationExport, _context: DeclarationContext) => ({
      setters?: DeclarationSetter[];
      execute: DeclarationExecutor;
    });
    /** The systemjs module emulation setter function, used to bind external libraries */
    export type DeclarationSetter = (module: Module) => void;
    /** The systemjs module emulation execute function, used to instantiate the module */
    export type DeclarationExecutor = () => void | Promise<void>;

    /** The systemjs module emulation `_exports` function, used to bind exported values from the modules */
    export interface DeclarationExport {
      (exports: Record<string, any>): void;
      (exportName: string, value: any): void;
    }
    /** The systemjs module emulation `_context` object, used to emulate ESM functionality like `import.meta` */
    export interface DeclarationContext {
      import(id: ModuleId, options?: ModuleOptions): Promise<Module>;
      meta: ImportMeta;
    }

    /** The systemjs module declaration format, used by the systemjs core to process the module */
    export type ModuleDeclaration = [ModuleId[], Declaration] | [ModuleId[], Declaration, ModuleOptions[]];

    /** The emulated ESM `import.meta` object */
    export interface ImportMeta {
      url: ModuleId;
      resolve(id: ModuleId, parent?: ModuleId): Promise<ModuleId>;
    }

    /** The module options object, passed through the systemjs pipeline */
    export interface ModuleOptions {}

    export class System {
      [REGISTRY]: Map<string, any>;

      /**
       * Loads a module by name taking an optional normalized parent URL argument.
       * @see https://github.com/systemjs/systemjs/blob/6.14.2/docs/api.md#systemimportid--parenturl---promisemodule
       */
      import<T extends Module>(id: ModuleId, parentId?: ModuleId, options?: ModuleOptions): Promise<T>;

      /**
       * Used to populate the `import.meta` for a module, available at _context.meta in the `System.register` module format.
       * @see https://github.com/systemjs/systemjs/blob/6.14.2/docs/hooks.md#createcontexturl---object
       * @see https://github.com/systemjs/systemjs/blob/6.14.2/docs/system-register.md
       */
      createContext(parentId: ModuleId): ImportMeta;

      /**
       * Declaration function for defining modules of the `System.register` polyfill module format.
       * @see https://github.com/systemjs/systemjs/blob/6.14.2/docs/api.md#systemregisterdeps-declare
       */
      register(dependencies: ModuleId[], definition: Declaration, options?: ModuleOptions[]): void;

      /**
       * Return the last anonymous `System.register` registration.
       * This can be useful when evaluating a module definition.
       */
      getRegister(): ModuleDeclaration;

      // todo
      onload();
      prepareImport(): void;
    }
  }
}

export { systemJSPrototype, REGISTRY };

var toStringTag = Symbol.toStringTag;
var REGISTRY = Symbol('registry');

function SystemJS() {
  this[REGISTRY] = new Map();
}

var systemJSPrototype = SystemJS.prototype as SystemJS.System;

export const SystemPrototype = systemJSPrototype;

// Auto-fill this method, we dont use this in React Native
SystemPrototype.prepareImport = function(){};

systemJSPrototype.import = function (id, parentUrl, meta) {
  var loader = this;
  parentUrl && typeof parentUrl === 'object' && ((meta = parentUrl), (parentUrl = undefined));
  return Promise.resolve(loader.prepareImport())
    .then(function () {
      return loader.resolve(id, parentUrl, meta);
    })
    .then(function (id) {
      var load = getOrCreateLoad(loader, id, undefined, meta);
      return load.C || topLevelLoad(loader, load);
    });
};

// Hookable createContext function -> allowing eg custom import meta
systemJSPrototype.createContext = function (parentId) {
  var loader = this;
  return {
    url: parentId,
    resolve: function (id, parentUrl) {
      return Promise.resolve(loader.resolve(id, parentUrl || parentId));
    },
  };
};

// onLoad(err, id, deps) provided for tracing / hot-reloading
if (!process.env.SYSTEM_PRODUCTION) systemJSPrototype.onload = function () {};
function loadToId(load) {
  return load.id;
}
function triggerOnload(loader, load, err, isErrSource) {
  loader.onload(err, load.id, load.d && load.d.map(loadToId), !!isErrSource);
  if (err) throw err;
}

var lastRegister;
systemJSPrototype.register = function (deps, declare, metas) {
  lastRegister = [deps, declare, metas];
};

/*
 * getRegister provides the last anonymous System.register call
 */
systemJSPrototype.getRegister = function () {
  var _lastRegister = lastRegister;
  lastRegister = undefined;
  return _lastRegister;
};

export function getOrCreateLoad(loader, id, firstParentUrl, meta) {
  var load = loader[REGISTRY].get(id);
  if (load) return load;

  var importerSetters = [] as SystemJS.DeclarationSetter[];
  var ns = Object.create(null);
  if (toStringTag) Object.defineProperty(ns, toStringTag, { value: 'Module' });

  var instantiatePromise = Promise.resolve()
    .then(function () {
      return loader.instantiate(id, firstParentUrl, meta);
    })
    .then(
      function (registration) {
        if (!registration) {
          throw new SystemError(
            'NO_REGISTRATION',
            errorMessageWithContext('".instantiate" did not create a module declaration.', { id, parentId: firstParentUrl })
          );
        }
        function _export(name, value) {
          // note if we have hoisted exports (including reexports)
          load.h = true;
          var changed = false;
          if (typeof name === 'string') {
            if (!(name in ns) || ns[name] !== value) {
              ns[name] = value;
              changed = true;
            }
          } else {
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
          if (changed)
            for (var i = 0; i < importerSetters.length; i++) {
              var setter = importerSetters[i];
              if (setter) setter(ns);
            }
          return value;
        }
        var declared = registration[1](
          _export,
          registration[1].length === 2
            ? {
                import: function (importId, meta) {
                  return loader.import(importId, id, meta);
                },
                meta: loader.createContext(id),
              }
            : undefined
        );
        load.e = declared.execute || function () {};
        return [registration[0], declared.setters || [], registration[2] || []];
      },
      function (err) {
        load.e = null;
        load.er = err;
        if (!process.env.SYSTEM_PRODUCTION) triggerOnload(loader, load, err, true);
        throw err;
      }
    );

  var linkPromise = instantiatePromise.then(function (instantiation) {
    return Promise.all(
      instantiation[0].map(function (dep, i) {
        var setter = instantiation[1][i];
        var meta = instantiation[2][i];
        return Promise.resolve(loader.resolve(dep, id)).then(function (depId) {
          var depLoad = getOrCreateLoad(loader, depId, id, meta);
          // depLoad.I may be undefined for already-evaluated
          return Promise.resolve(depLoad.I).then(function () {
            if (setter) {
              depLoad.i.push(setter);
              // only run early setters when there are hoisted exports of that module
              // the timing works here as pending hoisted export calls will trigger through importerSetters
              if (depLoad.h || !depLoad.I) setter(depLoad.n);
            }
            return depLoad;
          });
        });
      })
    ).then(function (depLoads) {
      load.d = depLoads;
    });
  });
  if (!process.env.SYSTEM_BROWSER) linkPromise.catch(function () {});

  // Capital letter = a promise function
  load = {
    id: id,
    // importerSetters, the setters functions registered to this dependency
    // we retain this to add more later
    i: importerSetters,
    // module namespace object
    n: ns,
    // extra module information for import assertion
    // shape like: { assert: { type: 'xyz' } }
    m: meta,

    // instantiate
    I: instantiatePromise,
    // link
    L: linkPromise,
    // whether it has hoisted exports
    h: false,

    // On instantiate completion we have populated:
    // dependency load records
    d: undefined,
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
  loader[REGISTRY].set(id, load);
  return load;
}

function instantiateAll(loader, load, parent, loaded) {
  if (!loaded[load.id]) {
    loaded[load.id] = true;
    // load.L may be undefined for already-instantiated
    return Promise.resolve(load.L)
      .then(function () {
        if (!load.p || load.p.e === null) load.p = parent;
        return Promise.all(
          load.d.map(function (dep) {
            return instantiateAll(loader, dep, parent, loaded);
          })
        );
      })
      .catch(function (err) {
        if (load.er) throw err;
        load.e = null;
        if (!process.env.SYSTEM_PRODUCTION) triggerOnload(loader, load, err, false);
        throw err;
      });
  }
}

function topLevelLoad(loader, load) {
  // @ts-expect-error
  return (load.C = instantiateAll(loader, load, load, {})
    .then(function () {
      return postOrderExec(loader, load, {});
    })
    .then(function () {
      return load.n;
    }));
}

// the closest we can get to call(undefined)
var nullContext = Object.freeze(Object.create(null));

// returns a promise if and only if a top-level await subgraph
// throws on sync errors
function postOrderExec(loader, load, seen) {
  if (seen[load.id]) return;
  seen[load.id] = true;

  if (!load.e) {
    if (load.er) throw load.er;
    if (load.E) return load.E;
    return;
  }

  // From here we're about to execute the load.
  // Because the execution may be async, we pop the `load.e` first.
  // So `load.e === null` always means the load has been executed or is executing.
  // To inspect the state:
  // - If `load.er` is truthy, the execution has threw or has been rejected;
  // - otherwise, either the `load.E` is a promise, means it's under async execution, or
  // - the `load.E` is null, means the load has completed the execution or has been async resolved.
  var exec = load.e;
  load.e = null;

  // deps execute first, unless circular
  var depLoadPromises;
  load.d.forEach(function (depLoad) {
    try {
      var depLoadPromise = postOrderExec(loader, depLoad, seen);
      if (depLoadPromise) (depLoadPromises = depLoadPromises || []).push(depLoadPromise);
    } catch (err) {
      load.er = err;
      if (!process.env.SYSTEM_PRODUCTION) triggerOnload(loader, load, err, false);
      throw err;
    }
  });
  if (depLoadPromises) return Promise.all(depLoadPromises).then(doExec);

  return doExec();

  function doExec() {
    try {
      var execPromise = exec.call(nullContext);
      if (execPromise) {
        execPromise = execPromise.then(
          function () {
            load.C = load.n;
            load.E = null; // indicates completion
            if (!process.env.SYSTEM_PRODUCTION) triggerOnload(loader, load, null, true);
          },
          function (err) {
            load.er = err;
            load.E = null;
            if (!process.env.SYSTEM_PRODUCTION) triggerOnload(loader, load, err, true);
            throw err;
          }
        );
        return (load.E = execPromise);
      }
      // (should be a promise, but a minify optimization to leave out Promise.resolve)
      load.C = load.n;
      load.L = load.I = undefined;
    } catch (err) {
      load.er = err;
      throw err;
    } finally {
      if (!process.env.SYSTEM_PRODUCTION) triggerOnload(loader, load, load.er, true);
    }
  }
}

/** The systemjs singleton instance */
export const System = new SystemJS();
