var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname + '/src',
  mode: 'development',
  entry: {
    app: './index.js',
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'js/[name].js',
  },
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve('./src'), 'src', 'node_modules'],
    alias: {
      app: path.resolve(__dirname, 'src/'),
      components: path.resolve(__dirname, 'src/components'),
      assets: path.resolve(__dirname, 'src/assets'),
    },
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.js?$/,
        use: [{ loader: 'babel-loader' }],
      },
      {
        test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.eot$|\.wav$|\.mp3$|\.tsv$|\.csv$|\.mp4$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name]-[hash:6].[ext]',
            },
          },
        ],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.hbs$/,
        use: [
          {
            loader: 'raw-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              hmr: true,
            },
          },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        test: /\.sass$|\.scss$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              hmr: true,
            },
          },
          { loader: 'css-loader' },
          { loader: 'sass-loader' },
        ],
      },
    ],
  },
  // context: path.join(__dirname, 'build'),
  plugins: [new webpack.EnvironmentPlugin('NODE_ENV')],
};
