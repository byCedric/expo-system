import { afterAll, afterEach, expect, it, spyOn } from 'bun:test';

import { System } from '../../core/system';
import '../instantiate';

const fetch = spyOn(System, 'fetch');
const evaluate = spyOn(System, 'evaluateResponse');

afterEach(() => [fetch, evaluate].forEach((spy) => spy.mockClear()));
afterAll(() => [fetch, evaluate].forEach((spy) => spy.mockRestore()));

it('fetch and evaluates modules by default', async () => {
  const response: any = {
    ok: true,
    headers: new Headers({ 'content-type': 'text/javascript' }),
    text: async () => 'System.register([], (_e) => { _e({ default: 42 }); });',
  };

  fetch.mockResolvedValue(response);
  await System.instantiate('http://example.com/some-module.js');

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(evaluate).toHaveBeenCalledTimes(1);
  expect(evaluate.mock.lastCall).toEqual([response, 'http://example.com/some-module.js']);
});
