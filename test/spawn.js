const Spawn = require('../lib/spawn.js')
const t = require('../')
const Test = t.Test
const Parser = require('tap-parser')
const node = process.execPath
const file = __filename

process.env.TAP_BAIL = ''
process.env.TAP_BUFFER = ''

t.cleanSnapshot = require('./clean-stacks.js')

const main = () => {
  // this test can be slow, especially on CI
  t.setTimeout(120000)

  t.test('basic child process', t =>
    t.spawn(node, [ file, 'ok' ]))

  t.test('using a plan', t =>
    t.spawn(node, [ file, 'plan-ok' ]))

  t.test('hard quit', t =>
    t.spawn(node, [ file, 'sigself' ],
      { expectFail: true }))

  t.test('failing process', t =>
    t.spawn(node, [ file, 'not-ok' ],
            { expectFail: true }))

  t.test('timeout', t =>
    t.spawn(node, [ file, 'timeout' ], {
      expectFail: true,
      timeout: 1
    }))

  t.test('timeout update', t => {
    const s = new Spawn({
      command: node,
      args: [file, 'timeout-update'],
      buffered: true,
    })
    t.plan(2)
    s.main(() => {
      t.equal(s.timer.duration, 42069, 'timer updated')
      t.matchSnapshot(s.output)
    })
  })

  t.test('timeout KILL', {skip: process.platform === 'win32'}, t => {
    const s = new Spawn({
      command: node,
      args: [ file, 'catch-term' ],
      timeout: process.env.CI ? 20000 : 2000,
      buffered: true,
      name: 'killa'
    })
    s.main(() => {
      t.matchSnapshot(s.output)
      t.end()
    })
  })

  t.test('skip stuff', t => {
    const tt = new Test({ buffered: true, bail: false })
    tt.spawn(node, [ file, 'skip' ], {
      bail: true,
      buffered: true
    }, 'skipper')
    tt.spawn(node, [ file, 'skip-reason' ])
    tt.test('check it', ttt => {
      t.matchSnapshot(tt.output.replace(/node\.exe/gi, 'node'))
      t.end()
      tt.end()
      ttt.end()
    })
  })

  t.test('timeout before spawn is no-op', t => {
    const s = new Spawn({
      command: node,
      args: [ file, 'timeout' ]
    })
    s.timeout()
    t.end()
  })

  t.test('using spawn event', t => {
    t.on('spawn', t =>
      t.proc.stdin.end('TAP version 13\nok\n1..1\n'))
    t.spawn('cat', [], { stdio: [ 'pipe', 'pipe', 'ignore' ] })
    t.end()
  })

  t.test('using proc event', t => {
    const s = new Spawn({
      command: 'cat',
      args: [],
      buffered: true,
      bail: false,
      stdio: [ 'pipe', 'ignore', 'ignore' ]
    })
    s.on('process', p =>
      p.stdin.end('TAP version 13\nok\n1..1\n'))

    t.plan(1)
    s.main(() => t.matchSnapshot(s.output))
  })

  t.test('failure to spawn', t => {
    const s = new Spawn({
      command: 'something that does not exist',
      args: [],
      buffered: true,
      bail: false,
      stdio: [0, 1, 2]
    })
    t.plan(1)
    // Fixup for errno property change in 13.x (-2 on POSIX, -4058 on Win32)
    s.main(() => t.matchSnapshot(s.output.replace(/errno: -(2|4058)/, 'errno: ENOENT')))
  })

  t.test('failure to spawn even harder', t => {
    const cp = require('child_process')
    const spawn = cp.spawn
    const poop = new Error('poop error')
    cp.spawn = () => { throw poop }
    t.teardown(_ => cp.spawn = spawn)
    const s = new Spawn({
      command: 'poop',
      args: [],
      buffered: true,
      bail: false,
      stdio: 'inherit'
    })
    s.main(_ => {
      t.match(s.output, 'tapCaught: spawn\n')
      t.match(s.output, 'not ok 1 - poop error\n')
      t.match(s.output, 'command: poop\n')
      t.end()
    })
  })

  t.throws(_ => new Spawn(),
           new TypeError('no command provided'))

  t.test('endAll called', t => {
    t.test('call proc', t => {
      const s = new Spawn({
        command: node,
        args: [ file, 'timeout' ],
        bail: false,
        buffered: true
      })
      s.main(_ => {
        t.match(s.output, 'not ok 1 - test unfinished')
        t.end()
      })
      setTimeout(_ => s.endAll())
    })

    t.test('pre-call', t => {
      const s = new Spawn({
        command: node,
        args: [ file, 'timeout' ],
        bail: false,
        buffered: true
      })
      s.endAll()
      t.match(s.output, 'not ok 1 - test unfinished')
      t.end()
    })
    t.end()
  })

  t.test('childId', t => {
    t.test('via childId option', t => {
      const s = new Spawn({
        command: node,
        buffered: true,
        args: [ file, 'childId' ],
        childId: 69420,
      })
      s.main(() => {
        t.matchSnapshot(s.output)
        t.end()
      })
    })
    t.test('via TAP_CHILD_ID env', t => {
      const s = new Spawn({
        command: node,
        buffered: true,
        args: [ file, 'childId' ],
        env: { ...(process.env), TAP_CHILD_ID: '69420' },
      })
      s.main(() => {
        t.matchSnapshot(s.output)
        t.end()
      })
    })
    t.end()
  })
}

switch (process.argv[2]) {
  case 'ok':
    t.pass('this is fine')
    break

  case 'plan-ok':
    t.plan(1)
    t.pass('this is fine')
    setTimeout(_ => _, 200)
    break

  case 'sigself':
    setTimeout(_ =>
      process.kill(process.pid, process.platform === 'win32' ? 'SIGTERM' : 'SIGQUIT'), 300)
    break

  case 'not-ok':
    process.exit(1)
    break

  case 'skip':
    t.plan(0)
    break

  case 'skip-reason':
    t.plan(0, 'for no raisins')
    break

  case 'catch-term':
    process.on('SIGTERM', _ => console.log('SIGTERM'))
  case 'timeout':
    setTimeout(_ => _, process.env.CI ? 50000 : 10000)
    break

  case 'timeout-update':
    t.setTimeout(42069)
    t.pass('this is fine')
    break

  case 'childId':
    console.log(`childId=${process.env.TAP_CHILD_ID}`)
    break

  default:
    main()
}
