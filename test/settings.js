'use strict'
const t = require('../')
const settings = require('../settings.js')
const {rmdirRecursiveSync} = settings

t.ok(Array.isArray(settings.stackUtils.internals), 'Array.isArray(settings.stackUtils.internals)')
t.not(settings.stackUtils.internals.length, 0)

t.matchSnapshot({
  ...settings,
  stackUtils: {
    ...settings.stackUtils,
    internals: []
  }
})

t.throws(_ => {
  settings.rmdirRecursiveSync = 'this is not a function'
}, TypeError)

t.throws(_ => {
  settings.rmdirRecursiveSync = () => {}
}, TypeError)

const replacement = dir => {}
settings.rmdirRecursiveSync = replacement
t.equal(settings.rmdirRecursiveSync, replacement)
settings.rmdirRecursiveSync = rmdirRecursiveSync
