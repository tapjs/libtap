import * as libtap from 'libtap'
import settings from 'libtap/settings'
import versions from 'libtap/versions'

import cjs from '../lib/tap.js'
import cjsSettings from '../settings.js'
import cjsVersions from '../versions.js'

const t = cjs

t.test('libtap', async t => {
	t.matchSnapshot(Object.keys(libtap).sort())

	for (const key of Object.keys(libtap)) {
		t.equal(libtap[key], key === 'default' ? cjs : cjs[key], key)
	}
})

t.test('settings', async t => t.equal(settings, cjsSettings))
t.test('versions', async t => t.equal(versions, cjsVersions))
