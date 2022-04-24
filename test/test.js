'use strict'
const t = require('../')
const fs = require('fs')
const path = require('path')
const Test = t.Test
const util = require('util')
const assert = require('assert')
const EE = require('events').EventEmitter
const MiniPass = require('minipass')
const settings = require('../settings.js')

if (settings.rimrafNeeded) {
  settings.rmdirRecursiveSync = dir => require('rimraf').sync(dir, {glob: false})
  settings.rmdirRecursive = (dir, cb) => require('rimraf')(dir, {glob: false}, cb)
}

// set this forcibly so it doesn't interfere with other tests.
process.env.TAP_DIAG = ''
process.env.TAP_BAIL = ''

t.cleanSnapshot = require('./clean-stacks.js')

t.test('short output checks', t => {
  const env = process.env.TAP_BUFFER
  delete process.env.TAP_BUFFER
  t.teardown(_ => process.env.TAP_BUFFER = env)

  const cases = {
    'no plan': tt => {
      tt.pass('this is fine')
      tt.end()
    },

    'plan': tt => {
      tt.plan(1)
      tt.pass('this is fine')
    },

    'comment': tt => {
      tt.comment('this is fine')
      tt.end()
    },

    'pragma': tt => {
      tt.pragma({ strict: true })
      tt.pragma({ strict: false })
      tt.end()
    },

    'todo': tt => {
      tt.notOk(true, 'i will do this later', { todo: true })
      tt.notOk(true, { todo: 'later' })
      tt.notOk(false)
      tt.todo('i will do this later', tt => {
        throw 'oh no'
      })
      tt.ok(false, { message: 'this is fine', skip: true })
      tt.skip('i did not do this later', tt => {
        throw 'oops'
      })
      tt.end()
    },

    'only': tt => {
      tt.runOnly = false
      tt.only('run this with a comment', tt => tt.end())
      tt.test('this is a child test', tt => tt.end())
      tt.test('run this with a comment', { only: true },
              tt => tt.end())
      tt.end()
    },

    'no plan fail': tt => {
      tt.fail('this is fine', { diagnostic: false })
      tt.fail({ todo: true })
      tt.fail('this is fine')
      tt.end()
    },

    'plan fail': tt => {
      tt.plan(1, 'expect some failure here')
      tt.fail('this is fine', { diagnostic: false })
    },

    'fail then end': tt => {
      tt.test('child', tt => {
        tt.fail('this is not ok')
        tt.end()
      })
      tt.end()
    },

    'planned skip': tt => {
      tt.plan(0, 'skip this one')
    },

    'multi-plan throws': tt => {
      tt.plan(1)
      tt.throws(() => tt.plan(1))
    },

    'negative plan throws': tt => {
      tt.throws(() => tt.plan(-1))
      tt.end()
    },

    'expect fail': tt => {
      tt.plan(1)
      tt.fail('this is fine', { expectFail: true })
    },

    'sub': tt => {
      tt.test('named child', { buffered: true }, tt => {
        tt.pass('this is fine')
        tt.pass()
        tt.pass({ todo: true })
        tt.end()
      })
      tt.test(function named_function (tt) {
        tt.plan(1)
        tt.pass('also fine')
      })
      tt.test('promisey', tt => new Promise(resolve => {
        tt.pass('i promise, it is fine')
        resolve()
      }))
      tt.end()
    },

    'parallel sub': tt => {
      tt.jobs = 2
      tt.plan(2)
      let slowGoing = true
      tt.test('slow child', tt => setTimeout(_ => {
        slowGoing = false
        tt.end()
      }, 200))
      tt.test('fast child', tt => setTimeout(_ => {
        tt.ok(slowGoing, 'slow is going')
        tt.end()
      }))
    },

    'reasoned bailout': tt => {
      tt.test(tt => {
        tt.pass('this is fine')
        tt.bailout('not fine')
      })
      tt.end()
    },

    'unreasonable bailout': tt => {
      tt.test(tt => {
        tt.pass('this is fine')
        tt.bailout()
      })
      tt.end()
    },

    'bailout after end': tt => {
      tt.test(tt => {
        tt.pass('this is fine')
        tt.end()
        tt.bailout('not fine')
      })
      tt.end()
    },

    'diags': tt => {
      tt.pass('has diags', { diagnostic: true, foo: 1 })
      tt.fail('fails without diag', { diagnostic: false, foo: 1 })
      process.env.TAP_DIAG = '1'
      tt.pass('has diags', { foo: 1 })
      tt.fail('fails without diag', { diagnostic: false, foo: 1 })
      process.env.TAP_DIAG = '0'
      tt.pass('has diags', { diagnostic: true, foo: 1 })
      tt.fail('fails without diag', { foo: 1 })
      process.env.TAP_DIAG = ''
      tt.end()
    },

    'gentle thrower': tt => tt.threw(new Error('ok')),
    'gentle thrower nonerror': tt => tt.threw('ok'),
    'child thrower': tt => tt.test('child test', tt =>
      tt.threw(new Error('ok'))).then(tt.end),

    'child thrower nonerror': tt => tt.test('child test', tt =>
      tt.threw('ok')).then(tt.end),

    'child end event thrower': tt => {
      tt.test(tt => {
        tt.plan(1)

        tt.on('end', function () {
          tt.comment('end() event')
          throw new Error('beep')
        })

        tt.equal(3, 3)
      })
      tt.end()
    },

    'child end event throw nonerror': tt => {
      tt.test(tt => {
        tt.plan(1)

        tt.on('end', function () {
          tt.comment('end() event')
          throw 'boop'
        })

        tt.equal(3, 3)
      })
      tt.end()
    },

    'simulated uncaughtException throwing': tt => {
      tt.test('parent', tt => {
        // expect 2
        tt.expectUncaughtException()
        tt.expectUncaughtException({ message: 'bar' })
        const e = new Error('foo')
        e.tapCaught = 'uncaughtException'
        tt.threw(e)
        tt.test('wrong error', tt => {
          tt.expectUncaughtException({ message: 'bar' })
          const e = new Error('foo is not a bear')
          e.tapCaught = 'uncaughtException'
          tt.threw(e)
          tt.end()
        })
        tt.test('nothing uncaught', tt => {
          tt.expectUncaughtException(/bar/)
          tt.expectUncaughtException(/anotehr one/, 'expect a second one')
          const e = new Error('bar is a bar')
          e.tapCaught = 'uncaughtException'
          tt.threw(e)
          tt.end()
        })
        const e2 = new Error('bar')
        e2.tapCaught = 'unhandledRejection'
        tt.threw(e2)
        tt.end()
      })
      tt.end()
    },
  }

  const keys = Object.keys(cases)
  t.plan(keys.length)

  for (let i in cases) {
    t.test(i, t => {
      const go = (t, tt) => new Promise(resolve => {
        let out = ''
        tt.on('data', c => out += c)
        let didIt = false
        const done = reason => {
          // make sure we don't test on BOTH bailout and end
          // as that is unnecessary
          if (didIt)
            return
          didIt = true

          if (tt.output)
            out = tt.output

          if (reason)
            out = out.trim() + '\nBAILOUT: ' + JSON.stringify(reason)

          t.matchSnapshot(out, i)
          resolve()
        }
        tt.on('end', done)
        tt.on('bailout', done)
        cases[i](tt)
      })

      t.test('no options', t =>
        go(t, new Test()))
      t.test('bailout', t =>
        go(t, new Test({ bail: true })))
      t.test('runOnly', t =>
        go(t, new Test({ runOnly: true })))
      t.end()
    })
  }
})

