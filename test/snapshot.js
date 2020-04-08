'use strict'
const t = require('../')
const Snapshot = require('../lib/snapshot.js')
const {rmdirRecursiveSync} = require('../settings.js')
const path = require('path')
const dir = path.resolve(__dirname, 'snapshot')
const fs = require('fs')

t.test('cleanup first', t => {
  rmdirRecursiveSync(dir)
  fs.mkdirSync(dir, {recursive: true})
  process.chdir(dir)
  t.end()
})

t.test('actual test', t => {
  t.comment('not using subtests, because snapshots are per-test')

  t.test('checking snapshot without creating throws', t => {
    const s = new Snapshot(t)
    t.throws(_ => s.read('asdf', 'asdf'))
    t.end()
  })

  const s = new Snapshot(t)
  t.comment('create some snapshots')
  s.snap(fs.readFileSync(__filename, 'utf8'), 'this file')
  s.snap('this is fine', 'a statement of acceptance')
  s.save()

  t.comment('now check that the snapshots are valid')
  const ss = new Snapshot(t)
  t.equal(fs.readFileSync(__filename, 'utf8'), ss.read('this file'))
  t.equal('this is fine', ss.read('a statement of acceptance'))
  t.throws(_ => ss.read('this is not in the file'))

  t.comment('saving without snapping anything removes the file')
  const sss = new Snapshot(t)
  sss.save()
  t.throws(_ => fs.statSync(sss.file), 'file is gone')

  t.comment('saving without snapping anything tolerates lack of existing file')
  sss.save()

  t.comment('saving without snapping anything throws if dir exists in place of file')
  fs.mkdirSync(sss.file)
  t.throws(_ => sss.save(), {
    code: process.platform === 'darwin' ? 'EPERM' : 'EISDIR'
  }, 'directory exists in place of file')
  fs.rmdirSync(sss.file)

  t.end()
})

t.test('cleanup after', t => {
  rmdirRecursiveSync(dir)
  process.chdir(__dirname)
  t.end()
})
