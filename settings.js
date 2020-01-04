'use strict'

const StackUtils = require('stack-utils')

// Just directly use fs.rmdirSync after LTS/12 is required
let rmdirRecursiveSync

module.exports = {
  atTap: false,
  get rmdirRecursiveSync() {
    if (!rmdirRecursiveSync) {
      initRmdir()
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
  }
}

function initRmdir() {
  const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number)
  /* istanbul ignore next: version specific branch */
  if (nodeMajor > 12 || (nodeMajor === 12 && nodeMinor >= 10)) {
    const fs = require('fs')
    rmdirRecursiveSync = dir => fs.rmdirSync(dir, {recursive: true})
  } else {
    const rimraf = require('rimraf').sync
    rmdirRecursiveSync = dir => rimraf(dir, {glob: false})
  }
}