t.test('assertions and weird stuff', t => {
  const env = process.env.TAP_BUFFER
  process.env.TAP_BUFFER = '0'
  t.teardown(_ => process.env.TAP_BUFFER = env)

  const cases = {
    'error': tt => {
      tt.error(null, 'this is not an error')
      tt.error(new Error('fail: poop'), 'this error is poop')
      tt.error(new Error('fail: poop'))
      tt.error('fail: poop', 'this error is "poop"')
      tt.error('fail: poop')
      tt.error(null, { todo: true })
      tt.error(null)
      tt.end()
    },

    equal: tt => {
      tt.equal(1, 2)
      tt.equal(1, '1', { skip: true })
      tt.equal(1, 1, 'one is one')
      // fails, but with the special note
      tt.equal({foo: 1}, {foo: 1})
      // fails, showing a diff
      tt.equal({foo: 1}, {foo: 2})
      tt.end()
    },

    not: tt => {
      tt.not(1, 2)
      tt.not(1, '1', { skip: true })
      tt.not(1, 1, 'one is not one')
      tt.not({}, {})
      tt.end()
    },

    same: tt => {
      const o = { foo: 1 }
      tt.same([1, 2, 3], ['1', '2', '3'])
      tt.same(o, o)
      tt.same({ foo: 1 }, { foo: 1 }, 'object exactness')
      tt.same({ foo: 2 }, { foo: 1 }, { skip: true })
      tt.notSame({ foo: 2 }, { foo: 1 }, 'this one passes')
      tt.notSame({ foo: 2 }, { foo: 1 }, { skip: true })
      tt.notSame({ foo: { bar: 2 } }, { foo: { bar: '2' } },
                 'this one fails')

      tt.strictSame({ foo: 2 }, { foo: 1 }, { skip: true })
      tt.strictSame([1, 2, 3], ['1', '2', '3'])
      tt.strictSame(o, { foo: 1 })
      tt.strictSame(o, o)
      tt.strictNotSame({ foo: 2 }, { foo: 1 }, { skip: true })
      tt.strictNotSame({ foo: 2 }, { foo: 1 }, 'this one passes')
      tt.strictNotSame({ foo: { bar: 2 } }, { foo: { bar: '2' } },
                       'this one passes')
      tt.strictNotSame({ foo: { bar: 2 } }, { foo: { bar: 2 } },
                       'this one fails')

      tt.end()
    },

    has: tt => {
      tt.has({ a: 'b', c: '1' }, { a: 'b', c: 1 }, 'should pass')
      tt.has({ a: 'b', c: '1' }, { a: 'b', b: 1 }, 'should fail')
      tt.has({ a: 'b', c: 1 }, { a: 'b', c: Number }, 'should fail')
      tt.has({ a: 1, b: 2, c: 3 }, { b: '2' }, 'should pass')
      tt.has({ a: 'b', c: '1' }, { a: 'b', c: 1 }, { todo: true })
      tt.end()
    },

    notHas: tt => {
      tt.notHas({ a: 'b', c: '1' }, { a: 'b', c: 1 }, 'should fail')
      tt.notHas({ a: 'b', c: '1' }, { a: 'b', b: 1 }, 'should pass')
      tt.notHas({ a: 'b', c: 1 }, { a: 'b', c: Number }, 'should pass')
      tt.notHas({ a: 1, b: 2, c: 3 }, { b: '2' }, 'should fail')
      tt.notHas({ a: 'b', c: '1' }, { a: 'b', c: 1 }, { todo: true })
      tt.end()
    },

    hasStrict: tt => {
      tt.hasStrict({ a: 'b', c: '1' }, { a: 'b', c: 1 }, 'should fail')
      tt.hasStrict({ a: 1, b: 2, c: 3 }, { b: 2 }, 'should pass')
      tt.hasStrict({ a: 'b', c: '1' }, { a: 'b', c: 1 }, { todo: true })
      tt.end()
    },

    notHasStrict: tt => {
      tt.notHasStrict({ a: 'b', c: '1' }, { a: 'b', c: 1 }, 'should pass')
      tt.notHasStrict({ a: 1, b: 2, c: 3 }, { b: 2 }, 'should fail')
      tt.notHasStrict({ a: 'b', c: '1' }, { a: 'b', c: 1 }, { todo: true })
      tt.end()
    },

    hasProp: tt => {
      const p = { a: 'b', c: undefined, d: undefined }
      const c = Object.assign(Object.create(p), { d: 'd', e: undefined })
      tt.hasProp(c, 'a', 'should pass')
      tt.hasProp(c, 'c', 'should fail')
      tt.hasProp(c, 'd', 'should pass')
      tt.hasProp(c, 'e', 'should fail')
      tt.hasProp(c, 'f', 'should fail')
      tt.test('invalid cases, all should fail', tt => {
        tt.hasProp(null, 'a')
        tt.hasProp({}, null)
        tt.hasProp(null, null)
        tt.hasProp('asdf', 'length')
        tt.end()
      })
      tt.end()
    },

    hasOwnProp: tt => {
      const p = { a: 'b', c: undefined, d: undefined }
      const c = Object.assign(Object.create(p), { d: 'd', e: undefined })
      tt.hasOwnProp(c, 'a', 'should fail')
      tt.hasOwnProp(c, 'c', 'should fail')
      tt.hasOwnProp(c, 'd', 'should pass')
      tt.hasOwnProp(c, 'e', 'should fail')
      tt.hasOwnProp(c, 'f', 'should fail')
      tt.hasOwnProp('asdf', 'length', 'should pass')
      tt.test('invalid cases, all should fail', tt => {
        tt.hasOwnProp(null, 'a')
        tt.hasOwnProp({}, null)
        tt.hasOwnProp(null, null)
        tt.end()
      })
      tt.end()
    },

    hasProps: tt => {
      const p = { a: 'b', c: undefined, d: undefined }
      const c = Object.assign(Object.create(p), { d: 'd', e: undefined })
      tt.hasProps(c, null, 'should fail (falsey)')
      tt.hasProps(c, 'hello', 'should fail (iterable, but not object)')
      tt.hasProps(c, {}, 'should fail (object, but not iterable)')

      tt.hasProps(c, ['a'], 'should pass')
      tt.hasProps(c, ['a', 'd'], 'should pass')
      tt.hasProps(c, ['a', 'c'], 'should fail')
      tt.hasProps(c, ['d'], 'should pass')
      tt.hasProps(c, new Set(['d']), 'should pass (Set is iterable)')
      tt.hasProps(c, new String('d'), 'should fail (even though String is iterable)')
      tt.hasProps(c, ['d', 'e'], 'should fail')
      tt.hasProps(c, ['d', 'f'], 'should fail')
      tt.test('invalid cases, all should fail', tt => {
        tt.hasProps('asdf', ['length'])
        tt.hasProps(null, ['a'])
        tt.hasProps({}, [null])
        tt.hasProps(null, [null])
        tt.end()
      })
      tt.end()
    },

    hasOwnProps: tt => {
      const p = { a: 'b', c: undefined, d: undefined }
      const c = Object.assign(Object.create(p), { d: 'd', e: undefined, f: 'f' })
      tt.hasOwnProps(c, null, 'should fail (falsey)')
      tt.hasOwnProps(c, 'hello', 'should fail (iterable, but not object)')
      tt.hasOwnProps(c, {}, 'should fail (object, but not iterable)')
      tt.hasOwnProps(c, ['a'], 'should fail')
      tt.hasOwnProps(c, ['a', 'd'], 'should fail')
      tt.hasOwnProps(c, ['a', 'c'], 'should fail')
      tt.hasOwnProps(c, ['d'], 'should pass')
      tt.hasOwnProps(c, new Set(['d']), 'should pass (Set is iterable)')
      tt.hasOwnProps(c, new String('d'), 'should fail (even though String is iterable)')
      tt.hasOwnProps(c, ['d', 'e'], 'should fail')
      tt.hasOwnProps(c, ['d', 'f'], 'should pass')
      tt.hasOwnProps(c, ['d', 'f', 'g'], 'should fail')
      tt.hasOwnProps('asdf', ['length'], 'should pass')
      tt.test('invalid cases, all should fail', tt => {
        tt.hasOwnProps(null, ['a'])
        tt.hasOwnProps({}, [null])
        tt.hasOwnProps(null, [null])
        tt.end()
      })
      tt.end()
    },

    match: tt => {
      tt.match({ a: 'b', c: /asdf/ }, { a: String, c: RegExp })
      tt.match({ a: 'b', c: /asdf/ }, { a: 'asdf', c: 1 })
      tt.match({ a: 'b', c: /asdf/ }, { a: String, c: RegExp },
               'a message')
      tt.match({ a: 'b', c: /asdf/ }, { a: 'asdf', c: 1 },
               { todo: true })
      tt.notMatch({ a: 'b', c: /asdf/ }, { a: String, c: RegExp })
      tt.notMatch({ a: 'b', c: /asdf/ }, { a: 'asdf', c: 1 })
      tt.notMatch({ a: 'b', c: /asdf/ }, { a: String, c: RegExp },
                  'a message')
      tt.notMatch({ a: 'b', c: /asdf/ }, { a: 'asdf', c: 1 },
                  { todo: true })

      tt.compareOptions.style = 'js'
      tt.match({ a: 'b', c: /asdf/ }, { a: 'asdf', c: 1 },
               'fails, prints diff in js mode')

      tt.end()
    },

    type: tt => {
      tt.type(null, 'object', 'this fails')
      tt.type(null, 'object', { expectFail: true })
      tt.type(1234, 'number')
      tt.type(tt, Test)
      tt.type({}, function () {}, 'fails, anonymously')
      const o = {}
      tt.type(o, o, 'a thing is a thing')
      tt.type(() => {}, 'function', 'arrows are functions')
      tt.type(() => {}, Function, 'arrows are functions')
      tt.type(() => {}, Object, 'fail: arrows are not objects')
      tt.type({}, 'object')
      tt.type(tt, 'Test')
      tt.type(tt, 'EventEmitter')
      tt.end()
    },

    throws: tt => {
      tt.match(tt.throws(() => { throw new TypeError('x') }, TypeError),
        new TypeError('x'), 'returns the error that was thrown')
      tt.throws(() => { throw new TypeError('x') }, TypeError)
      tt.throws(() => { throw new TypeError('x') },
                new TypeError('x'))
      tt.throws(() => { throw new TypeError('x') },
                { message: 'x' })

      const nameless = new Error('x')
      Object.defineProperty(nameless, 'name', {
        value: undefined
      })
      nameless.stack = /^.*$/
      tt.throws(() => { throw new Error('x') }, nameless)
      tt.throws(() => { throw nameless }, { message: 'x' })
      tt.throws(() => { throw nameless }, /^.$/)
      tt.match(tt.throws(() => { throw nameless }), nameless,
        'returns the error that was thrown')

      const prop = new Error('noent')
      prop.code= 'ENOENT'
      tt.throws(() => {
        const er = new Error('noent')
        er.code = 'ENOENT'
        er.path = __filename
        throw er
      }, prop)

      tt.throws(() => 'doesnt tho', 'fail: does not throw actually')

      tt.throws(() => { throw new Error('x') }, {}, { skip: true })
      tt.throws(() => { throw new Error('x') }, {},
                {}, {}, 1)
      tt.throws(() => { throw new Error('x') },
                () => {}, () => {}, () => {},
                'extra functions are no-ops for bw comp')
      tt.throws('todo')
      tt.end()
    },

    doesNotThrow: tt => {
      tt.doesNotThrow(() => {}, 'this is fine')
      tt.doesNotThrow(() => {}, { todo: true })
      tt.doesNotThrow('reverse args', () => {})
      tt.doesNotThrow('this is todo')
      tt.doesNotThrow('fail', () => {
        throw new Error('ouch')
      })
      tt.end()
    },

    rejects: tt => {
      tt.rejects('promise', new Promise((_, reject) => {
        reject(new Error('expected'))
      }))
      tt.rejects(() => new Promise((_, reject) => {
        reject(new Error('expected'))
      }), 'fn returns promise')
      tt.rejects(new Promise((_, reject) => {
        reject(new Error('expected'))
      }))
      tt.rejects(() => new Promise((_, reject) => {
        reject(new Error('expected'))
      }))
      tt.rejects('todo because no fn/promise', { foo: 'bar' })
      tt.comment('next 2 also todo, no message')
      tt.rejects({ x: 1 })
      tt.rejects()
      tt.rejects(() => new Promise((_, reject) => {
        reject(new Error('expected'))
      }), new Error('expected'), 'throws expected error')
      tt.rejects(() => new Promise((_, reject) => {
        reject(new TypeError('expected'))
      }), TypeError, 'throws expected error type')
      tt.rejects(() => new Promise((_, reject) => {
        reject(new TypeError('expected'))
      }), TypeError, ()=>{}, _=>_, 'extra functions are no-ops')
      tt.rejects(() => new Promise((_, reject) => {
        reject(new TypeError('expected'))
      }), TypeError, 1, 2, {}, {}, 'extra args are no-ops')

      const prop = new Error('noent')
      prop.code= 'ENOENT'
      tt.rejects(new Promise((_, reject) => {
        const er = new Error('noent')
        er.code = 'ENOENT'
        er.path = __filename
        reject(er)
      }), prop)

      const nameless = new Error('x')
      Object.defineProperty(nameless, 'name', {
        value: undefined
      })
      nameless.stack = /^.*$/
      tt.rejects(new Promise((_,r) => r(new Error('x'))), nameless)
      tt.rejects(new Promise((_,r) => r(nameless)), { message: 'x' })
      tt.rejects(new Promise((_,r) => r(nameless)), /^.$/)
      tt.rejects(new Promise((_,r) => r(nameless)))

      tt.rejects(() => {}, 'fail: no promise')
      tt.rejects(() => ({}), 'fail: no promise')

      tt.rejects(new Promise(r => r(420)), 'fail: passing promise')

      tt.rejects(() => Promise.reject(), 'empty rejection')

      tt.end()
    },

    resolves: tt => {
      tt.resolves(new Promise(r => r(420)))
      tt.resolves(new Promise(r => r(420)), { todo: true })
      tt.resolves(new Promise(r => r(420)), 'passing promise')
      tt.resolves(() => new Promise(r => r(420)), 'passing promise fn')
      tt.resolves(() => {}, 'fail: no promise')
      tt.end()
    },

    resolveMatch: tt => {
      tt.resolveMatch(new Promise(r => r(420)), Number)
      tt.resolveMatch(new Promise(r => r(420)), 'asdf', { todo: true })
      tt.resolveMatch(new Promise(r => r(420)), 420, 'promise')
      tt.resolveMatch(() => new Promise(r => r(420)), 420, 'promise fn')
      tt.resolveMatch(() => {}, {}, 'fail: no promise')
      tt.resolveMatch(Promise.reject('n'), 'y', 'fail: rejected promise')
      tt.end()
    },

    'test after end fails': tt => {
      tt.end()
      tt.pass('failing pass')
    },

    'plan excess': tt => {
      tt.plan(1)
      tt.pass('fine')
      tt.pass('not fine')
    },

    'plan excess, ignored when failing': tt => {
      tt.plan(1)
      tt.fail('expected fail', { diagnostic: false })
      tt.pass('not fine')
    },

    'using the assertAt field': tt => {
      const stack = require('../lib/stack.js')
      const foo = () => tt.fail('expect fail')
      const bar = () => foo()
      const baz = () => { tt.assertAt = stack.at(); bar() }

      tt.plan(1)
      baz()
    },

    'using the assertStack field': tt => {
      const stack = require('../lib/stack.js')
      const foo = () => tt.fail('expect fail')
      const bar = () => foo()
      const baz = () => { tt.assertStack = stack.captureString(80); bar() }

      tt.plan(1)
      baz()
    },

    printResult: tt => {
      // super low-level
      tt.printResult(true, 'this is fine')
      tt.end()
    },

    'printResult after plan end': tt => {
      // super low-level
      tt.end()
      tt.printResult(true, 'this is fine')
    },

    'plan, child test, explicit end': tt => {
      tt.plan(1)
      tt.test(tt => Promise.resolve('ok'))
      tt.end()
    },

    'end multiple times': tt => {
      tt.plan(1)
      tt.pass('yes')
      tt.end()
      tt.end()
    },

    'thrower after end': tt => {
      tt.test('child', tt => {
        tt.plan(1)
        tt.pass('this is fine')
        tt.threw(new Error('catch it in the parent'))
      })
      tt.end()
    },

    'child breaks a promise': tt => {
      tt.test('child', () => new Promise((_, r) => r(new Error('poop'))))
      tt.end()
    },

    'child breaks a promise nonerror': tt => {
      tt.test('child', () => new Promise((_, r) => r('poop')))
      tt.end()
    },

    'child teardown throw': tt => {
      tt.test('child', tt => {
        tt.teardown(() => { throw new Error('fail') })
        tt.end()
      })
      tt.end()
    },

    'child teardown throw nonerror': tt => {
      tt.test('child', tt => {
        tt.teardown(() => { throw 'fail' })
        tt.end()
      })
      tt.end()
    },

    'teardown promise': tt => {
      tt.test('parent', tt => {
        tt.teardown(() => new Promise(res => {
          tt.comment('parent teardown')
          res()
        }))
        tt.pass('this is fine')
        tt.end()
      })
      tt.end()
    },

    'teardown promise fail': tt => {
      tt.test('parent', tt => {
        tt.teardown(() => new Promise((_, rej) => {
          tt.comment('parent teardown')
          rej(new Error('did not tear down proper'))
        }))
        tt.pass('this is fine')
        tt.end()
      })
      tt.end()
    },

    'teardown promise fail nonerror': tt => {
      tt.test('parent', tt => {
        tt.teardown(() => new Promise((_, rej) => {
          tt.comment('parent teardown')
          rej('did not tear down proper')
        }))
        tt.pass('this is fine')
        tt.end()
      })
      tt.end()
    },

    'fullname without main': tt => {
      const main = process.argv[1]
      process.argv[1] = ''
      tt.test('child', tt => {
        tt.pass(tt.fullname)
        tt.end()
      })
      tt.pass(tt.fullname)
      process.argv[1] = main
      tt.end()
    },

    'comment after end': tt => {
      tt.end()
      tt.comment('this is fine')
    },

    grep: tt => {
      tt.test('parent', { grep: [ /x$/, /y$/ ] }, tt => {
        tt.test('do not run this', tt => tt.threw('no'))
        tt.test('but do run this x', tt => {
          tt.test('do not run this', tt => tt.threw('stop'))
          tt.test('but do run this y', tt => {
            tt.test('grand kids', tt => tt.end())
            tt.test('get all the', tt => tt.end())
            tt.test('goodies', tt => {
              tt.pass('this is good')
              tt.end()
            })
            tt.end()
          })
          tt.end()
        })
        tt.end()
      })
      tt.end()
    },

    grepInvert: tt => {
      tt.test('parent', { grepInvert: true, grep: [ /x$/, /y$/ ] }, tt => {
        tt.test('do not run this x', tt => tt.threw('no'))
        tt.test('but do run this', tt => {
          tt.test('do not run this y', tt => tt.threw('stop'))
          tt.test('but do run this', tt => {
            tt.test('grand kids', tt => tt.end())
            tt.test('get all the', tt => tt.end())
            tt.test('goodies', tt => {
              tt.pass('this is good')
              tt.end()
            })
            tt.end()
          })
          tt.end()
        })
        tt.end()
      })
      tt.end()
    },

    autoEnd: tt => {
      tt.options.autoend = true
      tt.test('this should automatically end', { autoend: true }, t => {
        t.pass('this is fine')
        setTimeout(() => t.pass('also fine'))
      })
      tt.test('this should also end', t => {
        t.pass('this is fine')
        setTimeout(() => t.pass('also fine'))
        t.autoend()
      })
      tt.test('autoend async 1', t => {
        setTimeout(() =>
          t.test('st', t => setTimeout(() => t.end())))
        t.autoend()
      })
      tt.test('autoend async 2', t => {
        setTimeout(() => setTimeout(() =>
          t.test('st', t => setTimeout(() => t.end()))))
        t.autoend()
      })
      tt.test('autoend async limit', t => {
        setTimeout(() => setTimeout(() => setTimeout(() =>
          t.test('st', t => setTimeout(() => t.end())))))
        t.autoend()
      })

    },

    'autoend(false)': tt => {
      tt.autoend()
      tt.autoend(false)
      setTimeout(() => {
        tt.pass('this is fine')
        tt.end()
      }, 50)
    },

    'endAll with test children': tt => {
      tt.test('this is the test that never ends', tt => {
        tt.test('it goes on and on my friend', tt => {
          tt.pass('this is ok')
          tt.test('misbehaving child', () => new Promise(()=>{}))
        })
        tt.pass('some queue stuff')
      })
      tt.endAll()
    },

    'endAll with unresolved t.resolveMatch': tt => {
      tt.test('this is the test that never ends', tt => {
        tt.test('it goes on and on my friend', tt => {
          tt.pass('this is ok')
          tt.resolveMatch(() => new Promise(()=>{}), {})
        })
        tt.pass('some queue stuff')
      })
      tt.endAll()
    },

    'endAll with stdin': tt => {
      const s = new MiniPass()
      tt.stdin({ tapStream: s })
      s.write('TAP version 13\nok - but not ended\n')
      tt.endAll()
    },

    'endAll with bailout': tt => {
      tt.on('bailout', reason => tt.endAll())
      tt.test('child', { bail: true }, tt => {
        tt.fail('not fine')
        tt.end()
      })
    },

    stdinOnly: tt => {
      const s = new MiniPass()
      tt.plan(8)
      tt.test('the stdinOnly test', ttt => {
        let sub = null
        ttt.stdinOnly({ tapStream: s })
        tt.throws(() => ttt.stdinOnly())
        tt.throws(() => ttt.pass('this is fine'))
        tt.throws(() => ttt.test('hello', () => {}))
        tt.throws(() => ttt.end())
        tt.throws(() => tt.stdinOnly())
        ttt.on('subtestAdd', s => sub = s)
        s.end(`
          TAP version 13
          # Subtest: child
              ok - this child is in a subtest
              1..1
          ok 1 - child
          ok 2 - just a normal assertion
          not ok 3 - this is not ok
          not ok 4 - this will be ok later # TODO
          1..4
          `.replace(/^          /gm, '')
        )
        tt.ok(sub, 'got a sub')
        tt.same(ttt.counts, {
          total: 3,
          pass: 1,
          fail: 1,
          skip: 0,
          todo: 1
        })
      })
    },

    'bailout with indented subs': tt => {
      tt.test('1', tt => tt.end())
      tt.test('2', tt => Promise.resolve(null))
      tt.test('3', tt => setTimeout(() => tt.end()))
      tt.end()
      tt.bailout('whoops')
    },

    'bailout with buffered subs': tt => {
      const o = { buffered: true }
      tt.test('1', o, tt => tt.end())
      tt.test('2', o, tt => Promise.resolve(null))
      tt.test('3', o, tt => setTimeout(() => tt.end()))
      process.nextTick(() => tt.bailout('whoops'))
      tt.end()
    },

    'bailout in first sub': t => {
      t.test('one', t => t.bailout('bail me out'))
      t.test('two', t => t.end())
      t.end()
    },

    'bailout in first buffered sub': t => {
      const o = { buffered: true }
      t.test('one', o, t => t.bailout('bail me out'))
      t.test('two', o, t => t.end())
      t.end()
    },

    'bailout in nested sub': t => {
      t.test('one', t => t.test('1.5', t => t.bailout('bail me out')))
      t.test('two', t => t.end())
      t.end()
    },

    'bailout in first buffered sub': t => {
      const o = { buffered: true }
      t.test('one', t => t.test('1.5', o, t => t.bailout('bail me out')))
      t.test('two', o, t => t.end())
      t.end()
    },

    'implicit bailout with parallel subs': t => {
      t.bail = true
      t.jobs = 2
      const tests = []
      t.test('zro', { buffered: true }, t => tests.push(t))
      t.test('one', { buffered: true }, t => tests.push(t))
      t.test('two', { buffered: true }, t => tests.push(t))
      t.test('tre', { buffered: true }, t => tests.push(t))
      t.test('for', { buffered: true }, t => tests.push(t))
      t.end()
      tests[1].end()
      tests[2].fail('two fail 0')
      tests[2].fail('two fail 1')
      tests[2].fail('two fail 2')
      tests[2].fail('two fail 3')
      tests[0].end()
    },

    'implicit bailout without ending parent': t => {
      t.bail = true
      t.jobs = 4
      const tests = []
      t.test('zro', { buffered: true }, t => tests.push(t))
      t.test('one', { buffered: true }, t => tests.push(t))
      t.test('two', { buffered: true }, t => tests.push(t))
      t.test('tre', { buffered: true }, t => tests.push(t))
      t.test('for', { buffered: true }, t => tests.push(t))

      tests[0].end()
      tests[2].end()
      tests[3].fail('not fine')
      tests[1].end()
    },

    'silent subs': tt => {
      tt.test('child', tt => Promise.resolve(null))
      tt.test('shhh', { silent: true }, tt => tt.end())
      tt.test('child 2', tt => tt.end())
      tt.end()
    },

    'beforeEach afterEach': tt => {
      tt.beforeEach(function () {
        console.error('parent be', this.name)
      })
      tt.afterEach(function () {
        console.error('parent ae', this.name)
      })
      tt.test('child', tt => {
        tt.beforeEach(function () {
          console.error('child be', this.name)
        })
        tt.afterEach(function () {
          console.error('child ae', this.name)
        })
        tt.test('grandkid', tt => Promise.resolve(console.error('in test')))
        tt.end()
      })
      tt.end()
    },

    'throw in child beforeEach': tt => {
      tt.test('child', async tt => {
        tt.beforeEach(async () => {
          throw new Error('poop')
        })
        tt.test('grandkid', tt => Promise.resolve(console.error('in test')))
        tt.end()
      })
      tt.test('next kid', async tt => {})
      tt.end()
    },

    'throw in root beforeEach': tt => {
      tt.beforeEach(async () => {
        throw new Error('poop')
      })
      tt.test('child', tt => {
        tt.test('grandkid', tt => Promise.resolve(console.error('in test')))
        tt.end()
      })
      tt.test('next kid', async tt => {})
      tt.end()
    },

    'timeout expiration': t => {
      const buf = [ false, true ]
      buf.forEach(buf => {
        t.test('get lost buf=' + buf, { buffered: buf, timeout: 50 }, t => {
          const timer = setTimeout(() => {}, 10000)
          t.on('timeout', () => clearTimeout(timer))
        })
      })
      t.end()
    },

    'timeout with subs': t => {
      const buf = [ false, true ]
      buf.forEach(buf => {
        t.test('get lost buf=' + buf, { buffered: buf, timeout: 50 }, t => {
          const timer = setTimeout(() => {}, 10000)
          t.test('carry on', t => t.on('timeout', () => clearTimeout(timer)))
        })
      })
      t.end()
    },

    'timeout at the last tick': t => {
      const buf = [ false, true ]
      buf.forEach(buf => {
        t.test('work it harder buf=' + buf, { buffered: buf, timeout: 1 }, t => {
          t.plan(1)
          const start = Date.now()
          const finish = start + 10
          while (finish > Date.now()) {
            fs.readFileSync(__filename)
          }
          t.pass('this is fine')
        })
      })
      t.end()
    },

    't.emits': t => {
      const EE = require('events').EventEmitter
      const ee = new EE()
      t.emits(ee, 'fail', 'this one will fail')
      t.emits(ee, 'pass', { extra: 'some stuff' })
      ee.emit('pass')
      t.end()
    },

    't.emits returns promise': t => {
      const EE = require('events').EventEmitter
      const ee = new EE()
      setTimeout(() => ee.emit('pass'))
      t.emits(ee, 'pass').then(() => {
        t.pass('emit returned promise that resolved')
      })
      t.emits(ee, 'never emitted').then(() => {
        throw new Error('should not happen')
      })
      t.end()
    },

    'before sync': t => {
      let x = false
      t.before(() => x = true)
      t.equal(x, true, 'before was called')
      t.end()
    },
    'before async': t => {
      let x = false
      let y = false
      t.before(async () => {
        x = true
        await Promise.resolve(true)
        y = true
      })
      t.equal(x, true, 'before was called')
      t.equal(y, false, 'before not done yet')
      t.test('child', t => {
        t.equal(y, true, 'tests wait for t.before to finish')
        t.end()
      })
      t.end()
    },
    'before after sync test fails': t => {
      t.test('child', t => {
        t.test('sync child', t => t.end())
        t.before(() => {})
        t.fail('should not print this')
      })
      t.end()
    },
    'before after async test fails': t => {
      t.test('child', t => {
        t.test('sync child', async t => {})
        t.before(() => {})
        t.fail('should not print this')
      })
      t.end()
    },
    'before after assertion fails': t => {
      t.test('child', t => {
        t.pass('this is going to be trouble')
        t.before(() => {})
        t.fail('should not print this')
      })
      t.end()
    },
    'before called more than once fails': t => {
      t.test('child', t => {
        t.before(() => {})
        t.before(() => {})
        t.fail('should not print this')
      })
      t.end()
    },
    'before throw': t => {
      t.test('child', t => {
        t.before(() => {throw new Error('poo')})
        t.test('async child', t => t.end())
        t.fail('should not print this')
      })
      t.end()
    },
    'before reject': t => {
      t.test('child', t => {
        t.before(async () => {throw new Error('poo')})
        t.test('async child', t => t.end())
        t.fail('should not print this')
      })
      t.end()
    },
  }

  const keys = Object.keys(cases)
  t.plan(keys.length)

  for (let i in cases) {
    t.test(i, t => {
      t.plan(1)

      const error = console.error
      t.teardown(() => console.error = error)
      let err = ''
      console.error = function () {
        err += util.format.apply(util, arguments) + '\n'
      }

      const tt = new Test()
      let out = ''
      tt.on('data', c => out += c)
      tt.on('end', _ => {
        setTimeout(() => {
          if (err)
            out = out.trim() + '\n' + 'STDERR:\n' + err
          t.matchSnapshot(out, 'output')
        })
      })
      cases[i](tt)
    })
  }
})

