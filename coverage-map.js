const glob = require('glob')
const path = require('path')

module.exports = t => {
  const parts = path.relative(process.cwd(), path.resolve(t)).split(/\\|\//)
  const unit = path.basename(parts[1], '.js')
  if (unit === 'coverage-map')
    return [ path.basename(__filename) ]
  const cov = glob.sync(`lib/${unit}.js`)
  if (!cov.length)
    return null
  return cov
}
