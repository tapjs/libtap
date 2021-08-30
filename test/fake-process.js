const t = require('../')
const noProc = require('../lib/fake-process.js')
t.plan(5)
t.match(noProc, {
  cwd: Function,
  pid: 0,
  env: {},
  argv: [],
  platform: 'unknown',
})
t.equal(noProc.exit(1), undefined)
t.equal(noProc.cwd(), '.')
t.strictSame(noProc.env, {})
t.strictSame(noProc.argv, [])