t.test('addAssert', t => {
  t.throws(() => t.addAssert(null), new TypeError('name is required'))
  t.throws(() => t.addAssert('x'), new TypeError('number of args required'))
  t.throws(() => t.addAssert('x', -1),
           new TypeError('number of args required'))
  t.throws(() => t.addAssert('x', 1),
           new TypeError('function required for addAssert'))
  t.throws(() => t.addAssert('ok', 1, () => {}),
           new TypeError('attempt to re-define `ok` assert'))

  const url = require('url')
  const tt = new Test({ buffered: true })
  tt.addAssert('isUrl', 1, function isUrl (u, message, extra) {
    return this.match(url.parse(u), {
      protocol: /^https?:$/,
      slashes: true,
      host: String,
      path: /^\/.*$/
    }, message || 'expect a valid http/https url', extra)
  })
  tt.isUrl('hello is not a url')
  tt.isUrl('http://x', 'x is a url!')
  tt.isUrl('https://skip:420/', { skip: 420 })
  tt.end()

  t.matchSnapshot(tt.output, 'using the custom isUrl assertion')
  return t.end()
})

t.test('static addAssert', t => {
  function foobar (found, message, extra) {
    return this.ok(found, message, extra)
  }
  Test.addAssert('foobar', 1, foobar)
  t.foobar(true, 'this is fine')
  t.end()
})

