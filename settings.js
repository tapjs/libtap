'use strict'

const StackUtils = require('stack-utils')

module.exports = {
  atTap: false,
  StackUtils,
  stackUtils: {
    // Support `settings.stackUtils.internals.push()`
    internals: StackUtils.nodeInternals(),
    ignoredPackages: []
  }
}
