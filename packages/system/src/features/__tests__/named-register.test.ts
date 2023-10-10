import { afterEach, describe, expect, it, mock } from 'bun:test';

import { System, REGISTRY} from '../../core/system';
import { NAMED_REGISTRY, NAMED_ALIASES } from '../named-register';

// Reset all modules after each test
afterEach(() => {
  System[REGISTRY].clear();
  System[NAMED_REGISTRY].clear();
  System[NAMED_ALIASES].clear();
});

describe('register/getRegister', () => {
  it('allows register without name', () => {
    System.register([], () => ({ execute() { } }));
    expect(System.getRegister()).toBeArray();
  });

  it('allows register with name', () => {
    const dependencies = [];
    const definition = () => ({ execute() { } });
    System.register('some-name', dependencies, definition);
    expect(System.getRegister('some-name')).toEqual([dependencies, definition]);
  });

  it('only returns registry once', () => {
    System.register('some-name', [], () => ({ execute() { } }));
    expect(System.getRegister('some-name')).toBeArray();
    expect(System.getRegister('some-name')).toBeUndefined();
  });

  it('does not instantiate module', () => {
    const execute = mock(() => {});
    System.register('some-module', [], () => ({ execute }));
    expect(execute).not.toHaveBeenCalled();
  });
});

describe('resolve', () => {
  it('resolves named registered modules', () => {
    const definition = (_export) => ({ execute() { _export('default', { hello: 'world' }) } });

    System.register('some-name', [], definition);
    expect(System.resolve('some-name')).toBe('some-name');
  });

  it('throws when unresolved', () => {
    expect(() => System.resolve('some-name')).toThrow();
  });
});

describe('instantiate', () => {
  it('returns the named module', async () => {
    const dependencies = [];
    const definition = () => ({ execute() { } });
    System.register('some-name', dependencies, definition);
    expect(await System.instantiate('some-name')).toEqual([dependencies, definition]);
  });
});

describe('import', () => {
  it('loads the named module', async () => {
    const execute = mock(() => {});
    System.register('some-name', [], () => ({ execute }));
    await System.import('some-name');
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
