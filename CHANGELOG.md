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
