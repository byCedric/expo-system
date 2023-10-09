import { afterAll, afterEach, expect, it, spyOn } from 'bun:test';

import { System } from '../../core/system';
import '../instantiate';

const fetch = spyOn(System, 'fetch');
const evaluate = spyOn(System, 'evaluateResponse');

afterEach(() => [fetch, evaluate].forEach((spy) => spy.mockClear()));
afterAll(() => [fetch, evaluate].forEach((spy) => spy.mockRestore()));

// it('fetch and evaluates modules by default', () => {
//   fetch.mockResolvedValue({
//     ok: true,
//     headers: new Headers({ 'content-type': 'text/javascript' }),
//     text: async () => 'System.register([], (_e) => { _e({ default: 42 }); });',
//   } as any);

//   System.instantiate('http://example.com/some-module.js');
//   expect(fetch).toHaveBeenCalledTimes(1);
//   expect(evaluate).toHaveBeenCalledTimes(1);
// });