t.test('spawn', t => {
  const okjs = path.resolve(__dirname, '../ok.test.js')
  t.teardown(() => fs.unlinkSync(okjs))
  fs.writeFileSync(okjs, "require('./').pass('this is fine')\n")
  t.spawn(process.execPath, okjs)
  t.spawn(process.execPath, okjs, 'a string as options')
  t.spawn(process.execPath, okjs, { name: 'a name as an option' })

  t.test('kitty pipe', t => {
    t.on('spawn', t =>
      t.proc.stdin.end('TAP version 13\n1..1\nok\n'))
    t.spawn('cat', [], { stdio: 'pipe' })
    t.spawn('cat', null, { stdio: 'pipe' }, 'aggreeable kitten')
    t.end()
  })

  t.end()
})

t.test('snapshots', async t => {
  const Snapshot = require('../lib/snapshot.js')
  const dir = t.testdir()
  const snap = [ true, false ]
  const fn = async snap => {
    const tt = new Test({
      snapshot: snap,
      name: 'deleteme',
      buffered: true
    })
    tt.snapshotFile = `${dir}/tap-snapshots/deleteme.test.cjs`
    await tt.test('child test', { snapshot: snap, buffered: false }, tt => {
      tt.matchSnapshot({ foo: 'bar' }, 'an object')
      tt.formatSnapshot = o => JSON.stringify(o, null, 2)
      tt.matchSnapshot({ foo: 'bar' }, 'a jsonic object')
      tt.formatSnapshot = o => ({ ...o, mutated: true })
      tt.matchSnapshot({ foo: 'bar' }, 'a mutated object')
      delete tt.formatSnapshot
      tt.matchSnapshot('some string \\ \` ${process.env.FOO}', 'string')
      tt.matchSnapshot('do this eventually', { todo: 'later' })
      tt.resolveMatchSnapshot(Promise.resolve(true), { todo: 'later' }, 'later')
      tt.resolveMatchSnapshot({ fo: 'not a promise' }, 'message about promise')
      tt.resolveMatchSnapshot(Promise.reject('rejected promise'))
      tt.resolveMatchSnapshot(() => Promise.resolve(420), 'promise fn')
      return tt.resolveMatchSnapshot(Promise.resolve({a:1, b:2})
        .then(a => `a: ${a.a}`), 'modify the promise result')
    })
    tt.emit('teardown')
    tt.end()
    t.matchSnapshot(fs.readFileSync(tt.snapshotFile, 'utf8'), 'snapshot file')
    return tt.output
  }
  const outputs = [await fn(true), await fn(false) ]

  t.matchSnapshot(outputs[0], 'saving the snapshot')
  t.matchSnapshot(outputs[1], 'verifying the snapshot')
  t.end()
})

