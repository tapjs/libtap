# libtap

A <abbr title="Test Anything Protocol">TAP</abbr> test library for
Node.js.

## `libtap` vs `tap`

`tap` extends this module and provides many other nice features.  Generally
you should be using `require('tap')` instead of `require('libtap')`.  In some
edge cases it can be appropriate to use `libtap` directly.

* Install size is important - `libtap` has significantly less dependencies.
* Your tests are suspectable to transformations or other environmental changes.
  `tap` does things that are useful by default, if this causes problems for your
  code you may wish to go lower level.

### Recursive rmdir

Some parts of `libtap` require a recursive rmdirSync function.  In node.js 12.10.0+
the default implementation is `dir => fs.rmdirSync(dir, {recursive: true})`.  For older
versions of node.js you must either install `rimraf` or set
`require('libtap/settings').rmdirRecursiveSync` with another implementation.  `tap`
installs `rimraf` unconditionally so this is only a concern to direct `libtap` users
who support older versions of node.js.

It is not considered semver-major for a libtap function to use recursive rmdir where
it previously did not.  If you test on older versions of node.js then you must ensure
a user-space implementation is available even if it is not currently needed.

## Environmental changes still in place

* signal-exit is run
* async-domain-hook is run
* process.stdout.emit is monkey-patched to swallow EPIPE errors
* process.reallyExit and process.exit are monkey-patched
* Handlers are added to process `beforeexit` and `exit` events

These all have an effect on the environment and may be undesirable in some edge cases.
Should any/all of these be opt-out or even opt-in?  The goal is to be able to create
functional tests using `require('libtap')`.
