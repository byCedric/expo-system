import { System } from '@expo-system/core';
import { ComponentType, StrictMode, Suspense, useRef } from 'react';

type EntryModule = { default: ComponentType<any> };

function SnackEntry(props: { load: Promise<EntryModule> }) {
  const App = throwPromiseWhenNotLoaded(props.load);
  return <App.default />;
}

function withTimeLog<T>(promise: Promise<T>) {
  console.time('finished');
  return promise.then((result) => {
    console.timeEnd('finished');
    return result;
  });
}

export function SnackRoot(props: { url: string }) {
  const load = useRef(
    withTimeLog(
      System.import<{ default: ComponentType<any> }>(props.url)
    )
  );

  return (
    <StrictMode>
      <Suspense fallback={null}>
        <SnackEntry load={load.current} />
      </Suspense>
    </StrictMode>
  );
}

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
