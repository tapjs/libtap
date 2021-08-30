'use strict'
const t = require('../')
const findMainScript = require('../lib/find-main-script.js')

t.equal(findMainScript(), __filename)

// Simulate REPL
global.repl = {}
t.type(findMainScript(), 'undefined')
t.equal(findMainScript('default'), 'default')

// Clear REPL flag
delete global.repl
t.equal(findMainScript(), __filename)

// Simulate `node -p`, `node -e` or `node --eval`
process._eval = 'testing'
t.type(findMainScript(), 'undefined')
t.equal(findMainScript('default'), 'default')

// Clear eval flag
delete process._eval
t.equal(findMainScript(), __filename)

// This is likely impossible but test it anyways
const { argv } = process
process.argv = [process.argv[0]]
t.equal(findMainScript('default'), 'default')
process.argv = argv

// make sure it works without a process, just return the default name
t.test('return defaultName if process unavailable', t => {
  const proc = global.process
  t.teardown(() => global.process = proc)
  global.process = null
  const findMainScript = t.mock('../lib/find-main-script.js', {
    '../lib/process.js': t.mock('../lib/process.js'),
  })
  t.equal(findMainScript('default'), 'default')
  t.end()
})
