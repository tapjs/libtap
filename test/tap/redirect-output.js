require('./')(
  () => {
    const {writeSync} = require('fs')
    const {PassThrough} = require('stream')
    const settings = require('../../settings.js')
    settings.output = new PassThrough()
    const results = []
    // Verify the local process can intercept libtap output
    settings.output.on('data', data => {
      writeSync(1, 'redirected: ' + data.toString())
    })
  },
  t => t.pass('ok')
)
