import { expect, it } from 'bun:test';

import { System } from '../../core/system';
import '../resolve';

// This feature only adds the `.resolve` hook, not the implementation
it('throws unhandled by default', () => {
  expect(() => System.resolve('should-always-throw')).toThrow(
    `".resolve" could not handle module: "should-always-throw" (UNHANDLED)`
  );
});
