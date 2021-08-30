'use strict'
const t = require('../')
const cyo = require('../lib/clean-yaml-object.js')
const settings = require('../settings.js')
const Domain = require('domain').Domain
const dom = new Domain()
dom.whosagooddomain = 'yes you are a good dog'

const cases = [
  [() => {
    settings.atTap = false
  }, {
    domain: { some: 'object' },
    stack: 'this\nis\na\nstack\n',
    at: {
      file: __filename,
      line: 2,
      column: 4
    },
    foo: {
      domain: dom,
      todo: 'maybe',
      time: 'hours',
      _tapChild: 'blerg'
    },
    _tapChild: 'asdfasdf'
  }, {
    stack: 'this\nis\na\nstack\n',
    at: {
      file: __filename,
      line: 2,
      column: 4
    },
    source: 'const t = require(\'../\')\n',
    foo: {
      domain: { whosagooddomain: dom.whosagooddomain },
      todo: 'maybe',
      time: 'hours',
      _tapChild: 'blerg'
    },
    _tapChild: null
  }],
  [{
    at: {
      file: require.resolve('../lib/clean-yaml-object.js')
    }
  }, { at: null }],
  [() => {
    settings.atTap = true
  }, {
    at: {
      file: require.resolve('../lib/clean-yaml-object.js'),
    }
  }, {
    at: {
      file: String,
    }
  }],
  [() => {
    settings.atTap = false
  }, {
    stack: '    at Foo.bar (/dev/fire/pwn:420:69)\n'
  }, {
    stack: '    at Foo.bar (/dev/fire/pwn:420:69)\n',
    at: {
      line: 420,
      column: 69,
      file: '/dev/fire/pwn',
      function: 'Foo.bar'
    }
  }],
  [{
    at: {
      file: __filename,
      line: 696969,
      column: 420420
    }
  }, { source: null }],
  [{ stack: '' }, { stack: null }],
  [{ found: {}, wanted: {} }, { note: 'object identities differ' }],
  [{ found: dom, wanted: dom }, { note: undefined }],
  [{ compareOptions: {} }, { compareOptions: undefined }],
  [{ compareOptions: false }, { compareOptions: undefined }],
  [{ compareOptions: { a: 1 } }, { compareOptions: { a: 1 } }],
]
cases.forEach((c, i) => {
  if (typeof c[0] === 'function')
    c.shift()()
  t.match(cyo(c[0]), c[1], `test #${i}`)
})

t.test('string diffs', t => {
  t.matchSnapshot(cyo({
    found: 'hello\nworld',
    wanted: 'a big\nhello\nworld\nstring\n'
  }))
  t.end()
})

t.test('just whitespace, no source shown', t => {
  const fs = require('fs')
  const path = require('path')
  const ws = path.resolve('whitespace-file')
  fs.writeFileSync(ws, '   \n   \n   \n   \n')
  t.teardown(() => fs.unlinkSync(ws))
  t.match(cyo({
    at: {
      file: ws,
      line: 1,
      column: 0,
    }
  }), { source: undefined })
  t.end()
})

t.test('no arrow if column is bogus', t => {
  t.notMatch(cyo({
    at: {
      file: __filename,
      line: 63,
      column: 420420
    }
  }, { source: /^-+^$/m }))
  t.notMatch(cyo({
    at: {
      file: __filename,
      line: 63,
      column: null
    }
  }, { source: /^-+^$/m }))
  t.end()
})

t.test('diff stuff', t => {
  t.matchSnapshot(cyo({
    found: {a: 1},
    wanted: {a: '1'},
    comparator: '===',
  }), 'objects that do not strictly match')

  t.matchSnapshot(cyo({
    found: {a: 1},
    wanted: require('tcompare').format({a: 1}),
  }), 'this one is weird')

  t.matchSnapshot(cyo({
    wanted: {a: 1},
    found: require('tcompare').format({a: 1}),
  }), 'another weird one')

  t.matchSnapshot(cyo({
    found: 'hello',
    wanted: 'world',
    comparator: '===',
  }), 'string that differ')

  t.end()
})

t.test('saveFixture included if relevant', t => {
  const { TAP_SAVE_FIXTURE } = process.env
  t.teardown(() => {
    process.env.TAP_SAVE_FIXTURE = TAP_SAVE_FIXTURE === '1' ? '1' : ''
  })

  process.env.TAP_SAVE_FIXTURE = '1'
  t.matchSnapshot(cyo({
    saveFixture: false,
  }), 'show if false and env=1')
  t.matchSnapshot(cyo({
    saveFixture: true,
  }), 'hide if true and env=1')

  process.env.TAP_SAVE_FIXTURE = '0'
  t.matchSnapshot(cyo({
    saveFixture: true,
  }), 'show if true and env=0')
  t.matchSnapshot(cyo({
    saveFixture: false,
  }), 'hide if false and env=0')
  t.end()
})

t.test('ok if process missing from the start', t => {
  const proc = process
  t.teardown(() => global.process = proc)
  global.process = null
  const cyo = t.mock('../lib/clean-yaml-object.js', {
    '../lib/process.js': t.mock('../lib/process.js'),
  })
  cases.forEach((c, i) => {
    if (typeof c[0] === 'function')
      c.shift()()
    // the "at" field will be different or missing if process unavailable
    const match = { ...c[1] }
    const actual = cyo(c[0])
    match.at = actual.at
    t.match(actual, match, `test #${i}`)
  })
  t.end()
})
