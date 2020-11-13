'use strict'

const fs = require('fs')
const StackUtils = require('stack-utils')

// Just unconditionally use fs.rmdirSync after LTS/12 is required
let rmdirRecursiveSync
let rmdirRecursive

module.exports = {
  atTap: false,
  get rimrafNeeded() {
    const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number)
    /* istanbul ignore next: version specific */
    return !rmdirRecursiveSync && (nodeMajor < 12 || (nodeMajor === 12 && nodeMinor < 10))
  },
  get rmdirRecursive() {
    /* istanbul ignore next: version specific */
    if (!rmdirRecursive) {
      return () => {
        throw new Error("require('libtap/settings').rmdirRecursive must be initialized for Node.js <12.10.0")
      }
    }

    return rmdirRecursive
  },
  set rmdirRecursive(value) {
    if (typeof value !== 'function' || value.length !== 2) {
      throw new TypeError('rmdirRecursive must be a function with exactly two arguments')
    }

    rmdirRecursive = value
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
  rmdirRecursiveSync = dir => fs.rmdirSync(dir, {recursive: true, force: true})
  rmdirRecursive = (dir, cb) => fs.rmdir(dir, {recursive: true, force: true}, cb)
}
