const path = require('path')
const glob = require('glob')

module.exports = {
  entry: ['es6-promise'].concat(glob.sync(path.resolve(__dirname, '../test/**/*.js'))),
  output: {
    path: path.resolve(__dirname, '../.tmp'),
    filename: 'test.js'
  },
  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js']
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel', exclude: /node_modules/ },
      { test: /\.json$/, loader: 'json' }
    ]
  },
  devtool: 'source-map'
}
