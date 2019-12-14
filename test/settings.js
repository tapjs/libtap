'use strict'
const t = require('../')
const settings = {...require('../settings.js')}

t.ok(Array.isArray(settings.stackUtils.internals), 'Array.isArray(settings.stackUtils.internals)')
t.not(settings.stackUtils.internals.length, 0)

settings.stackUtils = {
  ...settings.stackUtils,
  // internals is version specific, filter out of the snapshot
  internals: []
}

t.matchSnapshot(settings)
