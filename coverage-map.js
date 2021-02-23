const glob = require('glob')
const path = require('path')

const rootFiles = ['settings', 'versions', 'coverage-map'];

module.exports = t => {
  const parts = path.relative(process.cwd(), path.resolve(t)).split(/\\|\//)
  const ext = path.extname(t)
  const unit = path.basename(parts[1], ext)

  if (parts[1] === 'libtap.mjs')
    return 'lib/tap.mjs'

  if (rootFiles.includes(unit))
    return `${unit}.js`

  const cov = glob.sync(`lib/${unit}${ext}`)
  if (!cov.length)
    return null
  return cov
}
