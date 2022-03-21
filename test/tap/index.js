'use strict'
const node = process.execPath

if (module === require.main)
  require('../../lib/tap.js').pass('just the index')
else {
  const path = require('path')
  const StackUtils = require('stack-utils')
  const escapeStringRegexp = require('escape-string-regexp')
  const sourceMapSupport = require('source-map-support')
  const settings = require('../../settings.js')

  sourceMapSupport.install({environment: 'node', hookRequire: true})

  settings.stackUtils.internals.push(
    new RegExp(escapeStringRegexp(path.resolve(__dirname, '..', '..')) + '\\b', 'i')
  )
  if (path.sep === '\\') {
    settings.stackUtils.internals.push(
      new RegExp(escapeStringRegexp(path.resolve(__dirname, '..', '..').replace(/\\/g, '/')) + '\\b', 'i')
    )
  }
  settings.stackUtils.wrapCallSite = sourceMapSupport.wrapCallSite
}

module.exports = (...test) => {
  if (process.argv[2] === 'runtest') {
    // run the init function _before_ loading the root tap object
    if (test.length === 2) {
      test[0]()
      test[1](require('../../lib/tap.js'))
    } else
      test[0](require('../../lib/tap.js'))
  } else {
    const spawn = require('child_process').spawn
    const env = Object.keys(process.env).reduce((env, k) => {
      env[k] = env[k] || process.env[k]
      return env
    }, { TAP_BAIL: '0', TAP_BUFFER: '0' })
    const t = require('../../lib/tap.js')
    const cs = require('../clean-stacks.js')
    t.cleanSnapshot = str => cs(
      str.replace(process.argv[1], '{TESTFILE}')
    ).replace(/[^\n]*DEP0018[^\n]*\n/g, '')
      .replace(/\nNode.js .*\n$/, '')
    t.plan(3)
    const c = spawn(node, [process.argv[1], 'runtest'], { env: env })
    let out = ''
    c.stdout.on('data', c => out += c)
    let err = ''
    c.stderr.on('data', c => err += c)
    c.on('close', (code, signal) => {
      t.matchSnapshot({
        code: code,
        signal: signal
      }, 'exit status')
      t.matchSnapshot(out, 'stdout')
      t.matchSnapshot(
        err.split(/\r?\n/)
          // Remove node.js 13.0.0+ message:
          .filter(a => a !== '(Use `node --trace-uncaught ...` to show where the exception was thrown)')
          .join('\n'),
        'stderr'
      )
    })
  }
}
