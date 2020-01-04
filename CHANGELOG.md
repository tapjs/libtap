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
