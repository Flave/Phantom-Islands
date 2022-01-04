const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    port: 9000,
    historyApiFallback: true,
    contentBase: './src',
  },
});
