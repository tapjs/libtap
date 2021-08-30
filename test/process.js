const t = require('../')
const proc = require('../lib/process.js')
const fakeProc = require('../lib/fake-process.js')
t.equal(proc, global.process)
t.test('returns fake process when global.process is not present', t => {
  global.process = null
  t.teardown(() => global.process = proc)
  const noProc = t.mock('../lib/process.js', {
    '../lib/fake-process.js': fakeProc,
  })
  t.equal(noProc, fakeProc)
  t.end()
})
