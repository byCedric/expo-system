import { describe, expect, it, mock } from 'bun:test';

import { System } from '../../core/system';
import '../evaluate';

describe('evaluateSource', () => {
  it('evaluates module declaration', () => {
    const source = registerTemplate(`_export('default', 42)`);
    const register = System.evaluateSource(source, 'http://example.com/some-module.js');
    expect(assertRegister(register).mock.lastCall).toEqual(['default', 42]);
  });
});

describe('evaluateResponse', () => {
  it('evalates javascript from "Content-Type: text/javascript"', async () => {
    const source = registerTemplate(`_export('hello', 'world')`);
    const response: any = {
      ok: true,
      headers: new Headers({ 'content-type': 'text/javascript' }),
      text: async () => source,
    };

    const register = await System.evaluateResponse(response, 'http://example.com/some-module.js');
    expect(assertRegister(register).mock.lastCall).toEqual(['hello', 'world']);
  });

  it('evalates javascript from "Content-Type: application/javascript"', async () => {
    const source = registerTemplate(`_export('hello', true)`);
    const response: any = {
      ok: true,
      headers: new Headers({ 'content-type': 'text/javascript' }),
      text: async () => source,
    };

    const register = await System.evaluateResponse(response, 'http://example.com/some-module.js');
    expect(assertRegister(register).mock.lastCall).toEqual(['hello', true]);
  });

  it('evalates javascript from "Content-Type: text/javascript;charset=utf-8"', async () => {
    const source = registerTemplate(`_export('hello', 'world')`);
    const response: any = {
      ok: true,
      headers: new Headers({ 'content-type': 'text/javascript;charset=utf-8' }),
      text: async () => source,
    };

    const register = await System.evaluateResponse(response, 'http://example.com/some-module.js');
    expect(assertRegister(register).mock.lastCall).toEqual(['hello', 'world']);
  });

  it('evalates json from "Content-Type: text/json"', async () => {
    const response: any = {
      ok: true,
      headers: new Headers({ 'content-type': 'text/json' }),
      json: async () => ({ hello: 'world' }),
    };

    const register = await System.evaluateResponse(response, 'http://example.com/some-module.json');
    expect(assertRegister(register).mock.lastCall).toEqual(['default', { hello: 'world' }]);
  });

  it('evalates json from "Content-Type: application/json"', async () => {
    const response: any = {
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ hello: true }),
    };

    const register = await System.evaluateResponse(response, 'http://example.com/some-module.json');
    expect(assertRegister(register).mock.lastCall).toEqual(['default', { hello: true }]);
  });


  it('throws when evaluatingresponse with unknown "content-type"', () => {
    const response: any = {
      ok: true,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: async () => 'some text',
    };

    expect(() => System.evaluateResponse(response, 'http://example.com/some-module.txt')).toThrow(
      `Unknown "content-type" header received for module "http://example.com/some-module.txt": text/plain (UNKNOWN_CONTENT_TYPE)`
    );
  });
});

/** Assert and evaluate the `register` by executing the module with an `_export` mock */
function assertRegister(register: SystemJS.ModuleDeclaration) {
  console.log(register);

  expect(register).toBeArray();
  expect(register[0]).toBeArray();
  expect(register[1]).toBeFunction();

  const _export = mock((e) => {});
  const _context: any = {};
  register[1](_export, _context).execute();
  return _export;
}

/** Create a new registration string with the content exporting certain module properties */
function registerTemplate(content: string) {
  return `
    System.register([], function (_export) {
      return {
        execute() {
          ${content}
        }
      }
    })
  `;
}
