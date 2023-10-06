import { registerRootComponent } from 'expo';
import { ComponentProps } from 'react';
import { Platform } from 'react-native';

import { SnackRoot } from './suspense';
import './system';
import './modules';

registerRootComponent(
  function Root(props) {
    const url = getServeHost(props);
    global.__NOT_A_BUNDLER_HOST = url;
    console.log('Opening', url);
    return <SnackRoot url={`${url}/App.tsx`} />
  }
);

function getServeHost(props: ComponentProps<Parameters<typeof registerRootComponent>[0]>) {
  const handler = Platform.select({
    default() { throw new Error('No idea how to infer the URL') },
    web() {
      return window.location.origin.replace(':8081', ':3000');
    },
    ios() {
      return props.exp.initialUri
        .replace('exp:', 'http:')
        .replace(':8081', ':3000');
    },
    android() {
      const manifest = JSON.parse(props.exp.manifestString);
      return manifest.launchAsset.url
        .replace(/^(.*)\/index\.bundle.*/i, '$1')
        .replace(':8081', ':3000');
    }
  });

  return handler();
}
