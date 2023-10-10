import { afterEach, describe, expect, it } from 'bun:test';

import { System, REGISTRY } from '../../core/system';
import '../registry';

// Reset all modules after each test
afterEach(() => System[REGISTRY].clear());

describe('get', () => {
  it('returns undefined for non-existing modules', () => {
    expect(System.get('non-existing')).toBeUndefined();
  });

  it('returns the module for existing modules', () => {
    System.set('existing', { default: { hello: 'world' } });
    expect(System.get('existing')).toMatchObject({
      default: { hello: 'world' },
    });
  });
});

describe('set', () => {
  it('stores a copy of the module', () => {
    const module = { default: { hello: 'world' } };
    System.set('some-module', module);
    expect(System.get('some-module')).not.toBe(module);
    expect(System.get('some-module')).toMatchObject(module);
  });

  it('requires the module to be an object', () => {
    expect(() => System.set('null-module', null)).toThrow();
    expect(() => System.set('true-module', true)).toThrow();
    expect(() => System.set('false-module', false)).toThrow();
    expect(() => System.set('number-module', 1)).toThrow();
    expect(() => System.set('string-module', 'hello')).toThrow();
    expect(() => System.set('array-module', [])).toThrow();

    expect(() => System.set('object-module', {})).not.toThrow();
  });
});

describe('has', () => {
  it('returns false for non-existing modules', () => {
    expect(System.has('non-existing')).toBeFalse();
  });

  it('returns true for existing modules', () => {
    System.set('existing', {});
    expect(System.has('existing')).toBeTrue();
  });
});

describe('delete', () => {
  it('deletes existing module', () => {
    System.set('existing', {});
    System.delete('existing');
    expect(System.has('existing')).toBeFalse();
  });

  it('deletes non-existing module', () => {
    System.delete('non-existing');
    expect(System.get('non-existing')).toBeUndefined();
  });

  // TODO: test the setter rebind function returned from `System.delete`
});

describe('share', () => {
  it('stores the exact module reference', () => {
    const module = { default: { hello: 'world' } };
    System.share('some-module', module);
    expect(System.get('some-module')).toBe(module);
  });
});
