const config = require('jest-config-ktsn')
config.transform['^.+\\.[jt]sx?$'] = 'babel-jest'
config.setupFiles = ['<rootDir>/test/setup.js']
module.exports = config
