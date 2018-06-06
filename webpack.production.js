const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

module.exports = merge(common, {
  plugins: [
    new UglifyJSPlugin(),
    new CopyWebpackPlugin([
      {
        from: 'data/islands_specs.json',
        to: 'data/islands_specs.json',
      },
      {
        from: 'assets',
        to: 'assets',
      },
    ]),
    new BundleAnalyzerPlugin({ analyzerMode: 'static' }),
  ],
});
