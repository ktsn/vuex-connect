const path = require('path')
const glob = require('glob')

module.exports = {
  entry: ['es6-promise/auto', path.resolve(__dirname, '../test/setup.js')]
    .concat(glob.sync(path.resolve(__dirname, '../test/**/*.spec.js'))),
  output: {
    path: path.resolve(__dirname, '../.tmp'),
    filename: 'test.js'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js']
  },
  module: {
    rules: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ }
    ]
  },
  devtool: 'source-map'
}
