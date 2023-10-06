import { System } from '@expo-system/core';
import { SystemPrototype } from '@expo-system/core/src/core/system';
import { SystemError } from '@expo-system/core/src/core/errors';

// Initialize the Babel transpiler
import '@expo-system/core/src/extras/babel-transpile';

// Add basic support to translate relative URLs to the local server URLs
const nextResolve = SystemPrototype.resolve;
SystemPrototype.resolve = function (id, parentId, options) {
  // HTTP urls should just be fetched as-is
  if (id.startsWith('http')) {
    return id;
  }

  // Translate relative files to URLs
  if (id.startsWith('./')) {
    // see: ./index.tsx
    return id.replace('./', global.__NOT_A_BUNDLER_HOST + '/');
  }

  return nextResolve.call(this, id, parentId, options);
};

// Handle files based on extension
const nextEvaluateResponse = SystemPrototype.evaluateResponse;
SystemPrototype.evaluateResponse = function (response, id, parentId, options) {
  if (!response.ok) {
    throw new SystemError('FETCH_ERROR', `Unable to fetch module "${id}": ${response.status} - ${response.statusText}`);
  }

  const system = this as typeof System;
  const extension = id.split('.').pop();

  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return response.text().then((source) => this.evaluateSource(source, id, parentId, options));

    case 'json':
      return response.json().then((data) => {
        system.register([], function (_export) {
          return {
            execute() { _export('default', data) }
          };
        });

        return system.getRegister();
      });
  }

  return nextEvaluateResponse.call(this, response, id, parentId, options);
};
