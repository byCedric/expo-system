import { describe, expect, it, spyOn } from 'bun:test';

import { System } from '../../'; // Import the feature-populated system instance
import '../commonjs-require';

describe('require', () => {
  const module = { default: { hello: 'world' } };

  it('returns preloaded module from registry', () => {
    System.set('preloaded-module', module);
    expect(System.require('preloaded-module')).toEqual(module);
  });

  it('returns name-registered module', () => {
    System.register('name-registered-module', [], (_export) => ({
      execute() {
        _export(module);
      }
    }));

    expect(System.require('name-registered-module')).toEqual(module);
  });

  it('returns name-registered module with dependencies', () => {
    System.register('name-registered-module-1', [], (_export) => ({
      execute() {
        _export('test', 'test');
      }
    }));

    System.register('name-registered-module-2', ['name-registered-module-1'], (_export) => {
      var test;
      return {
        setters: [(_dependency) => { test = _dependency.test }],
        execute() {
          _export('test', test);
        }
      }
    });

    expect(System.require('name-registered-module-2')).toEqual({ test: 'test' });
  });

  it('returns name-registered module with preloaded dependency', () => {
    System.set('preloaded-module-1', { test: 'test' });
    System.register('name-registered-module', ['preloaded-module-1'], (_export) => {
      var test;
      return {
        setters: [(_dependency) => { test = _dependency.test }],
        execute() {
          _export('test', test);
        }
      }
    });

    expect(System.require('name-registered-module')).toEqual({ test: 'test' });
  });

  it('returns name-registered module with chained registered and preloaded dependency', () => {
    System.set('preloaded-module-1', { test: 'hello' });
    System.register('name-registered-module-1', ['preloaded-module-1'], (_export) => {
      var test;
      return {
        setters: [(_dependency) => { test = _dependency.test }],
        execute() {
          _export('default', test);
        },
      };
    });

    System.register('name-registered-module-2', ['name-registered-module-1'], (_export) => {
      var test;
      return {
        setters: [(_dependency) => { test = _dependency.default }],
        execute() {
          _export('test', test);
        }
      }
    });

    expect(System.require('name-registered-module-2')).toEqual({ test: 'hello' });
  });

  it('returns name-registered module with spread registered and preloaded dependency', () => {
    System.set('preloaded-module-1', { test: 'hello' });
    System.register('name-registered-module-1', [], (_export) => ({
      execute() {
        _export('default', 'world');
      }
    }));

    System.register('name-registered-module-2', ['preloaded-module-1', 'name-registered-module-1'], (_export) => {
      var hello, world;
      return {
        setters: [
          (_dependency) => { hello = _dependency.test },
          (_dependency) => { world = _dependency.default },
        ],
        execute() {
          _export('test', `${hello} ${world}`);
        }
      }
    });

    expect(System.require('name-registered-module-2')).toEqual({ test: 'hello world' });
  });

  it('throws when module is loaded remotely', () => {
    const moduleId = 'https://raw.githubusercontent.com/expo/expo/main/packages/expo/bundledNativeModules.json';
    const resolve = spyOn(System, 'resolve').mockImplementation((id) => id);

    expect(() => System.require(moduleId)).toThrow(
      `Module "${moduleId}" is not (yet) available and ".require" can't load modules async, use ".import" instead.`
    );

    resolve.mockRestore();
  });

  it('throws when registered module has async execute', () => {
    System.register('async-registered-module', [], (_export) => ({
      async execute() {
        _export(module);
      }
    }));

    expect(() => System.require('async-registered-module')).toThrow(
      `Module "async-registered-module" needs to be initialized asynchronously, use ".import" instead.`
    );
  });

  it('throws when dependency has async execute', () => {
    System.register('async-registered-module-1', [], (_export) => ({
      async execute() {
        _export('test', 'test');
      }
    }));

    System.register('async-registered-module-2', ['async-registered-module-1'], (_export) => {
      var test;
      return {
        setters: [_dependency => { test = _dependency.test }],
        async execute() {
          _export('test', 'test');
        }
      };
    });

    expect(() => System.require('async-registered-module-2')).toThrow(
      `Module "async-registered-module-1" needs to be initialized asynchronously, use ".import" instead.`
    );
  });
});