t.test('snapshot file per test case', async t => {
  const dir = t.testdir({ 'tap-snapshots': {} })
  const tt = new Test({ name: 'parent', snapshot: true })
  tt.setEncoding('utf8')
  tt.snapshotFile = dir + '/tap-snapshots/parent.test.cjs'
  tt.matchSnapshot('snapshot in main before subs')
  tt.test('sub 1', tt => {
    tt.snapshotFile = dir + '/tap-snapshots/sub1.test.cjs'
    tt.matchSnapshot('sub1')
    tt.end()
  })
  tt.matchSnapshot('snapshot in main between subs')
  tt.test('sub 2', tt => {
    tt.snapshotFile = dir + '/tap-snapshots/sub2.test.cjs'
    tt.matchSnapshot('sub2')
    tt.end()
  })
  tt.test('sub 3 (using main)', tt => {
    tt.matchSnapshot('sub 3 (using main)')
    tt.end()
  })
  tt.matchSnapshot('snapshot in main after subs')
  tt.end()

  t.matchSnapshot(tt.read(), 'output')
  const entries = fs.readdirSync(dir + '/tap-snapshots')
  t.matchSnapshot(entries, 'snapshot dir entries')
  for (const f of entries) {
    t.matchSnapshot(require(`${dir}/tap-snapshots/${f}`), f)
  }
})

