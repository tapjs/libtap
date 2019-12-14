'use strict'
const t = require('../')
const versions = require('../versions.js')

t.same(Object.keys(versions).sort(), [
  'libtap',
  'tapParser',
  'tapYaml',
  'tcompare'
])
