import { transformSync } from '@expo-system/babel';

import { SystemPrototype } from '../core/system';

const nextEvaluateSource = SystemPrototype.evaluateSource;
SystemPrototype.evaluateSource = function (source, url, parentUrl, options) {
  if (!url.endsWith('.js')) {
    return nextEvaluateSource.call(this, source, url, parentUrl, options);
  }

  console.time(`babel-transpile: ${url}`);

  const result = transformSync(source, {
    plugins: [
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
      ['@babel/plugin-transform-modules-systemjs', { systemGlobal: 'System' }],
    ],
    babelrc: false,
    configFile: false,
    sourceMaps: 'inline',
    sourceFileName: url,
    filename: url,
  });

  console.timeEnd(`babel-transpile: ${url}`);

  return nextEvaluateSource.call(this, result.code, url, parentUrl, options);
};