t.test('endAll direct while waiting on a resolving promise', t => {
  t.plan(1)
  const tt = new Test()
  tt.setEncoding('utf8')
  const buf = []
  tt.on('data', c => buf.push(c))
  tt.on('end', () => {
    const result = buf.join('')
    t.matchSnapshot(result, 'result')
  })
  tt.resolveMatch(() => new Promise(() => {}), 'never resolves')
  setTimeout(() => tt.endAll())
})

t.test('endAll direct while waiting on Promise rejection', t => {
  t.plan(1)
  const tt = new Test()
  tt.setEncoding('utf8')
  const buf = []
  tt.on('data', c => buf.push(c))
  tt.on('end', () => {
    const result = buf.join('')
    t.matchSnapshot(result, 'result')
  })
  tt.rejects(() => new Promise(() => {}), { message: 'never resolves' })
  setTimeout(() => tt.endAll())
})

t.test('endAll with sub while waiting on a resolving promise', t => {
  t.plan(1)
  const tt = new Test()
  tt.setEncoding('utf8')
  const buf = []
  tt.on('data', c => buf.push(c))
  tt.on('end', () => {
    const result = buf.join('')
    t.matchSnapshot(result, 'result')
  })
  tt.test(t => t.resolveMatch(() => new Promise(() => {}), 'never resolves'))
  setTimeout(() => tt.endAll())
})

