import { afterAll, afterEach, expect, it, spyOn } from 'bun:test';

import { System } from '../../'; // Import the feature-populated system instance

const fetch = spyOn(global, 'fetch');

afterEach(() => fetch.mockClear());
afterAll(() => fetch.mockRestore());

it('fetches modules by URL', async () => {
  await System.fetch('https://example.com/some-module.js');
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe('https://example.com/some-module.js');
});
