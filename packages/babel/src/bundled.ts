import { registerPlugins } from './registry';

registerPlugins({
  '@babel/plugin-transform-react-jsx': require('@babel/plugin-transform-react-jsx'),
  '@babel/plugin-transform-modules-systemjs': require('@babel/plugin-transform-modules-systemjs').default,
});

// No presets needed for now
// registerPresets({
//   //
// });
