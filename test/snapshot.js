'use strict'

const t = require('../')
const Snapshot = require('../lib/snapshot.js')
const settings = require('../settings.js')
const path = require('path')
const fs = require('fs')

if (settings.rimrafNeeded) {
  settings.rmdirRecursiveSync = dir => require('rimraf').sync(dir, {glob: false})
  settings.rmdirRecursive = (dir, cb) => require('rimraf')(dir, {glob: false}, cb)
}

const dir = t.testdir()
const snapfile = dir + '/snapshot.test.cjs'

t.test('actual test', t => {
  t.comment('not using subtests, because snapshots are per-test')

  t.test('checking snapshot without creating throws', t => {
    const s = new Snapshot()
    s.file = snapfile
    t.throws(_ => s.read('asdf', 'asdf'))
    t.end()
  })

  const s = new Snapshot()
  s.file = snapfile
  t.comment('create some snapshots', s.file)
  s.snap(fs.readFileSync(__filename, 'utf8'), 'this file')
  s.snap('this is fine', 'a statement of acceptance')
  s.save()

  t.comment('now check that the snapshots are valid')
  const ss = new Snapshot()
  ss.file = snapfile
  t.equal(fs.readFileSync(__filename, 'utf8'), ss.read('this file'))
  t.equal('this is fine', ss.read('a statement of acceptance'))
  t.throws(_ => ss.read('this is not in the file'))

  t.comment('saving without snapping anything removes the file')
  const sss = new Snapshot()
  sss.file = snapfile
  sss.save()
  t.throws(_ => fs.statSync(sss.file), 'file is gone')

  t.comment('saving without snapping anything tolerates lack of existing file')
  sss.save()

  t.comment('saving without snapping anything throws if dir exists in place of file')
  fs.mkdirSync(sss.file)
  t.throws(_ => sss.save(), {
    code: process.platform === 'linux' ? 'EISDIR' : 'EPERM'
  }, 'save(): directory exists in place of file')
  t.throws(_ => sss.read('this file'), {
    message: /^Snapshot file not found: /
  }, 'read(): directory exists in place of file')
  fs.rmdirSync(sss.file)

  // process.argv is relevant
  process.argv.push('asdf', 'foo', 'bar')
  const ssss = new Snapshot()
  const file = path.resolve('tap-snapshots/test/snapshot.js-asdf-foo-bar.test.cjs')
  t.equal(ssss.file, file)
  process.argv.pop()
  process.argv.pop()
  process.argv.pop()

  t.end()
})

t.test('ok if process missing from the start', t => {
  const proc = process
  t.teardown(() => global.process = proc)
  global.process = null
  const Test = t.mock('../lib/test.js', {
    '../lib/process.js': t.mock('../lib/process.js'),
  })
  const tt = new Test({ name: 'proc gone missing' })
  tt.plan(1)
  tt.test('child', tt => {
    tt.plan(1)
    tt.equal(1, 1, 'one is one')
  })

  const out = []
  t.plan(1)
  tt.on('data', c => out.push(c))
  tt.on('end', () => t.matchSnapshot(Buffer.concat(out).toString()))
})