t.test('throw while waiting on a resolving promise', t => {
  t.plan(1)
  const tt = new Test()
  tt.setEncoding('utf8')
  const buf = []
  tt.on('data', c => buf.push(c))
  tt.on('end', () => {
    const result = buf.join('')
    t.matchSnapshot(result, 'result')
  })
  tt.test(t => {
    setTimeout(() => t.threw(new Error('poop')))
    return t.resolveMatch(() => new Promise(() => {}), 'never resolves')
  })
  tt.end()
})

t.test('test dir name does not throw when no main module is present', t => {
  const {spawn} = require('child_process')
  const tap = JSON.stringify(require.resolve('../'))
  const c = spawn(process.execPath, ['-p', `require(${tap}).testdirName`])
  const out = []
  const err = []
  c.stdout.on('data', c => out.push(c))
  c.stderr.on('data', c => err.push(c))
  c.on('close', (code, signal) => {
    t.equal(code, 0)
    t.equal(signal, null)
    // normalize slashes
    t.cleanSnapshot = s => s.split('\\').join('/')
    t.matchSnapshot(Buffer.concat(out).toString('utf8'), 'stdout')
    t.matchSnapshot(Buffer.concat(err).toString('utf8'), 'stderr')
    t.end()
  })
})

t.test('fixture dir stuff', t => {
  // unnamed test has default test dir name
  t.test(t => {
    const base = path.basename(t.testdirName)
    t.equal(base, 'tap-testdir-test-fixture-dir-stuff-unnamed-test')
    t.end()
  })
  const tdn = t.testdirName
  t.throws(() => fs.statSync(tdn), 'doesnt exist yet')
  t.teardown(() => fs.statSync(tdn), 'exists in teardown')
  const dir = t.testdir()
  t.teardown(() => fs.statSync(tdn), 'exists in teardown scheduled after testdir')
  t.equal(dir, tdn)
  t.ok(fs.statSync(dir).isDirectory(), 'made directory')
  t.testdir({ file: 'contents' })
  t.equal(fs.readFileSync(`${dir}/file`, 'utf8'), 'contents', 'made file')
  t.testdir({
    file2: 'contents',
    link: t.fixture('symlink', 'file2'),
  })
  t.throws(() => fs.statSync(`${dir}/file`), 'old dir cleared out')
  t.equal(fs.readFileSync(`${dir}/file2`, 'utf8'), 'contents', 'made file')
  t.equal(fs.readlinkSync(`${dir}/link`), 'file2', 'made symlink')
  let removeDir
  t.test('remove the dir when its done', t => {
    removeDir = t.testdir()
    t.end()
  })
  let leaveDir
  t.test('leave the dir behind', { saveFixture: true }, t => {
    t.throws(() => fs.statSync(removeDir), 'previous dir was removed')
    leaveDir = t.testdir()
    t.parent.teardown(() => settings.rmdirRecursiveSync(leaveDir))
    t.end()
  })
  t.test('check leaveDir is still there', t => {
    t.ok(fs.statSync(leaveDir).isDirectory(), 'left dir behind')
    t.end()
  })
  t.end()
})

