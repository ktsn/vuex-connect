/* eslint-env node */
const path = require('path');
const glob = require('glob');

module.exports = {
  context: path.resolve(__dirname),
  entry: glob.sync('./test/**/*.js'),
  output: {
    path: path.resolve(__dirname, '.tmp'),
    filename: 'test.js'
  },
  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.json']
  },
  watch: true,
  debug: true,
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.json$/, loader: 'json-loader' }
    ]
  }
};
