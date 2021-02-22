/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/clean-yaml-object.js TAP diff stuff > another weird one 1`] = `
Object {
  "found": String(
    Object {
      "a": 1,
    }
  ),
  "wanted": Object {
    "a": 1,
  },
}
`

exports[`test/clean-yaml-object.js TAP diff stuff > objects that do not strictly match 1`] = `
Object {
  "comparator": "===",
  "diff": String(
    --- expected
    +++ actual
    @@ -1,3 +1,3 @@
     Object {
    -  "a": "1",
    +  "a": 1,
     }
    
  ),
}
`

exports[`test/clean-yaml-object.js TAP diff stuff > string that differ 1`] = `
Object {
  "comparator": "===",
  "diff": String(
    --- expected
    +++ actual
    @@ -1,1 +1,1 @@
    -world
    +hello
    
  ),
}
`

exports[`test/clean-yaml-object.js TAP diff stuff > this one is weird 1`] = `
Object {
  "found": Object {
    "a": 1,
  },
  "wanted": String(
    Object {
      "a": 1,
    }
  ),
}
`

exports[`test/clean-yaml-object.js TAP saveFixture included if relevant > hide if false and env=0 1`] = `
Object {}
`

exports[`test/clean-yaml-object.js TAP saveFixture included if relevant > hide if true and env=1 1`] = `
Object {}
`

exports[`test/clean-yaml-object.js TAP saveFixture included if relevant > show if false and env=1 1`] = `
Object {
  "saveFixture": false,
}
`

exports[`test/clean-yaml-object.js TAP saveFixture included if relevant > show if true and env=0 1`] = `
Object {
  "saveFixture": true,
}
`

exports[`test/clean-yaml-object.js TAP string diffs > must match snapshot 1`] = `
Object {
  "diff": String(
    --- expected
    +++ actual
    @@ -1,5 +1,2 @@
    -a big
     hello
     world
    -string
    -
    
  ),
}
`
