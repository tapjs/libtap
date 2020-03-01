const glob = require('glob')
const path = require('path')

const rootFiles = ['settings', 'versions'];

module.exports = t => {
  const parts = path.relative(process.cwd(), path.resolve(t)).split(/\\|\//)
  if (parts[1] === 'libtap.mjs')
    return 'lib/tap.mjs'

  const unit = path.basename(parts[1], '.js')
  if (rootFiles.includes(unit))
    return `${unit}.js`

  if (unit === 'coverage-map')
    return [ path.basename(__filename) ]
  const cov = glob.sync(`lib/${unit}.js`)
  if (!cov.length)
    return null
  return cov
}
