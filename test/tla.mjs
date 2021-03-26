import {promisify} from 'util'

const delay = promisify(setTimeout)
const expectedLog = [
	'importing settings',
	'imported settings',
	'watch settings.output',
	'importing tla',
	'flag ready',
	'flaged ready',
	'get settings.output',
	'imported tla'
];
let log = []

log.push('importing settings')
const settings = (await import('libtap/settings')).default
log.push('imported settings')

let output = process.stdout
let outputRead = 0
Object.defineProperty(settings, 'output', {
	get() {
		log.push('get settings.output')
		outputRead++
		return output
	},
	set(value) {
		log.push('set settings.output')
		output = value
	}
})
log.push('watch settings.output')

log.push('importing tla')
const libPromise = import('libtap/tla')
libPromise.then(t => {
	log.push('imported tla')
	t.same(log, expectedLog)
})

await delay(50)

log.push('flag ready')
settings.markAsReady()
log.push('flaged ready')

await delay(50);