t.test('require defining mocks', t => {
  // require/mock some actual internal tap modules
  const diags = t.mock('../lib/diags.js', {
    '../lib/obj-to-yaml.js': a => `foo ${a}`,
  })
  t.equal(diags('bar'), '\nfoo bar', 'should mock actual lib file')

  // stress test common js require injection logic
  t.test('same level files', t => {
    const f = t.testdir({
      'a.js': 'module.exports = "a"',
      'index.js': 'const a = require("./a.js"); module.exports = () => a',
      'test.js':
        `const t = require('../..'); // tap
        t.test('mock file at same level', t => {
          const i = t.mock('./index.js', {
            './a.js': 'mocked-a',
          })
          t.equal(i(), 'mocked-a', 'should get mocked result')
          t.end()
        })`,
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test.js') ],
      { cwd: f },
    )
  })

  t.test('immediately called require', t => {
    const f = t.testdir({
      'a.js': 'module.exports = () => { global.foo = true }',
      'index.js': 'require("./a.js")()',
      'test.js':
        `const t = require('../..'); // tap
        t.test('mock immediately called require', t => {
          t.mock('./index.js', {
            './a.js': () => {
              t.notOk(global.foo, 'should not run original a.js')
              t.end()
            }
          })
        })`,
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test.js') ],
      { cwd: f },
    )
  })

  t.test('run-time invoked require call', t => {
    const f = t.testdir({
      'a.js': 'module.exports = "a"',
        'index.js': 'module.exports = () => { return require("./a.js") }',
      'test.js':
        `const t = require('../..'); // tap
        t.test('mock file at run time', t => {
          const i = t.mock('./index.js', {
            './a.js': 'mocked-a',
          })
          t.equal(i(), 'mocked-a', 'should get mocked result')
          t.end()
        })`,
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test.js') ],
      { cwd: f },
    )
  })

  t.test('nested lib files', t => {
    const f = t.testdir({
      lib: {
        'a.js': 'module.exports = "a"',
      },
      'index.js': 'const a = require("./lib/a"); module.exports = () => a',
      'test.js':
        `const t = require('../..'); // tap
        t.test('mock file at nested lib', t => {
          const i = t.mock('./index.js', {
            './lib/a.js': 'mocked-a',
          })
          t.equal(i(), 'mocked-a', 'should get mocked result')
          t.end()
        })`,
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test.js') ],
      { cwd: f },
    )
  })

  t.test('nested test/lib files', t => {
    const f = t.testdir({
      lib: {
        'a.js': 'module.exports = "a"',
        'b.js': 'module.exports = "b"',
        'c.js':
          `const a = require('./a.js')
          const b = require('./b.js')
          const d = require('./utils/d')
          module.exports = [a, b, d].join(' ')`,
        utils: {
          'd.js': 'module.exports = "d"',
        },
      },
      'index.js':
        `const a = require("./lib/a")
        const b = require('./lib/b.js')
        const c = require('./lib/c.js')
        const d = require("./lib/utils/d.js")
        module.exports = () => [a, b, c, d].join(' ')`,
      test: {
        'test.js':
          `const t = require('../../..'); // tap
          t.test('mock file at nested lib', t => {
            const i = t.mock('../index.js', {
              '../lib/a.js': 'mocked-a',
            })
            t.equal(i(), 'mocked-a b mocked-a b d d', 'should get expected mocked result')
            t.end()
          })

          t.test('mock file at nested lib from nested lib', t => {
            const c = t.mock('../lib/c.js', {
              '../lib/a.js': 'mocked-a',
            })
            t.equal(c, 'mocked-a b d', 'should get expected mocked result')
            t.end()
          })

          t.test('mock a mock', t => {
            const i = t.mock('../index.js', {
              '../lib/a.js': 'mocked-a',
              '../lib/c.js': t.mock('../lib/c.js', {
                '../lib/b': 'mocked-b-within-c'
              })
            })
            t.equal(i(), 'mocked-a b a mocked-b-within-c d d', 'should get expected mocked-mocked result')
            t.end()
          })`,
      },
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test', 'test.js') ],
      { cwd: f },
    )
  })

  t.test('runner wrapper', t => {
    const f = t.testdir({
      lib: {
        'a.js': 'module.exports = "a"',
      },
      'index.js': 'const a = require("./lib/a.js"); module.exports = () => a',
      test: {
        runner: {
          'index.js': 'require("../unit/test")',
        },
        unit: {
          'test.js':
            `const t = require('../../../..'); // tap
            t.test('mock file started from a runner', t => {
              const i = t.mock('../../index.js', {
                '../../lib/a': 'mocked-a',
              })
              t.equal(i(), 'mocked-a', 'should get mocked result')
              t.end()
            })`,
        }
      }
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test', 'runner', 'index.js') ],
      { cwd: f },
    )
  })

  t.test('installed modules', t => {
    const f = t.testdir({
      node_modules: {
        foo: {
          'package.json': JSON.stringify({ name: 'foo', main: './index.js' }),
          'index.js': 'module.exports = () => "foo"',
        },
        bar: {
          'package.json': JSON.stringify({ name: 'bar', main: './index.js' }),
          'index.js': 'module.exports = () => "bar"',
        },
      },
      'index.js':
        `const foo = require('foo')
        const bar = require('bar')
        module.exports = foo() + ' ' + bar()`,
      'test.js':
        `const t = require('../..'); // tap
        t.test('mock installed modules', t => {
          const i = t.mock('./index.js', {
            'foo': () => 'mocked-foo',
          })
          t.equal(i, 'mocked-foo bar', 'should get expected mocked result')
          t.end()
        })`,
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test.js') ],
      { cwd: f },
    )
  })

  t.test('builtin modules', t => {
    const f = t.testdir({
      'index.js':
        `const util = require('util')
        module.exports = str => util.format('%s:%s', 'foo', str)`,
      'test.js':
        `const t = require('../..'); // tap
        t.test('mock builtin modules', t => {
          const i = t.mock('./index.js', {
            'util': { format: () => 'mocked-util' },
          })
          t.equal(i('bar'), 'mocked-util', 'should get mocked result')
          t.end()
        })`,
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test.js') ],
      { cwd: f },
    )
  })

  t.test('should support mocking within nested deps', t => {
    const f = t.testdir({
      lib: {
        'a.js':
          `module.exports = require('./b.js')`,
        'b.js':
          `module.exports = require('./c.js')`,
        'c.js':
          `module.exports = () => 'c'`,
      },
      'test.js':
        `const t = require('../..'); // tap
        t.test('mocking deps of required modules', t => {
          const a = t.mock('./lib/a.js', {
            './lib/c.js': () => 'mocked-c',
          })
          t.equal(a(), 'mocked-c', 'should get mocked-c result')
          t.end()
        })`,
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test.js') ],
      { cwd: f },
    )
  })

  t.test('should support cicle require', t => {
    const f = t.testdir({
      lib: {
        'a.js':
          `module.exports = require('./b.js')`,
        'b.js':
          `const c = require('./c.js')
          const b = () => 'b and ' + c
          b.extra = 'BBB'
          module.exports = () => 'b and ' + c`,
        'c.js':
          `const b = require('./b.js')
          module.exports = () => 'c and ' + b.extra`,
      },
      'test.js':
        `const t = require('../..'); // tap
        t.test('mocking cicled required deps', t => {
          const a = t.mock('./lib/a.js', {})
          t.ok('should not explode')
          t.end()
        })`,
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test.js') ],
      { cwd: f },
    )
  })

  t.test('should support mocking builtin modules within nested deps', t => {
    const f = t.testdir({
      lib: {
        'a.js':
          `module.exports = require('./b.js')`,
        'b.js':
          `module.exports = require('./c.js')`,
        'c.js':
          `module.exports = () => require('fs')`,
      },
      'test.js':
        `const t = require('../..'); // tap
        t.test('mocking builtin modules in nested modules', t => {
          const fs = {}
          const a = t.mock('./lib/a.js', { fs })
          t.equal(a(), fs, 'should get mocked fs result')
          t.end()
        })`,
    })
    return t.spawn(
      process.execPath,
      [ path.resolve(f, 'test.js') ],
      { cwd: f },
    )
  })

  t.end()
})

t.test('setting compareOptions to configure tmatch behavior', t => {
  t.compareOptions = { sort: false }
  t.test('first child', tt => {
    tt.equal(tt.compareOptions.sort, false, 'inherited')
    tt.not(tt.compareOptions, t.compareOptions, 'not same object')
    tt.has({noSortHere: true}, tt.compareOptions, 'does not (yet) respect enumerable (not-own) property')
    tt.compareOptions.includeEnumerable = true
    tt.notHas({includeEnumerable: true}, tt.compareOptions, 'respects enumerable (not-own) property')
    tt.end()
  })
  t.not(t.compareOptions.includeEnumerable, true, 'did not set on parent compareOptions')
  t.end()
})

t.test('resolve child test promise to child test results', async t => {
  const results = await t.test('child test', async t => {
    t.pass('this is fine')
  })
  t.matchSnapshot(results, 'should get a results object')
})

t.test('saveFixture is inherited', t => {
  t.plan(2)
  const save = new Test({ name: 'save', saveFixture: true })
  const nosave = new Test({ name: 'no save', saveFixture: false })
  save.test('child', tt => {
    t.equal(tt.saveFixture, true, 'inherited saveFixture=true')
    tt.end()
  })
  save.end()
  nosave.test('child', tt => {
    t.equal(tt.saveFixture, false, 'inherited saveFixture=false')
    tt.end()
  })
  nosave.end()
})

t.test('does not bork when process goes missing', t => {
  const proc = process
  t.teardown(() => global.process = proc)
  global.process = null
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

t.test('t.stdinOnly() throws without process.stdin', t => {
  const proc = process
  t.teardown(() => global.process = proc)
  global.process = null
  const Test = t.mock('../lib/test.js', {
    '../lib/process.js': t.mock('../lib/process.js'),
  })
  const tt = new Test({ name: 'proc gone missing' })
  t.throws(() => tt.stdinOnly(), {
    message: 'cannot read stdin without stdin stream',
  })
  t.end()
})
