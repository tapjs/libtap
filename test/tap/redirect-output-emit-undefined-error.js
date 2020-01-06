require('./')(
  () => {
    const {writeSync} = require('fs')
    const {PassThrough} = require('stream')
    const settings = require('../../settings.js')
    settings.output = new PassThrough()
    // Verify the local process can intercept libtap output
    settings.output.on('error', (...args) => {
      writeSync(1, `error with ${args.length} arguments emitted\n`);
    })
    settings.output.on('data', data => {
      writeSync(1, 'redirected: ' + data.toString())
    })
  },
  () => {
    const settings = require('../../settings.js')
    settings.output.emit('error')
  }
)
