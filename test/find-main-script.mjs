import {fileURLToPath} from 'url'
import t from 'libtap'
import findMainScript from '../lib/find-main-script.js'

const __filename = fileURLToPath(import.meta.url)

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
process.argv = [process.argv[0]]
t.equal(findMainScript('default'), 'default')
