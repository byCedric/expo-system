import { System } from '@expo-system/core';
import { registerRootComponent } from 'expo';
import { ComponentType, StrictMode, Suspense } from 'react';
import { Platform } from 'react-native';

// Initialize the Babel transpiler
import '@expo-system/core/src/extras/babel-transpile';
import { SystemPrototype } from '@expo-system/core/src/core/system';
import { SystemError } from '@expo-system/core/src/core/errors';

// External file to fetch & render
const sourceUrl = 'https://raw.githubusercontent.com/expo/expo/main/templates/expo-template-bare-minimum/App.js';

// Allow fetching modules starting with `http`
const nextResolve = SystemPrototype.resolve;
SystemPrototype.resolve = function (id, parentId, options) {
  if (id.startsWith('http')) {
    return id;
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

// Share module instances from Hermes compiled code
System.share('expo-status-bar', require('expo-status-bar'));
System.share('react', require('react'));
System.share('react/jsx-runtime', require('react/jsx-runtime'));
System.share('react-native', Platform.select({
  default: require('react-native'),
  web: require('react-native-web'),
}));

// On web, this works
// console.time('finished');
// System.import<{ default: ComponentType<any> }>(sourceUrl)
//   .then(({ default: App }) => {
//     console.timeEnd('finished');
//     registerRootComponent(App)
//   });

// On native & web, this works to avoid delaying `registerRootComponent`
function EntryLoader(props: { load: Promise<{ default: ComponentType<any> }> }) {
  const App = throwPromiseWhenNotLoaded(props.load);
  return <App.default />;
}

const loadPromise = System.import<{ default: ComponentType<any> }>(sourceUrl);

registerRootComponent(() => (
  <StrictMode>
    <Suspense fallback={null}>
      <EntryLoader load={loadPromise} />
    </Suspense>
  </StrictMode>
));

// I don't even know man...
function throwPromiseWhenNotLoaded(promise) {
  if (promise.status === 'fulfilled') {
    return promise.value;
  } else if (promise.status === 'rejected') {
    throw promise.reason;
  } else if (promise.status === 'pending') {
    throw promise;
  } else {
    promise.status = 'pending';
    promise.then(
      result => {
        promise.status = 'fulfilled';
        promise.value = result;
      },
      reason => {
        promise.status = 'rejected';
        promise.reason = reason;
      },
    );
    throw promise;
  }
}
