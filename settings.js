'use strict'

const fs = require('fs')
const StackUtils = require('stack-utils')

// Just unconditionally use fs.rmdirSync after LTS/12 is required
let rmdirRecursiveSync

module.exports = {
  atTap: false,
  get rimrafNeeded() {
    const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number)
    /* istanbul ignore next: version specific */
    return !rmdirRecursiveSync && (nodeMajor < 12 || (nodeMajor === 12 && nodeMinor < 10))
  },
  get rmdirRecursiveSync() {
    /* istanbul ignore next: version specific */
    if (!rmdirRecursiveSync) {
      return () => {
        throw new Error("require('libtap/settings').rmdirRecursiveSync must be initialized for Node.js <12.10.0")
      }
    }

    return rmdirRecursiveSync
  },
  set rmdirRecursiveSync(value) {
    if (typeof value !== 'function' || value.length !== 1) {
      throw new TypeError('rmdirRecursiveSync must be a function with exactly one argument')
    }

    rmdirRecursiveSync = value
  },
  StackUtils,
  stackUtils: {
    // Support `settings.stackUtils.internals.push()`
    internals: StackUtils.nodeInternals(),
    ignoredPackages: []
  },
  output: process.stdout
}

/* istanbul ignore next: version specific */
if (!module.exports.rimrafNeeded) {
  const fs = require('fs')
  rmdirRecursiveSync = dir => fs.rmdirSync(dir, {recursive: true})
}
