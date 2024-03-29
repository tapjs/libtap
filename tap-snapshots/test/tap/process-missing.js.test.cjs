/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`test/tap/process-missing.js TAP > exit status 1`] = `
Object {
  "code": 0,
  "signal": null,
}
`

exports[`test/tap/process-missing.js TAP > stderr 1`] = `

`

exports[`test/tap/process-missing.js TAP > stdout 1`] = `
TAP version 13
ok 1 - this is fine
not ok 2 - this not so much
  ---
  at:
    line: #
    column: #
    file: test/tap/process-missing.js
  source: |2
      t.pass('this is fine')
      t.fail('this not so much')
    --^
    })
  ...


`
