import { describe, expect, it, mock } from 'bun:test';

import { System } from '../../'; // Import the feature-populated system instance

describe('register/getRegister', () => {
  it('allows register without name', () => {
    System.register(['some-dep'], () => ({ execute() { } }));
    const register = System.getRegister();
    expect(register).toBeArray();
    expect(register[0]).toEqual(['some-dep']);
    expect(register[1]).toBeFunction();
  });

  it('allows register with name', () => {
    const dependencies = ['some-dep'];
    const definition = () => ({ execute() { } });
    System.register('some-name', dependencies, definition);
    const register = System.getRegister();
    expect(register).toBeArray();
    expect(register[0]).toBe(dependencies);
    expect(register[1]).toBe(definition);
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
