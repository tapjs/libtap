'use strict'
const t = require('../')
const path = require('path')
const StackUtils = require('stack-utils')
const settings = require('../settings.js')

t.test('in tapdir, no settings', t => {
  delete require.cache[require.resolve('../lib/stack.js')]
  process.chdir(path.resolve(__dirname, '..'))
  const stack = require('../lib/stack.js').captureString()
  t.match(stack, /test[\/\\]stack\.js:\w+:\w+\)\n/)
  t.notMatch(stack, '\.node-spawn-wrap')
  t.end()
})

t.test('add settings', t => {
  delete require.cache[require.resolve('../lib/stack.js')]
  settings.stackUtils.internals = [
    ...StackUtils.nodeInternals(),
    /test[\/\\]stack\.js:\w+:\w+\)/
  ]
  const stack = require('../lib/stack.js').captureString()
  t.notMatch(stack, /test[\/\\]stack\.js:\w+:\w+\)\n/)
  t.end()
})
