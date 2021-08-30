'use strict'
const t = require('../')
const settings = require('../settings.js')

t.ok(Array.isArray(settings.stackUtils.internals), 'Array.isArray(settings.stackUtils.internals)')
t.type(settings.rimrafNeeded, 'boolean')
t.not(settings.stackUtils.internals.length, 0)
t.equal(settings.output, process.stdout)

t.matchSnapshot({
  ...settings,
  rimrafNeeded: 'version specific',
  rmdirRecursiveSync(dir) {},
  rmdirRecursive(dir, cb) {},
  mkdirpNeeded: 'version specific',
  mkdirRecursiveSync(dir) {},
  mkdirRecursive(dir, cb) {},
  output: 'process.stdout',
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

t.throws(_ => {
  settings.rmdirRecursive = 'this is not a function'
}, TypeError)

t.throws(_ => {
  settings.rmdirRecursive = () => {}
}, TypeError)

t.throws(_ => {
  settings.mkdirRecursiveSync = 'this is not a function'
}, TypeError)

t.throws(_ => {
  settings.mkdirRecursiveSync = () => {}
}, TypeError)

t.throws(_ => {
  settings.mkdirRecursive = 'this is not a function'
}, TypeError)

t.throws(_ => {
  settings.mkdirRecursive = () => {}
}, TypeError)

const replacement = dir => {}
const replacementAsync = (dir, cb) => {}
settings.rmdirRecursiveSync = replacement
settings.rmdirRecursive = replacementAsync
t.equal(settings.rimrafNeeded, false)
t.equal(settings.rmdirRecursiveSync, replacement)
t.equal(settings.rmdirRecursive, replacementAsync)

settings.mkdirRecursiveSync = replacement
settings.mkdirRecursive = replacementAsync
t.equal(settings.mkdirpNeeded, false)
t.equal(settings.mkdirRecursiveSync, replacement)
t.equal(settings.mkdirRecursive, replacementAsync)

t.equal(settings.snapshotFile('cwd', 'main', 'args'),
  require('path').resolve('cwd', 'tap-snapshots', 'mainargs.test.cjs'),
  'default function puts it in ./tap-snapshots')

settings.snapshotFile = (cwd, main, args) => [cwd, main, args].join('X')
t.equal(settings.snapshotFile('cwd', 'main', 'args'), 'cwdXmainXargs',
  'can override snapshotFile setting function')

t.test('does not bork when no process object', t => {
  const proc = process
  t.teardown(() => process = proc)
  global.process = null
  const settings = t.mock('../settings.js', {
    '../lib/process.js': t.mock('../lib/process.js'),
  })
  t.equal(settings.output, undefined, 'no output defined without process')
  t.end()
})
