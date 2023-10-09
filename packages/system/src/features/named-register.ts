import { System, SystemPrototype } from '../core/system';

declare global {
  namespace SystemJS {
    interface System {
      [NAMED_REGISTRY]: Map<ModuleId, ModuleDeclaration>;
      [NAMED_ALIASES]: Map<ModuleId, ModuleId>;

      /**
       * Define a systemjs module definition with an exact module id or name.
       * The module definition is written to a temporary register, and is instantiated when importing this module by id or name.
       * This is different from `System.set`, where you write directly to the core registry and expects the module to be fully instantiated.
       * `System.register(<name>, ...)` only instantiates the module when imported by `System.import(<name>)`.
       *
       * @see https://github.com/systemjs/systemjs/blob/6.14.2/docs/api.md#systemregisterdeps-declare
       * @example ```js
       *   // Register the module as "foo"
       *   System.register('foo', [], function () {});
       *   // Import (and instantiate) the "foo" module
       *   System.import('foo');
       * ```
       */
      register(id: ModuleId, dependencies: ModuleId[], definition: Declaration, options?: ModuleOptions[]): void;

      /**
       * Return the module declaration from the (temporary) named register.
       */
      getRegister(id: ModuleId): ModuleDeclaration;
    }
  }
}

// Constants

export const NAMED_REGISTRY = Symbol('named-registry');
export const NAMED_ALIASES = Symbol('named-aliases');

// State-variables

let firstName: string | null = null;
let firstDeclaration: SystemJS.ModuleDeclaration | null = null;

// Named register hooks

const nextRegister = SystemPrototype.register;
// @ts-expect-error Target signature provides too few arguments. Expected 4 or more, but got 3.ts(2322)
SystemPrototype.register = function (id, dependencies, definition, options) {
  if (typeof id !== 'string') {
    // @ts-expect-error Argument of type 'string[]' is not assignable to parameter of type 'string'.ts(2345)
    return nextRegister.call(this, dependencies, definition, options);
  }

  const declaration = [dependencies, definition, options] as SystemJS.ModuleDeclaration;
  this[NAMED_REGISTRY][id] = declaration;

  if (!firstDeclaration) {
    firstDeclaration = declaration;
    firstName = id;
  }
  Promise.resolve().then(function () {
    firstDeclaration = null;
    firstName = null;
  });

  // @ts-expect-error Argument of type 'string[]' is not assignable to parameter of type 'string'.ts(2345)
  return nextRegister.call(this, dependencies, definition, options);
}

const nextGetRegister = SystemPrototype.getRegister;
// @ts-expect-error Target signature provides too few arguments. Expected 4 or more, but got 3.ts(2322)
SystemPrototype.getRegister = function (id) {
  // Calling getRegister() because other extras need to know it was called so they can perform side effects
  const register = nextGetRegister.call(this, id);

  if (firstName && id) {
    this[NAMED_ALIASES][firstName] = id;
  }

  const result = firstDeclaration || register;
  firstDeclaration = null;
  firstName = null;

  return result;
}

// Other hooks

const nextConstructor = System.constructor;
System.constructor = function () {
  nextConstructor.call(this);
  enableNamedRegister(System);
};

enableNamedRegister(System); // Enable for global singleton

const nextResolve = SystemPrototype.resolve;
SystemPrototype.resolve = function (id, parentId, options) {
  try {
    // Prefer other existing resolve attempts over the `named-registry`
    return nextResolve.call(this, id, parentId, options);
  } catch (error) {
    if (id in this[NAMED_REGISTRY]) {
      return this[NAMED_ALIASES][id] || id;
    }

    throw error;
  }
}

const nextInstantiate = SystemPrototype.instantiate;
SystemPrototype.instantiate = function (id, parentId, options) {
  const result = this[NAMED_REGISTRY][id];
  if (result) {
    this[NAMED_REGISTRY][id] = null
    return result;
  }
  return nextInstantiate.call(this, id, parentId, options);
}

// Utilities

function enableNamedRegister(system: SystemJS.System) {
  system[NAMED_REGISTRY] = new Map();
  system[NAMED_ALIASES] = new Map();
}
