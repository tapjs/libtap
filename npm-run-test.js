#!/usr/bin/env node
'use strict'

const foregroundChild = require('foreground-child')

async function runTests() {
  const semver = require('semver')
  const glob = require('glob')
  const os = require('os')
  const t = require('.')
  const coverageMap = require('./coverage-map.js')
  const testESM = semver.gte(process.versions.node, '13.10.0')
  const testFileGlob = testESM ? 'test/**/*.{js,mjs}' : 'test/**/*.js'
  const esLoaderHook = {
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --experimental-loader @istanbuljs/esm-loader-hook`
  }

  t.jobs = os.cpus().length

  glob.sync(testFileGlob).forEach(file => {
    if (process.platform === 'win32' && file.includes('sigterm')) {
      // TODO: investigate proper Win32 replacements for these tests
      return;
    }

    const esLoaderEnv = file.endsWith('.mjs') ? esLoaderHook : {}
    t.spawn(
      process.execPath,
      [file],
      {
        env: {
          ...process.env,
          NYC_CONFIG_OVERRIDE: JSON.stringify({
            include: coverageMap(file) || ''
          }),
          ...esLoaderEnv
        }
      },
      file
    )
  })
}

// libtap does not integrate with nyc so does not include coverage-map
// support.  The wrapped process is used because the global nyc configuration
// needs to include lib/** for the sake of `all: true`, but we don't want use
// of libtap from this file to contribute coverage.
if (process.argv[2] === 'wrapped') {
  runTests()
} else {
  process.env.NYC_CONFIG_OVERRIDE = JSON.stringify({include: ''})
  foregroundChild(process.execPath, [__filename, 'wrapped'])
}
