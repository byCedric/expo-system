import { SystemError } from '../core/errors';
import { REGISTRY, System, SystemPrototype } from '../core/system';

declare global {
  namespace SystemJS {
    interface System {
      /** Get the module directly from the emulated registry */
      get(id: ModuleId): Module | undefined;
      /** Set the module directly in the emulated registry */
      set(id: ModuleId, module: Module): Module;
      /** Determine if the registry has the module registered */
      has(id: ModuleId): boolean;
      /** Remove the module from the registry */
      delete(id: ModuleId): any; // TODO

      /** Share the exact same module instance with the systemjs emulation */
      share(id: ModuleId, module: Module): ReturnType<System['set']>;
    }
  }
}

// Hooks

const nextResolve = SystemPrototype.resolve;
SystemPrototype.resolve = function (id, parentId) {
  const instance = (this as typeof System).get(id);
  if (instance) return id;
  return nextResolve.call(this, id, parentId);
};

// Utilities

const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;

function tagModule(module: SystemJS.Module) {
  if (toStringTag && !module[toStringTag]) {
    Object.defineProperty(module, toStringTag, { value: 'Module' });
  }

  return module;
}

// Methods

SystemPrototype.share = function (id, module) {
  return this.set(id, tagModule(module));
};

SystemPrototype.get = function (id) {
  const load = this[REGISTRY][id];
  if (load && load.e === null && !load.E) {
    return load.er ? undefined : load.n
  }
};

SystemPrototype.has = function (id) {
  return !!this[REGISTRY][id];
};

SystemPrototype.set = function (id, module) {
  let ns;

  if (typeof module !== 'object' || Array.isArray(module)) {
    throw new SystemError(
      'INVALID_MODULE_INSTANCE',
      '".set" received a non-object module, only objects are allowed'
    );
  }

  if (toStringTag && module[toStringTag] === 'Module') {
    ns = module;
  } else {
    ns = Object.assign(Object.create(null), module);
    tagModule(ns);
  }

  var done = Promise.resolve(ns);

  var load = this[REGISTRY][id] || (this[REGISTRY][id] = {
    id: id,
    i: [],
    h: false,
    d: [],
    e: null,
    er: undefined,
    E: undefined
  });

  if (load.e || load.E)
    return false;

  Object.assign(load, {
    n: ns,
    I: undefined,
    L: undefined,
    C: done
  });

  return ns;
};

SystemPrototype.delete = function (id) {
  var registry = this[REGISTRY];
  var load = registry[id];
  // in future we can support load.E case by failing load first
  // but that will require TLA callbacks to be implemented
  if (!load || (load.p && load.p.e !== null) || load.E)
    return false;

  var importerSetters = load.i;
  // remove from importerSetters
  // (release for gc)
  if (load.d)
    load.d.forEach(function (depLoad) {
      var importerIndex = depLoad.i.indexOf(load);
      if (importerIndex !== -1)
        depLoad.i.splice(importerIndex, 1);
    });
  delete registry[id];
  return function () {
    var load = registry[id];
    if (!load || !importerSetters || load.e !== null || load.E)
      return false;
    // add back the old setters
    importerSetters.forEach(function (setter) {
      load.i.push(setter);
      setter(load.n);
    });
    importerSetters = null;
  };
};
