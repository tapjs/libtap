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

## Environmental changes still in place

* signal-exit is run
* async-domain-hook is run
* process.stdout.emit is monkey-patched to swallow EPIPE errors
* process.reallyExit and process.exit are monkey-patched
* Handlers are added to process `beforeexit` and `exit` events

These all have an effect on the environment and may be undesirable in some edge cases.
Should any/all of these be opt-out or even opt-in?  The goal is to be able to create
functional tests using `require('libtap')`.
