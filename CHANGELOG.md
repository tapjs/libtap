## 1.4

* subtests: only output comment style
* t.emits() returns promise, resolves when emitted
* tap-parser@11.0.1

## 1.3

* test: support setting snapshotFile explicitly in subtests

## 1.2

* remove yapool
* feat: add t.hasProp() and friends
* Escape # and \ characters in test message or directives
* Escape bailout message and plan comment
* tap-parser@11.0.0

## 1.1

* Provide a version-specific mkdirRecursive, with mkdirpNeeded flag
* fix: join testdirName with path.sep instead of /
* fix: do not break if global.process missing
* uncaughtException catch unhandledRejections

## 1.0.0

### Breaking Changes

* Run fixture cleanup asynchronously, after teardown
* beforeEach / afterEach no longer received a callback, are assumed to be synchronous
  if they do not return a promise
* Improve tap-snapshot folder structure
* Inherit t.saveFixture boolean

### Features

* Create fixture symlinks as junctions if pointing at directories
* Add tap-testdir- to the generated test dir folder
* Add `t.mock()` API
* Add `t.before(fn)` API
* Separate `t.match` and `t.has`
* Add `t.notHas()` / `t.notHasStrict()` API's
* Support `t.compareOptions` for configuring tcompare behavior
* Resolve child test promise to results
* Do not report only/grep filtered skips in test.lists
* Make snapshot file location fully customizable


## 0.3.0

### Breaking Changes

* Populate `package.json#exports`.  This blocks import/require
  of 'internal' files
* Convert `options.processDB.spawn` to an async function
  in preparation of nyc 15

### Features

* Provide ESM wrapper with named exports using conditional exports


## 0.2.0

### Breaking Changes

* Change extension of snapshot files to .cjs

### Features

* Add `output` option to `libtap/settings`
* Add `static addAssert` to Test class


## 0.1.0

This module is based on tap 14.10.2.

* Node.js 10 is now required
* Assertion synonyms are removed
* Remove stdio-polyfill.js
* Remove browser-process-hrtime
* Remove source-map-support
* Remove mocha DSL
* Remove default stripping of installed modules from stack
* Upgrade tcompare
* Prefer native recursive fs.rmdirSync over rimraf
* Installing rimraf is the users responsibility if it's needed to
  support node.js < 12
