const path = require('path');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const {
  /** Enable the bundle analyzer to validate the output after updating */
  WEBPACK_ANALYZE,
  /** Enable production mode to output the most optimized bundle */
  WEBPACK_PRODUCTION,
} = process.env;

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'development',
  entry: {
    index: path.resolve(__dirname, './src/index.ts'),
  },
  externals: {
    '@expo-system/babel': '@expo-system/babel',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    // library: '[name]', // This causes a weird export
    libraryTarget: 'commonjs2',
    globalObject: 'this',
  },
  plugins: [],
  module: {
    rules: [
      {
        test: /\.(ts|js|mjs)$/u,
        exclude: [path.resolve(__dirname, 'node_modules')],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-typescript',
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    mainFields: ['main'],
  },
};

// We want to optimize the bundle output to minimize the size of the bundle
if (WEBPACK_PRODUCTION || WEBPACK_ANALYZE) {
  config.mode = 'production';
  config.devtool = 'source-map';
  config.optimization = {
    minimize: true,
  };

  // We want to be able to analyze the bundle size, in case we need to update it
  if (WEBPACK_ANALYZE) {
    config.plugins.push(new BundleAnalyzerPlugin());
  }
}

module.exports = config;
