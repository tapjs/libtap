const t = require('../')
const esc = require('../lib/esc.js')
t.equal(esc('hello \\ # world'), 'hello \\\\ \\# world')
t.equal(esc('hello \\ \\# world'), 'hello \\\\ \\\\\\# world')
