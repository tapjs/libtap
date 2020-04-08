'use strict'

const semver = require('semver')

module.exports = {
  all: true,
  lines: 100,
  functions: 100,
  branches: 100,
  statements: 100,
  extension: semver.gte(process.versions.node, '13.10.0') ? ['.js', '.mjs'] : ['.js'],
  include: [
    'settings.js',
    'versions.js',
    'lib/**'
  ]
}
